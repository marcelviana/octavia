import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Upload } from "lucide-react"

interface CreationModeSelectorProps {
  mode: "create" | "import"
  onModeChange: (mode: "create" | "import") => void
}

export function CreationModeSelector({ mode, onModeChange }: CreationModeSelectorProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-gray-900">Choose How to Add</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Card
            onClick={() => onModeChange("create")}
            className={`cursor-pointer ${mode === "create" ? "ring-2 ring-primary" : "hover:shadow"}`}
          >
            <CardContent className="p-2 text-center space-y-1">
              <FileText className="w-6 h-6 mx-auto" />
              <p className="text-sm">Create Manually</p>
            </CardContent>
          </Card>
          <Card
            onClick={() => onModeChange("import")}
            className={`cursor-pointer ${mode === "import" ? "ring-2 ring-primary" : "hover:shadow"}`}
          >
            <CardContent className="p-2 text-center space-y-1">
              <Upload className="w-6 h-6 mx-auto" />
              <p className="text-sm">Import From File</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}