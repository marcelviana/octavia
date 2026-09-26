"use client"
import { Card, CardContent } from "@/components/ui/card"
import { ContentType, normalizeContentType } from "@/types/content"
import { SheetMusicDisplay } from "./SheetMusicDisplay"
import { TabDisplay } from "./TabDisplay"
import { ChordDisplay } from "./ChordDisplay"
import { LyricsDisplay } from "./LyricsDisplay"

interface ContentDisplayProps {
  content: any
  zoom: number
  currentPage: number
}

const getOrdinalSuffix = (num: number) => {
  const j = num % 10,
        k = num % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
}

export function ContentDisplay({
  content,
  zoom,
  currentPage,
}: ContentDisplayProps) {
  const contentType = normalizeContentType(content.content_type)

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
              {contentType === ContentType.SHEET && (
                <SheetMusicDisplay content={content} />
              )}

              {contentType === ContentType.TAB && (
                <TabDisplay
                  content={content}
                  getOrdinalSuffix={getOrdinalSuffix}
                />
              )}

              {contentType === ContentType.CHORDS && (
                <ChordDisplay content={content} />
              )}

              {contentType === ContentType.LYRICS && (
                <LyricsDisplay content={content} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}