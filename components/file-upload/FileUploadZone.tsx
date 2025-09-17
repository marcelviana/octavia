"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Music, Guitar, Mic } from "lucide-react";
import { ContentType } from "@/types/content";

interface FileUploadZoneProps {
  isDragOver: boolean;
  contentType?: ContentType;
  allowedExtensions: string;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
}

export function FileUploadZone({
  isDragOver,
  contentType,
  allowedExtensions,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect
}: FileUploadZoneProps) {
  const getContentIcon = () => {
    switch (contentType) {
      case ContentType.LYRICS:
        return <FileText className="w-8 h-8 text-amber-600" />;
      case ContentType.CHORDS:
        return <Music className="w-8 h-8 text-amber-600" />;
      case ContentType.TAB:
        return <Guitar className="w-8 h-8 text-amber-600" />;
      case ContentType.SHEET:
        return <Mic className="w-8 h-8 text-amber-600" />;
      default:
        return <Upload className="w-8 h-8 text-amber-600" />;
    }
  };

  const getTitle = () => {
    if (contentType === ContentType.SHEET) {
      return "Upload Sheet Music";
    }
    return "Upload Files";
  };

  const getSubtitle = () => {
    if (contentType === ContentType.SHEET) {
      return "Drag and drop PDF or image files, or click to select";
    }
    return "Drag and drop files here, or click to select";
  };

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragOver
          ? "border-amber-400 bg-amber-50 scale-105"
          : "border-amber-200 hover:border-amber-300 hover:bg-amber-25"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onFileSelect}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">{getContentIcon()}</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{getTitle()}</h3>
        <p className="text-sm text-gray-500 mb-4">{getSubtitle()}</p>
        <Button
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Supported formats: {allowedExtensions}
        </p>
      </CardContent>
    </Card>
  );
}