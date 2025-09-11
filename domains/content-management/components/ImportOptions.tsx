import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { ContentType } from "@/types/content"

interface UploadedFile {
  id: number
  name: string
  size: number
  type: string
  contentType: string
  file: File
  url?: string
  status?: string
  progress?: number
  isTextImport?: boolean
  parsedTitle?: string
  textBody?: string
  originalText?: string
}

interface ImportOptionsProps {
  uploadedFile: UploadedFile | null
  contentType: ContentType
  importMode: "single" | "batch"
  batchArtist: string
  onImportModeChange: (mode: "single" | "batch") => void
  onBatchArtistChange: (artist: string) => void
  onNext: () => void
}

export function ImportOptions({
  uploadedFile,
  contentType,
  importMode,
  batchArtist,
  onImportModeChange,
  onBatchArtistChange,
  onNext,
}: ImportOptionsProps) {
  if (!uploadedFile || contentType === ContentType.SHEET) {
    return null
  }

  const importModes = [
    {
      id: "single",
      name: "Single Content",
      subtitle: "Import a file with a single song.",
    },
    {
      id: "batch",
      name: "Batch Import",
      subtitle: "Import multiple songs from one file.",
    },
  ]

  const availableImportModes = contentType === ContentType.SHEET
    ? importModes.filter((m) => m.id === "single")
    : importModes

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-gray-900 flex items-center">
          <Star className="w-4 h-4 mr-2 text-amber-500" />
          Import Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Import Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableImportModes.map((m) => (
              <Card
                key={m.id}
                onClick={() => onImportModeChange(m.id as "single" | "batch")}
                className={`cursor-pointer ${
                  importMode === m.id ? "ring-2 ring-primary" : "hover:shadow"
                }`}
              >
                <CardContent className="p-2 text-center space-y-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        {importMode === "batch" && (
          <div>
            <Label htmlFor="artist" className="text-sm">
              Artist Name (optional)
            </Label>
            <Input
              id="artist"
              value={batchArtist}
              onChange={(e) => onBatchArtistChange(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onNext}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}