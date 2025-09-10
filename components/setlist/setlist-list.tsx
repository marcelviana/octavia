import { memo } from "react"
import { SetlistCard } from "./setlist-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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

interface SetlistListProps {
  setlists: SetlistWithSongs[]
  selectedSetlist: SetlistWithSongs | null
  loading: boolean
  error: string | null
  onSelectSetlist: (setlist: SetlistWithSongs) => void
  onCreateSetlist: () => void
  onEditSetlist: (setlist: SetlistWithSongs) => void
  onDeleteSetlist: (setlist: SetlistWithSongs) => void
  onEnterPerformance: (setlist: SetlistWithSongs, startingSongIndex?: number) => void
  onShareSetlist?: (setlist: SetlistWithSongs) => void
  onToggleFavorite?: (setlist: SetlistWithSongs) => void
}

export const SetlistList = memo(function SetlistList({
  setlists,
  selectedSetlist,
  loading,
  error,
  onSelectSetlist,
  onCreateSetlist,
  onEditSetlist,
  onDeleteSetlist,
  onEnterPerformance,
  onShareSetlist,
  onToggleFavorite,
}: SetlistListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-gray-100 animate-pulse rounded-lg border border-[#E8E3DA]"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-medium">Error loading setlists</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-[#E8E3DA] text-[#1A1F36] hover:bg-[#F8F9FA]"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (setlists.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-20 h-20 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E8E3DA]">
            <Plus className="w-8 h-8 text-[#6B7280]" />
          </div>
          <h3 className="text-xl font-medium text-[#1A1F36] mb-2">No setlists yet</h3>
          <p className="text-[#6B7280] max-w-sm mx-auto">
            Create your first setlist to organize songs for your performances.
          </p>
        </div>
        <Button
          onClick={onCreateSetlist}
          className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Setlist
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1F36]">Your Setlists</h2>
          <p className="text-[#6B7280] mt-1">
            {setlists.length} setlist{setlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={onCreateSetlist}
          className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Setlist
        </Button>
      </div>

      {/* Setlist Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setlists.map((setlist) => (
          <SetlistCard
            key={setlist.id}
            setlist={setlist}
            isSelected={selectedSetlist?.id === setlist.id}
            onSelect={onSelectSetlist}
            onEdit={onEditSetlist}
            onDelete={onDeleteSetlist}
            onEnterPerformance={onEnterPerformance}
            onShare={onShareSetlist}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  )
})