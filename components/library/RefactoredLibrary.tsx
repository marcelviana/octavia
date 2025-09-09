"use client";

import React, { memo, useMemo } from 'react';
import { useFirebaseAuth } from '@/contexts/firebase-auth-context';
import { useLibraryData } from '@/hooks/use-library-data';
import { useContentActions } from '@/hooks/use-content-actions';
import { useNavigationActions } from '@/hooks/use-navigation-actions';
import { DeleteContentDialog } from '@/components/delete-content-dialog';
import { LibraryProps, ContentItem } from '@/types/library';
import { 
  calculateTotalPages, 
  getLibraryContentIconData,
  hasActiveFilters 
} from '@/lib/library-utils';

// Import the new smaller components
import LibraryHeader from './LibraryHeader';
import LibraryPagination from './LibraryPagination';
import LibraryEmptyState from './LibraryEmptyState';
import LibraryLoadingState from './LibraryLoadingState';
import LibraryErrorBoundary from './LibraryErrorBoundary';
import OptimizedLibraryList from './OptimizedLibraryList';

const RefactoredLibrary = memo<LibraryProps>(function RefactoredLibrary({
  onSelectContent,
  initialContent,
  initialTotal,
  initialPage,
  initialPageSize,
  initialSearch,
}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { navigateToAddContent } = useNavigationActions();

  // Library data management
  const {
    content,
    totalCount,
    page,
    setPage,
    pageSize,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedFilters,
    setSelectedFilters,
    loading,
    reload,
  } = useLibraryData({
    user,
    ready: !authLoading,
    initialContent,
    initialTotal,
    initialPage,
    initialPageSize: 20, // Fixed page size
    initialSearch,
  });

  // Content actions (delete, favorite, edit, select)
  const contentActions = useContentActions(onSelectContent, { onReload: reload });

  // Memoized calculations
  const totalPages = useMemo(() => 
    calculateTotalPages(totalCount, pageSize), 
    [totalCount, pageSize]
  );

  const showEmptyState = useMemo(() => 
    !loading && content.length === 0,
    [loading, content.length]
  );

  const showLoadingState = useMemo(() => 
    loading && content.length === 0,
    [loading, content.length]
  );

  const showContent = useMemo(() => 
    !showLoadingState && !showEmptyState,
    [showLoadingState, showEmptyState]
  );

  // Memoized content icon function
  const getContentIcon = useMemo(() => (type: string) => {
    const { IconComponent, className } = getLibraryContentIconData(type);
    return <IconComponent className={className} />;
  }, []);

  // Header props
  const headerProps = useMemo(() => ({
    searchQuery,
    onSearchChange: setSearchQuery,
    sortBy,
    onSortChange: setSortBy,
    filters: selectedFilters,
    onFiltersChange: setSelectedFilters,
    onAddContent: navigateToAddContent,
  }), [
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedFilters,
    setSelectedFilters,
    navigateToAddContent,
  ]);

  // Pagination props
  const paginationProps = useMemo(() => ({
    currentPage: page,
    totalPages,
    totalCount,
    onPageChange: setPage,
  }), [page, totalPages, totalCount, setPage]);

  // Empty state props
  const emptyStateProps = useMemo(() => ({
    searchQuery,
    filters: selectedFilters,
    onAddContent: navigateToAddContent,
  }), [searchQuery, selectedFilters, navigateToAddContent]);

  return (
    <LibraryErrorBoundary>
      <div className="p-4 sm:p-4 md:p-6 bg-gradient-to-b from-[#fff9f0] to-[#fff5e5] min-h-full">
        
        {/* Header Section */}
        <LibraryHeader {...headerProps} />

        {/* Content Display */}
        {showLoadingState && <LibraryLoadingState />}
        
        {showEmptyState && <LibraryEmptyState {...emptyStateProps} />}
        
        {showContent && (
          <OptimizedLibraryList
            content={content}
            loading={loading}
            contentActions={contentActions}
            getContentIcon={getContentIcon}
          />
        )}

        {/* Pagination */}
        <LibraryPagination {...paginationProps} />

        {/* Delete Confirmation Dialog */}
        <DeleteContentDialog
          open={contentActions.deleteDialog.isOpen}
          onOpenChange={contentActions.deleteDialog.close}
          content={contentActions.deleteDialog.content}
          onConfirm={contentActions.deleteDialog.confirm}
        />
      </div>
    </LibraryErrorBoundary>
  );
});

export default RefactoredLibrary;
