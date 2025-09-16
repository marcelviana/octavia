"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload, Sparkles, Zap } from "lucide-react"
import { ContentType } from "@/types/content"

interface ModeSelectorProps {
  selectedMode: "create" | "import"
  contentType: ContentType
  onModeChange: (mode: "create" | "import") => void
}

export function ModeSelector({ selectedMode, contentType, onModeChange }: ModeSelectorProps) {
  const isSheetMusic = contentType === ContentType.SHEET

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create Mode */}
      {!isSheetMusic && (
        <Card
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMode === "create"
              ? "ring-2 ring-offset-2 ring-blue-500 bg-blue-50 border-blue-200"
              : "hover:shadow-md border-gray-200"
          }`}
          onClick={() => onModeChange("create")}
        >
          <CardHeader className="text-center pb-2">
            <div
              className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                selectedMode === "create"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Sparkles className="w-8 h-8" />
            </div>
            <CardTitle
              className={`text-lg ${
                selectedMode === "create" ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Create New
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p
              className={`text-sm ${
                selectedMode === "create" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Start from scratch and build your content manually with our editor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import Mode */}
      <Card
        className={`cursor-pointer transition-all hover:scale-105 ${
          selectedMode === "import"
            ? "ring-2 ring-offset-2 ring-green-500 bg-green-50 border-green-200"
            : "hover:shadow-md border-gray-200"
        } ${isSheetMusic ? "md:col-span-2" : ""}`}
        onClick={() => onModeChange("import")}
      >
        <CardHeader className="text-center pb-2">
          <div
            className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              selectedMode === "import"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <Zap className="w-8 h-8" />
          </div>
          <CardTitle
            className={`text-lg ${
              selectedMode === "import" ? "text-green-700" : "text-gray-700"
            }`}
          >
            Import from File
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p
            className={`text-sm ${
              selectedMode === "import" ? "text-green-600" : "text-gray-500"
            }`}
          >
            {isSheetMusic
              ? "Upload PDF files or images to import sheet music."
              : "Upload and parse existing files (PDF, DOCX, TXT) to extract content automatically."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}