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
    const j = num % 10,
          k = num % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
  };

  const handleDelete = () => {
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteContent(content.id);
      await clearContentCache();
      setDeleteDialog(false);
      onBack();
      toast.success("Content deleted successfully");
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className={`hover:bg-amber-50 ${
                isFavorite ? "text-yellow-500" : "text-gray-400"
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEnterPerformance(content)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Performance
            </Button>

            {onEdit && (
              null
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-amber-50">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
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
        <div className="bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:bg-gray-700"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>

              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-white" />
                <Slider
                  defaultValue={[50]}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  className="text-white hover:bg-gray-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-white text-sm">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="text-white hover:bg-gray-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
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

      {/* Main Content Area - Unified Layout */}
      <div className="flex-1 p-6">
        <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
          {/* Main Content Section */}
          <div className="flex-1">
            <Card className="shadow-xl border border-amber-200 overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="bg-white p-8 min-h-[calc(100vh-250px)] relative"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                  }}
                >
                  {/* Content Based on Type */}
                  <div className="space-y-6">
                    {/* Guitar Tab Content */}
                    {content.content_type === "Guitar Tab" && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Tablature</h3>
                        {content.content_data?.tablature ? (
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
                        ) : (
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
                                    alt="Sheet music"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                  />
                                )
                              }
                              return null
                            })()}
                          </div>
                        ) : (
                          content.content_data?.notation ? (
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
                          )
                        )}
                      </div>
                    )}

                    {/* Lyrics Content */}
                    {content.content_type === "Lyrics" && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Lyrics</h3>

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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Metadata and Notes */}
          <div className="w-full md:w-80 space-y-4">
            {/* Song Details */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Song Details
                </h3>
                <div className="space-y-4">
                  {/* 1. Album - Prominent First */}
                  {content.album && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block">
                        Album
                      </label>
                      <p className="text-sm font-medium text-blue-800 mt-0">{content.album}</p>
                    </div>
                  )}

                  {/* 2. Line 1: Difficulty | Genre */}
                  {(content.difficulty || content.genre) && (
                    <div className="grid grid-cols-2 gap-4">
                      {content.difficulty && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block">
                            Difficulty
                          </label>
                          <p className="text-sm font-medium text-blue-800 mt-0">{content.difficulty}</p>
                        </div>
                      )}
                      {content.genre && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block">
                            Genre
                          </label>
                          <p className="text-sm font-medium text-blue-800 mt-0">{content.genre}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Line 2: Key | Time Signature | Tempo */}
                  {(content.key || content.time_signature || content.bpm) && (
                    <div className="grid grid-cols-3 gap-4">
                      {content.key && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block">
                            Key
                          </label>
                          <p className="text-sm font-medium text-blue-800 mt-0">
                            {content.key}
                          </p>
                        </div>
                      )}
                      {content.time_signature && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block">
                            Time Signature
                          </label>
                          <p className="text-sm font-medium text-blue-800 mt-0">
                            {content.time_signature}
                          </p>
                        </div>
                      )}
                      {content.bpm && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block">
                            Tempo
                          </label>
                          <p className="text-sm font-medium text-blue-800 mt-0">
                            {content.bpm} BPM
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {content.tags && content.tags.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {content.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Created/Modified dates - small and muted */}
                  <div className="pt-2 mt-4 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Created {new Date(content.created_at).toLocaleDateString()}</span>
                      <span>Modified {new Date(content.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Notes */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-green-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Performance Notes
                </h3>
                {content.notes ? (
                  <div className="text-center py-6 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-lg">
                    <p className="p-2 text-green-800 text-sm text-left">
                    {content.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-lg">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      No performance notes available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click Edit to add notes and performance tips
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
