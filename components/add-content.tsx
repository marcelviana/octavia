"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  FileText,
  Guitar,
  Music,
  Camera,
  Check,
  AlertCircle,
  Download,
  Mic,
  Piano,
  Drum,
  Upload,
  Sparkles,
  Zap,
  Star,
} from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { ContentCreator } from "@/components/content-creator"
import { MetadataForm } from "@/components/metadata-form"
import { TextImportPreview } from "@/components/text-import-preview"
import { BatchImport } from "@/components/batch-import"
import { createContent } from "@/lib/content-service"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface AddContentProps {
  onBack: () => void
  onContentCreated: (content: any) => void
  onNavigate: (screen: string) => void
}

export function AddContent({ onBack, onContentCreated, onNavigate }: AddContentProps) {
  const [activeTab, setActiveTab] = useState("import")
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [createdContent, setCreatedContent] = useState<any>(null)
  const [createdContents, setCreatedContents] = useState<any[]>([])

  const contentTypes = [
    {
      id: "sheet-music",
      name: "Sheet Music",
      icon: Music,
      description: "Traditional musical notation",
      formats: ["PDF", "PNG", "JPG", "MusicXML"],
      gradient: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "guitar-tab",
      name: "Guitar Tablature",
      icon: Guitar,
      description: "Guitar tabs and fingering charts",
      formats: ["GP5", "GPX", "TXT", "PDF"],
      gradient: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      id: "chord-chart",
      name: "Chord Chart",
      icon: FileText,
      description: "Chord progressions and lyrics",
      formats: ["TXT", "PDF", "ChordPro"],
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      id: "lyrics",
      name: "Lyrics Only",
      icon: Mic,
      description: "Song lyrics without chords",
      formats: ["TXT", "PDF", "DOC"],
      gradient: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      id: "piano-score",
      name: "Piano Score",
      icon: Piano,
      description: "Piano sheet music and arrangements",
      formats: ["PDF", "MusicXML", "MIDI"],
      gradient: "from-indigo-500 to-blue-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      id: "drum-notation",
      name: "Drum Notation",
      icon: Drum,
      description: "Drum patterns and notation",
      formats: ["PDF", "GP5", "MIDI"],
      gradient: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ]

  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(files)
    setCurrentStep(2)
  }

  const handleScanCapture = (text: string) => {
    const file = {
      id: Date.now(),
      name: "Scanned Sheet",
      textBody: text,
      parsedTitle: "Scanned Sheet",
      isTextImport: true,
    }
    setUploadedFiles([file])
    setCurrentStep(2)
  }

  const handleUrlImport = (text: string) => {
    const file = {
      id: Date.now(),
      name: "Imported URL",
      textBody: text,
      parsedTitle: "Imported URL",
      isTextImport: true,
    }
    setUploadedFiles([file])
    setCurrentStep(2)
  }

  const handleContentCreated = (content: any) => {
    setCreatedContent(content)
    setCurrentStep(2)
  }

  const handleMetadataComplete = async (metadata: any) => {
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
      setCurrentStep(1) // Return to first step on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextImportComplete = (contents: any[]) => {
    setCreatedContents(contents)
    setUploadedFiles(contents.map((c: any) => ({ name: c.title })))
    setCurrentStep(3)
  }

  const handleBatchImportComplete = (contents: any[]) => {
    setCreatedContents(contents)
    setUploadedFiles(contents.map((c: any) => ({ name: c.title, isTextImport: true })))
    setCurrentStep(3)
  }

  const handleFinish = async () => {
    try {
      setIsProcessing(true);
      const contentToSave = createdContent || { files: uploadedFiles };
      
      if (!contentToSave?.id) {
        // If no ID, we need to create the content
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
  
        const formattedContent = {
          user_id: user.id,
          title: contentToSave.title || "Untitled",
          content_type: contentToSave.type || "unknown",
          content_data: contentToSave.content || {},
          file_url: contentToSave.files?.[0]?.url || null,
          is_favorite: false,
          is_public: false,
        };
  
        const newContent = await createContent(formattedContent);
        onContentCreated(newContent);
      } else {
        // If we have an ID, just navigate
        onContentCreated(contentToSave);
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
      { number: 1, title: "Add Content", active: currentStep >= 1, icon: Upload },
      { number: 2, title: "Add Details", active: currentStep >= 2, icon: FileText },
      { number: 3, title: "Complete", active: currentStep >= 3, icon: Check },
    ]

    return (
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon
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
                  {currentStep > step.number ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
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
                    currentStep > step.number ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-amber-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (currentStep === 3) {
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Content Added Successfully!
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Your {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : "content"} have been added to your
                library and are ready to use.
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => onNavigate("add-content")}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 px-4 py-2 text-sm"
              >
                Add More Content
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
    )
  }

  if (currentStep === 2) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setCurrentStep(1)} className="hover:bg-amber-100 text-amber-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ml-2">
              Add Content Details
            </h1>
          </div>

          {renderStepIndicator()}

          {isProcessing ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Processing Content...</h3>
                  <p className="text-gray-600 text-sm">We&apos;re analyzing and organizing your content with AI magic.</p>
                  <Progress value={75} className="w-full max-w-md mx-auto h-2" />
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>Extracting metadata and optimizing for performance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : uploadedFiles.length > 0 && uploadedFiles.every((f) => f.isTextImport) ? (
            <TextImportPreview
              files={uploadedFiles}
              onComplete={handleTextImportComplete}
              onBack={() => setCurrentStep(1)}
            />
          ) : (
            <MetadataForm
              files={uploadedFiles}
              createdContent={createdContent}
              onComplete={handleMetadataComplete}
              onBack={() => setCurrentStep(1)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-amber-100 text-amber-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="ml-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Add Content
            </h1>
            <p className="text-gray-600 text-sm">Import, create, or scan your musical content</p>
          </div>
        </div>

        {renderStepIndicator()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-amber-200 p-1 rounded-lg shadow h-auto">
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-md font-medium py-1.5 text-sm flex items-center justify-center"
            >
              <Upload className="w-3 h-3 mr-1.5" />
              Import Files
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-md font-medium py-1.5 text-sm flex items-center justify-center"
            >
              <FileText className="w-3 h-3 mr-1.5" />
              Create New
            </TabsTrigger>
            <TabsTrigger
              value="scan"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-md font-medium py-1.5 text-sm flex items-center justify-center"
            >
              <Camera className="w-3 h-3 mr-1.5" />
              Scan/Photo
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-md font-medium py-1.5 text-sm flex items-center justify-center"
            >
              <Download className="w-3 h-3 mr-1.5" />
              From URL
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-amber-700 hover:bg-amber-50 rounded-md font-medium py-1.5 text-sm flex items-center justify-center"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Batch Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-3 px-4">
                <CardTitle className="text-lg flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Music Files
                </CardTitle>
                <p className="text-amber-100 text-sm">
                  Upload your existing sheet music, tablatures, and other musical content
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <Star className="w-4 h-4 mr-2 text-amber-500" />
                  Supported Content Types
                </CardTitle>
                <p className="text-gray-600 text-sm">Choose from our wide range of supported musical formats</p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.id}
                        className="group p-3 border border-amber-200 rounded-lg hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 ${type.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <Icon className={`w-4 h-4 ${type.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm mb-1">{type.name}</h3>
                            <p className="text-gray-600 text-xs mb-2">{type.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {type.formats.map((format) => (
                                <Badge
                                  key={format}
                                  variant="secondary"
                                  className="text-xs bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 transition-colors px-1.5 py-0"
                                >
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <ContentCreator onContentCreated={handleContentCreated} />
          </TabsContent>

          <TabsContent value="scan" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm p-6 text-center space-y-4">
              <CardTitle className="text-lg flex items-center justify-center">
                <Camera className="w-4 h-4 mr-2" /> Scan/Photo
              </CardTitle>
              <Button onClick={() => handleScanCapture("Scanned content")}>Open Camera</Button>
            </Card>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm p-6 space-y-4 text-center">
              <CardTitle className="text-lg flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" /> From URL
              </CardTitle>
              <div className="flex space-x-2 justify-center">
                <Input id="url" placeholder="https://example.com/file.txt" className="flex-1" />
                <Button onClick={() => handleUrlImport("Imported text")}>Import</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <BatchImport onComplete={handleBatchImportComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
