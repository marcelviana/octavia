"use client"

import { DomainErrorBoundary } from "@/domains/shared/components/DomainErrorBoundary"
import { useContentViewer } from "@/domains/content-management/hooks/use-content-viewer"
import { ContentViewerHeader } from "@/domains/content-management/components/ContentViewerHeader"
import { ContentViewerToolbar } from "@/domains/content-management/components/ContentViewerToolbar"
import { ContentDisplay } from "@/domains/content-management/components/ContentDisplay"
import { ContentViewerSidebar } from "@/domains/content-management/components/ContentViewerSidebar"
import { DeleteConfirmDialog } from "@/domains/content-management/components/DeleteConfirmDialog"

interface ContentViewerProps {
  content: any
  onBack: () => void
  onEnterPerformance: (content: any) => void
  onEdit?: () => void
  showToolbar?: boolean
}

export function ContentViewer({
  content,
  onBack,
  onEnterPerformance,
  onEdit,
  showToolbar = true,
}: ContentViewerProps) {
  const {
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
    handleZoomIn,
    handleZoomOut,
    handleTogglePlay,
    handleNextPage,
    handlePreviousPage,
    handleDelete,
    confirmDelete,
    cancelDelete,
    toggleFavorite,
  } = useContentViewer({ content, onBack })

  return (
    <DomainErrorBoundary domain="Content Management" feature="Content Viewer">
      <div className="flex flex-col bg-gradient-to-b from-[#fff9f0] to-[#fff5e5]">
      {/* Header */}
      <ContentViewerHeader
        content={content}
        isFavorite={isFavorite}
        onBack={onBack}
        onEnterPerformance={onEnterPerformance}
        onEdit={onEdit}
        onDelete={handleDelete}
        onToggleFavorite={toggleFavorite}
      />

      {/* Toolbar */}
      {showToolbar && (
        <ContentViewerToolbar
          isPlaying={isPlaying}
          zoom={zoom}
          currentPage={currentPage}
          totalPages={totalPages}
          onTogglePlay={handleTogglePlay}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
          {/* Main Content Section */}
          <ContentDisplay
            content={content}
            zoom={zoom}
            offlineUrl={offlineUrl}
            offlineMimeType={offlineMimeType}
            isLoadingUrl={isLoadingUrl}
            urlError={urlError}
          />

          {/* Sidebar */}
          <ContentViewerSidebar content={content} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog}
        contentTitle={content.title}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      </div>
    </DomainErrorBoundary>
  )
}