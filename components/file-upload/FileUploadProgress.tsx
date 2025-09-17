"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Check, AlertCircle } from "lucide-react";

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  error?: string;
}

interface FileUploadProgressProps {
  files: UploadedFile[];
  isUploading: boolean;
  onRemoveFile: (id: number) => void;
}

export function FileUploadProgress({
  files,
  isUploading,
  onRemoveFile
}: FileUploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700">
        {isUploading ? "Uploading Files..." : "Uploaded Files"}
      </h4>

      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
        >
          <div className="flex-shrink-0">
            {file.status === 'completed' && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            )}
            {file.status === 'error' && (
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            )}
            {file.status === 'uploading' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 truncate">
                {file.name}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(file.size)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {file.status === 'uploading' && file.progress !== undefined && (
              <Progress value={file.progress} className="mt-2 h-1" />
            )}

            {file.status === 'error' && file.error && (
              <p className="text-xs text-red-600 mt-1">{file.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}