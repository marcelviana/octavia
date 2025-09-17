"use client";

import { useState, useEffect, useRef } from "react";
import { ContentCreator } from "@/components/content-creator";
import { StepIndicator } from "./StepIndicatorComponent";
import { CompletionStep } from "./CompletionStep";
import { DetailsStep } from "./DetailsStep";
import { ImportModeSelector } from "./ImportModeSelector";
import { ModeSelector } from "./ModeSelector";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { useAddContentLogic } from "@/hooks/useAddContentLogic";
import { ContentType } from "@/types/content";
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
      />
    );
  }

  // Step 1: Upload/Create
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} />

          <ContentTypeSelector
            contentTypes={contentTypes}
            selectedType={contentType}
            onTypeChange={setContentType}
          />

          {contentType !== ContentType.SHEET && (
            <ModeSelector
              mode={mode}
              onModeChange={setMode}
              contentType={contentType}
            />
          )}

          {mode === "import" && (
            <ImportModeSelector
              importModes={availableImportModes}
              selectedMode={importMode}
              onModeChange={setImportMode}
            />
          )}

          {mode === "create" ? (
            <ContentCreator
              contentType={contentType}
              onBack={onBack}
              onContentCreated={(content) => {
                setDraftContent(content);
                onContentCreated(content);
                setCurrentStep(3);
              }}
            />
          ) : (
            <div>
              {/* File upload component would go here */}
              <p className="text-center text-gray-600">File upload functionality</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}