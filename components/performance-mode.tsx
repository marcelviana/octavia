"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MusicText } from "@/components/music-text"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  Settings,
  Clock,
  MoreHorizontal,
} from "lucide-react"

interface PerformanceModeProps {
  onExitPerformance: () => void
  selectedContent?: any
  selectedSetlist?: any
}

export function PerformanceMode({
  onExitPerformance,
  selectedContent,
  selectedSetlist,
}: PerformanceModeProps) {
  const [currentSong, setCurrentSong] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [showControls, setShowControls] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)

  const defaultSetlist = [
    { id: 1, title: "Wonderwall", artist: "Oasis", key: "Em", bpm: 87 },
    { id: 2, title: "Black", artist: "Pearl Jam", key: "E", bpm: 85 },
    { id: 3, title: "Dust in the Wind", artist: "Kansas", key: "C", bpm: 78 },
  ]

  const songs = selectedSetlist
    ? (selectedSetlist.setlist_songs || []).map((s: any) => s.content)
    : selectedContent
    ? [selectedContent]
    : defaultSetlist

  const lyricsData = songs.map((song: any) => song?.content_data?.lyrics || "")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentSong > 0) setCurrentSong(currentSong - 1)
          break
        case "ArrowRight":
          if (currentSong < songs.length - 1) setCurrentSong(currentSong + 1)
          break
        case " ":
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case "Escape":
          onExitPerformance()
          break
        case "+":
          setZoom((prev) => Math.min(150, prev + 10))
          break
        case "-":
          setZoom((prev) => Math.max(70, prev - 10))
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentSong, isPlaying, onExitPerformance, songs.length])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentSongData: any = songs[currentSong] || {}

  const handleMouseMove = () => {
    setShowControls(true)

    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }

    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  useEffect(() => {
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [])

  return (
    <div className="h-screen bg-[#1A1F36] text-white flex flex-col relative" onMouseMove={handleMouseMove}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onExitPerformance} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-[#A69B8E]" />
              <span className="text-[#A69B8E]">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="font-bold text-lg text-white">{currentSongData.title}</h2>
            <p className="text-sm text-[#A69B8E]">{currentSongData.artist}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${isPlaying ? "text-[#FF6B6B]" : "text-white"} hover:bg-white/20`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-16">
        <Card className="bg-[#F7F9FA] text-[#1A1F36] shadow-2xl w-full max-w-4xl h-[calc(100vh-120px)] overflow-hidden border-[#A69B8E]">
          <div
            ref={contentRef}
            className="p-6 h-full overflow-auto"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div className="text-center mb-6 border-b border-[#A69B8E] pb-4">
              <h1 className="text-3xl font-bold mb-2 text-[#1A1F36]">{currentSongData.title}</h1>
              <p className="text-xl text-[#A69B8E] mb-3">{currentSongData.artist}</p>
              <div className="flex justify-center space-x-4">
                <Badge variant="outline" className="text-sm px-3 py-1 border-[#2E7CE4] text-[#2E7CE4]">
                  Key: {currentSongData.key || "N/A"}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 border-[#2E7CE4] text-[#2E7CE4]">
                  BPM: {currentSongData.bpm || "N/A"}
                </Badge>
              </div>
            </div>

            <div className="space-y-8 max-w-3xl mx-auto">
              {lyricsData[currentSong] ? (
                <MusicText text={lyricsData[currentSong]} className="text-lg leading-relaxed" />
              ) : (
                <div className="text-center text-[#A69B8E] py-10">
                  <p className="text-xl">No lyrics available for this song</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(70, zoom - 10))}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[40px] text-center text-[#A69B8E]">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentSong === 0}
              onClick={() => setCurrentSong(currentSong - 1)}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Prev
            </Button>

            <div className="flex space-x-1 mx-2">
              {songs.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer ${
                    index === currentSong ? "bg-[#FF6B6B]" : "bg-[#A69B8E]"
                  }`}
                  onClick={() => setCurrentSong(index)}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={currentSong === songs.length - 1}
              onClick={() => setCurrentSong(currentSong + 1)}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
