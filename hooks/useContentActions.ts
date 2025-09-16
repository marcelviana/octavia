import { useState } from 'react'
import { deleteContent, clearContentCache } from '@/lib/content-service'
import { toast } from 'sonner'

interface UseContentActionsProps {
  content: any
  onBack: () => void
}

export function useContentActions({ content, onBack }: UseContentActionsProps) {
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isFavorite, setIsFavorite] = useState(content?.is_favorite || false)

  const handleDelete = () => {
    setDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteContent(content.id)
      await clearContentCache()
      setDeleteDialog(false)
      onBack()
      toast.success("Content deleted successfully")
    } catch (error) {
      console.error("Error deleting content:", error)
      toast.error("Failed to delete content")
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Implement API call to update favorite status
  }

  return {
    deleteDialog,
    setDeleteDialog,
    isFavorite,
    handleDelete,
    confirmDelete,
    toggleFavorite
  }
}