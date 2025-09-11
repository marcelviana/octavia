import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Play,
  Star,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getHeaderGradient, getContentIcon } from "../utils/content-display-helpers"

interface ContentViewerHeaderProps {
  content: any
  isFavorite: boolean
  onBack: () => void
  onEnterPerformance: (content: any) => void
  onEdit?: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export function ContentViewerHeader({
  content,
  isFavorite,
  onBack,
  onEnterPerformance,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ContentViewerHeaderProps) {
  const IconComponent = getContentIcon(content.content_type)

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
            <IconComponent className="w-4 h-4 text-white" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-amber-50">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}