"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadToStorage, type UploadedFile } from "./upload-to-storage";
import { ContentType } from "@/types/content";

interface FileUploadZoneProps {
  contentType: ContentType;
  onFilesUploaded: (files: UploadedFile[]) => void;
}

const SHEET_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const TEXT_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function FileUploadZone({ contentType, onFilesUploaded }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions =
    contentType === ContentType.SHEET ? SHEET_EXTENSIONS : TEXT_EXTENSIONS;

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file || isUploading) return;

    if (!allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      toast.error(
        `Unsupported file type: ${file.name}. Allowed: ${allowedExtensions.join(", ")}`,
      );
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToStorage(file);
      onFilesUploaded([
        {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          contentType,
          file,
          url,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Music File</h2>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver ? "border-amber-500 bg-amber-50" : "border-amber-300"
        }`}
      >
        {isUploading ? (
          <Loader2
            className="w-8 h-8 mx-auto mb-3 text-amber-600 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-3 text-amber-600" aria-hidden="true" />
        )}
        <p className="text-gray-600 mb-3">
          {isUploading ? "Uploading file..." : "Drag and drop your file here, or"}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          aria-label="Upload music file"
          accept={allowedExtensions.join(",")}
          className="sr-only"
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
          }}
        />
        <p className="text-xs text-gray-500 mt-3">
          Supported formats: {allowedExtensions.join(", ")} (max 50MB)
        </p>
      </div>
    </div>
  );
}
