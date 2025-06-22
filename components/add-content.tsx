"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FileText,
  Guitar,
  Music,
  Check,
  Upload,
  Sparkles,
  Zap,
  Star,
  Mic,
} from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ContentCreator } from "@/components/content-creator";
import { MetadataForm } from "@/components/metadata-form";
import { TextImportPreview } from "@/components/text-import-preview";
import { BatchPreview } from "@/components/batch-preview";
import { createContent } from "@/lib/content-service";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  parseDocxFile,
  parsePdfFile,
  parseTextFile,
  type ParsedSong,
} from "@/lib/batch-import";
import { getContentTypeStyle } from "@/lib/content-type-styles";
import { ContentType } from "@/types/content";
import type { Database } from "@/types/supabase";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  contentType: string;
  file: File;
  url?: string;
  status?: string;
  progress?: number;
  isTextImport?: boolean;
  parsedTitle?: string;
  textBody?: string;
  originalText?: string;
}

interface DraftContent {
  title: string;
  type: ContentType | string;
  content: Record<string, unknown>;
  files?: UploadedFile[];
  id?: string;
}

type CreatedContent = DraftContent | Content;

interface TextImportResult {
  title: string;
  body: string;
  content_type: string;
}

interface AddContentProps {
  onBack: () => void;
  onContentCreated: (content: Content) => void;
  onNavigate: (screen: string) => void;
}

