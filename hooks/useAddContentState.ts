import { useState, useEffect, useRef } from 'react'
import { ContentType } from '@/types/content'
import type { ParsedSong } from '@/lib/batch-import'

interface UploadedFile {
  id: number
  name: string
  size: number
  type: string
  contentType: string
  file: File
  url?: string
  status?: string
  progress?: number
  isTextImport?: boolean
  parsedTitle?: string
  textBody?: string
  originalText?: string
}

interface DraftContent {
  title: string
  type: ContentType | string
  content: Record<string, unknown>
  files?: UploadedFile[]
  id?: string
}

export function useAddContentState() {
  const [mode, setMode] = useState<"create" | "import">("create")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [createdContent, setCreatedContent] = useState<DraftContent | null>(null)
  const [parsedSongs, setParsedSongs] = useState<(ParsedSong & { artist: string; include: boolean })[]>([])
  const [importMode, setImportMode] = useState<"single" | "batch">("single")
  const [contentType, setContentType] = useState(ContentType.LYRICS)
  const [batchArtist, setBatchArtist] = useState("")
  const [batchImported, setBatchImported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAutoDetectingContentType = useRef(false)

  // Reset state when content type changes
  useEffect(() => {
    if (isAutoDetectingContentType.current) {
      isAutoDetectingContentType.current = false
      return
    }

    setUploadedFile(null)
    setCurrentStep(1)
    setIsProcessing(false)
    setIsParsing(false)
    setCreatedContent(null)
    setParsedSongs([])
    setBatchArtist("")
    setBatchImported(false)
    setError(null)

    if (contentType === ContentType.SHEET) {
      setMode("import")
      setImportMode("single")
    } else {
      setMode("create")
      setImportMode("single")
    }
  }, [contentType])

  // Reset createdContent when switching modes
  useEffect(() => {
    setCreatedContent(null)
    setError(null)
  }, [mode])

  const resetState = () => {
    setUploadedFile(null)
    setCurrentStep(1)
    setIsProcessing(false)
    setIsParsing(false)
    setCreatedContent(null)
    setParsedSongs([])
    setBatchArtist("")
    setBatchImported(false)
    setError(null)
  }

  return {
    // State
    mode,
    uploadedFile,
    currentStep,
    isProcessing,
    isParsing,
    createdContent,
    parsedSongs,
    importMode,
    contentType,
    batchArtist,
    batchImported,
    error,
    isAutoDetectingContentType,

    // Setters
    setMode,
    setUploadedFile,
    setCurrentStep,
    setIsProcessing,
    setIsParsing,
    setCreatedContent,
    setParsedSongs,
    setImportMode,
    setContentType,
    setBatchArtist,
    setBatchImported,
    setError,

    // Actions
    resetState
  }
}