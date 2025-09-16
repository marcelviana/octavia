export interface Point {
  x: number
  y: number
}

export interface BaseAnnotation {
  type: string
  color?: string
  width?: number
}

export interface PathAnnotation extends BaseAnnotation {
  type: 'pen' | 'highlighter'
  path: Point[]
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize?: number
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle'
  x: number
  y: number
  radius: number
}

export interface SquareAnnotation extends BaseAnnotation {
  type: 'square'
  x: number
  y: number
  width: number
  height: number
  strokeWidth?: number
}

export type Annotation = PathAnnotation | TextAnnotation | CircleAnnotation | SquareAnnotation

export interface Content {
  thumbnail?: string
  [key: string]: unknown
}

export interface TextInputState {
  show: boolean
  x: number
  y: number
  text: string
}