import { memo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Music,
  Calendar,
  MapPin,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]
type SetlistWithSongs = Database["public"]["Tables"]["setlists"]["Row"] & {
  setlist_songs: Array<{
    id: string
    position: number
    notes: string | null
    content: Content
  }>
}

interface SetlistDetailsProps {
  setlist: SetlistWithSongs
  onAddSongs: () => void
  onEditSetlist: () => void
  onEnterPerformance: (startingSongIndex?: number) => void
  onRemoveSong: (songId: string) => void
  onReorderSongs: (songId: string, newPosition: number) => void
  className?: string
}

function getContentTypeDisplay(contentType: string): { label: string; color: string } {
  switch (contentType) {
    case 'LYRICS':
      return { label: 'Lyrics', color: 'bg-green-100 text-green-800' }
    case 'CHORDS':
      return { label: 'Chords', color: 'bg-blue-100 text-blue-800' }
    case 'TABS':
      return { label: 'Tabs', color: 'bg-purple-100 text-purple-800' }
    case 'PIANO':
      return { label: 'Piano', color: 'bg-indigo-100 text-indigo-800' }
    case 'DRUMS':
      return { label: 'Drums', color: 'bg-orange-100 text-orange-800' }
    default:
      return { label: 'Sheet Music', color: 'bg-gray-100 text-gray-800' }
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function calculateTotalDuration(songs: any[]): number {
  return songs.reduce((total, song) => {
    const duration = song.content?.bpm ? (song.content.bpm / 60) * 3 : 4
    return total + duration
  }, 0)
}

export const SetlistDetails = memo(function SetlistDetails({
  setlist,
  onAddSongs,
  onEditSetlist,
  onEnterPerformance,
  onRemoveSong,
  onReorderSongs,
  className,
}: SetlistDetailsProps) {
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null)
  
  const songs = setlist.setlist_songs || []
  const totalDuration = calculateTotalDuration(songs)
  
  const handleDragStart = (e: React.DragEvent, songId: string) => {
    setDraggedSongId(songId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedSongId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetSongId: string) => {
    e.preventDefault()
    if (!draggedSongId || draggedSongId === targetSongId) return

    const draggedSong = songs.find(s => s.id === draggedSongId)
    const targetSong = songs.find(s => s.id === targetSongId)
    
    if (draggedSong && targetSong) {
      onReorderSongs(draggedSongId, targetSong.position)
    }
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-[#1A1F36] mb-2">
              {setlist.name}
            </CardTitle>
            
            {/* Setlist Info */}
            <div className="space-y-2">
              {setlist.description && (
                <p className="text-[#6B7280] text-sm">
                  {setlist.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-[#6B7280]">
                {setlist.performance_date && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(setlist.performance_date).toLocaleDateString()}
                  </div>
                )}
                {setlist.venue && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {setlist.venue}
                  </div>
                )}
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-1" />
                  {songs.length} song{songs.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(totalDuration)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditSetlist}
              className="border-[#E8E3DA] text-[#1A1F36] hover:bg-[#F8F9FA]"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => onEnterPerformance()}
              className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
              disabled={songs.length === 0}
            >
              <Play className="w-4 h-4 mr-1" />
              Start Performance
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Song List */}
        {songs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Music className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1A1F36] mb-2">No songs yet</h3>
              <p className="text-[#6B7280] mb-4">
                Add songs from your library to build this setlist.
              </p>
              <Button
                onClick={onAddSongs}
                className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Songs
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#1A1F36]">Songs</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddSongs}
                className="border-[#E8E3DA] text-[#1A1F36] hover:bg-[#F8F9FA]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Songs
              </Button>
            </div>
            
            <div className="space-y-2">
              {songs
                .sort((a, b) => a.position - b.position)
                .map((song, index) => {
                  const contentTypeInfo = getContentTypeDisplay(song.content.content_type || 'SHEET')
                  const isDragging = draggedSongId === song.id

                  return (
                    <div
                      key={song.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                        isDragging ? "opacity-50 border-[#2E7CE4]" : "border-[#E8E3DA] hover:border-[#2E7CE4]/50"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, song.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, song.id)}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-[#6B7280]" />
                      </div>
                      
                      {/* Position */}
                      <div className="flex items-center justify-center w-8 h-8 bg-[#F8F9FA] rounded-full text-sm font-medium text-[#1A1F36]">
                        {index + 1}
                      </div>
                      
                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#1A1F36] truncate">
                              {song.content.title || 'Untitled'}
                            </h4>
                            {song.content.artist && (
                              <p className="text-sm text-[#6B7280] truncate">
                                {song.content.artist}
                              </p>
                            )}
                            {song.notes && (
                              <div className="flex items-center mt-1">
                                <FileText className="w-3 h-3 mr-1 text-[#6B7280]" />
                                <p className="text-xs text-[#6B7280] truncate">
                                  {song.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant="secondary"
                              className={cn("text-xs", contentTypeInfo.color)}
                            >
                              {contentTypeInfo.label}
                            </Badge>
                            
                            {/* Quick Performance Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280] hover:text-[#2E7CE4] hover:bg-[#2E7CE4]/10"
                              onClick={() => onEnterPerformance(index)}
                              title="Start performance from this song"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                            
                            {/* Remove Song Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280] hover:text-red-600 hover:bg-red-50"
                              onClick={() => onRemoveSong(song.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})