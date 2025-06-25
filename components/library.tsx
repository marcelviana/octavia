"use client";

import { useState } from "react";
import { useLibraryData } from "@/hooks/use-library-data";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  saveContent,
  cacheFileForContent,
  removeCachedContent,
} from "@/lib/offline-cache";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Music,
  FileText,
  Guitar,
  Filter,
  Star,
  Edit,
  Download,
  Share,
  Plus,
  Mic,
  Clock,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { getUserContentPage, deleteContent } from "@/lib/content-service";
import { useFirebaseAuth } from "@/contexts/firebase-auth-context";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { LibraryList } from "@/components/library-list";
import { DeleteContentDialog } from "@/components/delete-content-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContentType } from "@/types/content"

interface LibraryProps {
  onSelectContent: (content: any) => void;
  initialContent: any[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSearch?: string;
}

export function Library({
  onSelectContent,
  initialContent,
  initialTotal,
  initialPage,
  initialPageSize,
  initialSearch,
}: LibraryProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<any>(null);

  const {
    content,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedFilters,
    setSelectedFilters,
    loading,
    reload,
  } = useLibraryData({
    user,
    ready: !authLoading,
    initialContent,
    initialTotal,
    initialPage,
    initialPageSize,
    initialSearch,
  })

  const totalPages = Math.ceil(totalCount / pageSize);

  const getContentIcon = (type: string) => {
    switch (type) {
      case ContentType.GUITAR_TAB:
        return <Guitar className="w-5 h-5 text-blue-600" />;
      case ContentType.CHORD_CHART:
        return <Music className="w-5 h-5 text-purple-600" />;
      case ContentType.SHEET_MUSIC:
        return <FileText className="w-5 h-5 text-amber-600" />;
      case ContentType.LYRICS:
        return <Mic className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddContent = () => {
    router.push("/add-content");
  };



  const handleEditContent = (content: any) => {
    router.push(`/content/${content.id}/edit`);
  };

  const handleDeleteContent = async (content: any) => {
    setContentToDelete(content);
    setDeleteDialog(true);
  };

  const handleDownloadContent = async (content: any) => {
    try {
      await cacheFileForContent(content)
      toast.success('Content cached for offline use')
    } catch (err) {
      console.error('Failed to cache content', err)
      const message = err instanceof Error ? err.message : 'Download failed'
      toast.error(message)
    }
  };

  const confirmDelete = async () => {
    if (!contentToDelete || !user) return

    try {
      await deleteContent(contentToDelete.id)
      try {
        await removeCachedContent(contentToDelete.id)
      } catch (err) {
        console.error('Failed to remove cached content', err)
      }

      await reload()

      setDeleteDialog(false)
      setContentToDelete(null)
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  return (
    <div className="p-6 bg-gradient-to-b from-[#fff9f0] to-[#fff5e5] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Your Music Library
          </h1>
          <p className="text-[#A69B8E] mt-1">
            Manage and organize all your musical content
          </p>
        </div>
        <Button
          onClick={handleAddContent}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-amber-200 bg-white hover:bg-amber-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-sm font-medium mb-1">Content Type</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[
                      { display: "Guitar Tab", value: ContentType.GUITAR_TAB },
                      { display: "Chord Chart", value: ContentType.CHORD_CHART },
                      { display: "Sheet Music", value: ContentType.SHEET_MUSIC },
                      { display: "Lyrics", value: ContentType.LYRICS }
                    ].map(
                      (type) => (
                        <Badge
                          key={type.value}
                          variant={
                            selectedFilters.contentType.includes(type.value)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedFilters((prev) => ({
                              ...prev,
                              contentType: prev.contentType.includes(type.value)
                                ? prev.contentType.filter(
                                    (t: string) => t !== type.value,
                                  )
                                : [...prev.contentType, type.value],
                            }));
                          }}
                        >
                          {type.display}
                        </Badge>
                      ),
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1 mt-3">Difficulty</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[
                      { display: "Beginner", value: "Beginner" },
                      { display: "Intermediate", value: "Intermediate" },
                      { display: "Advanced", value: "Advanced" }
                    ].map(
                      (difficulty) => (
                        <Badge
                          key={difficulty.value}
                          variant={
                            selectedFilters.difficulty.includes(difficulty.value)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedFilters((prev) => ({
                              ...prev,
                              difficulty: prev.difficulty.includes(difficulty.value)
                                ? prev.difficulty.filter(
                                    (d: string) => d !== difficulty.value,
                                  )
                                : [...prev.difficulty, difficulty.value],
                            }));
                          }}
                        >
                          {difficulty.display}
                        </Badge>
                      ),
                    )}
                  </div>
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="favorites"
                      checked={selectedFilters.favorite}
                      onChange={() =>
                        setSelectedFilters((prev) => ({
                          ...prev,
                          favorite: !prev.favorite,
                        }))
                      }
                      className="mr-2"
                    />
                    <label htmlFor="favorites" className="text-sm">
                      Favorites only
                    </label>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "recent" | "title" | "artist")
              }
            >
              <SelectTrigger className="w-[180px] border-amber-200 bg-white hover:bg-amber-50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="artist">Artist (A-Z)</SelectItem>
              </SelectContent>
            </Select>


          </div>
        </div>
      </div>

      {/* Content Display */}
      {loading && content.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-t-amber-600 border-amber-200 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your music library...</h3>
            <p className="text-[#A69B8E]">Please wait while we fetch your content</p>
          </CardContent>
        </Card>
      ) : content.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-[#A69B8E] mb-4">
              {searchQuery || Object.values(selectedFilters).some((v) => (Array.isArray(v) ? v.length > 0 : v))
                ? "Try adjusting your search or filters"
                : "Add your first piece of music content to get started"}
            </p>
            <Button onClick={handleAddContent} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LibraryList
          content={content}
          loading={loading}
          onSelect={onSelectContent}
          onEdit={handleEditContent}
          onDownload={handleDownloadContent}
          onDelete={handleDeleteContent}
          getContentIcon={getContentIcon}
          formatDate={formatDate}
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[100px] border-amber-200 bg-white hover:bg-amber-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <Pagination className="ml-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={cn(page === 1 && "pointer-events-none opacity-50")}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                className={cn(page === totalPages && "pointer-events-none opacity-50")}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteContentDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        content={contentToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
