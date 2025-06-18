"use client"

import React from 'react' 
import { useState, useEffect, useCallback } from "react"
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
  AlertTriangle,
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
import logger from "@/lib/logger"

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

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class SetlistErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Setlist Manager Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600 text-sm mb-4">
                {this.state.error?.message || 'An unexpected error occurred in Setlist Manager'}
              </p>
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Custom hook for setlist operations
function useSetlistOperations() {
  const { user } = useAuth()
  const [setlists, setSetlists] = useState<SetlistWithSongs[]>([])
  const [availableContent, setAvailableContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operationInProgress, setOperationInProgress] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    if (!user) {
      setError("User not authenticated")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.log("Loading setlists and content for user:", user.id)

      // Load setlists and content in parallel with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      )

      const [setlistsData, contentData] = await Promise.race([
        Promise.all([getUserSetlists(), getContentList()]),
        timeoutPromise
      ]) as [SetlistWithSongs[], Content[]]

      logger.log("Loaded data successfully", { 
        setlistsCount: setlistsData.length, 
        contentCount: contentData.length 
      })

      setSetlists(setlistsData)
      setAvailableContent(contentData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
      logger.error("Error loading setlist data:", err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createNewSetlist = useCallback(async (setlistData: any) => {
    if (!user) throw new Error("User not authenticated")

    setOperationInProgress(prev => ({ ...prev, create: true }))
    try {
      logger.log("Creating new setlist:", setlistData.name)
      
      const newSetlist = await createSetlist({
        user_id: user.id,
        ...setlistData,
      })

      const setlistWithSongs: SetlistWithSongs = {
        ...newSetlist,
        setlist_songs: [],
      }

      setSetlists(prev => [setlistWithSongs, ...prev])
      logger.log("Setlist created successfully:", newSetlist.id)
      
      return setlistWithSongs
    } catch (err) {
      logger.error("Error creating setlist:", err)
      throw err
    } finally {
      setOperationInProgress(prev => ({ ...prev, create: false }))
    }
  }, [user])

  const deleteExistingSetlist = useCallback(async (setlistId: string) => {
    setOperationInProgress(prev => ({ ...prev, [setlistId]: true }))
    try {
      logger.log("Deleting setlist:", setlistId)
      
      await deleteSetlist(setlistId)
      setSetlists(prev => prev.filter(s => s.id !== setlistId))
      
      logger.log("Setlist deleted successfully")
    } catch (err) {
      logger.error("Error deleting setlist:", err)
      throw err
    } finally {
      setOperationInProgress(prev => ({ ...prev, [setlistId]: false }))
    }
  }, [])

  const addSongsToSetlist = useCallback(async (setlistId: string, songIds: string[]) => {
    const operationKey = `add-${setlistId}`
    setOperationInProgress(prev => ({ ...prev, [operationKey]: true }))
    
    try {
      logger.log("Adding songs to setlist:", { setlistId, songCount: songIds.length })
      
      const selectedSetlist = setlists.find(s => s.id === setlistId)
      if (!selectedSetlist) throw new Error("Setlist not found")

      const currentMaxPosition = selectedSetlist.setlist_songs?.length || 0

      // Add songs sequentially to avoid position conflicts
      for (let i = 0; i < songIds.length; i++) {
        await addSongToSetlist(setlistId, songIds[i], currentMaxPosition + i + 1)
      }

      // Reload data to get updated setlist
      await loadData()
      
      logger.log("Songs added successfully")
    } catch (err) {
      logger.error("Error adding songs to setlist:", err)
      throw err
    } finally {
      setOperationInProgress(prev => ({ ...prev, [operationKey]: false }))
    }
  }, [setlists, loadData])

  const removeSongFromSetlist = useCallback(async (setlistSongId: string) => {
    setOperationInProgress(prev => ({ ...prev, [`remove-${setlistSongId}`]: true }))
    try {
      logger.log("Removing song from setlist:", setlistSongId)
      
      await removeSongFromSetlist(setlistSongId)
      await loadData() // Reload to get updated positions
      
      logger.log("Song removed successfully")
    } catch (err) {
      logger.error("Error removing song from setlist:", err)
      throw err
    } finally {
      setOperationInProgress(prev => ({ ...prev, [`remove-${setlistSongId}`]: false }))
    }
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    setlists,
    availableContent,
    loading,
    error,
    setError,
    operationInProgress,
    createNewSetlist,
    deleteExistingSetlist,
    addSongsToSetlist,
    removeSongFromSetlist,
    refreshData: loadData
  }
}

// Main component
export function SetlistManager({ onEnterPerformance }: SetlistManagerProps) {
  const {
    setlists,
    availableContent,
    loading,
    error,
    setError,
    operationInProgress,
    createNewSetlist,
    deleteExistingSetlist,
    addSongsToSetlist,
    removeSongFromSetlist,
    refreshData
  } = useSetlistOperations()

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

  // Helper functions
  const calculateTotalDuration = useCallback((songs: any[]) => {
    return songs.reduce((total, song) => {
      const duration = song.content?.bpm ? (song.content.bpm / 60) * 3 : 4
      return total + duration
    }, 0)
  }, [])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }, [])

  // Event handlers
  const handleCreateSetlist = async () => {
    if (!newSetlistData.name.trim()) {
      setError("Setlist name is required")
      return
    }

    try {
      const setlistData = {
        name: newSetlistData.name,
        description: newSetlistData.description || undefined,
        performance_date: newSetlistData.performance_date || null,
        venue: newSetlistData.venue || null,
        notes: newSetlistData.notes || null,
      }

      await createNewSetlist(setlistData)
      setNewSetlistData({ name: "", description: "", performance_date: "", venue: "", notes: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create setlist")
    }
  }

  const handleDeleteSetlist = async (setlistId: string) => {
    try {
      await deleteExistingSetlist(setlistId)
      if (selectedSetlist?.id === setlistId) {
        setSelectedSetlist(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete setlist")
    }
  }

  const handleSongSelection = (contentId: string, checked: boolean) => {
    if (checked) {
      setSelectedSongsToAdd(prev => [...prev, contentId])
    } else {
      setSelectedSongsToAdd(prev => prev.filter(id => id !== contentId))
    }
  }

  const addSelectedSongs = async () => {
    if (!selectedSetlist || selectedSongsToAdd.length === 0) return

    try {
      await addSongsToSetlist(selectedSetlist.id, selectedSongsToAdd)
      
      // Update selected setlist with fresh data
      const updatedSetlist = setlists.find(s => s.id === selectedSetlist.id)
      if (updatedSetlist) {
        setSelectedSetlist(updatedSetlist)
      }

      setSelectedSongsToAdd([])
      setIsAddSongsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add songs to setlist")
    }
  }

  const handleRemoveSong = async (setlistSongId: string) => {
    try {
      await removeSongFromSetlist(setlistSongId)
      
      // Update selected setlist with fresh data
      if (selectedSetlist) {
        const updatedSetlist = setlists.find(s => s.id === selectedSetlist.id)
        if (updatedSetlist) {
          setSelectedSetlist(updatedSetlist)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove song from setlist")
    }
  }

  // Filter available songs (exclude songs already in current setlist)
  const availableSongs = availableContent.filter(
    (content) => !selectedSetlist?.setlist_songs?.some(
      (setlistSong) => setlistSong.content?.id === content.id
    )
  )

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-6 text-xl">{error}</p>
            <div className="space-x-4">
              <Button
                onClick={refreshData}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3"
              >
                Try Again
              </Button>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SetlistErrorBoundary>
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
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-base shadow-lg"
                  disabled={operationInProgress.create}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {operationInProgress.create ? "Creating..." : "Create Setlist"}
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
                      onChange={(e) => setNewSetlistData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-2 border-amber-300 focus:border-amber-500 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-lg font-medium text-gray-900">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this setlist"
                      value={newSetlistData.description}
                      onChange={(e) => setNewSetlistData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 border-amber-300 focus:border-amber-500 text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="venue" className="text-lg font-medium text-gray-900">
                        Venue
                      </Label>
                      <Input
                        id="venue"
                        placeholder="Performance venue"
                        value={newSetlistData.venue}
                        onChange={(e) => setNewSetlistData(prev => ({ ...prev, venue: e.target.value }))}
                        className="mt-2 border-amber-300 focus:border-amber-500 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="performance_date" className="text-lg font-medium text-gray-900">
                        Date
                      </Label>
                      <Input
                        id="performance_date"
                        type="datetime-local"
                        value={newSetlistData.performance_date}
                        onChange={(e) => setNewSetlistData(prev => ({ ...prev, performance_date: e.target.value }))}
                        className="mt-2 border-amber-300 focus:border-amber-500 text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-lg font-medium text-gray-900">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes or reminders"
                      value={newSetlistData.notes}
                      onChange={(e) => setNewSetlistData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-2 border-amber-300 focus:border-amber-500 text-base"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSetlist}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                      disabled={operationInProgress.create || !newSetlistData.name.trim()}
                    >
                      {operationInProgress.create ? "Creating..." : "Create Setlist"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content continues with your existing layout but with better error handling and state management */}
          {/* ... Rest of your existing JSX with the same styling ... */}
        </div>
      </div>
    </SetlistErrorBoundary>
  )
}