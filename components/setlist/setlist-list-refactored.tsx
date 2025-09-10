/**
 * SetlistList Component (Refactored with Composition Patterns)
 * 
 * Example of how to use the new composition patterns for consistency
 * and reusability across the application.
 */

import { memo } from "react"
import { Play, Edit, Trash2, Music, Calendar, Clock } from "lucide-react"
import { DataList, ActionCard } from "@/components/common"
import type { SetlistWithSongs } from "@/types/performance"

interface SetlistListRefactoredProps {
  setlists: SetlistWithSongs[]
  selectedSetlist: SetlistWithSongs | null
  loading: boolean
  error: string | null
  onSelectSetlist: (setlist: SetlistWithSongs) => void
  onCreateSetlist: () => void
  onEditSetlist: (setlist: SetlistWithSongs) => void
  onDeleteSetlist: (setlist: SetlistWithSongs) => void
  onEnterPerformance: (setlist: SetlistWithSongs, startingSongIndex?: number) => void
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

export const SetlistListRefactored = memo(function SetlistListRefactored({
  setlists,
  selectedSetlist,
  loading,
  error,
  onSelectSetlist,
  onCreateSetlist,
  onEditSetlist,
  onDeleteSetlist,
  onEnterPerformance,
}: SetlistListRefactoredProps) {
  const renderSetlistItem = (setlist: SetlistWithSongs, index: number) => {
    const songCount = setlist.setlist_songs?.length || 0
    const totalDuration = calculateTotalDuration(setlist.setlist_songs || [])
    const isSelected = selectedSetlist?.id === setlist.id
    const isUpcoming = setlist.performance_date && new Date(setlist.performance_date) > new Date()

    return (
      <ActionCard
        key={setlist.id}
        title={setlist.name}
        subtitle={setlist.artist || undefined}
        description={setlist.description || undefined}
        isSelected={isSelected}
        onClick={() => onSelectSetlist(setlist)}
        badges={[
          {
            label: `${songCount} song${songCount !== 1 ? 's' : ''}`,
            variant: "secondary",
          },
          {
            label: formatDuration(totalDuration),
            variant: "secondary", 
          },
          ...(isUpcoming ? [{
            label: "Upcoming",
            variant: "outline" as const,
          }] : []),
        ]}
        primaryAction={{
          label: "Start Performance",
          icon: <Play className="w-4 h-4" />,
          onClick: () => onEnterPerformance(setlist),
          disabled: songCount === 0,
        }}
        actions={[
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => onEditSetlist(setlist),
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => onDeleteSetlist(setlist),
            variant: "destructive",
          },
        ]}
        testId={`setlist-card-${setlist.id}`}
      >
        {/* Additional setlist information */}
        {setlist.performance_date && (
          <div className="flex items-center text-sm text-gray-500">
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
      </ActionCard>
    )
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Setlists</h2>
        <p className="text-gray-600 mt-1">
          {setlists.length} setlist{setlists.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )

  return (
    <DataList
      data={setlists}
      loading={loading}
      error={error}
      emptyTitle="No setlists yet"
      emptyDescription="Create your first setlist to organize songs for your performances."
      emptyIcon={<Music className="w-8 h-8 text-gray-400" />}
      onCreateNew={onCreateSetlist}
      createButtonText="Create Setlist"
      renderHeader={renderHeader}
      renderItem={renderSetlistItem}
      className="space-y-4"
      itemClassName="w-full"
      testId="setlist-list"
    />
  )
})