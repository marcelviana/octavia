"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BasicMetadataFields } from "./BasicMetadataFields";
import { AdvancedMetadataFields } from "./AdvancedMetadataFields";
import { Music, ArrowLeft, Check, AlertCircle, Sliders } from "lucide-react";
import { useMetadataForm } from "@/hooks/useMetadataForm";

interface RefactoredMetadataFormProps {
  files?: any[];
  createdContent?: any;
  onComplete: (metadata: any) => void;
  onBack: () => void;
}

export function RefactoredMetadataForm({
  files = [],
  createdContent,
  onComplete,
  onBack
}: RefactoredMetadataFormProps) {
  const {
    formData,
    isSubmitting,
    error,
    success,
    updateField,
    handleSubmit
  } = useMetadataForm({ onComplete });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-amber-100 text-amber-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="ml-4">
          <h1 className="text-xl font-bold text-gray-900">Add Metadata</h1>
          <p className="text-sm text-gray-600">Fill in the details for your content</p>
        </div>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-amber-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <CardTitle className="flex items-center text-amber-800">
            <Music className="w-5 h-5 mr-2" />
            Content Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <BasicMetadataFields
            title={formData.title}
            artist={formData.artist}
            album={formData.album}
            genre={formData.genre}
            year={formData.year}
            notes={formData.notes}
            onChange={updateField}
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-amber-700 hover:text-amber-800">
                <div className="flex items-center">
                  <Sliders className="w-4 h-4 mr-2" />
                  Advanced Options
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <AdvancedMetadataFields
                  key={formData.key}
                  bpm={formData.bpm}
                  difficulty={formData.difficulty}
                  capo={formData.capo}
                  tuning={formData.tuning}
                  timeSignature={formData.timeSignature}
                  isFavorite={formData.isFavorite}
                  tags={formData.tags}
                  onChange={updateField}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.artist}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Content"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}