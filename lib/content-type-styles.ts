import { ContentType, normalizeContentType } from "@/types/content"

export interface ContentTypeStyle {
  ring: string
  border: string
  bg: string
  icon: string
}

export function getContentTypeStyle(type: string): ContentTypeStyle {
  const t = normalizeContentType(type)
  switch (t) {
    case ContentType.LYRICS:
      return {
        ring: "ring-green-500",
        border: "border-green-200",
        bg: "bg-green-50",
        icon: "text-green-600",
      }
    case ContentType.TAB:
      return {
        ring: "ring-blue-500",
        border: "border-blue-200",
        bg: "bg-blue-50",
        icon: "text-blue-600",
      }
    case ContentType.CHORDS:
      return {
        ring: "ring-purple-500",
        border: "border-purple-200",
        bg: "bg-purple-50",
        icon: "text-purple-600",
      }
    case ContentType.SHEET:
      return {
        ring: "ring-orange-500",
        border: "border-orange-200",
        bg: "bg-orange-50",
        icon: "text-orange-600",
      }
    default:
      return {
        ring: "ring-gray-500",
        border: "border-gray-200",
        bg: "bg-gray-50",
        icon: "text-gray-600",
      }
  }
}