export function AddContent({
  onBack,
  onContentCreated,
  onNavigate,
}: AddContentProps) {
  const [mode, setMode] = useState<"create" | "import">("create");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [createdContent, setCreatedContent] = useState<CreatedContent | null>(null);
  const [parsedSongs, setParsedSongs] = useState<(ParsedSong & { artist: string; include: boolean })[]>([]);
  const [importMode, setImportMode] = useState<"single" | "batch">("single");
  const [contentType, setContentType] = useState(ContentType.LYRICS);
  const [batchArtist, setBatchArtist] = useState("");
  const [batchImported, setBatchImported] = useState(false);

  useEffect(() => {
    if (contentType === ContentType.SHEET_MUSIC) {
      setMode("import");
      setImportMode("single");
    }
  }, [contentType]);

  const importModes = [
    {
      id: "single",
      name: "Single Content",
      subtitle: "Import a file with a single song.",
    },
    {
      id: "batch",
      name: "Batch Import",
      subtitle: "Import multiple songs from one file.",
    },
  ];

  const availableImportModes =
    contentType === ContentType.SHEET_MUSIC
      ? importModes.filter((m) => m.id === "single")
      : importModes;

  const contentTypes = [
    { id: "lyrics", name: ContentType.LYRICS, icon: Mic },
    { id: "chords", name: ContentType.CHORD_CHART, icon: Music },
    { id: "tabs", name: ContentType.GUITAR_TAB, icon: Guitar },
    {
      id: "sheet",
      name: ContentType.SHEET_MUSIC,
      icon: FileText,
      tooltip:
        "Add Sheet Music by uploading PDF or image files. Manual creation is not available for this type.",
    },
  ];

  const handleFilesUploaded = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Auto-detect if this is an image file and set content type to Sheet Music
      const isImageFile = /\.(png|jpg|jpeg)$/i.test(file.name);
      if (isImageFile) {
        setContentType(ContentType.SHEET_MUSIC);
        const updatedFile = { ...file, contentType: ContentType.SHEET_MUSIC };
        setUploadedFile(updatedFile);
        setCurrentStep(2);
      } else {
        const updatedFile = { ...file, contentType };
        setUploadedFile(updatedFile);
        if (contentType === ContentType.SHEET_MUSIC) {
          setCurrentStep(2);
        }
      }
    }
  };

  const handleImportNext = async () => {
    if (!uploadedFile) return;
    setUploadedFile({ ...uploadedFile, contentType });
    if (importMode === "single") {
      setCurrentStep(2);
      return;
    }
    setIsParsing(true);
    try {
      let songs: ParsedSong[] = [];
      const file: File = uploadedFile.file;
      if (file.name.toLowerCase().endsWith(".docx")) {
        songs = await parseDocxFile(file);
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        songs = await parsePdfFile(file);
      } else {
        songs = await parseTextFile(file);
      }
      setParsedSongs(
        songs.map((s) => ({ ...s, artist: batchArtist, include: true })),
      );
      setCurrentStep(2);
    } finally {
      setIsParsing(false);
    }
  };

  const handleContentCreated = (content: DraftContent) => {
    setCreatedContent(content);
    setCurrentStep(2);
  };

  const handleBatchPreviewComplete = (contents: Content[]) => {
    if (contents.length > 0) {
      setBatchImported(true);
    }
    setCurrentStep(3);
  };

  const handleMetadataComplete = async (metadata: Content) => {
    console.log("handleMetadataComplete called with:", metadata);
    setIsProcessing(true);

    try {
      // Verify content was actually saved
      if (!metadata?.id) {
        throw new Error("Content save failed - no ID returned");
      }

      // Only proceed if we have a valid content ID
      setCurrentStep(3);
      setCreatedContent(metadata); // Ensure this is set for handleFinish
    } catch (error) {
      console.error("Error in metadata completion:", error);
      alert("Failed to save content. Please try again.");
      setCurrentStep(1); // Return to first step on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextImportComplete = (contents: TextImportResult[]) => {
    if (contents.length > 0) {
      setCreatedContent({
        title: contents[0].title,
        type: contents[0].content_type,
        content: { lyrics: contents[0].body },
      });
      if (uploadedFile) {
        setUploadedFile({ ...uploadedFile, contentType });
      }
      setCurrentStep(2);
    }
  };


  const handleFinish = async () => {
    try {
      setIsProcessing(true);
      const contentToSave = createdContent || {
        files: uploadedFile ? [uploadedFile] : [],
      };

      if (!createdContent?.id) {
        // If no ID, we need to create the content
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const formattedContent = {
          user_id: user.id,
          title: createdContent?.title || uploadedFile?.name || "Untitled",
          content_type:
            contentType === ContentType.SHEET_MUSIC
              ? "sheet_music"
              : contentType || "unknown",
          content_data:
            contentType === ContentType.SHEET_MUSIC
              ? { file: uploadedFile?.url || null }
              : (createdContent && 'content' in createdContent ? createdContent.content : {}) as any,
          file_url: uploadedFile?.url || null,
          is_favorite: false,
          is_public: false,
        };

        const newContent = await createContent(formattedContent);
        onContentCreated(newContent);
      } else {
        // If we have an ID, just navigate
        onContentCreated(createdContent as Content);
      }
    } catch (error) {
      console.error("Error in finish:", error);
      alert("Error completing content addition. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      {
        number: 1,
        title: "Add Content",
        active: currentStep >= 1,
        icon: Upload,
      },
      {
        number: 2,
        title: "Add Details",
        active: currentStep >= 2,
        icon: FileText,
      },
      { number: 3, title: "Complete", active: currentStep >= 3, icon: Check },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step.active
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                      : "bg-white border-2 border-amber-200 text-amber-600"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors ${
                    step.active ? "text-gray-900" : "text-amber-600"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 rounded-full transition-colors ${
                    currentStep > step.number
                      ? "bg-gradient-to-r from-amber-500 to-orange-600"
                      : "bg-amber-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (currentStep === 3) {
    const isSheetMusic = contentType === ContentType.SHEET_MUSIC
    const isBatch = importMode === "batch" || batchImported
    const title = isBatch
      ? "All songs were successfully added to your library."
      : isSheetMusic
      ? "Your sheet music has been added to your library."
      : "Content Added Successfully!"
    const subtitle = isBatch
      ? "Check them in your music library to edit details or start building setlists."
      : isSheetMusic
      ? "You can now access it anytime from your music library."
      : "Ready to create setlists, perform, or edit whenever you need."
    const secondaryLabel = isBatch
      ? "Add More Songs"
      : isSheetMusic
      ? "Add Another Sheet Music"
      : "Add More Music"

    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-yellow-800" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">🎉 Done! Your music is now part of your library.</h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-1">{title}</p>
              <p className="text-sm text-gray-600 max-w-md mx-auto">{subtitle}</p>
            </div>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => onNavigate("add-content")}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 px-4 py-2 text-sm"
              >
                {secondaryLabel}
              </Button>
              <Button
                onClick={() => onNavigate("library")}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 text-sm shadow"
              >
                Go to Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(1)}
              className="hover:bg-amber-100 text-amber-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ml-2">
              Add Content Details
            </h1>
            {contentType === ContentType.SHEET_MUSIC && (
              <p className="text-sm text-gray-600 ml-4">
                Fill in the details to help organize and find your Sheet Music in your library.
              </p>
            )}
          </div>

          {renderStepIndicator()}

          {isProcessing ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Processing Content...
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We&apos;re analyzing and organizing your content with AI
                    magic.
                  </p>
                  <Progress
                    value={75}
                    className="w-full max-w-md mx-auto h-2"
                  />
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>
                      Extracting metadata and optimizing for performance
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : importMode === "batch" ? (
            <BatchPreview
              songs={parsedSongs}
              contentType={contentType}
              onComplete={handleBatchPreviewComplete}
              onBack={() => setCurrentStep(1)}
            />
          ) : uploadedFile && uploadedFile.isTextImport ? (
            <TextImportPreview
              files={[uploadedFile]}
              onComplete={handleTextImportComplete}
              onBack={() => setCurrentStep(1)}
            />
          ) : (
            <MetadataForm
              files={uploadedFile ? [uploadedFile] : []}
              createdContent={createdContent}
              onComplete={handleMetadataComplete}
              onBack={() => setCurrentStep(1)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="hover:bg-amber-100 text-amber-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="ml-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Add Content
            </h1>
            <p className="text-gray-600 text-sm">Create or import new music</p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="space-y-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg text-gray-900">Select Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  const selected = contentType === type.name;
                  
                  // Define explicit classes for each content type to ensure Tailwind includes them
                  const getTypeClasses = (typeName: string, isSelected: boolean) => {
                    if (isSelected) {
                      switch (typeName) {
                        case ContentType.LYRICS:
                          return "border-green-200 ring-2 ring-green-500 bg-green-50";
                        case ContentType.GUITAR_TAB:
                          return "border-blue-200 ring-2 ring-blue-500 bg-blue-50";
                        case ContentType.CHORD_CHART:
                          return "border-purple-200 ring-2 ring-purple-500 bg-purple-50";
                        case ContentType.SHEET_MUSIC:
                          return "border-orange-200 ring-2 ring-orange-500 bg-orange-50";
                        default:
                          return "border-gray-200 ring-2 ring-gray-500 bg-gray-50";
                      }
                    } else {
                      switch (typeName) {
                        case ContentType.LYRICS:
                          return "border-gray-200 hover:bg-green-50 hover:border-green-200";
                        case ContentType.GUITAR_TAB:
                          return "border-gray-200 hover:bg-blue-50 hover:border-blue-200";
                        case ContentType.CHORD_CHART:
                          return "border-gray-200 hover:bg-purple-50 hover:border-purple-200";
                        case ContentType.SHEET_MUSIC:
                          return "border-gray-200 hover:bg-orange-50 hover:border-orange-200";
                        default:
                          return "border-gray-200 hover:bg-gray-50 hover:border-gray-200";
                      }
                    }
                  };

                  const getIconClasses = (typeName: string) => {
                    switch (typeName) {
                      case ContentType.LYRICS:
                        return "text-green-600";
                      case ContentType.GUITAR_TAB:
                        return "text-blue-600";
                      case ContentType.CHORD_CHART:
                        return "text-purple-600";
                      case ContentType.SHEET_MUSIC:
                        return "text-orange-600";
                      default:
                        return "text-gray-600";
                    }
                  };

                  return (
                    <Card
                      key={type.id}
                      onClick={() => setContentType(type.name)}
                      title={type.tooltip}
                      className={`cursor-pointer transition-all duration-200 ${getTypeClasses(type.name, selected)}`}
                    >
                      <CardContent className="p-2 text-center space-y-1">
                        <Icon className={`w-6 h-6 mx-auto ${getIconClasses(type.name)}`} />
                        <p className="text-sm">{type.name}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {contentType !== ContentType.SHEET_MUSIC && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-lg text-gray-900">Choose How to Add</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Card
                    onClick={() => setMode("create")}
                    className={`cursor-pointer ${mode === "create" ? "ring-2 ring-primary" : "hover:shadow"}`}
                  >
                    <CardContent className="p-2 text-center space-y-1">
                      <FileText className="w-6 h-6 mx-auto" />
                      <p className="text-sm">Create Manually</p>
                    </CardContent>
                  </Card>
                  <Card
                    onClick={() => setMode("import")}
                    className={`cursor-pointer ${mode === "import" ? "ring-2 ring-primary" : "hover:shadow"}`}
                  >
                    <CardContent className="p-2 text-center space-y-1">
                      <Upload className="w-6 h-6 mx-auto" />
                      <p className="text-sm">Import From File</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === "create" ? (
            <ContentCreator
              onContentCreated={handleContentCreated}
              initialType={
                contentType === ContentType.CHORD_CHART
                  ? "chord_chart"
                  : contentType === ContentType.GUITAR_TAB
                  ? "tablature"
                  : "lyrics"
              }
              hideTypeSelection
            />
          ) : (
            <>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-3 px-4">
                  <CardTitle className="text-lg flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Music File
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <FileUpload
                    single
                    onFilesUploaded={handleFilesUploaded}
                    contentType={contentType}
                  />
                  
                  <div className="mt-3 text-center">
                    {contentType === ContentType.SHEET_MUSIC ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 font-medium">
                          Sheet Music files only
                        </p>
                        <p className="text-xs text-gray-600">
                          Supported formats: PDF, PNG, JPG, JPEG
                        </p>
                        <p className="text-xs text-gray-500">
                          Manual creation is not available for Sheet Music
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 font-medium">
                          Text and document files
                        </p>
                        <p className="text-xs text-gray-600">
                          Supported formats: TXT, DOCX, PDF
                        </p>
                        <p className="text-xs text-gray-500">
                          Perfect for lyrics, chord charts, and guitar tabs
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {uploadedFile && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-center text-sm text-green-800 font-medium">
                        ✓ {uploadedFile.name}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {uploadedFile && contentType !== ContentType.SHEET_MUSIC && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-amber-500" />
                      Import Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Import Mode</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableImportModes.map((m) => (
                          <Card
                            key={m.id}
                            onClick={() => setImportMode(m.id as "single" | "batch")}
                            className={`cursor-pointer ${importMode === m.id ? "ring-2 ring-primary" : "hover:shadow"}`}
                          >
                            <CardContent className="p-2 text-center space-y-1">
                              <p className="text-sm font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.subtitle}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    {importMode === "batch" && (
                      <div>
                        <Label htmlFor="artist" className="text-sm">Artist Name (optional)</Label>
                        <Input
                          id="artist"
                          value={batchArtist}
                          onChange={(e) => setBatchArtist(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="text-right">
                      <Button onClick={handleImportNext}>Next</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
