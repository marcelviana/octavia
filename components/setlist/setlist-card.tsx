import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Edit,
  Trash2,
  Clock,
  Music,
  Calendar,
  Share,
  Star,
  Sparkles,
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

interface SetlistCardProps {
  setlist: SetlistWithSongs
  isSelected: boolean
  onSelect: (setlist: SetlistWithSongs) => void
  onEdit: (setlist: SetlistWithSongs) => void
  onDelete: (setlist: SetlistWithSongs) => void
  onEnterPerformance: (setlist: SetlistWithSongs, startingSongIndex?: number) => void
  onShare?: (setlist: SetlistWithSongs) => void
  onToggleFavorite?: (setlist: SetlistWithSongs) => void
}

function calculateTotalDuration(songs: any[]): number {
  return songs.reduce((total, song) => {
    const duration = song.content?.bpm ? (song.content.bpm / 60) * 3 : 4
    return total + duration
  }, 0)
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export const SetlistCard = memo(function SetlistCard({
  setlist,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onEnterPerformance,
  onShare,
  onToggleFavorite,
}: SetlistCardProps) {
  const totalDuration = calculateTotalDuration(setlist.setlist_songs || [])
  const songCount = setlist.setlist_songs?.length || 0
  const isUpcoming = setlist.performance_date && new Date(setlist.performance_date) > new Date()
  const isRecent = setlist.performance_date && 
    new Date(setlist.performance_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md border-[1px]",
        isSelected
          ? "border-[#2E7CE4] shadow-md bg-gradient-to-br from-[#2E7CE4]/5 to-transparent"
          : "border-[#E8E3DA] hover:border-[#2E7CE4]/50"
      )}
      onClick={() => onSelect(setlist)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-[#1A1F36] group-hover:text-[#2E7CE4] transition-colors flex items-center gap-2">
              {setlist.name}
              {setlist.is_favorite && (
                <Star className="w-4 h-4 fill-[#F39C12] text-[#F39C12]" />
              )}
              {isUpcoming && (
                <Sparkles className="w-4 h-4 text-[#2E7CE4]" />
              )}
            </CardTitle>
            {setlist.description && (
              <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                {setlist.description}
              </p>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#6B7280] hover:text-[#2E7CE4] hover:bg-[#2E7CE4]/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(setlist)
                }}
              >
                <Share className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#6B7280] hover:text-[#2E7CE4] hover:bg-[#2E7CE4]/10"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(setlist)
              }}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#6B7280] hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(setlist)
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#F8F9FA] text-[#6B7280] border-[#E8E3DA]"
            >
              <Music className="w-3 h-3 mr-1" />
              {songCount} song{songCount !== 1 ? 's' : ''}
            </Badge>
            <Badge 
              variant="secondary"
              className="text-xs bg-[#F8F9FA] text-[#6B7280] border-[#E8E3DA]"
            >
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(totalDuration)}
            </Badge>
            {isRecent && (
              <Badge 
                variant="secondary"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                Recent
              </Badge>
            )}
          </div>

          {/* Performance Info */}
          {setlist.performance_date && (
            <div className="flex items-center text-sm text-[#6B7280]">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(setlist.performance_date).toLocaleDateString()}</span>
              {setlist.venue && (
                <>
                  <span className="mx-2">•</span>
                  <span className="truncate">{setlist.venue}</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
              onClick={(e) => {
                e.stopPropagation()
                onEnterPerformance(setlist)
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Performance
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})