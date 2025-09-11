import { Card, CardContent } from "@/components/ui/card"
import { MusicText } from "@/components/music-text"
import Image from "next/image"
import PdfViewer from "@/components/pdf-viewer"
import { isPdfFile, isImageFile } from "@/lib/utils"
import { ContentType, normalizeContentType } from "@/types/content"
import { getOrdinalSuffix } from "../utils/content-display-helpers"

interface ContentDisplayProps {
  content: any
  zoom: number
  offlineUrl: string | null
  offlineMimeType: string | null
  isLoadingUrl: boolean
  urlError: string | null
}

export function ContentDisplay({
  content,
  zoom,
  offlineUrl,
  offlineMimeType,
  isLoadingUrl,
  urlError,
}: ContentDisplayProps) {
  const renderSheetMusic = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex items-center justify-center h-40">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></span>
          <span className="ml-2 text-orange-500">Loading...</span>
        </div>
      )
    }
    
    if (urlError) {
      return (
        <div className="text-center text-red-500 mt-4">
          {urlError}
        </div>
      )
    }
    
    if (offlineUrl || content.file_url) {
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
      
      return (
        <div className="text-center text-red-500 mt-4">
          Failed to load file. Please check the file format or try again later.
        </div>
      )
    }
    
    if (content.content_data?.notation) {
      return (
        <div className="p-6 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
          <MusicText
            text={content.content_data.notation}
            className="text-sm leading-relaxed"
          />
        </div>
      )
    }
    
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm">
        <p className="text-gray-500">No sheet music available</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload a PDF or image file to display sheet music
        </p>
      </div>
    )
  }

  const renderGuitarTab = () => {
    if (Array.isArray(content.content_data?.tablature)) {
      return (
        <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg overflow-x-auto">
          {content.content_data.tablature.map((line: string, index: number) => (
            <div key={index} className="whitespace-nowrap">{line}</div>
          ))}
        </div>
      )
    }
    
    if (typeof content.content_data?.tablature === "string") {
      return (
        <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {content.content_data.tablature}
        </div>
      )
    }
    
    return (
      <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg">
        <div>E|--0----3----0----2----0---------0----3----0----2----0---------|</div>
        <div>B|----1----1----1----1----1---------1----1----1----1----1-------|</div>
        <div>G|------0----0----0----0----0---------0----0----0----0----0-----|</div>
        <div>D|--------2----2----2----2----2---------2----2----2----2----2---|</div>
        <div>A|--3---------------------------3------------------------------|</div>
        <div>E|--------------------------------------------------------------|</div>
      </div>
    )
  }

  const renderChords = () => {
    if (Array.isArray(content.content_data?.chords)) {
      return (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
          {content.content_data.chords.map((chord: any, index: number) => (
            <div
              key={index}
              className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
            >
              <div className="text-xl font-bold mb-3">
                {chord.name || chord}
              </div>
              {Array.isArray(chord.diagram) ? (
                <div className="text-xs font-mono space-y-1">
                  {chord.diagram.map((line: string, lineIndex: number) => (
                    <div key={lineIndex}>{line}</div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono space-y-1">
                  <div>●○○○○○</div>
                  <div>●●●●●●</div>
                  <div>○●○○●○</div>
                  <div>○○●●○○</div>
                </div>
              )}
              {chord.fingering && (
                <div className="text-xs mt-2 text-gray-600">
                  {chord.fingering}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }
    
    if (typeof content.content_data?.chords === "string") {
      return (
        <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {content.content_data.chords}
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
        {["Am", "F", "C", "G"].map((chord) => (
          <div
            key={chord}
            className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
          >
            <div className="text-xl font-bold mb-3">{chord}</div>
            <div className="text-xs font-mono space-y-1">
              <div>●○○○○○</div>
              <div>●●●●●●</div>
              <div>○●○○●○</div>
              <div>○○●●○○</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLyrics = () => {
    if (content.content_data?.lyrics) {
      return (
        <div className="space-y-6">
          <MusicText
            text={content.content_data.lyrics}
            className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow text-sm leading-relaxed"
          />
        </div>
      )
    }
    
    return (
      <div className="p-8 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl text-center">
        <p className="text-gray-500">No lyrics available</p>
        <p className="text-sm text-gray-400 mt-2">
          Add lyrics to help with performance
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <Card className="shadow-xl border border-amber-200 overflow-hidden">
        <CardContent className="p-0">
          <div
            className="bg-white p-8 min-h-[calc(100vh-250px)] relative"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <div className="space-y-6">
              {/* Sheet Music Content */}
              {normalizeContentType(content.content_type) === ContentType.SHEET && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Sheet Music</h3>
                  <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
                    {renderSheetMusic()}
                  </div>
                </div>
              )}

              {/* Guitar Tab Content */}
              {normalizeContentType(content.content_type) === ContentType.TAB && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Tablature</h3>
                  {renderGuitarTab()}

                  {/* Guitar-specific info */}
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
                    <div>
                      <strong>Capo:</strong>{" "}
                      {content.capo
                        ? `${content.capo}${getOrdinalSuffix(Number(content.capo))} fret`
                        : "None"}
                    </div>
                    <div>
                      <strong>Tuning:</strong>{" "}
                      {content.tuning || "Standard (EADGBE)"}
                    </div>
                  </div>

                  {/* Chord progression if available */}
                  {content.content_data?.chords && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Chord Progression</h4>
                      <div className="flex flex-wrap gap-2">
                        {content.content_data.chords.map((chord: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-200 rounded-md font-mono"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chord Chart Content */}
              {normalizeContentType(content.content_type) === ContentType.CHORDS && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Chord Chart</h3>
                  {renderChords()}

                  {/* Song structure */}
                  {content.content_data?.progression && (
                    <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl shadow">
                      <h4 className="font-semibold">Song Structure</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(content.content_data.progression).map(
                          ([section, chords]: [string, any]) => (
                            <div key={section} className="flex">
                              <span className="font-medium w-20">{section}:</span>
                              <span className="font-mono">
                                {Array.isArray(chords) ? chords.join(" - ") : chords}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lyrics Content */}
              {normalizeContentType(content.content_type) === ContentType.LYRICS && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Lyrics</h3>
                  {renderLyrics()}

                  {/* Chord progression for lyrics */}
                  {Array.isArray(content.content_data?.chords) && content.content_data.chords.length > 0 && (
                    <div className="p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
                      <h4 className="font-semibold mb-2">Chords</h4>
                      <div className="flex flex-wrap gap-2">
                        {content.content_data.chords.map((chord: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white rounded font-mono text-sm"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof content.content_data?.chords === "string" && content.content_data.chords && (
                    <div className="p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
                      <h4 className="font-semibold mb-2">Chords</h4>
                      <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg">
                        {content.content_data.chords}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}