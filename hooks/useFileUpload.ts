import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { uploadFileToStorage, testStoragePermissions } from "@/lib/storage-service";
import { ContentType } from "@/types/content";

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  error?: string;
  contentType?: string;
}

interface UseFileUploadProps {
  single?: boolean;
  contentType?: ContentType;
  onFilesUploaded: (files: any[]) => void;
  onFilesRemoved?: () => void;
}

export function useFileUpload({
  single = false,
  contentType,
  onFilesUploaded,
  onFilesRemoved
}: UseFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ canUpload: boolean; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredCallback = useRef(false);

  useEffect(() => {
    testStoragePermissions()
      .then(() => setStorageStatus({ canUpload: true }))
      .catch((error) => setStorageStatus({ canUpload: false, error: error.message }));
  }, []);

  useEffect(() => {
    if (uploadedFiles.length > 0 && !isUploading && !hasTriggeredCallback.current) {
      hasTriggeredCallback.current = true;
      onFilesUploaded(uploadedFiles);
    }
  }, [uploadedFiles, isUploading, onFilesUploaded]);

  const getAllowedExtensions = () => {
    if (contentType === ContentType.SHEET) {
      return ".pdf, .png, .jpg, .jpeg";
    }
    return ".pdf, .docx, .txt, .png, .jpg, .jpeg";
  };

  const sanitizeFilename = (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  };

  const handleFiles = async (files: File[]) => {
    if (!storageStatus?.canUpload) {
      toast.error("File upload is not available. Please check your storage configuration.");
      return;
    }

    const filesToProcess = single ? files.slice(0, 1) : files;
    const allowedExtensions = getAllowedExtensions().split(', ').map(ext => ext.trim());

    const validFiles = filesToProcess.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(extension);
    });

    if (validFiles.length !== filesToProcess.length) {
      toast.error(`Some files were not supported. Allowed formats: ${getAllowedExtensions()}`);
    }

    if (validFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    hasTriggeredCallback.current = false;

    if (single) {
      setUploadedFiles([]);
    }

    const newFiles = validFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
      contentType: contentType || ContentType.LYRICS
    }));

    setUploadedFiles(prev => single ? newFiles : [...prev, ...newFiles]);

    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        const fileId = newFiles[index].id;
        const sanitizedName = sanitizeFilename(file.name);

        try {
          const result = await uploadFileToStorage(file, sanitizedName, (progress) => {
            setUploadedFiles(prev => prev.map(f =>
              f.id === fileId ? { ...f, progress } : f
            ));
          });

          setUploadedFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'completed', url: result.url, progress: 100 }
              : f
          ));

          return { ...newFiles[index], status: 'completed', url: result.url };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', error: errorMessage }
              : f
          ));
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      toast.success(`Successfully uploaded ${validFiles.length} file(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Some files failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (id: number) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    if (uploadedFiles.length === 1) {
      onFilesRemoved?.();
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    hasTriggeredCallback.current = false;
    onFilesRemoved?.();
  };

  return {
    // State
    isDragOver,
    uploadedFiles,
    isUploading,
    storageStatus,

    // Handlers
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleFileInputChange,
    removeFile,
    clearFiles,

    // Utils
    getAllowedExtensions,
    fileInputRef
  };
}