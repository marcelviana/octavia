"use client"
import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import { MusicText } from "@/components/music-text"
import { isPdfFile, isImageFile } from "@/lib/utils"

interface SheetMusicDisplayProps {
  content: any
  offlineUrl: string | null
  offlineMimeType: string | null
  isLoadingUrl: boolean
  urlError: string | null
}

export function SheetMusicDisplay({
  content,
  offlineUrl,
  offlineMimeType,
  isLoadingUrl,
  urlError
}: SheetMusicDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sheet Music</h3>

      {isLoadingUrl ? (
        <div className="flex items-center justify-center h-40">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></span>
          <span className="ml-2 text-orange-500">Loading...</span>
        </div>
      ) : urlError ? (
        <div className="text-center text-red-500 mt-4">
          {urlError}
        </div>
      ) : offlineUrl || content.file_url ? (
        <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
          {(() => {
            const url = offlineUrl || content.file_url
            if (!url) return null

            const mimeType = offlineUrl ? (offlineMimeType || undefined) : undefined
            const isPdf = isPdfFile(url, mimeType)
            const isImage = isImageFile(url, mimeType)

            if (isPdf) {
              return (
                <PdfViewer
                  url={url}
                  fullscreen
                  className="w-full h-[calc(100vh-250px)]"
                />
              )
            }
            if (isImage) {
              return (
                <Image
                  src={url}
                  alt="Sheet music"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              )
            }
            return null
          })()}

          {(() => {
            const url = offlineUrl || content.file_url
            if (!url) return null

            const mimeType = offlineUrl ? (offlineMimeType || undefined) : undefined
            const isPdf = isPdfFile(url, mimeType)
            const isImage = isImageFile(url, mimeType)

            if ((offlineUrl || content.file_url) && !isPdf && !isImage) {
              return (
                <div className="text-center text-red-500 mt-4">
                  Failed to load file. Please check the file format or try again later.
                </div>
              )
            }
            return null
          })()}
        </div>
      ) : content.content_data?.notation ? (
        <div className="p-6 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
          <MusicText
            text={content.content_data.notation}
            className="text-sm leading-relaxed"
          />
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm">
          <p className="text-gray-500">
            No sheet music available
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Upload a PDF or image file to display sheet music
          </p>
        </div>
      )}
    </div>
  )
}