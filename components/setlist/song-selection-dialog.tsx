import { memo, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Music, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

interface SongSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableContent: Content[]
  selectedSongs: string[]
  onSelectedSongsChange: (songIds: string[]) => void
  onAddSongs: (songIds: string[]) => Promise<void>
  loading?: boolean
  excludeSongIds?: string[] // Songs already in the setlist
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

export const SongSelectionDialog = memo(function SongSelectionDialog({
  open,
  onOpenChange,
  availableContent,
  selectedSongs,
  onSelectedSongsChange,
  onAddSongs,
  loading = false,
  excludeSongIds = [],
}: SongSelectionDialogProps) {
  const [searchFilter, setSearchFilter] = useState("")
  const [submitLoading, setSubmitLoading] = useState(false)

  // Filter available content
  const filteredContent = useMemo(() => {
    return availableContent
      .filter(content => !excludeSongIds.includes(content.id))
      .filter(content => {
        if (!searchFilter) return true
        const search = searchFilter.toLowerCase()
        return (
          content.title?.toLowerCase().includes(search) ||
          content.artist?.toLowerCase().includes(search) ||
          content.content_type?.toLowerCase().includes(search)
        )
      })
      .sort((a, b) => {
        // Sort by title, then by artist
        const titleCompare = (a.title || '').localeCompare(b.title || '')
        if (titleCompare !== 0) return titleCompare
        return (a.artist || '').localeCompare(b.artist || '')
      })
  }, [availableContent, excludeSongIds, searchFilter])

  const handleToggleSong = (songId: string) => {
    const newSelection = selectedSongs.includes(songId)
      ? selectedSongs.filter(id => id !== songId)
      : [...selectedSongs, songId]
    onSelectedSongsChange(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedSongs.length === filteredContent.length) {
      onSelectedSongsChange([])
    } else {
      onSelectedSongsChange(filteredContent.map(content => content.id))
    }
  }

  const handleAddSongs = async () => {
    if (selectedSongs.length === 0) return

    setSubmitLoading(true)
    try {
      await onAddSongs(selectedSongs)
      onSelectedSongsChange([])
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add songs:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const isAllSelected = filteredContent.length > 0 && selectedSongs.length === filteredContent.length
  const isPartiallySelected = selectedSongs.length > 0 && selectedSongs.length < filteredContent.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#1A1F36]">Add Songs to Setlist</DialogTitle>
          <DialogDescription>
            Select songs from your library to add to this setlist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              placeholder="Search by title, artist, or content type..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 border-[#E8E3DA] focus:border-[#2E7CE4]"
            />
          </div>

          {/* Select All */}
          {filteredContent.length > 0 && (
            <div className="flex items-center space-x-2 py-2 border-b border-[#E8E3DA]">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className={cn(
                  isPartiallySelected && "data-[state=checked]:bg-[#2E7CE4] data-[state=checked]:border-[#2E7CE4]"
                )}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium text-[#1A1F36] cursor-pointer"
              >
                Select all ({filteredContent.length} songs)
              </label>
            </div>
          )}

          {/* Song List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#6B7280]" />
                <span className="ml-2 text-[#6B7280]">Loading songs...</span>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#1A1F36] mb-2">
                  {searchFilter ? "No matching songs" : "No songs available"}
                </h3>
                <p className="text-[#6B7280]">
                  {searchFilter 
                    ? "Try adjusting your search terms."
                    : "Add some songs to your library first."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContent.map((content) => {
                  const isSelected = selectedSongs.includes(content.id)
                  const contentTypeInfo = getContentTypeDisplay(content.content_type || 'SHEET')

                  return (
                    <div
                      key={content.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-[#F8F9FA]",
                        isSelected
                          ? "border-[#2E7CE4] bg-[#2E7CE4]/5"
                          : "border-[#E8E3DA]"
                      )}
                      onClick={() => handleToggleSong(content.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSong(content.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#1A1F36] truncate">
                              {content.title || 'Untitled'}
                            </h4>
                            {content.artist && (
                              <p className="text-sm text-[#6B7280] truncate">
                                {content.artist}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge 
                              variant="secondary"
                              className={cn("text-xs", contentTypeInfo.color)}
                            >
                              {contentTypeInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitLoading}
            className="border-[#E8E3DA] text-[#1A1F36] hover:bg-[#F8F9FA]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSongs}
            disabled={selectedSongs.length === 0 || submitLoading}
            className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white disabled:opacity-50"
          >
            {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add {selectedSongs.length} Song{selectedSongs.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})