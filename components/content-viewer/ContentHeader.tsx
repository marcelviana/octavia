"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Star } from "lucide-react"
import { ContentType, getContentTypeIcon, normalizeContentType } from "@/types/content"

interface ContentHeaderProps {
  content: {
    id: string
    title: string
    artist: string
    content_type: string
    is_favorite?: boolean
  }
  isFavorite: boolean
  onBack: () => void
  onEnterPerformance: (content: any) => void
  onToggleFavorite: () => void
}

const getHeaderGradient = (type: string) => {
  const t = normalizeContentType(type)
  switch (t) {
    case ContentType.LYRICS:
      return "from-green-500 to-green-600"
    case ContentType.TAB:
      return "from-blue-500 to-blue-600"
    case ContentType.CHORDS:
      return "from-purple-500 to-purple-600"
    case ContentType.SHEET:
      return "from-orange-500 to-orange-600"
    default:
      return "from-amber-500 to-orange-600"
  }
}

const getContentIcon = (type: string) => {
  const IconComponent = getContentTypeIcon(type)
  return <IconComponent className="w-4 h-4 text-white" />
}

export function ContentHeader({
  content,
  isFavorite,
  onBack,
  onEnterPerformance,
  onToggleFavorite
}: ContentHeaderProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 px-0 py-2 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-amber-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${getHeaderGradient(
              content.content_type,
            )}`}
          >
            {getContentIcon(content.content_type)}
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-xl text-gray-900">
              {content.title}
            </h1>
            <p className="text-sm text-gray-500">
              {content.artist} • {content.content_type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            className={`hover:bg-amber-50 ${
              isFavorite ? "text-yellow-500" : "text-gray-400"
            }`}
          >
            <Star
              className={`w-5 h-5 ${
                isFavorite ? "fill-current" : ""
              }`}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEnterPerformance(content)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
          >
            <Play className="w-4 h-4 mr-0 md:mr-2 mr-0" />
            <span className="hidden md:inline">Performance</span>
          </Button>
        </div>
      </div>
    </div>
  )
}