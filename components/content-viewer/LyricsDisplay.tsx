"use client"
import { MusicText } from "@/components/music-text"

interface LyricsDisplayProps {
  content: any
}

export function LyricsDisplay({ content }: LyricsDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Lyrics</h3>

      {content.content_data?.lyrics ? (
        <div className="space-y-6">
          <MusicText
            text={content.content_data.lyrics}
            className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow text-sm leading-relaxed"
          />
        </div>
      ) : (
        <div className="p-8 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl text-center">
          <p className="text-gray-500">
            No lyrics available
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Add lyrics to help with performance
          </p>
        </div>
      )}

      {/* Chord progression for lyrics */}
      {Array.isArray(content.content_data?.chords) && content.content_data.chords.length > 0 && (
        <div className="p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
          <h4 className="font-semibold mb-2">Chords</h4>
          <div className="flex flex-wrap gap-2">
            {content.content_data.chords.map(
              (chord: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white rounded font-mono text-sm"
                >
                  {chord}
                </span>
              ),
            )}
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
  )
}