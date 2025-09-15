import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"

interface ContentViewerToolbarProps {
  isPlaying: boolean
  zoom: number
  currentPage: number
  totalPages: number
  onTogglePlay: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function ContentViewerToolbar({
  isPlaying,
  zoom,
  currentPage,
  totalPages,
  onTogglePlay,
  onZoomIn,
  onZoomOut,
  onPreviousPage,
  onNextPage,
}: ContentViewerToolbarProps) {
  return (
    <div className="bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePlay}
            className="text-white hover:bg-gray-700"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-white" />
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              className="text-white hover:bg-gray-700"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              className="text-white hover:bg-gray-700"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-white">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={onPreviousPage}
              className="text-white hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={onNextPage}
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
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}