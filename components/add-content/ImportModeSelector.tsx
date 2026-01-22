"use client"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Import Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {availableImportModes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all hover:scale-102 ${
              selectedImportMode === mode.id
                ? "ring-2 ring-offset-1 ring-orange-500 bg-orange-50 border-orange-200"
                : "hover:shadow-sm border-gray-200"
            }`}
            onClick={() => onImportModeChange(mode.id as "single" | "batch")}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedImportMode === mode.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {mode.id === "single" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                <h4
                  className={`text-sm font-semibold ${
                    selectedImportMode === mode.id ? "text-orange-700" : "text-gray-700"
                  }`}
                >
                  {mode.name}
                </h4>
                <p
                  className={`text-xs ${
                    selectedImportMode === mode.id ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  {mode.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}