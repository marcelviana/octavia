"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteContent, toggleFavorite, clearContentCache } from '@/lib/content-service';
import { ContentItem, LibraryError } from '@/types/library';
import { useFirebaseAuth } from '@/contexts/firebase-auth-context';

interface UseContentActionsOptions {
  onReload: () => Promise<void>;
}

interface UseContentActionsResult {
  deleteItem: (content: ContentItem) => Promise<void>;
  toggleFavoriteItem: (content: ContentItem) => Promise<void>;
  editItem: (content: ContentItem) => void;
  selectItem: (content: ContentItem) => void;
  deleteDialog: {
    isOpen: boolean;
    content: ContentItem | null;
    open: (content: ContentItem) => void;
    close: () => void;
    confirm: () => Promise<void>;
  };
  isLoading: boolean;
  error: LibraryError | null;
}

export function useContentActions(
  onSelectContent: (content: ContentItem) => void,
  options: UseContentActionsOptions
): UseContentActionsResult {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LibraryError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const deleteItem = useCallback(async (content: ContentItem) => {
    if (!user) {
      setError({ message: 'User not authenticated', type: 'AUTH_ERROR' });
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await deleteContent(content.id);

      // Clear the content cache to ensure fresh data on reload
      clearContentCache();

      // I1-PR-9 (I1-D26; decisão 7 da folha): sem toast — a lista já mostra que a linha saiu
      // Reload content
      try {
        await options.onReload();
      } catch (reloadError) {
        console.warn('Failed to reload content after delete:', reloadError);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('not configured')) {
          setError({ message: 'Authentication error. Please try logging out and back in.', type: 'AUTH_ERROR' });
        } else if (error.message.includes('not found')) {
          setError({ message: 'Content not found. It may have already been deleted.', type: 'VALIDATION_ERROR' });
          // Still reload to refresh the UI
          try {
            await options.onReload();
          } catch (reloadError) {
            console.warn('Failed to reload after delete error:', reloadError);
          }
        } else {
          setError({ message: `Failed to delete content: ${error.message}`, type: 'UNKNOWN_ERROR' });
        }
      } else {
        setError({ message: 'Failed to delete content. Please try again.', type: 'UNKNOWN_ERROR' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, options, clearError]);

  const toggleFavoriteItem = useCallback(async (content: ContentItem) => {
    if (!user) {
      setError({ message: 'User not authenticated', type: 'AUTH_ERROR' });
      return;
    }

    const newFavoriteStatus = !content.is_favorite;
    setIsLoading(true);
    clearError();
    
    try {
      await toggleFavorite(content.id, newFavoriteStatus);
      
      // I1-PR-9: sem toast — o rótulo Favoritar/Favorita já mudou na lista
      // Force reload to ensure UI is updated with fresh data
      await options.onReload();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError({ message: 'Failed to update favorite status. Please try again.', type: 'NETWORK_ERROR' });
    } finally {
      setIsLoading(false);
    }
  }, [user, options, clearError]);

  const editItem = useCallback((content: ContentItem) => {
    router.push(`/content/${content.id}/edit`);
  }, [router]);

  const selectItem = useCallback((content: ContentItem) => {
    onSelectContent(content);
  }, [onSelectContent]);

  const openDeleteDialog = useCallback((content: ContentItem) => {
    setContentToDelete(content);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setContentToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!contentToDelete) return;
    
    await deleteItem(contentToDelete);
    closeDeleteDialog();
  }, [contentToDelete, deleteItem, closeDeleteDialog]);

  return {
    deleteItem,
    toggleFavoriteItem,
    editItem,
    selectItem,
    deleteDialog: {
      isOpen: deleteDialogOpen,
      content: contentToDelete,
      open: openDeleteDialog,
      close: closeDeleteDialog,
      confirm: confirmDelete,
    },
    isLoading,
    error,
  };
}
