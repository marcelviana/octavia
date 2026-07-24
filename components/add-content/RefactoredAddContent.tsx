"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ContentCreator } from "@/components/content-creator";
import { FileUploadZone } from "./FileUploadZone";
import { StepIndicator } from "./StepIndicatorComponent";
import { CompletionStep } from "./CompletionStep";
import { DetailsStep } from "./DetailsStep";
import { ImportModeSelector } from "./ImportModeSelector";
import { ModeSelector } from "./ModeSelector";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { useAddContentLogic } from "@/hooks/useAddContentLogic";
import { ContentType, type ContentTypeId } from "@/types/content";
import type { Database } from "@/types/supabase";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface RefactoredAddContentProps {
  onBack: () => void;
  onContentCreated: (content: Content) => void;
  onNavigate: (screen: string) => void;
}

export function RefactoredAddContent({
  onBack,
  onContentCreated,
  onNavigate,
}: RefactoredAddContentProps) {
  const {
    mode,
    setMode,
    currentStep,
    setCurrentStep,
    contentType,
    setContentType,
    importMode,
    setImportMode,
    uploadedFile,
    metadata,
    setMetadata,
    parsedSongs,
    draftContent,
    setDraftContent,
    isUploading,
    isProcessing,
    createdContent,
    error,
    handleFilesUploaded,
    handleSaveContent,
    availableImportModes,
    contentTypes
  } = useAddContentLogic();

  // Step 3: Completion
  if (currentStep === 3 && createdContent) {
    const title = Array.isArray(createdContent)
      ? `${createdContent.length} songs imported successfully`
      : `"${createdContent.title}" by ${createdContent.artist}`;

    const subtitle = Array.isArray(createdContent)
      ? "All songs are now available in your library"
      : "Your new content is now available in your library";

    const secondaryLabel = Array.isArray(createdContent)
      ? "Import More"
      : "Add Another";

    return (
      <CompletionStep
        title={title}
        subtitle={subtitle}
        secondaryLabel={secondaryLabel}
        onNavigate={onNavigate}
      />
    );
  }

  // Step 2: Details
  if (currentStep === 2) {
    return (
      <DetailsStep
        contentType={contentType}
        isMultipleFiles={parsedSongs.length > 0}
        uploadedFiles={parsedSongs}
        metadata={metadata}
        onMetadataChange={setMetadata}
        onBack={() => setCurrentStep(1)}
        onNext={() => setCurrentStep(3)}
        draftContent={draftContent}
        setDraftContent={setDraftContent}
        handleSaveContent={handleSaveContent}
        isUploading={isUploading}
        onContentCreated={onContentCreated}
      />
    );
  }

  // Step 1: Upload/Create
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-amber-100 text-amber-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <StepIndicator currentStep={currentStep} />

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4">
            <ContentTypeSelector
              selectedType={contentType}
              onTypeChange={setContentType}
            />

            {contentType !== ContentType.SHEET && (
              <ModeSelector
                selectedMode={mode}
                onModeChange={setMode}
                contentType={contentType}
              />
            )}

            {mode === "import" && (
              <ImportModeSelector
                selectedImportMode={importMode}
                contentType={contentType}
                onImportModeChange={setImportMode}
              />
            )}
          </div>

          {mode === "create" ? (
            <ContentCreator
              initialType={
                contentType === ContentType.LYRICS
                  ? "lyrics"
                  : contentType === ContentType.CHORDS
                  ? "chord_chart"
                  : contentType === ContentType.TAB
                  ? "tablature"
                  : "sheet"
              }
              hideTypeSelection={true}
              onContentCreated={(content) => {
                setDraftContent(content);
                setCurrentStep(2);
              }}
            />
          ) : (
            <FileUploadZone
              contentType={contentType}
              onFilesUploaded={handleFilesUploaded}
            />
          )}
        </div>
      </div>
    </div>
  );
}