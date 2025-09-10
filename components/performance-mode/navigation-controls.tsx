import { memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { SongData } from "@/types/performance"

interface NavigationControlsProps {
  showControls: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  goToPrevious: () => void
  goToNext: () => void
  songs: SongData[]
  currentSong: number
  goToSong: (index: number) => void
}

export const NavigationControls = memo(function NavigationControls({
  showControls,
  canGoPrevious,
  canGoNext,
  goToPrevious,
  goToNext,
  songs,
  currentSong,
  goToSong
}: NavigationControlsProps) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm transition-opacity duration-300 ${
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      data-testid="bottom-controls"
    >
      <div className="flex items-center justify-center gap-4 p-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoPrevious}
          onClick={goToPrevious}
          className="text-white hover:bg-white/20 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Prev
        </Button>

        <div className="flex space-x-1 mx-4">
          {songs.map((_, index: number) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full cursor-pointer ${
                index === currentSong ? "bg-[#FF6B6B]" : "bg-[#A69B8E]"
              }`}
              onClick={() => goToSong(index)}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoNext}
          onClick={goToNext}
          className="text-white hover:bg-white/20 disabled:opacity-50"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
})