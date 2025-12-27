"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MetadataForm } from "@/components/metadata-form";
import { BatchPreview } from "@/components/batch-preview";
import { ContentType } from "@/types/content";
import type { Database } from "@/types/supabase";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface DetailsStepProps {
  contentType: ContentType;
  isMultipleFiles: boolean;
  uploadedFiles: any[];
  metadata: any;
  onMetadataChange: (metadata: any) => void;
  onBack: () => void;
  onNext: () => void;
  draftContent: any;
  setDraftContent: (content: any) => void;
  handleSaveContent: () => Promise<void>;
  isUploading: boolean;
}

export function DetailsStep({
  contentType,
  isMultipleFiles,
  uploadedFiles,
  metadata,
  onMetadataChange,
  onBack,
  onNext,
  draftContent,
  setDraftContent,
  handleSaveContent,
  isUploading
}: DetailsStepProps) {
  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
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

        {isMultipleFiles ? (
          <BatchPreview
            songs={uploadedFiles}
            contentType={
              contentType === ContentType.CHORDS
                ? "Chord Chart"
                : contentType === ContentType.TAB
                ? "Guitar Tab"
                : contentType === ContentType.SHEET
                ? "Sheet Music"
                : "Lyrics"
            }
            onComplete={(contents) => {
              // Handle batch import completion
              if (contents.length > 0) {
                onNext();
              }
            }}
            onBack={onBack}
          />
        ) : (
          <MetadataForm
            createdContent={draftContent}
            onComplete={(metadata) => {
              // Handle metadata completion
              onNext();
            }}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}