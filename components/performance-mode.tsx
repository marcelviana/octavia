"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

export function PerformanceMode({ onExitPerformance, selectedContent }: PerformanceModeProps) {
  const [currentSong, setCurrentSong] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [showControls, setShowControls] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)

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
            { text: "\nI don't believe that anybody feels the way I " },
            { chord: "C", text: "do about you " },
            { chord: "D", text: "now" },
          ],
        },
        {
          title: "Verse 2:",
          content: [
            { chord: "Em", text: "Backbeat, the word is on the street that the fire in your " },
            { chord: "C", text: "heart is out" },
            { text: "\nI'm " },
            { chord: "G", text: "sure you've heard it all before but you never really had a " },
            { chord: "D", text: "doubt" },
            { text: "\nI don't believe that anybody feels the way I " },
            { chord: "C", text: "do about you " },
            { chord: "D", text: "now" },
          ],
        },
        {
          title: "Pre-Chorus:",
          content: [
            { chord: "C", text: "And all the roads we " },
            { chord: "D", text: "have to walk are " },
            { chord: "Em", text: "winding" },
            { text: "\n" },
            { chord: "C", text: "And all the lights that " },
            { chord: "D", text: "lead us there are " },
            { chord: "Em", text: "blinding" },
            { text: "\n" },
            { chord: "C", text: "There are many " },
            { chord: "D", text: "things that I would " },
            { chord: "Em", text: "like to say to " },
            { chord: "D", text: "you but I don't know " },
            { chord: "C", text: "how" },
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
            { text: "\nNow the air I tasted and breathed has taken a " },
            { chord: "E", text: "turn" },
          ],
        },
        {
          title: "Chorus:",
          content: [
            { text: "Ooh, and all I taught her was " },
            { chord: "A", text: "everything" },
            { text: "\nOoh, I know she gave me all that she " },
            { chord: "E", text: "wore" },
            { text: "\nAnd now my bitter hands chafe beneath the " },
            { chord: "A", text: "clouds" },
            { text: "\nOf what was everything" },
          ],
        },
        {
          title: "Bridge:",
          content: [
            { chord: "E", text: "Oh, the pictures have all been " },
            { chord: "A", text: "washed in black" },
            { text: "\nTattooed everything" },
            { text: "\n" },
            { chord: "E", text: "I take a walk outside" },
            { text: "\nI'm surrounded by some kids at play" },
            { text: "\nI can feel their laughter, so why do I " },
            { chord: "A", text: "sear?" },
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
        {
          title: "Verse 2:",
          content: [
            { chord: "C", text: "Same old " },
            { chord: "Am", text: "song, just a drop of water in an endless " },
            { chord: "G", text: "sea" },
            { text: "\n" },
            { chord: "C", text: "All we " },
            { chord: "Am", text: "do crumbles to the ground though we refuse to " },
            { chord: "G", text: "see" },
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
            { text: "\nBright and early for their daily " },
            { chord: "Em", text: "races" },
            { text: "\nGoing " },
            { chord: "A", text: "nowhere, going " },
            { chord: "Em", text: "nowhere" },
          ],
        },
        {
          title: "Verse 2:",
          content: [
            { chord: "Em", text: "Their tears are filling up their " },
            { chord: "A", text: "glasses" },
            { text: "\nNo expre" },
            { chord: "Em", text: "ssion, no expre" },
            { chord: "A", text: "ssion" },
            { text: "\nHide my head, I wanna drown my " },
            { chord: "Em", text: "sorrow" },
            { text: "\nNo " },
            { chord: "A", text: "tomorrow, no " },
            { chord: "Em", text: "tomorrow" },
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
            { text: "\nI find it hard to " },
            { chord: "C", text: "tell you, I find it hard to " },
            { chord: "G", text: "take" },
            { text: "\nWhen people run in " },
            { chord: "D", text: "circles, it's a very, very" },
            { text: "\nMad " },
            { chord: "Em", text: "world, mad " },
            { chord: "A", text: "world" },
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
            { text: "\nBut " },
            { chord: "F", text: "you don't really " },
            { chord: "G", text: "care for music, " },
            { chord: "C", text: "do you?" },
          ],
        },
        {
          title: "Verse 2:",
          content: [
            { text: "It " },
            { chord: "C", text: "goes like this, the " },
            { chord: "F", text: "fourth, the " },
            { chord: "G", text: "fifth" },
            { text: "\nThe " },
            { chord: "Am", text: "minor fall, the " },
            { chord: "F", text: "major lift" },
            { text: "\nThe " },
            { chord: "G", text: "baffled king " },
            { chord: "E", text: "composing " },
            { chord: "Am", text: "Hallelujah" },
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
  }, [currentSong, isPlaying, onExitPerformance])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentSongData = setlist[currentSong]

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
    // Initial timeout to hide controls
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
    <div className="h-screen bg-black text-white flex flex-col relative" onMouseMove={handleMouseMove}>
      {/* Top Control Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onExitPerformance} className="text-white hover:bg-white/20">
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="font-bold text-lg">{currentSongData.title}</h2>
            <p className="text-sm text-gray-300">{currentSongData.artist}</p>
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

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-16">
        <Card className="bg-white text-black shadow-2xl w-full max-w-4xl h-[calc(100vh-120px)] overflow-hidden">
          <div
            ref={contentRef}
            className="p-6 h-full overflow-auto"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {/* Song Header */}
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-3xl font-bold mb-2">{currentSongData.title}</h1>
              <p className="text-xl text-gray-600 mb-3">{currentSongData.artist}</p>
              <div className="flex justify-center space-x-4">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Key: {currentSongData.key}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  BPM: {currentSongData.bpm}
                </Badge>
              </div>
            </div>

            {/* Song Content */}
            <div className="space-y-8 max-w-3xl mx-auto">
              {lyricsData[currentSong]?.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-8">
                  <h3 className="font-bold text-blue-600 text-xl mb-3">{section.title}</h3>
                  <div className="mb-4 text-lg leading-relaxed">
                    {section.content.map((part, partIndex) => (
                      <span key={partIndex}>
                        {part.chord ? (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm mr-1 inline-block">
                            {part.chord}
                          </span>
                        ) : null}
                        {part.text}
                      </span>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 py-10">
                  <p className="text-xl">No lyrics available for this song</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
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
            <span className="text-sm min-w-[40px] text-center">{zoom}%</span>
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
              {setlist.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer ${
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
