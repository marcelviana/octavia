"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Edit, Trash2, Clock, Music, Calendar, Share, Copy, GripVertical } from "lucide-react"
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
  onEnterPerformance: () => void
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
        description: newSetlistData.description || null,
        performance_date: newSetlistData.performance_date || null,
        venue: newSetlistData.venue || null,
        notes: newSetlistData.notes || null,
      }

      const newSetlist = await createSetlist(setlistData)
      const setlistWithSongs: SetlistWithSongs = {
        ...newSetlist,
        setlist_songs: [],
      }

      setSetlists([setlistWithSongs, ...setlists])
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
      setSetlists(setlists.filter((s) => s.id !== setlistId))
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
      const currentMaxPosition = selectedSetlist.setlist_songs.length

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
    (content) => !selectedSetlist?.setlist_songs.some((setlistSong) => setlistSong.content.id === content.id),
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-[#1A1F36]">Loading your setlists...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData} className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Setlist Manager</h1>
          <p className="text-gray-600">Organize your performances</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Setlist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Setlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Setlist Name</Label>
                <Input
                  id="name"
                  placeholder="Enter setlist name"
                  value={newSetlistData.name}
                  onChange={(e) => setNewSetlistData({ ...newSetlistData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description"
                  value={newSetlistData.description}
                  onChange={(e) => setNewSetlistData({ ...newSetlistData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="date">Performance Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newSetlistData.performance_date}
                  onChange={(e) => setNewSetlistData({ ...newSetlistData, performance_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Performance venue"
                  value={newSetlistData.venue}
                  onChange={(e) => setNewSetlistData({ ...newSetlistData, venue: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSetlist} disabled={!newSetlistData.name.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setlists List */}
        <div className="lg:col-span-1 space-y-4">
          {setlists.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Setlists Yet</h3>
                <p className="text-gray-600 mb-4">Create your first setlist to get started.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Setlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            setlists.map((setlist) => (
              <Card
                key={setlist.id}
                className={`cursor-pointer transition-all ${
                  selectedSetlist?.id === setlist.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedSetlist(setlist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{setlist.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{setlist.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        {setlist.performance_date && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(setlist.performance_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Music className="w-3 h-3 mr-1" />
                          {setlist.setlist_songs?.length || 0} songs
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(calculateTotalDuration(setlist.setlist_songs || []))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSetlist(setlist.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedSetlist.name}</CardTitle>
                    <p className="text-gray-600 mt-1">{selectedSetlist.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button onClick={onEnterPerformance}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Performance
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  {selectedSetlist.performance_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(selectedSetlist.performance_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Music className="w-4 h-4 mr-1" />
                    {selectedSetlist.setlist_songs?.length || 0} songs
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(calculateTotalDuration(selectedSetlist.setlist_songs || []))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!selectedSetlist.setlist_songs || selectedSetlist.setlist_songs.length === 0 ? (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Songs Yet</h3>
                      <p className="text-gray-600 mb-4">Add some songs to this setlist to get started.</p>
                    </div>
                  ) : (
                    selectedSetlist.setlist_songs
                      .sort((a, b) => a.position - b.position)
                      .map((setlistSong, index) => (
                        <div
                          key={setlistSong.id}
                          className="flex items-center justify-between p-3 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-4 h-4 text-stone-500 cursor-grab" />
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{setlistSong.content.title}</p>
                              <p className="text-sm text-gray-600">{setlistSong.content.artist || "Unknown Artist"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">{setlistSong.content.key || "N/A"}</Badge>
                            <span className="text-sm text-gray-500">
                              {setlistSong.content.bpm ? `${setlistSong.content.bpm} BPM` : "N/A"}
                            </span>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleRemoveSong(setlistSong.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Total Performance Time</span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatDuration(calculateTotalDuration(selectedSetlist.setlist_songs || []))}
                    </span>
                  </div>
                </div>

                <Dialog open={isAddSongsDialogOpen} onOpenChange={setIsAddSongsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-4" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Songs to Setlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Add Songs to "{selectedSetlist?.name}"</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-stone-600">
                        Select songs from your library to add to this setlist
                      </div>

                      <ScrollArea className="h-96 border border-stone-300 rounded-lg p-4">
                        {availableSongs.length === 0 ? (
                          <div className="text-center py-8 text-stone-500">
                            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No additional songs available to add.</p>
                            <p className="text-sm mt-1">All songs from your library are already in this setlist.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {availableSongs.map((song) => (
                              <div
                                key={song.id}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-stone-100 transition-colors"
                              >
                                <Checkbox
                                  id={`song-${song.id}`}
                                  checked={selectedSongsToAdd.includes(song.id)}
                                  onCheckedChange={(checked) => handleSongSelection(song.id, checked as boolean)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">{song.title}</p>
                                      <p className="text-sm text-stone-600">{song.artist || "Unknown Artist"}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-stone-600">
                                      <Badge variant="secondary" className="bg-stone-100 text-blue-600">
                                        {song.key || "N/A"}
                                      </Badge>
                                      <span>{song.bpm ? `${song.bpm} BPM` : "N/A"}</span>
                                      <Badge variant="outline" className="border-stone-300 text-stone-600">
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
                        <div className="p-3 bg-stone-100 rounded-lg">
                          <p className="text-sm text-gray-900">
                            {selectedSongsToAdd.length} song{selectedSongsToAdd.length !== 1 ? "s" : ""} selected
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSongsToAdd([])
                            setIsAddSongsDialogOpen(false)
                          }}
                          className="border-stone-300 text-gray-900 hover:bg-stone-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addSelectedSongs}
                          disabled={selectedSongsToAdd.length === 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <Card>
              <CardContent className="p-12 text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Setlist</h3>
                <p className="text-gray-600">Choose a setlist from the left to view and manage its songs.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
