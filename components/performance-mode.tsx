"use client"

import { useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { usePerformanceNavigation } from "@/hooks/use-performance-navigation"
import { useContentCaching } from "@/hooks/use-content-caching"
import { useContentPreloader } from "@/hooks/use-content-preloader"
import { usePerformanceControls } from "@/hooks/use-performance-controls"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useContentRenderer } from "@/hooks/use-content-renderer"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { HeaderControls } from "./performance-mode/header-controls"
import { ContentDisplay } from "./performance-mode/content-display"
import { NavigationControls } from "./performance-mode/navigation-controls"
import type { 
  PerformanceModeProps, 
  SongData, 
  SetlistWithSongs,
  Content
} from "@/types/performance"

const defaultSetlist: SongData[] = [
  { id: "1", title: "Wonderwall", artist: "Oasis", key: "Em", bpm: 87 },
  { id: "2", title: "Black", artist: "Pearl Jam", key: "E", bpm: 85 },
  { id: "3", title: "Dust in the Wind", artist: "Kansas", key: "C", bpm: 78 },
]

export function PerformanceMode({
  onExitPerformance,
  selectedContent,
  selectedSetlist,
  startingSongIndex,
}: PerformanceModeProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const songs: SongData[] = useMemo(() => {
    if (selectedSetlist?.setlist_songs) {
      return selectedSetlist.setlist_songs.map(s => ({
        id: s.content.id,
        title: s.content.title,
        artist: s.content.artist,
        key: s.content.key,
        bpm: s.content.bpm,
        content_type: s.content.content_type,
        file_url: s.content.file_url,
        content_data: s.content.content_data ? {
          lyrics: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'lyrics' in s.content.content_data 
            ? s.content.content_data.lyrics as string 
            : undefined,
          file: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'file' in s.content.content_data 
            ? s.content.content_data.file as string 
            : undefined
        } : null
      }))
    }
    if (selectedContent) {
      return [{
        id: selectedContent.id,
        title: selectedContent.title,
        artist: selectedContent.artist,
        key: selectedContent.key,
        bpm: selectedContent.bpm,
        content_type: selectedContent.content_type,
        file_url: selectedContent.file_url,
        content_data: selectedContent.content_data ? {
          lyrics: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'lyrics' in selectedContent.content_data 
            ? selectedContent.content_data.lyrics as string 
            : undefined,
          file: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'file' in selectedContent.content_data 
            ? selectedContent.content_data.file as string 
            : undefined
        } : null
      }]
    }
    return defaultSetlist
  }, [selectedSetlist, selectedContent])

  const { currentSong, canGoNext, canGoPrevious, goToNext, goToPrevious, goToSong, currentSongData } = 
    usePerformanceNavigation({ songs, onExitPerformance, startingSongIndex })

  const { sheetUrls, sheetMimeTypes, lyricsData } = useContentCaching({ songs })
  
  const { zoom, isPlaying, bpm, darkSheet, bpmFeedback, showControls, setZoom, setIsPlaying, 
    setDarkSheet, changeBpm, startPress, endPress, handleMouseMove } = 
    usePerformanceControls({ currentSong, lyricsData, currentSongData, contentRef })

  // Intelligent preloading for seamless live performance
  useContentPreloader({ 
    songs, 
    currentSongIndex: currentSong, 
    isPlaying, 
    enablePreloading: true 
  })

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