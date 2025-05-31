"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Pause, Play, Settings, Clock } from "lucide-react"

interface PerformanceModeProps {
  onExitPerformance: () => void
  selectedContent?: any
}

export function PerformanceMode({ onExitPerformance, selectedContent }: PerformanceModeProps) {
  const [currentSong, setCurrentSong] = useState(0)
  const [zoom, setZoom] = useState(125)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Mock setlist data
  const setlist = [
    { id: 1, title: "Wonderwall", artist: "Oasis", key: "Em", bpm: 87 },
    { id: 2, title: "Black", artist: "Pearl Jam", key: "E", bpm: 85 },
    { id: 3, title: "Dust in the Wind", artist: "Kansas", key: "C", bpm: 78 },
    { id: 4, title: "Mad World", artist: "Gary Jules", key: "Em", bpm: 65 },
    { id: 5, title: "Hallelujah", artist: "Jeff Buckley", key: "C", bpm: 72 },
  ]

  // Add lyrics data for each song
  const lyricsData = {
    0: {
      // Wonderwall
      sections: [
        {
          title: "Verse 1:",
          content: [
            { chord: "Em", text: "Today is gonna be the day that they're gonna throw it back to " },
            { chord: "C", text: "you" },
            { text: "\nBy " },
            { chord: "G", text: "now you should've somehow realized what you gotta " },
            { chord: "D", text: "do" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { text: "Because " },
            { chord: "C", text: "maybe, " },
            { chord: "D", text: "you're gonna be the one that " },
            { chord: "Em", text: "saves me" },
            { text: "\nAnd after " },
            { chord: "C", text: "all, " },
            { chord: "D", text: "you're my wonder" },
            { chord: "Em", text: "wall" },
          ],
        },
      ],
    },
    1: {
      // Black
      sections: [
        {
          title: "Verse 1:",
          content: [
            { chord: "E", text: "Sheets of empty canvas, untouched sheets of " },
            { chord: "A", text: "clay" },
            { text: "\nWere laid spread out before me as her body once did " },
            { chord: "E", text: "All five horizons revolved around her soul as the " },
            { chord: "A", text: "earth to the sun" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { text: "Now the air I tasted and breathed has taken a " },
            { chord: "E", text: "turn" },
            { text: "\nOoh, and all I taught her was " },
            { chord: "A", text: "everything" },
            { text: "\nOoh, I know she gave me all that she " },
            { chord: "E", text: "wore" },
          ],
        },
      ],
    },
    2: {
      // Dust in the Wind
      sections: [
        {
          title: "Verse 1:",
          content: [
            { chord: "C", text: "I close my " },
            { chord: "Am", text: "eyes, only for a moment, and the moment's " },
            { chord: "G", text: "gone" },
            { text: "\n" },
            { chord: "C", text: "All my " },
            { chord: "Am", text: "dreams pass before my eyes, a " },
            { chord: "G", text: "curiosity" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { chord: "D", text: "Dust in the " },
            { chord: "G", text: "wind" },
            { text: "\nAll they are is dust in the " },
            { chord: "Am", text: "wind" },
          ],
        },
      ],
    },
    3: {
      // Mad World
      sections: [
        {
          title: "Verse 1:",
          content: [
            { chord: "Em", text: "All around me are familiar " },
            { chord: "A", text: "faces" },
            { text: "\nWorn out " },
            { chord: "Em", text: "places, worn out " },
            { chord: "A", text: "faces" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { text: "And I find it kinda " },
            { chord: "C", text: "funny, I find it kinda " },
            { chord: "G", text: "sad" },
            { text: "\nThe dreams in which I'm dying are the " },
            { chord: "D", text: "best I've ever had" },
          ],
        },
      ],
    },
    4: {
      // Hallelujah
      sections: [
        {
          title: "Verse 1:",
          content: [
            { chord: "C", text: "I've heard there was a " },
            { chord: "Am", text: "secret chord" },
            { text: "\nThat " },
            { chord: "C", text: "David played, and it " },
            { chord: "Am", text: "pleased the Lord" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { chord: "F", text: "Hallelujah, " },
            { chord: "G", text: "Hallelujah" },
            { text: "\n" },
            { chord: "C", text: "Hallelujah, " },
            { chord: "G", text: "Hallelujah" },
          ],
        },
      ],
    },
  }

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
          if (currentSong < setlist.length - 1) setCurrentSong(currentSong + 1)
          break
        case " ":
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case "Escape":
          onExitPerformance()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentSong, isPlaying, onExitPerformance])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentSongData = setlist[currentSong]

  return (
    <div className="h-screen bg-black text-white flex flex-col relative">
      {/* Control Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onExitPerformance} className="text-white hover:bg-white/20">
              <X className="w-4 h-4 mr-2" />
              Exit Performance
            </Button>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Song {currentSong + 1} of {setlist.length}
              </p>
              <h2 className="font-bold">{currentSongData.title}</h2>
              <p className="text-sm text-gray-300">{currentSongData.artist}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 flex items-center justify-center p-4 pt-20 overflow-hidden"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 2000)}
      >
        <div className="w-full h-full max-w-6xl max-h-full flex items-center justify-center">
          <Card className="bg-white text-black shadow-2xl w-full h-[calc(100vh-120px)]">
            <CardContent className="p-0 overflow-hidden">
              <div
                className="p-8 h-full"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  width: "100%",
                  overflow: "auto",
                }}
              >
                {/* Song Header */}
                <div className="text-center mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold mb-1">{currentSongData.title}</h1>
                  <p className="text-lg text-gray-600 mb-2">{currentSongData.artist}</p>
                  <div className="flex justify-center space-x-4 text-sm">
                    <Badge variant="secondary">Key: {currentSongData.key}</Badge>
                    <Badge variant="secondary">BPM: {currentSongData.bpm}</Badge>
                    <Badge variant="secondary">4/4 Time</Badge>
                  </div>
                </div>

                {/* Song Content - Dynamic based on current song */}
                <div className="space-y-4 max-w-5xl mx-auto px-4">
                  <div className="space-y-4 text-lg leading-relaxed">
                    {lyricsData[currentSong]?.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex}>
                        <h3 className="font-bold text-blue-600 mb-1">{section.title}</h3>
                        <p className="mb-2">
                          {section.content.map((part, partIndex) => (
                            <span key={partIndex}>
                              {part.chord ? (
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm mr-1">
                                  {part.chord}
                                </span>
                              ) : null}
                              {part.text}
                            </span>
                          ))}
                        </p>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500">
                        <p>No lyrics available for this song</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm transition-transform duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(75, zoom - 25))}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(150, zoom + 25))}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(100)}
              className="text-white hover:bg-white/20 text-xs"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentSong === 0}
              onClick={() => setCurrentSong(currentSong - 1)}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {setlist.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full cursor-pointer ${
                    index === currentSong ? "bg-white" : "bg-white/30"
                  }`}
                  onClick={() => setCurrentSong(index)}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={currentSong === setlist.length - 1}
              onClick={() => setCurrentSong(currentSong + 1)}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-300">Use ← → to navigate, Space to play/pause, Esc to exit</p>
          </div>
        </div>
      </div>
    </div>
  )
}
