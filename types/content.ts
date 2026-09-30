export enum ContentType {
  LYRICS = "Lyrics",
  CHORDS = "Chords",
  TAB = "Tab",
  SHEET = "Sheet"
}

export const CONTENT_TYPE_KEYS: Record<ContentType, string> = {
  [ContentType.LYRICS]: "lyrics",
  [ContentType.CHORDS]: "chords",
  [ContentType.TAB]: "tablature",
  [ContentType.SHEET]: "sheet"
}

/**
 * Normalize content type strings to ContentType enum values
 * Handles legacy formats like "Guitar Tab", "Chord Chart", etc.
 */
export function normalizeContentType(contentType: ContentType | string): ContentType {
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