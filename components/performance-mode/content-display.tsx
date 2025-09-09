import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import { MusicText } from "@/components/music-text"
import { ContentRenderInfo } from "@/hooks/use-content-renderer"

interface ContentDisplayProps {
  renderInfo: ContentRenderInfo
  currentSongData: any
  currentSong: number
  zoom: number
}

export function ContentDisplay({ 
  renderInfo, 
  currentSongData, 
  currentSong, 
  zoom 
}: ContentDisplayProps) {
  return (
    <div 
      className="space-y-6 max-w-3xl mx-auto w-full"
      style={{ 
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top center",
        width: zoom >= 100 ? `${10000 / zoom}%` : '100%',
        maxWidth: zoom >= 100 ? `${10000 / zoom}%` : '100%'
      }}
    >
      {renderInfo.renderType === 'pdf' && (
        <div>
          <PdfViewer
            url={renderInfo.url!}
            fullscreen
            className="h-[calc(100vh-220px)]"
          />
        </div>
      )}

      {renderInfo.renderType === 'image' && (
        <Image
          src={renderInfo.url!}
          alt={currentSongData.title || "Sheet Music"}
          width={800}
          height={800}
          className="w-full h-auto"
          style={{ 
            maxHeight: "100%", 
            objectFit: "contain"
          }}
          sizes="(max-width: 768px) 100vw, 800px"
          priority={currentSong === 0}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      )}

      {renderInfo.renderType === 'lyrics' && (
        <MusicText
          text={renderInfo.lyricsText!}
          className="text-lg leading-relaxed"
        />
      )}

      {renderInfo.renderType === 'unsupported' && (
        <div className="text-center text-[#A69B8E] py-8">
          <p className="text-xl">Unsupported file format</p>
          <p className="text-sm mt-2">Please check that the file is a valid PDF or image</p>
          <p className="text-xs mt-2 text-gray-500">
            URL: {renderInfo.errorInfo!.url.substring(0, 50)}... | 
            MIME: {renderInfo.errorInfo!.mimeType || 'unknown'}
          </p>
        </div>
      )}

      {renderInfo.renderType === 'no-sheet' && (
        <div className="text-center text-[#A69B8E] py-8">
          <p className="text-xl">No sheet music available</p>
        </div>
      )}

      {renderInfo.renderType === 'no-lyrics' && (
        <div className="text-center text-[#A69B8E] py-8">
          <p className="text-xl">No lyrics available for this song</p>
        </div>
      )}
    </div>
  )
}