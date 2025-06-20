"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getUserSetlists,
  createSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
} from "@/lib/setlist-service"
import { getUserContent as getContentList } from "@/lib/content-service"
import type { Database } from "@/types/supabase"
import { useAuth } from "@/contexts/auth-context"

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
  onEnterPerformance: (setlist: SetlistWithSongs) => void
}

export function SetlistManager({ onEnterPerformance }: SetlistManagerProps) {
  const { user } = useAuth()
  const [setlists, setSetlists] = useState<SetlistWithSongs[]>([])
  const [availableContent, setAvailableContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSetlist, setSelectedSetlist] = useState<SetlistWithSongs | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddSongsDialogOpen, setIsAddSongsDialogOpen] = useState(false)
  const [selectedSongsToAdd, setSelectedSongsToAdd] = useState<string[]>([])
  const [newSetlistData, setNewSetlistData] = useState({
    name: "",
    description: "",
    performance_date: "",
    venue: "",
    notes: "",
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load setlists and content in parallel
      const [setlistsData, contentData] = await Promise.all([getUserSetlists(), getContentList()])

      console.log("Loaded setlists:", setlistsData)
      console.log("Loaded content:", contentData)

      try {
        await saveSetlists(setlistsData as any[])
      } catch (err) {
        console.error('Failed to cache offline setlists', err)
      }

      setSetlists(setlistsData as SetlistWithSongs[])
      setAvailableContent(contentData)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalDuration = (songs: any[]) => {
    return songs.reduce((total, song) => {
      const duration = song.content?.bpm ? (song.content.bpm / 60) * 3 : 4 // Estimate 3-4 minutes per song
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
        user_id: user.id,
        name: newSetlistData.name,
        description: newSetlistData.description || undefined,
        performance_date: newSetlistData.performance_date || null,
        venue: newSetlistData.venue || null,
        notes: newSetlistData.notes || null,
      }

      const newSetlist = await createSetlist(setlistData)
      const setlistWithSongs: SetlistWithSongs = {
        ...newSetlist,
        setlist_songs: [],
      }

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
      setError("Failed to create setlist. Please try again.")
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
      setError("Failed to delete setlist. Please try again.")
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
    if (!selectedSetlist || selectedSongsToAdd.length === 0) return

    try {
      const currentMaxPosition = selectedSetlist.setlist_songs?.length || 0

      // Add songs to setlist
      for (let i = 0; i < selectedSongsToAdd.length; i++) {
        await addSongToSetlist(selectedSetlist.id, selectedSongsToAdd[i], currentMaxPosition + i + 1)
      }

      // Reload data to get updated setlist
      await loadData()

      // Find and select the updated setlist
      const updatedSetlists = await getUserSetlists()
      const updatedSetlist = updatedSetlists.find((s) => s.id === selectedSetlist.id)
      if (updatedSetlist) {
        setSelectedSetlist(updatedSetlist as SetlistWithSongs)
      }

      // Reset and close dialog
      setSelectedSongsToAdd([])
      setIsAddSongsDialogOpen(false)
    } catch (err) {
      console.error("Error adding songs to setlist:", err)
      setError("Failed to add songs to setlist. Please try again.")
    }
  }

  const handleRemoveSong = async (setlistSongId: string) => {
    try {
      await removeSongFromSetlist(setlistSongId)

      // Reload data to get updated setlist
      await loadData()

      // Find and select the updated setlist
      if (selectedSetlist) {
        const updatedSetlists = await getUserSetlists()
        const updatedSetlist = updatedSetlists.find((s) => s.id === selectedSetlist.id)
        if (updatedSetlist) {
          setSelectedSetlist(updatedSetlist as SetlistWithSongs)
        }
      }
    } catch (err) {
      console.error("Error removing song from setlist:", err)
      setError("Failed to remove song from setlist. Please try again.")
    }
  }

  // Filter out songs that are already in the current setlist
  const availableSongs = availableContent.filter(
    (content) => !selectedSetlist?.setlist_songs?.some((setlistSong) => setlistSong.content?.id === content.id),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-t-amber-500 border-amber-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-xl text-gray-700">Loading your setlists...</p>
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
            <p className="text-red-600 mb-6 text-xl">{error}</p>
            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
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
            <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm border border-amber-200">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-6 h-6 mr-3 text-amber-500" />
                  Create New Setlist
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-lg font-medium text-gray-900">
                    Setlist Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter setlist name"
                    value={newSetlistData.name}
                    onChange={(e) => setNewSetlistData({ ...newSetlistData, name: e.target.value })}
                    className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 text-lg py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-lg font-medium text-gray-900">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description"
                    value={newSetlistData.description}
                    onChange={(e) => setNewSetlistData({ ...newSetlistData, description: e.target.value })}
                    className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-lg font-medium text-gray-900">
                      Performance Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSetlistData.performance_date}
                      onChange={(e) => setNewSetlistData({ ...newSetlistData, performance_date: e.target.value })}
                      className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue" className="text-lg font-medium text-gray-900">
                      Venue
                    </Label>
                    <Input
                      id="venue"
                      placeholder="Performance venue"
                      value={newSetlistData.venue}
                      onChange={(e) => setNewSetlistData({ ...newSetlistData, venue: e.target.value })}
                      className="mt-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-2 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSetlist}
                    disabled={!newSetlistData.name.trim()}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-base"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setlists List */}
          <div className="lg:col-span-1 space-y-6">
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
              setlists.map((setlist) => (
                <Card
                  key={setlist.id}
                  className={`cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-2xl hover:scale-105 ${
                    selectedSetlist?.id === setlist.id
                      ? "ring-2 ring-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-2xl scale-105"
                      : "bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  }`}
                  onClick={() => setSelectedSetlist(setlist)}
                >
                  <CardContent className="p-4 overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mr-3"></div>
                          <h3 className="font-bold text-gray-900 text-base">{setlist.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm">{setlist.description}</p>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                          {setlist.performance_date && (
                            <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
                              <Calendar className="w-3 h-3 mr-1 text-amber-600" />
                              {new Date(setlist.performance_date).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center bg-blue-50 px-2 py-1 rounded-full">
                            <Music className="w-3 h-3 mr-1 text-blue-600" />
                            {setlist.setlist_songs?.length || 0} songs
                          </div>
                          <div className="flex items-center bg-green-50 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3 mr-1 text-green-600" />
                            {formatDuration(calculateTotalDuration(setlist.setlist_songs || []))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" className="hover:bg-amber-100 text-amber-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSetlist(setlist.id)
                          }}
                          className="hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Setlist Details */}
          <div className="lg:col-span-2">
            {selectedSetlist ? (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                      <CardTitle className="text-lg lg:text-xl font-bold flex items-center mb-2">
                        <Star className="w-6 h-6 mr-2 flex-shrink-0" />
                        <span className="break-words">{selectedSetlist.name}</span>
                      </CardTitle>
                      {selectedSetlist.description && (
                        <p className="text-amber-100 text-sm lg:text-base leading-relaxed">
                          {selectedSetlist.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/50 text-white hover:bg-white/20 transition-colors bg-white/10 px-2 py-1 text-xs"
                        title="Duplicate setlist"
                      >
                        <Copy className="w-3 h-3 text-white" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/50 text-white hover:bg-white/20 transition-colors bg-white/10 px-2 py-1 text-xs"
                        title="Share setlist"
                      >
                        <Share className="w-3 h-3 text-white" />
                      </Button>
                      <Button
                        onClick={() => selectedSetlist && onEnterPerformance(selectedSetlist)}
                        className="bg-white text-amber-700 hover:bg-amber-50 font-bold px-3 py-1 text-xs transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        <span className="text-amber-700">Start Performance</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-amber-100 mt-4 pt-4 border-t border-white/20">
                    {selectedSetlist.performance_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="font-medium text-sm">
                          {new Date(selectedSetlist.performance_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Music className="w-4 h-4 mr-1" />
                      <span className="font-medium text-sm">{selectedSetlist.setlist_songs?.length || 0} songs</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="font-medium text-sm">
                        {formatDuration(calculateTotalDuration(selectedSetlist?.setlist_songs || []))}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {!selectedSetlist.setlist_songs || selectedSetlist.setlist_songs.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">No Songs Yet</h3>
                        <p className="text-gray-600 mb-6 text-base">Add some songs to this setlist to get started.</p>
                      </div>
                    ) : (
                      (selectedSetlist.setlist_songs || [])
                        .sort((a, b) => a.position - b.position)
                        .map((setlistSong, index) => (
                          <div
                            key={setlistSong.id}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-300"
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
                            <div className="flex items-center space-x-4">
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-700 border-amber-300 text-sm px-2 py-1"
                              >
                                {setlistSong.content.key || "N/A"}
                              </Badge>
                              <span className="text-gray-500 text-sm font-medium">
                                {setlistSong.content.bpm ? `${setlistSong.content.bpm} BPM` : "N/A"}
                              </span>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-amber-100 text-amber-600 h-7 w-7 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveSong(setlistSong.id)}
                                  className="hover:bg-red-100 text-red-600 h-7 w-7 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 text-base">Total Performance Time</span>
                      <span className="text-xl font-bold text-blue-900">
                        {formatDuration(calculateTotalDuration(selectedSetlist?.setlist_songs || []))}
                      </span>
                    </div>
                  </div>

                  <Dialog open={isAddSongsDialogOpen} onOpenChange={setIsAddSongsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 text-base shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Songs to Setlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] bg-white/95 backdrop-blur-sm border border-amber-200">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                          <Music className="w-6 h-6 mr-3 text-amber-500" />
                          Add Songs to &quot;{selectedSetlist?.name}&quot;
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="text-gray-600 text-lg">
                          Select songs from your library to add to this setlist
                        </div>

                        <ScrollArea className="h-96 border border-amber-300 rounded-xl p-6 bg-amber-50/50">
                          {availableSongs.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                              <Music className="w-16 h-16 mx-auto mb-6 opacity-50" />
                              <p className="text-xl">No additional songs available to add.</p>
                              <p className="text-lg mt-2">All songs from your library are already in this setlist.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {availableSongs.map((song) => (
                                <div
                                  key={song.id}
                                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/60 transition-all duration-300 border border-amber-200"
                                >
                                  <Checkbox
                                    id={`song-${song.id}`}
                                    checked={selectedSongsToAdd.includes(song.id)}
                                    onCheckedChange={(checked) => handleSongSelection(song.id, checked as boolean)}
                                    className="w-5 h-5"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-bold text-gray-900 text-lg">{song.title}</p>
                                        <p className="text-gray-600">{song.artist || "Unknown Artist"}</p>
                                      </div>
                                      <div className="flex items-center space-x-4 text-gray-600">
                                        <Badge
                                          variant="secondary"
                                          className="bg-blue-100 text-blue-600 border-blue-300"
                                        >
                                          {song.key || "N/A"}
                                        </Badge>
                                        <span>{song.bpm ? `${song.bpm} BPM` : "N/A"}</span>
                                        <Badge variant="outline" className="border-amber-300 text-amber-600">
                                          {song.content_type}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>

                        {selectedSongsToAdd.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <p className="text-gray-900 font-medium text-lg">
                              {selectedSongsToAdd.length} song{selectedSongsToAdd.length !== 1 ? "s" : ""} selected
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedSongsToAdd([])
                              setIsAddSongsDialogOpen(false)
                            }}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-2 text-base"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={addSelectedSongs}
                            disabled={selectedSongsToAdd.length === 0}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-base"
                          >
                            Add {selectedSongsToAdd.length > 0 ? `${selectedSongsToAdd.length} ` : ""}Song
                            {selectedSongsToAdd.length !== 1 ? "s" : ""}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a Setlist</h3>
                  <p className="text-gray-600 text-lg">Choose a setlist from the left to view and manage its songs.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}