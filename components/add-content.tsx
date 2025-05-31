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
} from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { ContentCreator } from "@/components/content-creator"
import { MetadataForm } from "@/components/metadata-form"

interface AddContentProps {
  onBack: () => void
  onContentAdded: () => void
}

export function AddContent({ onBack, onContentAdded }: AddContentProps) {
  const [activeTab, setActiveTab] = useState("import")
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [createdContent, setCreatedContent] = useState<any>(null)

  const contentTypes = [
    {
      id: "sheet-music",
      name: "Sheet Music",
      icon: Music,
      description: "Traditional musical notation",
      formats: ["PDF", "PNG", "JPG", "MusicXML"],
    },
    {
      id: "guitar-tab",
      name: "Guitar Tablature",
      icon: Guitar,
      description: "Guitar tabs and fingering charts",
      formats: ["GP5", "GPX", "TXT", "PDF"],
    },
    {
      id: "chord-chart",
      name: "Chord Chart",
      icon: FileText,
      description: "Chord progressions and lyrics",
      formats: ["TXT", "PDF", "ChordPro"],
    },
    {
      id: "lyrics",
      name: "Lyrics Only",
      icon: Mic,
      description: "Song lyrics without chords",
      formats: ["TXT", "PDF", "DOC"],
    },
    {
      id: "piano-score",
      name: "Piano Score",
      icon: Piano,
      description: "Piano sheet music and arrangements",
      formats: ["PDF", "MusicXML", "MIDI"],
    },
    {
      id: "drum-notation",
      name: "Drum Notation",
      icon: Drum,
      description: "Drum patterns and notation",
      formats: ["PDF", "GP5", "MIDI"],
    },
  ]

  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(files)
    setCurrentStep(2)
  }

  const handleContentCreated = (content: any) => {
    setCreatedContent(content)
    setCurrentStep(2)
  }

  const handleMetadataComplete = async (metadata: any) => {
    setIsProcessing(true)
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setCurrentStep(3)
  }

  const handleFinish = () => {
    onContentAdded()
  }

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: "Add Content", active: currentStep >= 1 },
      { number: 2, title: "Add Details", active: currentStep >= 2 },
      { number: 3, title: "Complete", active: currentStep >= 3 },
    ]

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
            </div>
            <span className={`ml-2 text-sm ${step.active ? "text-gray-900" : "text-gray-500"}`}>{step.title}</span>
            {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>
    )
  }

  if (currentStep === 3) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Added Successfully!</h1>
            <p className="text-gray-600">
              Your {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : "content"} have been added to your
              library.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Add More Content
            </Button>
            <Button onClick={handleFinish}>Go to Library</Button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Add Content Details</h1>
        </div>

        {renderStepIndicator()}

        {isProcessing ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Music className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium">Processing Content...</h3>
                <p className="text-gray-600">We're analyzing and organizing your content.</p>
                <Progress value={75} className="w-full max-w-xs mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <MetadataForm
            files={uploadedFiles}
            createdContent={createdContent}
            onComplete={handleMetadataComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 ml-4">Add Content</h1>
      </div>

      {renderStepIndicator()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">Import Files</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="scan">Scan/Photo</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Music Files</CardTitle>
              <p className="text-gray-600">Upload your existing sheet music, tablatures, and other musical content</p>
            </CardHeader>
            <CardContent>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Content Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <div key={type.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {type.formats.map((format) => (
                              <Badge key={format} variant="secondary" className="text-xs">
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

        <TabsContent value="create" className="space-y-6">
          <ContentCreator onContentCreated={handleContentCreated} />
        </TabsContent>

        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Physical Sheet Music</CardTitle>
              <p className="text-gray-600">Use your device camera to capture physical sheet music</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Scan</h3>
                <p className="text-gray-600 mb-4">Position your sheet music in good lighting for best results</p>
                <Button>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Scanning Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Ensure good lighting</li>
                      <li>• Keep the page flat</li>
                      <li>• Fill the frame with the music</li>
                      <li>• Avoid shadows and glare</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Auto-Processing</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Automatic crop and straighten</li>
                      <li>• Text recognition (OCR)</li>
                      <li>• Chord detection</li>
                      <li>• Multi-page support</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import from URL</CardTitle>
              <p className="text-gray-600">Import content from web links or online music libraries</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">Content URL</Label>
                <div className="flex space-x-2 mt-2">
                  <Input id="url" placeholder="https://example.com/sheet-music.pdf" className="flex-1" />
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Supported Sources</h4>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      <li>• Direct PDF/image links</li>
                      <li>• IMSLP (Petrucci Music Library)</li>
                      <li>• MuseScore public scores</li>
                      <li>• Ultimate Guitar tabs</li>
                      <li>• Songsterr tablatures</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recent Imports</h4>
                <div className="space-y-2">
                  {[
                    { title: "Moonlight Sonata", source: "IMSLP", status: "completed" },
                    { title: "Stairway to Heaven Tab", source: "Ultimate Guitar", status: "processing" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.source}</p>
                      </div>
                      <Badge variant={item.status === "completed" ? "default" : "secondary"}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
