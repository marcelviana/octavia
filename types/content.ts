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