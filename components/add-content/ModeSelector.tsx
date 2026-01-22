"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Zap } from "lucide-react"
import { ContentType } from "@/types/content"

interface ModeSelectorProps {
  selectedMode: "create" | "import"
  contentType: ContentType
  onModeChange: (mode: "create" | "import") => void
}

export function ModeSelector({ selectedMode, contentType, onModeChange }: ModeSelectorProps) {
  const isSheetMusic = contentType === ContentType.SHEET

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">How would you like to add content?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Create Mode */}
        {!isSheetMusic && (
          <Card
            className={`cursor-pointer transition-all hover:scale-102 ${
              selectedMode === "create"
                ? "ring-2 ring-offset-1 ring-blue-500 bg-blue-50 border-blue-200"
                : "hover:shadow-sm border-gray-200"
            }`}
            onClick={() => onModeChange("create")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selectedMode === "create"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4
                  className={`text-base font-semibold ${
                    selectedMode === "create" ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  Create New
                </h4>
                <p
                  className={`text-xs ${
                    selectedMode === "create" ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  Start from scratch and build your content manually with our editor.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Mode */}
        <Card
          className={`cursor-pointer transition-all hover:scale-102 ${
            selectedMode === "import"
              ? "ring-2 ring-offset-1 ring-green-500 bg-green-50 border-green-200"
              : "hover:shadow-sm border-gray-200"
          } ${isSheetMusic ? "md:col-span-2" : ""}`}
          onClick={() => onModeChange("import")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                selectedMode === "import"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4
                className={`text-base font-semibold ${
                  selectedMode === "import" ? "text-green-700" : "text-gray-700"
                }`}
              >
                Import from File
              </h4>
              <p
                className={`text-xs ${
                  selectedMode === "import" ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isSheetMusic
                  ? "Upload PDF files or images to import sheet music."
                  : "Upload and parse existing files (PDF, DOCX, TXT) to extract content automatically."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}