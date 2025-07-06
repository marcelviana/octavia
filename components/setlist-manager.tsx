"use client"

import React, { useState, useEffect, useRef } from "react"
import { saveSetlists, removeCachedSetlist } from "@/lib/offline-setlist-cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Clock,
  Music,
  Calendar,
  Share,
  Copy,
  GripVertical,
  Star,
  Sparkles,
  Search,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  createSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
  updateSongPosition,
  updateSetlist,
  getUserSetlists,
} from "@/lib/setlist-service"
import { getUserContent as getContentList } from "@/lib/content-service"
import type { Database } from "@/types/supabase"
import { useFirebaseAuth } from "@/contexts/firebase-auth-context"
import { cn } from "@/lib/utils"
import { useSetlistData } from "@/hooks/use-setlist-data"


type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
type Content = Database["public"]["Tables"]["content"]["Row"]
type SetlistWithSongs = Setlist & {
  setlist_songs: Array<{
    id: string
    position: number
    notes: string | null
    content: Content
  }>
}

interface SetlistManagerProps {
  onEnterPerformance: (setlist: SetlistWithSongs, startingSongIndex?: number) => void
}

export function SetlistManager({ onEnterPerformance }: SetlistManagerProps) {
  const { user, isLoading: authLoading } = useFirebaseAuth()
  const isInitialized = !authLoading
  const {
    setlists,
    setSetlists,
    content: availableContent,
    setContent: setAvailableContent,
    loading,
    error,
    reload,
  } = useSetlistData(user, isInitialized)
  const [selectedSetlist, setSelectedSetlist] = useState<SetlistWithSongs | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddSongsDialogOpen, setIsAddSongsDialogOpen] = useState(false)
  const [selectedSongsToAdd, setSelectedSongsToAdd] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [setlistToDelete, setSetlistToDelete] = useState<SetlistWithSongs | null>(null)
  const [songFilter, setSongFilter] = useState("")
  const [newSetlistData, setNewSetlistData] = useState({
    name: "",
    description: "",
    performance_date: "",
    venue: "",
    notes: "",
  })

  const [draggedSongId, setDraggedSongId] = useState<string | null>(null)
  const [addingSongs, setAddingSongs] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [setlistToEdit, setSetlistToEdit] = useState<SetlistWithSongs | null>(null)
  const [editSetlistData, setEditSetlistData] = useState({
    name: "",
    description: "",
    performance_date: "",
    venue: "",
    notes: "",
  })

  useEffect(() => {
    let lastLoad = Date.now()
    const RELOAD_COOLDOWN = 30000

    const handleVisibilityChange = () => {
      if (!document.hidden && !loading && user) {
        const now = Date.now()
        if (now - lastLoad > RELOAD_COOLDOWN) {
          lastLoad = now
          const hasRecent = setlists.length > 0 || availableContent.length > 0
          const lastLoadTime = localStorage.getItem('octavia-setlists-last-load')
          const dataIsRecent =
            lastLoadTime && now - new Date(lastLoadTime).getTime() < 300000
          if (hasRecent && dataIsRecent) return
          setTimeout(() => {
            if (user && !loading) {
              reload()
            }
          }, 1000)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading, user, setlists.length, availableContent.length, reload])

  const calculateTotalDuration = (songs: any[]) => {
    return songs.reduce((total, song) => {
      const duration = song.content?.bpm ? (song.content.bpm / 60) * 3 : 4
      return total + duration
    }, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handleCreateSetlist = async () => {
    if (!user || !newSetlistData.name.trim()) return

    try {
      const setlistData = {
        user_id: user.uid,
        name: newSetlistData.name,
        description: newSetlistData.description || undefined,
        performance_date: newSetlistData.performance_date || null,
        venue: newSetlistData.venue || null,
        notes: newSetlistData.notes || null,
      }

      const newSetlist = await createSetlist(setlistData)
      const setlistWithSongs = newSetlist as unknown as SetlistWithSongs

      const updated = [setlistWithSongs, ...setlists]
      setSetlists(updated)
      try {
        await saveSetlists(updated as any[])
      } catch (err) {
        console.error('Failed to cache offline setlists', err)
      }
      setNewSetlistData({ name: "", description: "", performance_date: "", venue: "", notes: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      console.error("Error creating setlist:", err)
    }
  }

  const handleDeleteSetlist = async (setlistId: string) => {
    try {
      await deleteSetlist(setlistId)
      try {
        await removeCachedSetlist(setlistId)
      } catch (err) {
        console.error('Failed to remove cached setlist', err)
      }
      const updated = setlists.filter((s) => s.id !== setlistId)
      setSetlists(updated)
      try {
        await saveSetlists(updated as any[])
      } catch (err) {
        console.error('Failed to cache offline setlists', err)
      }
      if (selectedSetlist?.id === setlistId) {
        setSelectedSetlist(null)
      }
    } catch (err) {
      console.error("Error deleting setlist:", err)
    }
  }

  const confirmDeleteSetlist = async () => {
    if (!setlistToDelete) return
    await handleDeleteSetlist(setlistToDelete.id)
    setDeleteDialogOpen(false)
    setSetlistToDelete(null)
  }

  const handleEditSetlist = (setlist: SetlistWithSongs) => {
    setSetlistToEdit(setlist)
    setEditSetlistData({
      name: setlist.name,
      description: setlist.description || "",
      performance_date: setlist.performance_date || "",
      venue: setlist.venue || "",
      notes: setlist.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateSetlist = async () => {
    if (!setlistToEdit || !editSetlistData.name.trim()) return

    try {
      const updateData = {
        name: editSetlistData.name,
        description: editSetlistData.description || null,
        performance_date: editSetlistData.performance_date || null,
        venue: editSetlistData.venue || null,
        notes: editSetlistData.notes || null,
      }

      await updateSetlist(setlistToEdit.id, updateData)

      // Update the setlist in local state
      const updatedSetlist = { ...setlistToEdit, ...updateData }
      const updatedSetlists = setlists.map(setlist => 
        setlist.id === setlistToEdit.id ? updatedSetlist : setlist
      )
      
      setSetlists(updatedSetlists)
      
      // Update selected setlist if it's the one being edited
      if (selectedSetlist?.id === setlistToEdit.id) {
        setSelectedSetlist(updatedSetlist)
      }

      // Cache the updated setlists
      try {
        await saveSetlists(updatedSetlists as any[])
      } catch (err) {
        console.error('Failed to cache offline setlists', err)
      }

      // Close dialog and reset
      setIsEditDialogOpen(false)
      setSetlistToEdit(null)
      setEditSetlistData({ name: "", description: "", performance_date: "", venue: "", notes: "" })

    } catch (err) {
      console.error("Error updating setlist:", err)
    }
  }

  const handleSongSelection = (contentId: string, checked: boolean) => {
    if (checked) {
      setSelectedSongsToAdd([...selectedSongsToAdd, contentId])
    } else {
      setSelectedSongsToAdd(selectedSongsToAdd.filter((id) => id !== contentId))
    }
  }

  const addSelectedSongs = async () => {
    if (!selectedSetlist || selectedSongsToAdd.length === 0 || !user) return

    try {
      setAddingSongs(true)
      
      const currentMaxPosition = selectedSetlist.setlist_songs?.length || 0

      console.log("🔍 Adding songs to setlist:", {
        setlistId: selectedSetlist.id,
        songsToAdd: selectedSongsToAdd,
        currentMaxPosition
      })

      // Add songs to setlist one by one and update the selected setlist immediately
      let updatedSetlist = { ...selectedSetlist }
      
      for (let i = 0; i < selectedSongsToAdd.length; i++) {
        const songId = selectedSongsToAdd[i]
        const position = currentMaxPosition + i + 1
        
        console.log("🔍 Adding song:", { songId, position })
        const addedSong = await addSongToSetlist(selectedSetlist.id, songId, position)
        
        // Find the content for this song
        const content = availableContent.find(c => c.id === songId)
        if (content && addedSong) {
          // Add the song to the selected setlist immediately
          const newSetlistSong = {
            id: addedSong.id,
            position: addedSong.position,
            notes: addedSong.notes,
            content: content
          }
          
          updatedSetlist = {
            ...updatedSetlist,
            setlist_songs: [...(updatedSetlist.setlist_songs || []), newSetlistSong]
          }
        }
      }

      // Update the selected setlist immediately
      setSelectedSetlist(updatedSetlist)
      
      // Update the main setlists array as well
      const updatedSetlists = setlists.map(setlist => 
        setlist.id === selectedSetlist.id ? updatedSetlist : setlist
      )
      setSetlists(updatedSetlists)

      console.log("🔍 Successfully added all songs, updated UI immediately")

      // Close dialog and reset selection after successful addition
      setIsAddSongsDialogOpen(false)
      setSelectedSongsToAdd([])
      setSongFilter("")

      // Reload data in the background to ensure everything is in sync
      setTimeout(() => {
        reload().catch(err => console.warn('Background reload failed:', err))
      }, 1000)

    } catch (err) {
      console.error("Error adding songs to setlist:", err)
    } finally {
      setAddingSongs(false)
    }
  }

  const handleRemoveSong = async (setlistSongId: string) => {
    if (!user || !selectedSetlist) return

    try {
      console.log("🔍 Removing song from setlist:", { setlistSongId, setlistId: selectedSetlist.id })

      // Optimistically update UI first for immediate feedback
      const updatedSongs = selectedSetlist.setlist_songs.filter((s) => s.id !== setlistSongId)
      const optimisticSetlist = { ...selectedSetlist, setlist_songs: updatedSongs }
      setSelectedSetlist(optimisticSetlist)
      
      // Update the main setlists array as well
      const updatedSetlists = setlists.map(setlist => 
        setlist.id === selectedSetlist.id ? optimisticSetlist : setlist
      )
      setSetlists(updatedSetlists)

      // Then perform the backend update
      await removeSongFromSetlist(setlistSongId)

      console.log("🔍 Successfully removed song, reloading data...")

      // Reload data using the hook's reload function
      await reload()

    } catch (err) {
      console.error("Error removing song from setlist:", err)
      
      // Revert the optimistic update by reloading from server
      try {
        await reload()
      } catch (reloadErr) {
        console.error('Failed to reload data after error:', reloadErr)
      }
    }
  }

  const handleDragStart = (songId: string) => {
    setDraggedSongId(songId)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedSongId || !selectedSetlist) {
      setDraggedSongId(null)
      return
    }
    
    if (draggedSongId === targetId) {
      setDraggedSongId(null)
      return
    }
    
    // Find the dragged song and target song positions
    const draggedSong = selectedSetlist.setlist_songs.find((s) => s.id === draggedSongId)
    const targetSong = selectedSetlist.setlist_songs.find((s) => s.id === targetId)
    
    if (!draggedSong || !targetSong) {
      setDraggedSongId(null)
      return
    }
    
    // Don't update if the position would be the same
    if (draggedSong.position === targetSong.position) {
      setDraggedSongId(null)
      return
    }
    
    try {
      // First, optimistically update the UI immediately for instant feedback
      const currentSongs = [...selectedSetlist.setlist_songs]
      const draggedIndex = currentSongs.findIndex(s => s.id === draggedSongId)
      const targetIndex = currentSongs.findIndex(s => s.id === targetId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove the dragged song and insert it at the target position
        const [draggedSongData] = currentSongs.splice(draggedIndex, 1)
        currentSongs.splice(targetIndex, 0, draggedSongData)
        
        // Update positions to be sequential
        const updatedSongs = currentSongs.map((song, index) => ({
          ...song,
          position: index + 1
        }))
        
        // Update the selected setlist immediately
        const optimisticSetlist = {
          ...selectedSetlist,
          setlist_songs: updatedSongs
        }
        setSelectedSetlist(optimisticSetlist)
        
        // Update the main setlists array as well
        const updatedSetlists = setlists.map(setlist => 
          setlist.id === selectedSetlist.id ? optimisticSetlist : setlist
        )
        setSetlists(updatedSetlists)
      }
      
      // Then perform the backend update
      await updateSongPosition(selectedSetlist.id, draggedSongId, targetSong.position)
      
    } catch (err) {
      console.error('Error updating song position:', err)
      
      // Revert the optimistic update by reloading from server
      try {
      await reload()
      } catch (reloadErr) {
        console.error('Failed to reload data after error:', reloadErr)
      }
    } finally {
      setDraggedSongId(null)
    }
  }

  const handleExportSetlist = (list: SetlistWithSongs) => {
    const data = new Blob([JSON.stringify(list, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(data)
    const a = document.createElement("a")
    a.href = url
    a.download = `${list.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleStartPerformanceFromSong = (setlist: SetlistWithSongs, songPosition: number) => {
    // Convert position to 0-based index
    const startingSongIndex = songPosition - 1
    onEnterPerformance(setlist, startingSongIndex)
  }

  // Filter out songs that are already in the current setlist
  const availableSongs = availableContent.filter((content) => {
    if (!selectedSetlist?.setlist_songs || !content?.id) return true
    
    // Check if this content is already in the setlist
    const isInSetlist = selectedSetlist.setlist_songs.some((setlistSong) => {
      // The setlist song content should have an id property
      return setlistSong.content?.id === content.id
    })
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Filtering song ${content.title}: isInSetlist = ${isInSetlist}`)
    }
    
    return !isInSetlist
  })

  // Filter songs based on search term
  const filteredSongs = availableSongs.filter((song) => {
    const searchTerm = songFilter.toLowerCase()
    const titleMatch = song.title?.toLowerCase().includes(searchTerm)
    const artistMatch = song.artist?.toLowerCase().includes(searchTerm)
    return titleMatch || artistMatch
  })





  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-t-amber-500 border-amber-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700">Loading your setlists...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few moments while we connect to the database</p>
            <Button
              onClick={reload}
              variant="outline"
              className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                "Retry Loading"
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Unable to Load Setlists</h3>
            <p className="text-red-600 mb-6 text-base">{error}</p>
            <Button
              onClick={reload}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Retrying...
                </>
              ) : (
                "Try Again"
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Setlist Manager
            </h1>
            <p className="text-base text-gray-600 mt-1">Organize your performances with style</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-base shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Setlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw] sm:w-full bg-white/95 backdrop-blur-sm border border-amber-200">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-amber-500" />
                  Create New Setlist
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Fill in the details below to create a new setlist for your performance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base sm:text-lg font-medium text-gray-900">
                    Setlist Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter setlist name"
                    value={newSetlistData.name}
                    onChange={(e) => setNewSetlistData({ ...newSetlistData, name: e.target.value })}
                    className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base sm:text-lg py-2 sm:py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-base sm:text-lg font-medium text-gray-900">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description"
                    value={newSetlistData.description}
                    onChange={(e) => setNewSetlistData({ ...newSetlistData, description: e.target.value })}
                    className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="date" className="text-base sm:text-lg font-medium text-gray-900">
                      Performance Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSetlistData.performance_date}
                      onChange={(e) => setNewSetlistData({ ...newSetlistData, performance_date: e.target.value })}
                      className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue" className="text-base sm:text-lg font-medium text-gray-900">
                      Venue
                    </Label>
                    <Input
                      id="venue"
                      placeholder="Performance venue"
                      value={newSetlistData.venue}
                      onChange={(e) => setNewSetlistData({ ...newSetlistData, venue: e.target.value })}
                      className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSetlist}
                    disabled={!newSetlistData.name.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 space-y-6">
          {/* Setlists List */}
          <div className="space-y-6">
            {setlists.length === 0 ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No Setlists Yet</h3>
                  <p className="text-gray-600 mb-4 text-base">
                    Create your first setlist to get started organizing your performances.
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Setlist
                  </Button>
                </CardContent>
              </Card>
            ) : (
              setlists.map((setlist) => {
                const expanded = selectedSetlist?.id === setlist.id
                return (
                  <Card
                    key={setlist.id}
                    className={`cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-2xl ${
                      expanded
                        ? "ring-2 ring-amber-500 shadow-2xl"
                        : "bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:scale-105"
                    }`}
                    onClick={() =>
                      setSelectedSetlist(expanded ? null : setlist)
                    }
                  >
                    <CardContent className="p-0 overflow-hidden">
                      <div
                        className={cn(
                          "flex items-start justify-between px-4 py-4",
                          expanded &&
                            "bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg",
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center mb-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full mr-3 flex-shrink-0",
                                expanded
                                  ? "bg-white/80"
                                  : "bg-gradient-to-r from-amber-500 to-orange-600",
                              )}
                            ></div>
                            <h3
                              className={cn(
                                "font-bold text-base truncate",
                                expanded ? "" : "text-gray-900",
                              )}
                            >
                              {setlist.name}
                            </h3>
                          </div>
                          <p className={cn("text-sm", expanded ? "mb-2 opacity-90" : "text-gray-600 mb-3")}>{setlist.description}</p>
                          <div
                            className={cn(
                              "flex items-center gap-2 text-xs",
                              expanded ? "opacity-90" : "text-gray-500",
                            )}
                          >
                            {setlist.performance_date && (
                              <div className={cn(
                                "flex items-center px-2 py-1 rounded-full flex-shrink-0",
                                expanded ? "bg-white/10" : "bg-amber-50",
                              )}
                              >
                                <Calendar className={cn("w-3 h-3 mr-1", expanded ? "" : "text-amber-600")} />
                                <span className="whitespace-nowrap">{new Date(setlist.performance_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className={cn(
                              "flex items-center px-2 py-1 rounded-full flex-shrink-0",
                              expanded ? "bg-white/10" : "bg-blue-50",
                            )}
                            >
                              <Music className={cn("w-3 h-3 mr-1", expanded ? "" : "text-blue-600")} />
                              <span className="whitespace-nowrap">{setlist.setlist_songs?.length || 0} songs</span>
                            </div>
                            <div className={cn(
                              "flex items-center px-2 py-1 rounded-full flex-shrink-0",
                              expanded ? "bg-white/10" : "bg-green-50",
                            )}
                            >
                              <Clock className={cn("w-3 h-3 mr-1", expanded ? "" : "text-green-600")} />
                              <span className="whitespace-nowrap">{formatDuration(calculateTotalDuration(setlist.setlist_songs || []))}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEnterPerformance(setlist)
                            }}
                            className={cn(
                              expanded
                                ? "text-white hover:bg-white/20"
                                : "hover:bg-green-100 text-green-600",
                            )}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSetlist(setlist)
                            }}
                            className={cn(
                              expanded
                                ? "text-white hover:bg-white/20"
                                : "hover:bg-amber-100 text-amber-600",
                            )}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSetlistToDelete(setlist)
                              setDeleteDialogOpen(true)
                            }}
                            className={cn(
                              expanded
                                ? "text-white hover:bg-white/20"
                                : "hover:bg-red-100 text-red-600",
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-4 pt-3 pb-4 space-y-2">
                          <div className="space-y-2 max-h-96 md:max-h-[32rem] overflow-y-auto scroll-smooth">
                            {!setlist.setlist_songs || setlist.setlist_songs.length === 0 ? (
                              <div className="text-center py-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Music className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">No Songs Yet</h3>
                                <p className="text-gray-600 mb-4 text-base">Add some songs to this setlist to get started.</p>
                              </div>
                            ) : (
                              (setlist.setlist_songs || [])
                                .sort((a, b) => a.position - b.position)
                                  .map((setlistSong, index) => (
                                    <div
                                      key={setlistSong.id}
                                      draggable
                                      onDragStart={() => handleDragStart(setlistSong.id)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => {
                                        e.preventDefault()
                                        handleDrop(setlistSong.id)
                                      }}
                                      onDragEnd={() => setDraggedSongId(null)}
                                      className={`flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-300 ${
                                        draggedSongId === setlistSong.id ? 'opacity-50' : ''
                                      } ${
                                        draggedSongId && draggedSongId !== setlistSong.id ? 'border-dashed border-amber-400' : ''
                                      }`}
                                    >
                                    <div className="flex items-center space-x-3">
                                      <GripVertical className="w-4 h-4 text-amber-500 cursor-grab" />
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-900 text-base">{setlistSong.content.title}</p>
                                        <p className="text-gray-600 text-sm">
                                          {setlistSong.content.artist || "Unknown Artist"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStartPerformanceFromSong(setlist, setlistSong.position)
                                        }}
                                        className="hover:bg-green-100 text-green-600 h-7 w-7 p-0"
                                        title="Start performance from this song"
                                      >
                                        <Play className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRemoveSong(setlistSong.id)
                                        }}
                                        className="hover:bg-red-100 text-red-600 h-7 w-7 p-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>

                          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-900 text-base">Total Performance Time</span>
                              <span className="text-xl font-bold text-blue-900">
                                {formatDuration(calculateTotalDuration(setlist.setlist_songs || []))}
                              </span>
                            </div>
                          </div>

                          <Dialog open={isAddSongsDialogOpen} onOpenChange={setIsAddSongsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={(e) => e.stopPropagation()}
                                className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 text-base shadow-lg"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Songs to Setlist
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className="max-w-4xl h-[90vh] w-[95vw] sm:w-full bg-white/95 backdrop-blur-sm border border-amber-200 flex flex-col"
                              onInteractOutside={(e) => e.preventDefault()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DialogHeader className="flex-shrink-0 pb-4">
                                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                  <Music className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-amber-500" />
                                  Add Songs to &quot;{selectedSetlist?.name}&quot;
                                </DialogTitle>
                                <DialogDescription className="text-sm sm:text-base text-gray-600">
                                  Select songs to add to this setlist
                                </DialogDescription>
                              </DialogHeader>
              
                              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                                {/* Search/Filter Input */}
                                <div className="flex-shrink-0">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                      placeholder="Search songs by title or artist..."
                                      value={songFilter}
                                      onChange={(e) => setSongFilter(e.target.value)}
                                      className="pl-10 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                                    />
                                  </div>
                                </div>

                                {/* Scrollable Song List */}
                                <div className="flex-1 min-h-0">
                                  <ScrollArea className="h-full border border-amber-300 rounded-xl bg-amber-50/50">
                                    <div className="p-3 sm:p-4">
                                      {availableSongs.length === 0 ? (
                                        <div className="text-center py-8 sm:py-16 text-gray-500">
                                          <Music className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 opacity-50" />
                                          <p className="text-lg sm:text-xl">No additional songs available to add.</p>
                                          <p className="text-sm sm:text-lg mt-2">All songs from your library are already in this setlist.</p>
                                        </div>
                                      ) : filteredSongs.length === 0 ? (
                                        <div className="text-center py-8 sm:py-16 text-gray-500">
                                          <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 opacity-50" />
                                          <p className="text-lg sm:text-xl">No songs match your search.</p>
                                          <p className="text-sm sm:text-lg mt-2">Try adjusting your search terms.</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {filteredSongs.map((song) => (
                                            <div
                                              key={song.id}
                                              className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl hover:bg-white/60 transition-all duration-300 border border-amber-200"
                                            >
                                              <Checkbox
                                                id={`song-${song.id}`}
                                                checked={selectedSongsToAdd.includes(song.id)}
                                                onCheckedChange={(checked) => handleSongSelection(song.id, checked as boolean)}
                                                className="w-5 h-5"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 text-base sm:text-lg truncate">{song.title}</p>
                                                    <p className="text-gray-600 text-sm truncate">{song.artist || "Unknown Artist"}</p>
                                                  </div>
                                                  <div className="flex items-center space-x-2 sm:space-x-4 text-gray-600 flex-shrink-0">
                                                    <Badge
                                                      variant="secondary"
                                                      className="bg-blue-100 text-blue-600 border-blue-300 text-xs sm:text-sm"
                                                    >
                                                      {song.key || "N/A"}
                                                    </Badge>
                                                    <span className="text-xs sm:text-sm">{song.bpm ? `${song.bpm} BPM` : "N/A"}</span>
                                                    <Badge variant="outline" className="border-amber-300 text-amber-600 text-xs sm:text-sm">
                                                      {song.content_type}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </div>

                                {/* Selected Songs Summary */}
                                {selectedSongsToAdd.length > 0 && (
                                  <div className="flex-shrink-0 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                                      {selectedSongsToAdd.length} song{selectedSongsToAdd.length !== 1 ? "s" : ""} selected
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                  <Button
                                    variant="outline"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSelectedSongsToAdd([])
                                      setSongFilter("")
                                      setIsAddSongsDialogOpen(false)
                                    }}
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-2 text-base w-full sm:w-auto"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      addSelectedSongs()
                                    }}
                                    disabled={selectedSongsToAdd.length === 0 || addingSongs}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-base w-full sm:w-auto"
                                  >
                                    {addingSongs ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Adding Songs...
                                      </>
                                    ) : (
                                      <>
                                        Add {selectedSongsToAdd.length > 0 ? `${selectedSongsToAdd.length} ` : ""}Song
                                        {selectedSongsToAdd.length !== 1 ? "s" : ""}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
            </div>

        </div>
        
        {/* Edit Setlist Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full bg-white/95 backdrop-blur-sm border border-amber-200">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-amber-500" />
                Edit Setlist
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Update the details of your setlist.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="edit-name" className="text-base sm:text-lg font-medium text-gray-900">
                  Setlist Name
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Enter setlist name"
                  value={editSetlistData.name}
                  onChange={(e) => setEditSetlistData({ ...editSetlistData, name: e.target.value })}
                  className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-base sm:text-lg py-2 sm:py-3"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-base sm:text-lg font-medium text-gray-900">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Brief description"
                  value={editSetlistData.description}
                  onChange={(e) => setEditSetlistData({ ...editSetlistData, description: e.target.value })}
                  className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit-date" className="text-base sm:text-lg font-medium text-gray-900">
                    Performance Date
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editSetlistData.performance_date}
                    onChange={(e) => setEditSetlistData({ ...editSetlistData, performance_date: e.target.value })}
                    className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-venue" className="text-base sm:text-lg font-medium text-gray-900">
                    Venue
                  </Label>
                  <Input
                    id="edit-venue"
                    placeholder="Performance venue"
                    value={editSetlistData.venue}
                    onChange={(e) => setEditSetlistData({ ...editSetlistData, venue: e.target.value })}
                    className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes" className="text-base sm:text-lg font-medium text-gray-900">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Additional notes"
                  value={editSetlistData.notes}
                  onChange={(e) => setEditSetlistData({ ...editSetlistData, notes: e.target.value })}
                  className="mt-1 sm:mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSetlist}
                  disabled={!editSetlistData.name.trim()}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  Update Setlist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Setlist</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this setlist? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteSetlist}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
  )
}
