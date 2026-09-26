"use client"
import { useState } from "react"
import { useContentActions } from "@/hooks/useContentActions"
import { ContentHeader } from "./content-viewer/ContentHeader"
import { ContentToolbar } from "./content-viewer/ContentToolbar"
import { ContentDisplay } from "./content-viewer/ContentDisplay"
import { ContentSidebar } from "./content-viewer/ContentSidebar"
import { DeleteDialog } from "./content-viewer/DeleteDialog"

interface ContentViewerProps {
  content: any
  onBack: () => void
  onEdit?: () => void
  showToolbar?: boolean
}

export function ContentViewer({
  content,
  onBack,
  onEdit,
  showToolbar = true,
}: ContentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = content?.content_data?.pages
    ? content.content_data.pages.length
    : 1

  // Custom hooks for separated concerns
  const {
    deleteDialog,
    setDeleteDialog,
    isFavorite,
    handleDelete,
    confirmDelete,
    toggleFavorite
  } = useContentActions({ content, onBack })

  // Event handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <div className="flex flex-col bg-gradient-to-b from-[#fff9f0] to-[#fff5e5] min-h-full">
      {/* Header */}
      <ContentHeader
        content={content}
        isFavorite={isFavorite}
        onBack={onBack}
        onToggleFavorite={toggleFavorite}
      />

      {/* Toolbar */}
      {showToolbar && (
        <ContentToolbar
          isPlaying={isPlaying}
          zoom={zoom}
          currentPage={currentPage}
          totalPages={totalPages}
          onPlayPause={handlePlayPause}
          onZoomChange={handleZoomChange}
          onPageChange={handlePageChange}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
          {/* Main Content Section */}
          <ContentDisplay
            content={content}
            zoom={zoom}
            currentPage={currentPage}
          />

          {/* Sidebar with Metadata and Notes */}
          <ContentSidebar content={content} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={confirmDelete}
        contentTitle={content.title}
      />
    </div>
  )
}