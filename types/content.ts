import { 
  Mic, 
  Grid, 
  AlignLeft, 
  FileMusic,
  type LucideIcon 
} from "lucide-react"

export enum ContentType {
  LYRICS = "Lyrics",
  CHORDS = "Chords",
  TAB = "Tab",
  SHEET = "Sheet"
}

export const CONTENT_TYPE_DISPLAY_NAMES: Record<ContentType, string> = {
  [ContentType.LYRICS]: "Lyrics",
  [ContentType.CHORDS]: "Chords",
  [ContentType.TAB]: "Tab",
  [ContentType.SHEET]: "Sheet"
}

export const CONTENT_TYPE_KEYS: Record<ContentType, string> = {
  [ContentType.LYRICS]: "lyrics",
  [ContentType.CHORDS]: "chords",
  [ContentType.TAB]: "tablature",
  [ContentType.SHEET]: "sheet"
}

export const CONTENT_TYPE_IDS = {
  lyrics: ContentType.LYRICS,
  chord_chart: ContentType.CHORDS,
  tablature: ContentType.TAB,
  sheet: ContentType.SHEET
} as const

export type ContentTypeId = keyof typeof CONTENT_TYPE_IDS

// Icon mappings for content types
export const CONTENT_TYPE_ICONS: Record<ContentType, LucideIcon> = {
  [ContentType.LYRICS]: Mic,
  [ContentType.CHORDS]: Grid,
  [ContentType.TAB]: AlignLeft,
  [ContentType.SHEET]: FileMusic
}

// Color schemes for content types
export const CONTENT_TYPE_COLORS: Record<ContentType, {
  primary: string;
  light: string;
  border: string;
  bg: string;
  hoverBg: string;
  hoverBorder: string;
  ring: string;
}> = {
  [ContentType.LYRICS]: {
    primary: "text-green-600",
    light: "text-green-500",
    border: "border-green-200",
    bg: "bg-green-50",
    hoverBg: "hover:bg-green-50",
    hoverBorder: "hover:border-green-200",
    ring: "ring-green-500"
  },
  [ContentType.TAB]: {
    primary: "text-blue-600",
    light: "text-blue-500",
    border: "border-blue-200",
    bg: "bg-blue-50",
    hoverBg: "hover:bg-blue-50",
    hoverBorder: "hover:border-blue-200",
    ring: "ring-blue-500"
  },
  [ContentType.CHORDS]: {
    primary: "text-purple-600",
    light: "text-purple-500",
    border: "border-purple-200",
    bg: "bg-purple-50",
    hoverBg: "hover:bg-purple-50",
    hoverBorder: "hover:border-purple-200",
    ring: "ring-purple-500"
  },
  [ContentType.SHEET]: {
    primary: "text-orange-600",
    light: "text-orange-500",
    border: "border-orange-200",
    bg: "bg-orange-50",
    hoverBg: "hover:bg-orange-50",
    hoverBorder: "hover:border-orange-200",
    ring: "ring-orange-500"
  }
}

/**
 * Get the icon component for a content type
 * @param contentType The content type
 * @returns The Lucide icon component
 */
export function getContentTypeIcon(contentType: ContentType | string): LucideIcon {
  // Handle legacy string formats
  const normalizedType = normalizeContentType(contentType)
  return CONTENT_TYPE_ICONS[normalizedType] || CONTENT_TYPE_ICONS[ContentType.LYRICS]
}

/**
 * Get the color scheme for a content type
 * @param contentType The content type
 * @returns The color scheme object
 */
export function getContentTypeColors(contentType: ContentType | string) {
  const normalizedType = normalizeContentType(contentType)
  return CONTENT_TYPE_COLORS[normalizedType] || CONTENT_TYPE_COLORS[ContentType.LYRICS]
}

/**
 * Normalize content type strings to ContentType enum values
 * Handles legacy formats like "Guitar Tab", "Chord Chart", etc.
 */
function normalizeContentType(contentType: ContentType | string): ContentType {
  if (Object.values(ContentType).includes(contentType as ContentType)) {
    return contentType as ContentType
  }
  
  // Handle legacy formats
  switch (contentType) {
    case "Guitar Tab":
    case "tablature":
      return ContentType.TAB
    case "Chord Chart":
    case "chord_chart":
    case "chords":
      return ContentType.CHORDS
    case "Sheet Music":
    case "sheet":
    case "sheet_music":
      return ContentType.SHEET
    case "lyrics":
      return ContentType.LYRICS
    default:
      return ContentType.LYRICS
  }
} 