import { ContentType, getContentTypeIcon, normalizeContentType } from '@/types/content'

export const getHeaderGradient = (type: string) => {
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

export const getContentIcon = (type: string) => {
  const IconComponent = getContentTypeIcon(type)
  return IconComponent
}

export const getOrdinalSuffix = (num: number) => {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return "st"
  if (j === 2 && k !== 12) return "nd"
  if (j === 3 && k !== 13) return "rd"
  return "th"
}