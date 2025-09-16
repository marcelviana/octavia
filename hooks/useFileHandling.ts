import { ContentType } from '@/types/content'

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

interface UseFileHandlingProps {
  contentType: ContentType
  setContentType: (type: ContentType) => void
  setUploadedFile: (file: UploadedFile | null) => void
  setCurrentStep: (step: number) => void
  isAutoDetectingContentType: React.MutableRefObject<boolean>
}

export function useFileHandling({
  contentType,
  setContentType,
  setUploadedFile,
  setCurrentStep,
  isAutoDetectingContentType
}: UseFileHandlingProps) {
  const handleFilesUploaded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]

      // Auto-detect if this is an image file and set content type to Sheet Music
      const isImageFile = /\.(png|jpg|jpeg)$/i.test(file.name)
      if (isImageFile && contentType !== ContentType.SHEET) {
        // Set flag to prevent reset when auto-detecting content type
        isAutoDetectingContentType.current = true
        const updatedFile = { ...file, contentType: ContentType.SHEET }
        setContentType(ContentType.SHEET)
        setUploadedFile(updatedFile)
        setCurrentStep(2)
      } else {
        // Normal file upload flow
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

  return {
    handleFilesUploaded,
    handleFilesRemoved
  }
}