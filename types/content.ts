export enum ContentType {
  LYRICS = "Lyrics",
  CHORD_CHART = "Chord Chart",
  GUITAR_TAB = "Guitar Tab",
  SHEET_MUSIC = "Sheet Music"
}

export const CONTENT_TYPE_DISPLAY_NAMES: Record<ContentType, string> = {
  [ContentType.LYRICS]: "Lyrics",
  [ContentType.CHORD_CHART]: "Chord Chart",
  [ContentType.GUITAR_TAB]: "Guitar Tab",
  [ContentType.SHEET_MUSIC]: "Sheet Music"
}

export const CONTENT_TYPE_KEYS: Record<ContentType, string> = {
  [ContentType.LYRICS]: "lyrics",
  [ContentType.CHORD_CHART]: "chords",
  [ContentType.GUITAR_TAB]: "tablature",
  [ContentType.SHEET_MUSIC]: "sheet"
}

export const CONTENT_TYPE_IDS = {
  lyrics: ContentType.LYRICS,
  chord_chart: ContentType.CHORD_CHART,
  tablature: ContentType.GUITAR_TAB,
  sheet: ContentType.SHEET_MUSIC
} as const

export type ContentTypeId = keyof typeof CONTENT_TYPE_IDS 