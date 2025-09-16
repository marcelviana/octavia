"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/firebase-auth-context"
import { useAddContentState } from "@/hooks/useAddContentState"
import { useFileHandling } from "@/hooks/useFileHandling"
import { ContentTypeSelector } from "./add-content/ContentTypeSelector"
import { ModeSelector } from "./add-content/ModeSelector"
import { ImportModeSelector } from "./add-content/ImportModeSelector"
import { StepIndicator } from "./add-content/StepIndicator"
import { FileUpload } from "./file-upload"
import { ContentCreator } from "./content-creator"
import { MetadataForm } from "./metadata-form"
import { BatchPreview } from "./batch-preview"
import { ContentType } from "@/types/content"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

interface AddContentProps {
  onBack: () => void
  onContentCreated: (content: Content) => void
  onNavigate: (screen: string) => void
}

export function AddContent({
  onBack,
  onContentCreated,
  onNavigate,
}: AddContentProps) {
  const { user } = useAuth()
  const {
    mode,
    uploadedFile,
    currentStep,
    isProcessing,
    createdContent,
    parsedSongs,
    importMode,
    contentType,
    batchArtist,
    batchImported,
    error,
    isAutoDetectingContentType,
    setMode,
    setUploadedFile,
    setCurrentStep,
    setImportMode,
    setContentType,
    setError,
  } = useAddContentState()

  const { handleFilesUploaded, handleFilesRemoved } = useFileHandling({
    contentType,
    setContentType,
    setUploadedFile,
    setCurrentStep,
    isAutoDetectingContentType,
  })

  const handleContentCreated = (content: Content) => {
    onContentCreated(content)
  }

  const getSteps = () => {
    if (contentType === ContentType.SHEET) {
      return ["Upload File", "Add Details", "Complete"]
    }
    if (mode === "create") {
      return ["Select Type", "Create Content"]
    }
    if (importMode === "batch") {
      return ["Select Type", "Choose Mode", "Upload File", "Review & Import"]
    }
    return ["Select Type", "Choose Mode", "Upload File", "Add Details"]
  }

  const steps = getSteps()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-amber-100 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Add New Content</h1>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
          />

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Content Type Selection */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle>What type of content do you want to add?</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ContentTypeSelector
                  selectedType={contentType}
                  onTypeChange={(type) => {
                    setContentType(type)
                    setCurrentStep(type === ContentType.SHEET ? 3 : 2)
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Mode Selection (not for Sheet Music) */}
          {currentStep === 2 && contentType !== ContentType.SHEET && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle>How would you like to add your content?</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <ModeSelector
                  selectedMode={mode}
                  contentType={contentType}
                  onModeChange={(newMode) => {
                    setMode(newMode)
                    if (newMode === "create") {
                      setCurrentStep(5) // Skip to content creation
                    } else {
                      setCurrentStep(3) // Go to import mode selection
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Import Mode Selection */}
          {currentStep === 3 && mode === "import" && contentType !== ContentType.SHEET && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle>Import Options</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ImportModeSelector
                  selectedImportMode={importMode}
                  contentType={contentType}
                  onImportModeChange={(mode) => {
                    setImportMode(mode)
                    setCurrentStep(4)
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: File Upload */}
          {(currentStep === 4 || (currentStep === 3 && contentType === ContentType.SHEET)) && mode === "import" && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Music File
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <FileUpload
                  single
                  onFilesUploaded={handleFilesUploaded}
                  onFilesRemoved={handleFilesRemoved}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Content Creation or Metadata Form */}
          {currentStep === 5 && (
            <>
              {mode === "create" ? (
                <ContentCreator
                  onContentCreated={handleContentCreated}
                  initialType={
                    contentType === ContentType.CHORDS
                      ? "chord_chart"
                      : contentType === ContentType.TAB
                      ? "tablature"
                      : "lyrics"
                  }
                  hideTypeSelection
                />
              ) : uploadedFile && createdContent ? (
                importMode === "batch" ? (
                  <BatchPreview
                    songs={parsedSongs}
                    onImport={async () => {
                      // Handle batch import
                    }}
                    onCancel={() => setCurrentStep(4)}
                    isProcessing={isProcessing}
                  />
                ) : (
                  <MetadataForm
                    initialData={createdContent}
                    onSave={handleContentCreated}
                    onCancel={() => setCurrentStep(4)}
                    isProcessing={isProcessing}
                  />
                )
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}