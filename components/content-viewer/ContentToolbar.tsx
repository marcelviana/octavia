"use client"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Volume2
} from "lucide-react"

interface ContentToolbarProps {
  isPlaying: boolean
  zoom: number
  currentPage: number
  totalPages: number
  onPlayPause: () => void
  onZoomChange: (zoom: number) => void
  onPageChange: (page: number) => void
}

export function ContentToolbar({
  isPlaying,
  zoom,
  currentPage,
  totalPages,
  onPlayPause,
  onZoomChange,
  onPageChange
}: ContentToolbarProps) {
  return (
    <div className="bg-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="text-white hover:bg-gray-700"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-white" />
            <Slider
              value={[75]}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.max(25, zoom - 25))}
              className="text-white hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(Math.min(200, zoom + 25))}
              className="text-white hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-white">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="text-white hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="text-white hover:bg-gray-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}