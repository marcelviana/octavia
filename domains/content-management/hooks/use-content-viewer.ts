import { useState, useEffect, useCallback } from 'react'
import { getCachedFileInfo } from '@/lib/offline-cache'
import { deleteContent, clearContentCache } from '@/lib/content-service'
import { useContent, useContentActions, useUIActions } from '@/domains/shared/state-management/app-store'
import { toast } from 'sonner'

interface UseContentViewerProps {
  content: any
  onBack: () => void
}

export function useContentViewer({ content, onBack }: UseContentViewerProps) {
  // State management from centralized store
  const { selectedContent } = useContent()
  const { setSelectedContent, updateContent } = useContentActions()
  const { addNotification, setOperationLoading } = useUIActions()
  
  // Local component state
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isFavorite, setIsFavorite] = useState(content?.is_favorite || false)
  const [offlineUrl, setOfflineUrl] = useState<string | null>(null)
  const [offlineMimeType, setOfflineMimeType] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [blobUrlToRevoke, setBlobUrlToRevoke] = useState<string | null>(null)

  const totalPages = content?.content_data?.pages ? content.content_data.pages.length : 1

  // Load cached file info
  useEffect(() => {
    let isMounted = true
    let url: string | null = null
    
    const load = async () => {
      try {
        setIsLoadingUrl(true)
        setUrlError(null)
        console.log(`Loading cached file info for content ${content.id}`)
        
        const fileInfo = await getCachedFileInfo(content.id)
        
        if (isMounted) {
          if (fileInfo) {
            setOfflineUrl(fileInfo.url)
            setOfflineMimeType(fileInfo.mimeType)
            url = fileInfo.url
            // Track blob URLs for cleanup
            if (fileInfo.url.startsWith('blob:')) {
              setBlobUrlToRevoke(fileInfo.url)
            }
            console.log(`Successfully loaded cached file for content ${content.id}, MIME: ${fileInfo.mimeType}`)
          } else {
            console.log(`No cached file found for content ${content.id}, will use file_url`)
          }
          setIsLoadingUrl(false)
        }
      } catch (error) {
        console.error(`Error loading cached file for content ${content.id}:`, error)
        if (isMounted) {
          setUrlError(error instanceof Error ? error.message : 'Failed to load cached file')
          setIsLoadingUrl(false)
        }
      }
    }
    
    load()
    
    return () => {
      isMounted = false
    }
  }, [content.id])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlToRevoke) {
        console.log(`Revoking blob URL for content ${content.id} on unmount`)
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [blobUrlToRevoke, content.id])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(200, prev + 25))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(25, prev - 25))
  }, [])

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }, [totalPages])

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }, [])

  const handleDelete = useCallback(() => {
    setDeleteDialog(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    try {
      setOperationLoading('delete-content', true)
      await deleteContent(content.id)
      await clearContentCache()
      setDeleteDialog(false)
      
      // Update centralized state
      if (selectedContent?.id === content.id) {
        setSelectedContent(null)
      }
      
      addNotification({
        type: 'success',
        message: 'Content deleted successfully'
      })
      onBack()
    } catch (error) {
      console.error("Error deleting content:", error)
      addNotification({
        type: 'error',
        message: 'Failed to delete content'
      })
    } finally {
      setOperationLoading('delete-content', false)
    }
  }, [content.id, selectedContent, onBack, setSelectedContent, addNotification, setOperationLoading])

  const cancelDelete = useCallback(() => {
    setDeleteDialog(false)
  }, [])

  const toggleFavorite = useCallback(async () => {
    try {
      const newFavoriteStatus = !isFavorite
      setIsFavorite(newFavoriteStatus)
      
      // Update centralized state
      updateContent(content.id, { is_favorite: newFavoriteStatus })
      
      addNotification({
        type: 'success',
        message: newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites'
      })
    } catch (error) {
      console.error("Error updating favorite status:", error)
      // Revert local state on error
      setIsFavorite(prev => !prev)
      addNotification({
        type: 'error',
        message: 'Failed to update favorite status'
      })
    }
  }, [isFavorite, content.id, updateContent, addNotification])

  return {
    // State
    zoom,
    isPlaying,
    currentPage,
    totalPages,
    deleteDialog,
    isFavorite,
    offlineUrl,
    offlineMimeType,
    isLoadingUrl,
    urlError,
    
    // Actions
    setZoom,
    handleZoomIn,
    handleZoomOut,
    handleTogglePlay,
    handleNextPage,
    handlePreviousPage,
    handleDelete,
    confirmDelete,
    cancelDelete,
    toggleFavorite,
  }
}