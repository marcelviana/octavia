import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/firebase-auth-context"
import { createContent } from "@/lib/content-service"
import { useContentActions, useUIActions } from "@/domains/shared/state-management/app-store"
import { parseDocxFile, parsePdfFile, parseTextFile, type ParsedSong } from "@/lib/batch-import"
import { ContentType } from "@/types/content"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

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

type CreatedContent = DraftContent | Content

interface UseContentCreationProps {
  onContentCreated: (content: Content) => void
}

export function useContentCreation({ onContentCreated }: UseContentCreationProps) {
  // State management from centralized store
  const { addContent } = useContentActions()
  const { addNotification, setOperationLoading } = useUIActions()
  const [mode, setMode] = useState<"create" | "import">("create")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [createdContent, setCreatedContent] = useState<CreatedContent | null>(null)
  const [parsedSongs, setParsedSongs] = useState<(ParsedSong & { artist: string; include: boolean })[]>([])
  const [importMode, setImportMode] = useState<"single" | "batch">("single")
  const [contentType, setContentType] = useState(ContentType.LYRICS)
  const [batchArtist, setBatchArtist] = useState("")
  const [batchImported, setBatchImported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const isAutoDetectingContentType = useRef(false)

  // Reset form state when content type changes
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

  // Reset createdContent when switching between modes
  useEffect(() => {
    setCreatedContent(null)
    setError(null)
  }, [mode])

  const handleFilesUploaded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]
      
      const isImageFile = /\.(png|jpg|jpeg)$/i.test(file.name)
      if (isImageFile && contentType !== ContentType.SHEET) {
        isAutoDetectingContentType.current = true
        const updatedFile = { ...file, contentType: ContentType.SHEET }
        setContentType(ContentType.SHEET)
        setUploadedFile(updatedFile)
        setCurrentStep(2)
      } else {
        const updatedFile = { ...file, contentType }
        setUploadedFile(updatedFile)
        if (contentType === ContentType.SHEET) {
          setCurrentStep(2)
        }
      }
    }
  }

  const handleFilesRemoved = () => {
    setUploadedFile(null)
  }

  const getContentKey = (type: ContentType) => {
    switch (type) {
      case ContentType.LYRICS:
        return "lyrics"
      case ContentType.CHORDS:
        return "chords"
      case ContentType.TAB:
        return "tablature"
      default:
        return "content"
    }
  }

  const handleImportNext = async () => {
    if (!uploadedFile) return
    setError(null)
    setUploadedFile({ ...uploadedFile, contentType })
    
    if (importMode === "single") {
      if (uploadedFile.isTextImport) {
        setCreatedContent({
          title: uploadedFile.parsedTitle || uploadedFile.name,
          type: contentType,
          content: { [getContentKey(contentType)]: uploadedFile.textBody || uploadedFile.originalText || "" },
        })
      } else {
        setCreatedContent({
          title: uploadedFile.name.replace(/\.[^/.]+$/, ""),
          type: contentType,
          content: {},
        })
      }
      setCurrentStep(2)
      return
    }
    
    setIsParsing(true)
    try {
      let songs: ParsedSong[] = []
      const file: File = uploadedFile.file
      
      if (file.name.toLowerCase().endsWith(".docx")) {
        songs = await parseDocxFile(file)
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        songs = await parsePdfFile(file)
      } else {
        songs = await parseTextFile(file)
      }
      
      setParsedSongs(songs.map((s) => ({ ...s, artist: batchArtist, include: true })))
      setCurrentStep(2)
    } finally {
      setIsParsing(false)
    }
  }

  const handleContentCreated = (content: DraftContent) => {
    setCreatedContent(content)
    setCurrentStep(2)
  }

  const handleBatchPreviewComplete = (contents: Content[]) => {
    if (contents.length > 0) {
      setBatchImported(true)
    }
    setCurrentStep(3)
  }

  const handleMetadataComplete = async (metadata: Content) => {
    setIsProcessing(true)
    setError(null)

    try {
      if (!metadata?.id) {
        throw new Error("Content save failed - no ID returned")
      }

      // Add to centralized state
      addContent(metadata)
      
      addNotification({
        type: 'success',
        message: 'Content saved successfully'
      })

      setCurrentStep(3)
      setCreatedContent(metadata)
    } catch (error) {
      console.error("Error in metadata completion:", error)
      setError("Failed to save content. Please try again.")
      setCurrentStep(1)
      
      addNotification({
        type: 'error',
        message: 'Failed to save content'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinish = async () => {
    try {
      setIsProcessing(true)
      setOperationLoading('create-content', true)
      setError(null)
      
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      if (!createdContent?.id) {
        if (!user?.uid) {
          throw new Error("User not authenticated")
        }

        const formattedContent = {
          user_id: user.uid,
          title: createdContent?.title || uploadedFile?.name || "Untitled",
          content_type: contentType || "unknown",
          content_data:
            contentType === ContentType.SHEET
              ? { file: uploadedFile?.url || null }
              : (createdContent && 'content' in createdContent ? createdContent.content : {}) as any,
          file_url: uploadedFile?.url || null,
          is_favorite: false,
          is_public: false,
        }

        const newContent = await createContent(formattedContent)
        
        // Add to centralized state
        addContent(newContent)
        
        addNotification({
          type: 'success',
          message: 'Content created successfully'
        })
        
        onContentCreated(newContent)
      } else {
        onContentCreated(createdContent as Content)
      }
    } catch (error) {
      console.error("Error in finish:", error)
      const message = error instanceof Error ? error.message : "Error completing content addition. Please try again."
      setError(message)
      
      addNotification({
        type: 'error',
        message: 'Failed to create content'
      })
    } finally {
      setIsProcessing(false)
      setOperationLoading('create-content', false)
    }
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
    
    // Actions
    setMode,
    setCurrentStep,
    setContentType,
    setImportMode,
    setBatchArtist,
    handleFilesUploaded,
    handleFilesRemoved,
    handleImportNext,
    handleContentCreated,
    handleBatchPreviewComplete,
    handleMetadataComplete,
    handleFinish,
  }
}