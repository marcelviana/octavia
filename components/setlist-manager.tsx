"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Edit, Trash2, Clock, Music, Calendar, Share, Copy, GripVertical } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SetlistManagerProps {
  onEnterPerformance: () => void
}

export function SetlistManager({ onEnterPerformance }: SetlistManagerProps) {
  const [setlists, setSetlists] = useState([
    {
      id: 1,
      name: "Coffee Shop Session",
      description: "Acoustic set for intimate venue",
      date: "2024-01-15",
      duration: 90,
      songs: [
        { id: 1, title: "Wonderwall", artist: "Oasis", duration: 4.5, key: "Em" },
        { id: 2, title: "Black", artist: "Pearl Jam", duration: 5.2, key: "E" },
        { id: 3, title: "Dust in the Wind", artist: "Kansas", duration: 3.8, key: "C" },
        { id: 4, title: "Mad World", artist: "Gary Jules", duration: 4.1, key: "Em" },
        { id: 5, title: "Hallelujah", artist: "Jeff Buckley", duration: 6.3, key: "C" },
      ],
    },
    {
      id: 2,
      name: "Wedding Reception",
      description: "Mix of classics and modern hits",
      date: "2024-01-20",
      duration: 120,
      songs: [
        { id: 6, title: "Perfect", artist: "Ed Sheeran", duration: 4.2, key: "Ab" },
        { id: 7, title: "All of Me", artist: "John Legend", duration: 4.5, key: "Ab" },
        { id: 8, title: "Can't Help Myself", artist: "Four Tops", duration: 2.9, key: "C" },
        { id: 9, title: "Sweet Child O' Mine", artist: "Guns N' Roses", duration: 5.6, key: "D" },
      ],
    },
    {
      id: 3,
      name: "Open Mic Night",
      description: "Short set for weekly open mic",
      date: "2024-01-22",
      duration: 30,
      songs: [
        { id: 10, title: "House of the Rising Sun", artist: "The Animals", duration: 4.3, key: "Am" },
        { id: 11, title: "Creep", artist: "Radiohead", duration: 3.9, key: "G" },
        { id: 12, title: "Zombie", artist: "The Cranberries", duration: 5.1, key: "Em" },
      ],
    },
  ])

  const [selectedSetlist, setSelectedSetlist] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const calculateTotalDuration = (songs: any[]) => {
    return songs.reduce((total, song) => total + song.duration, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="p-6 space-y-6 bg-[#fff9f0]">
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
                <Input id="name" placeholder="Enter setlist name" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description" />
              </div>
              <div>
                <Label htmlFor="date">Performance Date</Label>
                <Input id="date" type="date" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setlists List */}
        <div className="lg:col-span-1 space-y-4">
          {setlists.map((setlist) => (
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
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(setlist.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Music className="w-3 h-3 mr-1" />
                        {setlist.songs.length} songs
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(calculateTotalDuration(setlist.songs))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(selectedSetlist.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Music className="w-4 h-4 mr-1" />
                    {selectedSetlist.songs.length} songs
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(calculateTotalDuration(selectedSetlist.songs))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedSetlist.songs.map((song: any, index: number) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-3 bg-[#F2EDE5] rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-[#A69B8E] cursor-grab" />
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{song.title}</p>
                          <p className="text-sm text-gray-600">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{song.key}</Badge>
                        <span className="text-sm text-gray-500">
                          {Math.floor(song.duration)}:{String(Math.round((song.duration % 1) * 60)).padStart(2, "0")}
                        </span>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Total Performance Time</span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatDuration(calculateTotalDuration(selectedSetlist.songs))}
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Songs to Setlist
                </Button>
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
