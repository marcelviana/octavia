"use client"

import { useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { usePerformanceNavigation } from "@/hooks/use-performance-navigation"
import { useContentCaching } from "@/hooks/use-content-caching"
import { usePerformanceControls } from "@/hooks/use-performance-controls"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useContentRenderer } from "@/hooks/use-content-renderer"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { HeaderControls } from "./performance-mode/header-controls"
import { ContentDisplay } from "./performance-mode/content-display"
import { NavigationControls } from "./performance-mode/navigation-controls"

const defaultSetlist = [
  { id: 1, title: "Wonderwall", artist: "Oasis", key: "Em", bpm: 87 },
  { id: 2, title: "Black", artist: "Pearl Jam", key: "E", bpm: 85 },
  { id: 3, title: "Dust in the Wind", artist: "Kansas", key: "C", bpm: 78 },
]

interface PerformanceModeProps {
  onExitPerformance: () => void
  selectedContent?: any
  selectedSetlist?: any
  startingSongIndex?: number
}

export function PerformanceMode({
  onExitPerformance,
  selectedContent,
  selectedSetlist,
  startingSongIndex,
}: PerformanceModeProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const songs = useMemo(() => {
    if (selectedSetlist) return (selectedSetlist.setlist_songs || []).map((s: any) => s.content)
    if (selectedContent) return [selectedContent]
    return defaultSetlist
  }, [selectedSetlist, selectedContent])

  const { currentSong, canGoNext, canGoPrevious, goToNext, goToPrevious, goToSong, currentSongData } = 
    usePerformanceNavigation({ songs, onExitPerformance, startingSongIndex })

  const { sheetUrls, sheetMimeTypes, lyricsData } = useContentCaching({ songs })

  const { zoom, isPlaying, bpm, darkSheet, bpmFeedback, showControls, setZoom, setIsPlaying, 
    setDarkSheet, changeBpm, startPress, endPress, handleMouseMove } = 
    usePerformanceControls({ currentSong, lyricsData, currentSongData, contentRef })

  const contentRenderInfo = useContentRenderer({
    currentSong, currentSongData, sheetUrls, sheetMimeTypes, lyricsData
  })

  useWakeLock()
  useKeyboardShortcuts({ isPlaying, setIsPlaying, changeBpm })



  // Show loading if no songs are available
  if (!songs || songs.length === 0) {
    return (
      <div className="h-screen bg-[#1A1F36] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading performance mode...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#1A1F36] text-white flex flex-col relative" onMouseMove={handleMouseMove}>
      <HeaderControls
        currentSongData={currentSongData}
        onExitPerformance={onExitPerformance}
        darkSheet={darkSheet}
        setDarkSheet={setDarkSheet}
        zoom={zoom}
        setZoom={setZoom}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        bpm={bpm}
        bpmFeedback={bpmFeedback}
        startPress={startPress}
        endPress={endPress}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-3 pt-[108px] pb-12">
        <Card
          className={`shadow-2xl w-full max-w-4xl h-[calc(100vh-168px)] overflow-hidden border-[#A69B8E] ${
            darkSheet ? "bg-[#1A1F36] text-[#F7F9FA]" : "bg-[#F7F9FA] text-[#1A1F36]"
          }`}
        >
          <div ref={contentRef} className="p-4 h-full overflow-auto">
            <ContentDisplay
              renderInfo={contentRenderInfo}
              currentSongData={currentSongData}
              currentSong={currentSong}
              zoom={zoom}
            />
          </div>
        </Card>
      </div>

      <NavigationControls
        showControls={showControls}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        songs={songs}
        currentSong={currentSong}
        goToSong={goToSong}
      />
    </div>
  )
}