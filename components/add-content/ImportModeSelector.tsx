"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"
import { ContentType } from "@/types/content"

interface ImportModeSelectorProps {
  selectedImportMode: "single" | "batch"
  contentType: ContentType
  onImportModeChange: (mode: "single" | "batch") => void
}

export function ImportModeSelector({
  selectedImportMode,
  contentType,
  onImportModeChange
}: ImportModeSelectorProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {availableImportModes.map((mode) => (
        <Card
          key={mode.id}
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedImportMode === mode.id
              ? "ring-2 ring-offset-2 ring-orange-500 bg-orange-50 border-orange-200"
              : "hover:shadow-md border-gray-200"
          }`}
          onClick={() => onImportModeChange(mode.id as "single" | "batch")}
        >
          <CardHeader className="text-center pb-2">
            <div
              className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                selectedImportMode === mode.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {mode.id === "single" ? (
                <FileText className="w-6 h-6" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <CardTitle
              className={`text-base ${
                selectedImportMode === mode.id ? "text-orange-700" : "text-gray-700"
              }`}
            >
              {mode.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p
              className={`text-xs ${
                selectedImportMode === mode.id ? "text-orange-600" : "text-gray-500"
              }`}
            >
              {mode.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}