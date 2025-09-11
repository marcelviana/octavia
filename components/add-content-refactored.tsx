"use client"

import { DomainErrorBoundary } from "@/domains/shared/components/DomainErrorBoundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, FileText, Zap, AlertCircle, Upload } from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { ContentCreator } from "@/components/content-creator"
import { MetadataForm } from "@/components/metadata-form"
import { BatchPreview } from "@/components/batch-preview"
import { ContentType } from "@/types/content"
import { useContentCreation } from "@/domains/content-management/hooks/use-content-creation"
import { ContentTypeSelector } from "@/domains/content-management/components/ContentTypeSelector"
import { CreationModeSelector } from "@/domains/content-management/components/CreationModeSelector"
import { StepIndicator } from "@/domains/content-management/components/StepIndicator"
import { ImportOptions } from "@/domains/content-management/components/ImportOptions"
import { SuccessScreen } from "@/domains/content-management/components/SuccessScreen"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

interface AddContentProps {
  onBack: () => void
  onContentCreated: (content: Content) => void
  onNavigate: (screen: string) => void
}

export function AddContent({ onBack, onContentCreated, onNavigate }: AddContentProps) {
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
    setMode,
    setCurrentStep,
    setContentType,
    setImportMode,
    setBatchArtist,
    handleFilesUploaded,
    handleFilesRemoved,
    handleImportNext,
    handleContentCreated,
    handleBatchPreviewComplete,
    handleMetadataComplete,
  } = useContentCreation({ onContentCreated })

  if (currentStep === 3) {
    return (
      <SuccessScreen
        contentType={contentType}
        importMode={importMode}
        batchImported={batchImported}
        onNavigate={onNavigate}
      />
    )
  }

  if (currentStep === 2) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(1)}
              className="hover:bg-amber-100 text-amber-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ml-2">
              Add Content Details
            </h1>
            {contentType === ContentType.SHEET && (
              <p className="text-sm text-gray-600 ml-4">
                Fill in the details to help organize and find your Sheet Music in your library.
              </p>
            )}
          </div>

          <StepIndicator currentStep={currentStep} />

          {isProcessing ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Processing Content...</h3>
                  <p className="text-gray-600 text-sm">
                    We&apos;re analyzing and organizing your content with AI magic.
                  </p>
                  <Progress value={75} className="w-full max-w-md mx-auto h-2" />
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>Extracting metadata and optimizing for performance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : importMode === "batch" ? (
            <BatchPreview
              songs={parsedSongs}
              contentType={contentType}
              onComplete={handleBatchPreviewComplete}
              onBack={() => setCurrentStep(1)}
            />
          ) : (
            <MetadataForm
              files={mode === "import" && uploadedFile ? [uploadedFile] : []}
              createdContent={createdContent}
              onComplete={handleMetadataComplete}
              onBack={() => setCurrentStep(1)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <DomainErrorBoundary domain="Content Management" feature="Add Content">
      <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-amber-100 text-amber-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="ml-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Add Content
            </h1>
            <p className="text-gray-600 text-sm">Create or import new music</p>
          </div>
        </div>

        <StepIndicator currentStep={currentStep} />

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <ContentTypeSelector
            contentType={contentType}
            onContentTypeChange={setContentType}
          />

          {contentType !== ContentType.SHEET && (
            <CreationModeSelector mode={mode} onModeChange={setMode} />
          )}

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
          ) : (
            <>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-3 px-4">
                  <h3 className="text-lg flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Music File
                  </h3>
                </div>
                <CardContent className="p-4">
                  <FileUpload
                    single
                    onFilesUploaded={handleFilesUploaded}
                    onFilesRemoved={handleFilesRemoved}
                    contentType={contentType}
                  />
                </CardContent>
              </Card>

              <ImportOptions
                uploadedFile={uploadedFile}
                contentType={contentType}
                importMode={importMode}
                batchArtist={batchArtist}
                onImportModeChange={setImportMode}
                onBatchArtistChange={setBatchArtist}
                onNext={handleImportNext}
              />
            </>
          )}
        </div>
      </div>
      </div>
    </DomainErrorBoundary>
  )
}