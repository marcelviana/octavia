"use client";

import { useState, useEffect } from "react";
import { useLibraryData } from "@/hooks/use-library-data";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  saveContent,
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
  Music,
  FileText,
  Guitar,
  Filter,
  Star,
  Edit,
  Plus,
  Mic,
  Clock,
  ArrowUpDown,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import {
  getUserContentPage,
  deleteContent,
  clearContentCache,
  toggleFavorite,
} from "@/lib/content-service";
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
import { ContentType } from "@/types/content";

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

  // Track auth state, but avoid verbose logging in production
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Library: Auth state changed", {
        user: user
          ? {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
            }
          : null,
        isLoading: authLoading,
      });
    }
  }, [user, authLoading]);

  // Log initial props only during development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Library: Component mounted with props", {
        initialContentLength: initialContent.length,
        initialTotal,
        initialPage,
        initialPageSize,
        initialSearch,
        firstItem: initialContent[0]?.title || "N/A",
      });
    }
  }, [
    initialContent,
    initialTotal,
    initialPage,
    initialPageSize,
    initialSearch,
  ]);

  const {
    content,
    totalCount,
    page,
    setPage,
    pageSize,
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
    initialPageSize: 20, // Fixed page size
    initialSearch,
  });

  // Log content state updates during development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Library: Content state changed", {
        contentLength: content.length,
        totalCount,
        loading,
        hasInitialContent: initialContent.length,
        firstItem: content[0]?.title || "N/A",
      });
    }
  }, [content, totalCount, loading, initialContent.length]);

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

  const confirmDelete = async () => {
    if (!contentToDelete || !user) return;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Delete operation starting:", {
        contentId: contentToDelete.id,
        contentTitle: contentToDelete.title,
        userEmail: user.email,
      });
      
      // Debug auth configuration
      try {
        const { debugAuthConfig } = await import("@/lib/auth-manager");
        await debugAuthConfig();
      } catch (err) {
        console.warn("Failed to debug auth config:", err);
      }
    }

    try {
      await deleteContent(contentToDelete.id);
      try {
        await removeCachedContent(contentToDelete.id);
      } catch (err) {
        console.error("Failed to remove cached content", err);
      }

      // Clear the content cache to ensure fresh data on reload
      clearContentCache();

      toast.success(`"${contentToDelete.title}" has been deleted`);
      
      // Try to reload the content, but don't fail if it doesn't work
      try {
        await reload();
      } catch (reloadError) {
        console.warn("Failed to reload content after delete:", reloadError);
        // Still close the dialog even if reload fails
      }

      setDeleteDialog(false);
      setContentToDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("Authentication") || error.message.includes("not configured")) {
          toast.error("Authentication error. Please try logging out and back in.");
        } else if (error.message.includes("not found")) {
          toast.error("Content not found. It may have already been deleted.");
          // Still close the dialog and try to reload
          setDeleteDialog(false);
          setContentToDelete(null);
          try {
            await reload();
          } catch (reloadError) {
            console.warn("Failed to reload after delete error:", reloadError);
          }
        } else {
          toast.error(`Failed to delete content: ${error.message}`);
        }
      } else {
        toast.error("Failed to delete content. Please try again.");
      }
    }
  };

  const handleToggleFavorite = async (contentItem: any) => {
    if (!user) return;

    const newFavoriteStatus = !contentItem.is_favorite;
    
    try {
      // Call the API to update the backend first
      await toggleFavorite(contentItem.id, newFavoriteStatus);
      
      // Show success message
      toast.success(
        newFavoriteStatus 
          ? `"${contentItem.title}" added to favorites` 
          : `"${contentItem.title}" removed from favorites`
      );
      
      // Force reload to ensure UI is immediately updated with fresh data
      await reload();
      
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-4 md:p-6 bg-gradient-to-b from-[#fff9f0] to-[#fff5e5] min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:gap-2 md:gap-4 mb-2 sm:mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[60px]">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Your Music Library
            </h1>
            <p className="text-[#A69B8E] mt-0 sm:mt-0.5 md:mt-1 text-xs sm:text-sm md:text-base">
              Manage and organize all your musical content
            </p>
          </div>
          <div className="flex gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
            {/* Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-amber-200 bg-white hover:bg-amber-50 text-xs sm:text-sm flex-shrink-0 h-7 sm:h-8 md:h-9 px-1.5 sm:px-2 md:px-3"
                  size="sm"
                >
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline ml-1 sm:ml-2">Filters</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
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
                      {
                        display: "Chord Chart",
                        value: ContentType.CHORD_CHART,
                      },
                      {
                        display: "Sheet Music",
                        value: ContentType.SHEET_MUSIC,
                      },
                      { display: "Lyrics", value: ContentType.LYRICS },
                    ].map((type) => (
                      <Badge
                        key={type.value}
                        variant={
                          selectedFilters.contentType.includes(type.value)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer text-xs"
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
                    ))}
                  </div>
                  <p className="text-sm font-medium mb-1 mt-3">Difficulty</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[
                      { display: "Beginner", value: "Beginner" },
                      { display: "Intermediate", value: "Intermediate" },
                      { display: "Advanced", value: "Advanced" },
                    ].map((difficulty) => (
                      <Badge
                        key={difficulty.value}
                        variant={
                          selectedFilters.difficulty.includes(difficulty.value)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setSelectedFilters((prev) => ({
                            ...prev,
                            difficulty: prev.difficulty.includes(
                              difficulty.value,
                            )
                              ? prev.difficulty.filter(
                                  (d: string) => d !== difficulty.value,
                                )
                              : [...prev.difficulty, difficulty.value],
                          }));
                        }}
                      >
                        {difficulty.display}
                      </Badge>
                    ))}
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

            {/* Sort Button */}
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "recent" | "title" | "artist")
              }
            >
              <SelectTrigger className="w-9 sm:w-10 md:w-[120px] border-amber-200 bg-white hover:bg-amber-50 text-xs sm:text-sm flex-shrink-0 h-7 sm:h-8 md:h-9 justify-center md:justify-start px-1.5 sm:px-2 md:px-3">
                <div className="flex items-center">
                  <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline md:ml-2">Sort</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="artist">Artist (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Content Button */}
            <Button
              onClick={handleAddContent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm h-7 sm:h-8 md:h-9 px-1.5 sm:px-2 md:px-3"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Content</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {loading && content.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-4 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-t-amber-600 border-amber-200 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              Loading your music library...
            </h3>
            <p className="text-[#A69B8E] text-sm">
              Please wait while we fetch your content
            </p>
          </CardContent>
        </Card>
      ) : content.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-4 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              No content found
            </h3>
            <p className="text-[#A69B8E] mb-3 sm:mb-4 text-sm">
              {searchQuery ||
              Object.values(selectedFilters).some((v) =>
                Array.isArray(v) ? v.length > 0 : v,
              )
                ? "Try adjusting your search or filters"
                : "Add your first piece of music content to get started"}
            </p>
            <Button
              onClick={handleAddContent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm"
              size="sm"
            >
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
          onDelete={handleDeleteContent}
          onToggleFavorite={handleToggleFavorite}
          getContentIcon={getContentIcon}
          formatDate={formatDate}
        />
      )}

      {/* Pagination Controls - Only show when there's data */}
      {totalCount > 0 && totalPages > 1 && (
        <div className="mt-3 sm:mt-6 mb-4 flex justify-center">
          <Pagination>
            <PaginationContent className="flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationPrevious
                  className={cn(
                    page === 1 && "pointer-events-none opacity-50",
                    "text-xs sm:text-sm h-8 px-2 sm:h-9 sm:px-3",
                  )}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Show first, last, and current page with 2 pages around current
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => setPage(pageNum)}
                      className="text-xs sm:text-sm h-8 w-8 sm:h-9 sm:w-9"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  className={cn(
                    page === totalPages && "pointer-events-none opacity-50",
                    "text-xs sm:text-sm h-8 px-2 sm:h-9 sm:px-3",
                  )}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
