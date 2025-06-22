"use client";

import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Music,
  Guitar,
  X,
  Check,
  AlertCircle,
  Settings,
} from "lucide-react";
import { getContentTypeStyle } from "@/lib/content-type-styles";
import { uploadFileToStorage, testStoragePermissions } from "@/lib/storage-service";
import { ContentType } from "@/types/content";

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void;
  single?: boolean;
  contentType?: ContentType;
}

export function FileUpload({
  onFilesUploaded,
  single = false,
  contentType,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ canUpload: boolean; error?: string } | null>(null);
  
  // Dynamic allowed extensions based on content type
  const getAllowedExtensions = () => {
    if (contentType === ContentType.SHEET_MUSIC) {
      return ["pdf", "png", "jpg", "jpeg"];
    }
    // For other content types (Lyrics, Chord Chart, Guitar Tab)
    return ["pdf", "docx", "txt"];
  };
  
  const allowedExtensions = getAllowedExtensions();

  // Function to sanitize filename for storage
  const sanitizeFilename = (filename: string): string => {
    // Get the file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Remove or replace problematic characters
    const sanitizedName = name
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    return sanitizedName + extension;
  };

  const handleFiles = async (files: File[]) => {
    if (single) {
      files = files.slice(0, 1);
    }
    const unsupported = files.filter(
      (f) =>
        !allowedExtensions.some((ext) =>
          f.name.toLowerCase().endsWith(`.${ext}`),
        ),
    );
    if (unsupported.length > 0) {
      toast.error(
        `Unsupported file type: ${unsupported.map((f) => f.name).join(", ")}`,
      );
      files = files.filter((f) => !unsupported.includes(f));
    }
    
    if (files.length === 0) {
      return;
    }
    
    // Check storage permissions before starting upload
    console.log("Checking storage permissions...");
    const permissionCheck = await testStoragePermissions();
    setStorageStatus(permissionCheck);
    if (!permissionCheck.canUpload) {
      console.error("Storage permission check failed:", permissionCheck.error);
      toast.error(permissionCheck.error || "Storage not configured properly");
      return;
    }
    console.log("Storage permissions OK");
    
    setIsUploading(true);

    const processedFiles = await Promise.all(
      files.map(async (file, index) => {
        const base = {
          id: Date.now() + index,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploading" as const,
          progress: 0,
          contentType: detectContentType(file.name),
        };

        if (/(\.txt|\.md)$/i.test(file.name)) {
          const text = await file.text();
          const lines = text.split(/\r?\n/);
          const firstIndex = lines.findIndex((l) => l.trim() !== "");
          const firstLine = firstIndex >= 0 ? lines[firstIndex].trim() : "";
          let title = firstLine;
          const marker =
            firstLine.match(/^#\s*(.*)/) || firstLine.match(/^Title:\s*(.*)/i);
          if (marker) {
            title = marker[1].trim();
          }
          const body = lines.slice(firstIndex + 1).join("\n");

          return {
            ...base,
            file,
            isTextImport: true,
            parsedTitle: title || file.name,
            textBody: body,
            originalText: text,
          };
        }

        return { ...base, file };
      }),
    );

    setUploadedFiles(processedFiles);

    // Upload files one by one to avoid overwhelming the system
    for (const file of processedFiles) {
      try {
        console.log(`Starting upload for ${file.name}...`);
        const sanitizedFilename = sanitizeFilename(file.name);
        const storageFilename = `${Date.now()}-${sanitizedFilename}`;
        
        const { url } = await uploadFileToStorage(
          file.file,
          storageFilename,
        );
        
        console.log(`Upload successful for ${file.name}:`, url);
        
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, url, status: "completed" as const, progress: 100 }
              : f,
          ),
        );
      } catch (e) {
        console.error("Upload failed for", file.name, ":", e);
        toast.error(`Failed to upload ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "error" as const } : f)),
        );
      }
    }

    setIsUploading(false);
    console.log("Upload process completed");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const detectContentType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "Document";
      case "docx":
        return "Document";
      case "gp5":
      case "gpx":
        return "Guitar Tab";
      case "txt":
        return "Document";
      case "png":
      case "jpg":
      case "jpeg":
        return "Sheet Music";
      case "mid":
      case "midi":
        return "MIDI File";
      case "xml":
      case "musicxml":
        return "MusicXML";
      default:
        return "Unknown";
    }
  };

  const getFileIcon = (contentType: string) => {
    const styles = getContentTypeStyle(contentType);
    switch (contentType) {
      case "Guitar Tab":
      case "Guitar Tablature":
        return <Guitar className={`w-5 h-5 ${styles.icon}`} />;
      case "Chord Chart":
        return <Music className={`w-5 h-5 ${styles.icon}`} />;
      case "Sheet Music":
        return <FileText className={`w-5 h-5 ${styles.icon}`} />;
      case "Lyrics":
        return <FileText className={`w-5 h-5 ${styles.icon}`} />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleContinue = () => {
    const completedFiles = uploadedFiles.filter(
      (f) => f.status === "completed",
    );
    onFilesUploaded(completedFiles);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? "Drop files here" : "Upload your music files"}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <input
          type="file"
          multiple={!single}
          accept={allowedExtensions.map(ext => `.${ext}`).join(",")}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild>
            <span>{single ? "Choose File" : "Choose Files"}</span>
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          {contentType === ContentType.SHEET_MUSIC 
            ? "Supports PDF and image files (PNG, JPG, JPEG)"
            : "Supports PDF, DOCX, and text files"
          }
        </p>
      </div>

      {/* Storage Status Warning */}
      {storageStatus && !storageStatus.canUpload && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Storage Setup Required</h4>
                <p className="text-sm text-orange-700 mt-1">
                  {storageStatus.error}
                </p>
                <p className="text-sm text-orange-700 mt-2">
                  Please visit the <a href="/setup" className="underline font-medium">setup page</a> to configure storage properly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              {!isUploading &&
                uploadedFiles.every((f) => f.status === "completed") && (
                  <Button onClick={handleContinue}>
                    Continue
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                )}
            </div>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(file.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.contentType}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="w-full mt-2" />
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {file.status === "completed" ? (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you sure you want to remove this file?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel the current sheet music creation
                                process.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeFile(file.id)}
                              >
                                Remove File
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : file.status === "uploading" ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
