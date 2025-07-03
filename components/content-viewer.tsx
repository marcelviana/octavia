"use client";
import { useState, useEffect } from "react";
import { getCachedFileUrl } from "@/lib/offline-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share,
  Edit,
  Star,
  Volume2,
  Settings,
  MoreVertical,
  Trash2,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Music,
  Info,
  MessageSquare,
  Guitar,
  Mic,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteContent, clearContentCache } from "@/lib/content-service";
import { MusicText } from "@/components/music-text";
import Image from "next/image";
import PdfViewer from "@/components/pdf-viewer";
import { ContentType } from "@/types/content";
import { getContentTypeStyle } from "@/lib/content-type-styles";
import { toast } from "sonner";

interface ContentViewerProps {
  content: any;
  onBack: () => void;
  onEnterPerformance: (content: any) => void;
  onEdit?: () => void;
  /**
   * Whether to display the toolbar with playback and zoom controls.
   * Defaults to `true` so existing usages keep the current behaviour.
   */
  showToolbar?: boolean;
}

export function ContentViewer({
  content,
  onBack,
  onEnterPerformance,
  onEdit,
  showToolbar = true,
}: ContentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("content");
  const totalPages = content?.content_data?.pages
    ? content.content_data.pages.length
    : 1;
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(content?.is_favorite || false);
  const [offlineUrl, setOfflineUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    const load = async () => {
      url = await getCachedFileUrl(content.id);
      if (url) setOfflineUrl(url);
    };
    load();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [content.id]);

  const styles = getContentTypeStyle(content.content_type);

  const getHeaderGradient = (type: string) => {
    switch (type) {
      case ContentType.LYRICS:
        return "from-green-500 to-green-600";
      case ContentType.GUITAR_TAB:
        return "from-blue-500 to-blue-600";
      case ContentType.CHORD_CHART:
        return "from-purple-500 to-purple-600";
      case ContentType.SHEET_MUSIC:
        return "from-orange-500 to-orange-600";
      default:
        return "from-amber-500 to-orange-600";
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case ContentType.GUITAR_TAB:
        return <Guitar className="w-4 h-4 text-white" />;
      case ContentType.CHORD_CHART:
        return <Music className="w-4 h-4 text-white" />;
      case ContentType.SHEET_MUSIC:
        return <FileText className="w-4 h-4 text-white" />;
      case ContentType.LYRICS:
        return <Mic className="w-4 h-4 text-white" />;
      default:
        return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const mod10 = num % 10;
    const mod100 = num % 100;
    if (mod10 === 1 && mod100 !== 11) return "st";
    if (mod10 === 2 && mod100 !== 12) return "nd";
    if (mod10 === 3 && mod100 !== 13) return "rd";
    return "th";
  };

  const handleDelete = () => {
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteContent(content.id);
              clearContentCache();
      toast.success(`"${content.title}" has been deleted`);
      setDeleteDialog(false);
      onBack();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content. Please try again.");
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, this would call an API to update the favorite status
  };

  if (!content) return null;

  return (
    <div className="flex flex-col bg-gradient-to-b from-[#fff9f0] to-[#fff5e5]">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-amber-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${getHeaderGradient(
                content.content_type,
              )}`}
            >
              {getContentIcon(content.content_type)}
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl text-gray-900">
                {content.title}
              </h1>
              <p className="text-sm text-gray-500">
                {content.artist} • {content.content_type}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onEnterPerformance(content)}
              size="icon"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg w-10 sm:w-auto sm:px-4 transition-all"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:ml-2 sm:inline">Performance Mode</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={toggleFavorite}>
                  <Star
                    className={`w-4 h-4 mr-2 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`}
                  />
                  {isFavorite ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-gray-800 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-gray-700"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Volume2 className="w-4 h-4" />
                <Slider value={[75]} max={100} step={1} className="w-20" />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm">Zoom:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="text-white hover:bg-gray-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="text-white hover:bg-gray-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="text-white hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="text-white hover:bg-gray-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex flex-row flex-wrap items-center justify-between gap-2">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-amber-200 p-1 rounded-xl shadow-md flex flex-row flex-wrap gap-2 w-full h-auto">
                <TabsTrigger
                  value="content"
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg text-amber-700 hover:bg-amber-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r ${getHeaderGradient(content.content_type)}`}
                >
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg text-amber-700 hover:bg-amber-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r ${getHeaderGradient(content.content_type)}`}
                >
                  <Info className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg text-amber-700 hover:bg-amber-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r ${getHeaderGradient(content.content_type)}`}
                >
                  <MessageSquare className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="mt-6">
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-xl border border-amber-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div
                      className="bg-white p-8 min-h-[calc(100vh-250px)] relative"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top center",
                      }}
                    >
                      {/* Sheet Music Content */}
                      <div className="space-y-6">
                        {/* Technical summary removed to avoid duplication */}

                        {/* Dynamic Content Based on Type */}
                        <div className="space-y-8">
                          {/* Guitar Tab Content */}
                          {content.content_type === "Guitar Tab" && (
                            <div className="space-y-6">
                              {content.content_data?.tablature ? (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Tablature
                                  </h3>
                                  <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                    {content.content_data.tablature.map(
                                      (line: string, index: number) => (
                                        <div
                                          key={index}
                                          className="whitespace-nowrap"
                                        >
                                          {line}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold">
                                    Tablature
                                  </h3>
                                  <div className="font-mono text-sm space-y-1 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                      E|--0----3----0----2----0---------0----3----0----2----0---------|
                                    </div>
                                    <div>
                                      B|----1----1----1----1----1---------1----1----1----1----1-------|
                                    </div>
                                    <div>
                                      G|------0----0----0----0----0---------0----0----0----0----0-----|
                                    </div>
                                    <div>
                                      D|--------2----2----2----2----2---------2----2----2----2----2---|
                                    </div>
                                    <div>
                                      A|--3---------------------------3------------------------------|
                                    </div>
                                    <div>
                                      E|--------------------------------------------------------------|
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Guitar-specific info */}
                              <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
                                <div>
                                  <strong>Capo:</strong>{" "}
                                  {content.capo
                                    ? `${content.capo}${getOrdinalSuffix(Number(content.capo))} fret`
                                    : "None"}
                                </div>
                                <div>
                                  <strong>Tuning:</strong>{" "}
                                  {content.tuning || "Standard (EADGBE)"}
                                </div>
                              </div>

                              {/* Chord progression if available */}
                              {content.content_data?.chords && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold">
                                    Chord Progression
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {content.content_data.chords.map(
                                      (chord: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-3 py-1 bg-gray-200 rounded-md font-mono"
                                        >
                                          {chord}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Chord Chart Content */}
                          {content.content_type === "Chord Chart" && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold">
                                Chord Chart
                              </h3>

                              {/* Chord diagrams */}
                              {content.content_data?.chords ? (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                                  {content.content_data.chords.map(
                                    (chord: any, index: number) => (
                                      <div
                                        key={index}
                                        className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
                                      >
                                        <div className="text-xl font-bold mb-3">
                                          {chord.name || chord}
                                        </div>
                                        {chord.diagram ? (
                                          <div className="text-xs font-mono space-y-1">
                                            {chord.diagram.map(
                                              (
                                                line: string,
                                                lineIndex: number,
                                              ) => (
                                                <div key={lineIndex}>
                                                  {line}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-xs font-mono space-y-1">
                                            <div>●○○○○○</div>
                                            <div>●●●●●●</div>
                                            <div>○●○○●○</div>
                                            <div>○○●●○○</div>
                                          </div>
                                        )}
                                        {chord.fingering && (
                                          <div className="text-xs mt-2 text-gray-600">
                                            {chord.fingering}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                                  {["Am", "F", "C", "G"].map((chord) => (
                                    <div
                                      key={chord}
                                      className="text-center p-4 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow"
                                    >
                                      <div className="text-xl font-bold mb-3">
                                        {chord}
                                      </div>
                                      <div className="text-xs font-mono space-y-1">
                                        <div>●○○○○○</div>
                                        <div>●●●●●●</div>
                                        <div>○●○○●○</div>
                                        <div>○○●●○○</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Song structure */}
                              {content.content_data?.progression && (
                                <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl shadow">
                                  <h4 className="font-semibold">
                                    Song Structure
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {Object.entries(
                                      content.content_data.progression,
                                    ).map(
                                      ([section, chords]: [string, any]) => (
                                        <div key={section} className="flex">
                                          <span className="font-medium w-20">
                                            {section}:
                                          </span>
                                          <span className="font-mono">
                                            {Array.isArray(chords)
                                              ? chords.join(" - ")
                                              : chords}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sheet Music Content */}
                          {content.content_type === ContentType.SHEET_MUSIC && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold">
                                Sheet Music
                              </h3>

                              {offlineUrl || content.file_url ? (
                                <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
                                  {(() => {
                                    const url = (offlineUrl || content.file_url)!.toLowerCase()
                                    const isPdf = url.endsWith(".pdf")
                                    const isImage = url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg")
                                    if (isPdf) {
                                      return (
                                        <PdfViewer
                                          url={(offlineUrl || content.file_url) as string}
                                          fullscreen
                                          className="w-full h-[calc(100vh-250px)]"
                                        />
                                      )
                                    }
                                                        if (isImage) {
                      return (
                        <Image
                          src={(offlineUrl || content.file_url) as string}
                          alt={`Sheet music for ${content.title}`}
                          width={800}
                          height={800}
                          className="w-full h-auto"
                          style={{ maxHeight: "calc(100vh - 250px)", objectFit: "contain" }}
                          sizes="(max-width: 768px) 100vw, 800px"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                      )
                    }
                                    return null
                                  })()}
                                </div>
                              ) : content.content_data?.notation ? (
                                <div className="p-6 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl shadow">
                                  <MusicText
                                    text={content.content_data.notation}
                                    className="text-sm leading-relaxed"
                                  />
                                </div>
                              ) : (
                                <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm">
                                  <p className="text-gray-500">
                                    No sheet music available
                                  </p>
                                  <p className="text-sm text-gray-400 mt-2">
                                    Upload a PDF or image file to display sheet
                                    music
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lyrics Content */}
                          {content.content_type === "Lyrics" && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold">Lyrics</h3>

                              {/* Technical Information */}
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold mb-3">
                                  Technical Information
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Key:</span>
                                    <span className="ml-2 font-mono">
                                      {content.key || "Not specified"}
                                    </span>
                                  </div>
                                  {content.bpm && (
                                    <div>
                                      <span className="text-gray-600">
                                        Tempo:
                                      </span>
                                      <span className="ml-2 font-mono">
                                        {content.bpm} BPM
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-600">Time:</span>
                                    <span className="ml-2 font-mono">
                                      {content.time_signature || "4/4"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Difficulty:
                                    </span>
                                    <span className="ml-2">
                                      {content.difficulty || "Not specified"}
                                    </span>
                                  </div>
                                  {content.genre && (
                                    <div>
                                      <span className="text-gray-600">
                                        Genre:
                                      </span>
                                      <span className="ml-2">
                                        {content.genre}
                                      </span>
                                    </div>
                                  )}
                                  {content.album && (
                                    <div>
                                      <span className="text-gray-600">
                                        Album:
                                      </span>
                                      <span className="ml-2">
                                        {content.album}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {content.content_data?.lyrics ? (
                                <div className="space-y-6">
                                  <MusicText
                                    text={content.content_data.lyrics}
                                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow text-sm leading-relaxed"
                                  />
                                </div>
                              ) : (
                                <div className="p-8 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl text-center">
                                  <p className="text-gray-500">
                                    No lyrics available
                                  </p>
                                  <p className="text-sm text-gray-400 mt-2">
                                    Add lyrics to help with performance
                                  </p>
                                </div>
                              )}

                              {/* Chord progression for lyrics */}
                              {content.content_data?.chords && (
                                <div className="p-4 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl shadow">
                                  <h4 className="font-semibold mb-2">Chords</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {content.content_data.chords.map(
                                      (chord: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-white rounded font-mono text-sm"
                                        >
                                          {chord}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Performance Notes */}
                          {content.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <span className="mr-2">📝</span>
                                Performance Notes
                              </h4>
                              <MusicText
                                text={content.notes}
                                monospace={false}
                                className="text-sm text-gray-700"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">
                      Content Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Title
                          </label>
                          <p className="text-gray-900">{content.title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Artist
                          </label>
                          <p className="text-gray-900">{content.artist}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Album
                          </label>
                          <p className="text-gray-900">
                            {content.album || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Genre
                          </label>
                          <p className="text-gray-900">
                            {content.genre || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Key
                          </label>
                          <p className="text-gray-900">
                            {content.key || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            BPM
                          </label>
                          <p className="text-gray-900">
                            {content.bpm || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Difficulty
                          </label>
                          <p className="text-gray-900">
                            {content.difficulty || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {content.tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          )) || <span className="text-gray-500">No tags</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Created
                          </label>
                          <p className="text-gray-900">
                            {new Date(content.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Last Modified
                          </label>
                          <p className="text-gray-900">
                            {new Date(content.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-green-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">
                      Performance Notes
                    </h3>
                    {content.notes ? (
                      <div className="p-4 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl">
                        <MusicText
                          text={content.notes}
                          monospace={false}
                          className="text-sm text-gray-700"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No performance notes available
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Click Edit to add practice notes and performance tips
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{content.title}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
