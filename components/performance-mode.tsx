"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "sonner"
import { getCachedFileUrl } from "@/lib/offline-cache"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MusicText } from "@/components/music-text"
import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import { ContentType } from "@/types/content"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  Maximize,
  Minimize,
  Plus,
  Minus,
  Moon,
  Sun,
} from "lucide-react"

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
  const [currentSong, setCurrentSong] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [showControls, setShowControls] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(80)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [darkSheet, setDarkSheet] = useState(false)
  const [bpmFeedback, setBpmFeedback] = useState<string | null>(null)
  const pressTimeout = useRef<NodeJS.Timeout | null>(null)
  const pressInterval = useRef<NodeJS.Timeout | null>(null)
  const isPressing = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<number | null>(null)
  const wakeLock = useRef<any>(null)


  const songs = useMemo(() => {
    if (selectedSetlist) {
      return (selectedSetlist.setlist_songs || []).map((s: any) => s.content)
    }
    if (selectedContent) return [selectedContent]
    return defaultSetlist
  }, [selectedSetlist, selectedContent])

  const lyricsData = songs.map((song: any) => song?.content_data?.lyrics || "")
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])

  useEffect(() => {
    let toRevoke: string[] = []
    const load = async () => {
      const urls = await Promise.all(
        songs.map(async (song: any) => {
          const cached = song?.id ? await getCachedFileUrl(song.id) : null
          if (cached) {
            toRevoke.push(cached)
            return cached
          }
          return song?.file_url || song?.content_data?.file || null
        })
      )
      setSheetUrls(urls)
    }
    load()
    return () => {
      toRevoke.forEach(url => URL.revokeObjectURL(url))
    }
  }, [songs])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { })
    } else {
      document.exitFullscreen().catch(() => { })
    }
  }

  useEffect(() => {
    const updateFs = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", updateFs)
    return () => document.removeEventListener("fullscreenchange", updateFs)
  }, [])

  const changeBpm = (delta: number, label: string) => {
    setBpm((prev) => {
      const val = Math.max(20, prev + delta)
      setBpmFeedback(`${val} BPM (${label})`)
      return val
    })
  }

  const startPress = (type: "inc" | "dec") => {
    isPressing.current = true
    pressTimeout.current = setTimeout(() => {
      pressInterval.current = setInterval(() => {
        changeBpm(type === "inc" ? 1 : -1, type === "inc" ? "+1" : "-1")
      }, 100)
    }, 400)
  }

  const endPress = (type: "inc" | "dec", trigger: boolean = true) => {
    if (!isPressing.current) return
    isPressing.current = false
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current)
      pressTimeout.current = null
    }
    if (pressInterval.current) {
      clearInterval(pressInterval.current)
      pressInterval.current = null
    } else if (trigger) {
      changeBpm(type === "inc" ? 5 : -5, type === "inc" ? "+5" : "-5")
    }
  }

  useEffect(() => {
    const requestLock = async () => {
      try {
        // @ts-ignore
        if (navigator.wakeLock) {
          // @ts-ignore
          wakeLock.current = await navigator.wakeLock.request("screen")
        } else {
          toast.warning(
            "Heads up! Your browser does not support preventing screen sleep. Please adjust your device settings to avoid screen timeout during your performance."
          )
        }
      } catch (err) {
        console.error("Wake lock error", err)
        toast.warning(
          "Heads up! Your browser does not support preventing screen sleep. Please adjust your device settings to avoid screen timeout during your performance."
        )
      }
    }
    requestLock()
    const handleVisibility = () => {
      if (wakeLock.current && document.visibilityState === "visible") {
        requestLock()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      if (wakeLock.current) {
        wakeLock.current.release()
      }
    }
  }, [])


  useEffect(() => {
    if (!isPlaying) {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current)
      return
    }

    const el = contentRef.current
    if (!el) return

    const total = el.scrollHeight - el.clientHeight
    const lines = lyricsData[currentSong]?.split("\n").length || 1
    const beats = lines * 4
    const beatDuration = 60 / bpm
    const scrollSpeed = total / (beats * beatDuration)
    const start = performance.now() - (el.scrollTop / scrollSpeed) * 1000

    const step = (now: number) => {
      const elapsed = (now - start) / 1000
      const y = scrollSpeed * elapsed
      el.scrollTop = y
      if (y < total && isPlaying) {
        scrollRef.current = requestAnimationFrame(step)
      } else {
        el.scrollTop = total
        scrollRef.current = null
        setIsPlaying(false)
      }
    }

    scrollRef.current = requestAnimationFrame(step)

    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current)
    }
  }, [isPlaying, bpm, currentSong, lyricsData])

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
          changeBpm(5, "+5")
          break
        case "-":
          changeBpm(-5, "-5")
          break
        case "f":
        case "F":
          toggleFullScreen()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentSong, isPlaying, onExitPerformance, songs.length])

  // Set initial song based on startingSongIndex
  useEffect(() => {
    if (startingSongIndex !== undefined && songs.length > 0 && startingSongIndex < songs.length) {
      setCurrentSong(startingSongIndex)
    }
  }, [startingSongIndex, songs.length])

  // Ensure currentSong index is valid
  useEffect(() => {
    if (songs.length > 0 && currentSong >= songs.length) {
      setCurrentSong(0)
    }
  }, [songs.length, currentSong])

  const currentSongData: any = songs[currentSong] || { title: "Unknown Song", artist: "Unknown Artist" }

  useEffect(() => {
    setBpm(currentSongData.bpm || 80)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [currentSong, currentSongData.bpm])

  useEffect(() => {
    if (!bpmFeedback) return
    const t = setTimeout(() => setBpmFeedback(null), 800)
    return () => clearTimeout(t)
  }, [bpmFeedback])

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

  // Add this at the end of your component, before the return statement
  useEffect(() => {
    return () => {
      // Clean up timers and intervals
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current)
      }
      if (pressTimeout.current) {
        clearTimeout(pressTimeout.current)
      }
      if (pressInterval.current) {
        clearInterval(pressInterval.current)
      }
      // Release wake lock
      if (wakeLock.current) {
        wakeLock.current.release()
      }
    }
  }, [])

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
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-between p-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExitPerformance}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center">
            <h2 className="font-bold text-lg text-white">{currentSongData.title || "Unknown Song"}</h2>
            <p className="text-sm text-[#A69B8E]">{currentSongData.artist || "Unknown Artist"}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="text-white hover:bg-white/20"
            >
              {isFullScreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkSheet(!darkSheet)}
              className="text-white hover:bg-white/20"
            >
              {darkSheet ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`${isPlaying ? "text-[#FF6B6B]" : "text-white"} hover:bg-white/20`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-16">
        <Card
          className={`shadow-2xl w-full max-w-4xl h-[calc(100vh-120px)] overflow-hidden border-[#A69B8E] ${darkSheet ? "bg-[#1A1F36] text-[#F7F9FA]" : "bg-[#F7F9FA] text-[#1A1F36]"}`}
        >
          <div
            ref={contentRef}
            className="p-6 h-full overflow-auto"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >


            <div className="space-y-8 max-w-3xl mx-auto">
              {currentSongData.content_type === ContentType.SHEET_MUSIC ? (
                sheetUrls[currentSong] ? (
                  (() => {
                    const url = sheetUrls[currentSong]!.toLowerCase()
                    const isPdf = url.endsWith(".pdf")
                    const isImage = url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg")
                    if (isPdf) {
                      return (
                        <PdfViewer
                          url={sheetUrls[currentSong] as string}
                          fullscreen
                          className="h-[calc(100vh-200px)]"
                        />
                      )
                    }
                    if (isImage) {
                      return (
                        <Image
                          src={sheetUrls[currentSong] as string}
                          alt={currentSongData.title || "Sheet Music"}
                          width={800}
                          height={800}
                          className="w-full h-auto"
                          style={{ maxHeight: "100%", objectFit: "contain" }}
                        />
                      )
                    }
                    return null
                  })()
                ) : (
                  <div className="text-center text-[#A69B8E] py-10">
                    <p className="text-xl">No sheet music available</p>
                  </div>
                )
              ) : lyricsData[currentSong] ? (
                <MusicText
                  text={lyricsData[currentSong]}
                  className="text-lg leading-relaxed"
                />
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
        className={`absolute bottom-0 left-0 right-0 z-50 bg-[#1A1F36]/90 backdrop-blur-sm transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-between p-3">
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
              {songs.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer ${index === currentSong ? "bg-[#FF6B6B]" : "bg-[#A69B8E]"
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
            <div className="relative flex items-center space-x-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onPointerDown={() => startPress("dec")}
                onPointerUp={() => endPress("dec")}
                onPointerLeave={() => endPress("dec", false)}
                onPointerCancel={() => endPress("dec", false)}
                className="text-white hover:bg-white/30 active:scale-95 transition-transform"
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
      </div>
    </div>
  )
}