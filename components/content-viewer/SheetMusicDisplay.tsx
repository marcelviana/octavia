"use client"
import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import { MusicText } from "@/components/music-text"
import { isPdfFile, isImageFile } from "@/lib/utils"

interface SheetMusicDisplayProps {
  content: any
}

// I1-D36 (I1-PR3): o tipo do arquivo sai da extensão de content.file_url
// (isPdfFile/isImageFile sem mimeType) — o cache offline que dava o blob: e
// o mimeType morreu com o PWA. URL sem extensão cai em "Failed to load file".
export function SheetMusicDisplay({ content }: SheetMusicDisplayProps) {
  const url: string | null = content.file_url || null
  const isPdf = url ? isPdfFile(url) : false
  const isImage = url ? isImageFile(url) : false

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sheet Music</h3>

      {url ? (
        <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
          {isPdf && (
            <PdfViewer
              url={url}
              fullscreen
              className="w-full h-[calc(100vh-250px)]"
            />
          )}
          {isImage && (
            <Image
              src={url}
              alt="Sheet music"
              width={800}
              height={600}
              className="w-full h-auto"
            />
          )}
          {!isPdf && !isImage && (
            <div className="text-center text-red-500 mt-4">
              Failed to load file. Please check the file format or try again later.
            </div>
          )}
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