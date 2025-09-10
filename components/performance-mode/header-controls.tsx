import { memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  Plus,
  Minus,
  Moon,
  Sun,
} from "lucide-react"
import type { SongData } from "@/types/performance"

interface HeaderControlsProps {
  // Title and Exit
  currentSongData: SongData
  onExitPerformance: () => void
  
  // Dark mode
  darkSheet: boolean
  setDarkSheet: (dark: boolean) => void
  
  // Zoom controls
  zoom: number
  setZoom: (zoom: number) => void
  
  // Play/Pause
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  
  // BPM controls
  bpm: number
  bpmFeedback: string | null
  startPress: (type: "inc" | "dec") => void
  endPress: (type: "inc" | "dec", trigger?: boolean) => void
}

export const HeaderControls = memo(function HeaderControls({
  currentSongData,
  onExitPerformance,
  darkSheet,
  setDarkSheet,
  zoom,
  setZoom,
  isPlaying,
  setIsPlaying,
  bpm,
  bpmFeedback,
  startPress,
  endPress
}: HeaderControlsProps) {
  return (
    <>
      {/* Header Line 1 - Title/Artist with X and Dark mode buttons */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExitPerformance}
              className="text-white hover:bg-white/20"
              data-testid="exit-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center flex-1">
            <h2 className="font-bold text-lg text-white">{currentSongData.title || "Unknown Song"}</h2>
            <p className="text-sm text-[#A69B8E]">{currentSongData.artist || "Unknown Artist"}</p>
          </div>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkSheet(!darkSheet)}
              className="text-white hover:bg-white/20"
              data-testid="dark-mode-toggle"
            >
              {darkSheet ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Header Line 2 - Functional Controls */}
      <div className="absolute top-[60px] left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-6 py-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(70, zoom - 10))}
              className="text-white hover:bg-white/20"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[40px] text-center text-[#A69B8E]">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="text-white hover:bg-white/20"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Play/Pause Control */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${isPlaying ? "text-[#FF6B6B]" : "text-white"} hover:bg-white/20`}
              data-testid="play-pause-button"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>

          {/* BPM Controls */}
          <div className="relative flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onPointerDown={() => startPress("dec")}
              onPointerUp={() => endPress("dec")}
              onPointerLeave={() => endPress("dec", false)}
              onPointerCancel={() => endPress("dec", false)}
              className="text-white hover:bg-white/30 active:scale-95 transition-transform"
              aria-label="Decrease BPM"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[#A69B8E] min-w-[60px] text-center">{bpm} BPM</span>
            <Button
              variant="ghost"
              size="icon"
              onPointerDown={() => startPress("inc")}
              onPointerUp={() => endPress("inc")}
              onPointerLeave={() => endPress("inc", false)}
              onPointerCancel={() => endPress("inc", false)}
              className="text-white hover:bg-white/30 active:scale-95 transition-transform"
              aria-label="Increase BPM"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {bpmFeedback && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1A1F36] text-white text-xs px-2 py-1 rounded">
                {bpmFeedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
})