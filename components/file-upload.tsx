"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Music, Guitar, X, Check, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void
}

export function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFiles = async (files: File[]) => {
    setIsUploading(true)

    const processedFiles = await Promise.all(
      files.map(async (file, index) => {
        const base = {
          id: Date.now() + index,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploading",
          progress: 0,
          contentType: detectContentType(file.name),
        }

        // Parse text-based files for automatic content import
        if (/(\.txt|\.md)$/i.test(file.name)) {
          const text = await file.text()
          const lines = text.split(/\r?\n/)
          const firstIndex = lines.findIndex((l) => l.trim() !== "")
          const firstLine = firstIndex >= 0 ? lines[firstIndex].trim() : ""
          let title = firstLine
          const marker = firstLine.match(/^#\s*(.*)/) || firstLine.match(/^Title:\s*(.*)/i)
          if (marker) {
            title = marker[1].trim()
          }
          const body = lines.slice(firstIndex + 1).join("\n")

          return {
            ...base,
            isTextImport: true,
            parsedTitle: title || file.name,
            textBody: body,
            originalText: text,
          }
        }

        return base
      }),
    )

    setUploadedFiles(processedFiles)

    // Simulate upload progress
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i]
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)))
      }
      setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "completed" } : f)))
    }

    setIsUploading(false)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }, [handleFiles])

  const detectContentType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "pdf":
        return "Sheet Music"
      case "gp5":
      case "gpx":
        return "Guitar Tab"
      case "txt":
        return "Chord Chart"
      case "mid":
      case "midi":
        return "MIDI File"
      case "xml":
      case "musicxml":
        return "MusicXML"
      default:
        return "Unknown"
    }
  }

  const getFileIcon = (contentType: string) => {
    switch (contentType) {
      case "Guitar Tab":
        return <Guitar className="w-5 h-5 text-orange-600" />
      case "Sheet Music":
        return <Music className="w-5 h-5 text-blue-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const removeFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleContinue = () => {
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed")
    onFilesUploaded(completedFiles)
  }

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
        <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.gp5,.gpx,.txt,.mid,.midi,.xml,.musicxml"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild>
            <span>Choose Files</span>
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-2">Supports PDF, images, Guitar Pro, MIDI, MusicXML, and text files</p>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Uploaded Files ({uploadedFiles.length})</h3>
              {!isUploading && uploadedFiles.every((f) => f.status === "completed") && (
                <Button onClick={handleContinue}>
                  Continue
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">{getFileIcon(file.contentType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.contentType}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                    {file.status === "uploading" && <Progress value={file.progress} className="w-full mt-2" />}
                  </div>
                  <div className="flex-shrink-0">
                    {file.status === "completed" ? (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                          <X className="w-4 h-4" />
                        </Button>
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
  )
}
