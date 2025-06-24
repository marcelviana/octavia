"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  saveContent,
  getCachedContent,
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
  MoreVertical,
  Star,
  Edit,
  Trash2,
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
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<"recent" | "title" | "artist">("recent");

  const [content, setContent] = useState<any[]>(initialContent);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({
    contentType: [],
    difficulty: [],
    key: [],
    favorite: false,
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<any>(null);
  const totalPages = Math.ceil(totalCount / pageSize);
  const initialLoadRef = useRef(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const fetchInProgressRef = useRef(false)
  const hasNavigatedRef = useRef(false) // Track if user has navigated away from initial state

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }
    
    // Check if we're still on the initial state (same page, pageSize, search, and default filters/sort)
    const isInitialState = (
      page === initialPage && 
      pageSize === initialPageSize && 
      debouncedSearch === (initialSearch || "") &&
      sortBy === "recent" &&
      selectedFilters.contentType.length === 0 &&
      selectedFilters.difficulty.length === 0 &&
      selectedFilters.key.length === 0 &&
      selectedFilters.favorite === false
    )
    
    // Mark that user has navigated if they're not in initial state
    if (!isInitialState) {
      hasNavigatedRef.current = true
    }
    
    // Only skip fetch if we're in initial state AND user has never navigated away AND we have content
    if (isInitialState && !hasNavigatedRef.current && content.length > 0) {
      console.log('📋 Skipping fetch - using initial server data')
      return
    }
    
    let cancelled = false
    let fetchTimeoutId: NodeJS.Timeout | null = null

    async function fetchData() {
      // Prevent concurrent fetches
      if (fetchInProgressRef.current) {
        console.log('Fetch already in progress, skipping...')
        return
      }
      
      // Wait for Firebase authentication to be ready
      if (authLoading) {
        console.log('Waiting for Firebase auth to be ready...')
        return
      }
      
      if (!user) {
        console.log('No authenticated user, skipping fetch')
        setContent([])
        setTotalCount(0)
        return
      }
      
      try {
        fetchInProgressRef.current = true
        setLoading(true)
        console.log('Fetching content with filters:', selectedFilters, 'for user:', user.email)
        
        // Add timeout wrapper to prevent infinite loading
        const controller = new AbortController()
        fetchTimeoutId = setTimeout(() => {
          controller.abort()
        }, 10000) // 10 second timeout
        
        // Pass Firebase user information to the content service
        const result = await getUserContentPage({
          page,
          pageSize,
          search: debouncedSearch,
          sortBy,
          filters: selectedFilters,
        }, undefined, { id: user.uid, email: user.email }, controller.signal)
        
        if (fetchTimeoutId) {
          clearTimeout(fetchTimeoutId)
          fetchTimeoutId = null
        }

        if (!cancelled) {
          if (result.error) {
            console.error('Content loading error:', result.error)
            // Still show the content but with a warning
            setContent(result.data || [])
            setTotalCount(result.total || 0)
          } else {
            console.log('✅ Content loaded successfully:', result.data?.length, 'items')
            setContent(result.data || [])
            setTotalCount(result.total || 0)
            try {
              if (result.data && result.data.length > 0) {
                await saveContent(result.data)
              }
            } catch (err) {
              console.error('Failed to cache offline content', err)
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          const isAbortError = error instanceof Error && error.name === 'AbortError'
          const isTimeoutError = error instanceof Error && error.message.includes('timeout')
          
          if (isAbortError || isTimeoutError) {
            console.warn('Content fetch timed out, loading cached content')
          } else {
            console.error('Failed to load content:', error)
          }
          
          // Load cached content as fallback
          try {
            const cachedContent = await getCachedContent()
            if (cachedContent && cachedContent.length > 0) {
              console.log('Loading cached content as fallback:', cachedContent.length, 'items')
              setContent(cachedContent)
              setTotalCount(cachedContent.length)
              if (isAbortError || isTimeoutError) {
                toast.info('Loading cached content due to slow connection')
              }
            } else {
              setContent([])
              setTotalCount(0)
              if (isAbortError || isTimeoutError) {
                toast.warning('Request timed out and no cached content available')
              }
            }
          } catch (cacheError) {
            console.error('Failed to load cached content:', cacheError)
            setContent([])
            setTotalCount(0)
          }
        }
      } finally {
        fetchInProgressRef.current = false
        if (!cancelled) {
          console.log('🏁 Setting loading to false')
          setLoading(false)
        }
      }
    }

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchData, 100)

    return () => {
      cancelled = true
      fetchInProgressRef.current = false
      clearTimeout(timeoutId)
      if (fetchTimeoutId) {
        clearTimeout(fetchTimeoutId)
      }
    }
  // We intentionally exclude `content.length` to avoid unnecessary refetches when content changes locally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortBy, selectedFilters, page, pageSize, refreshTrigger, initialPage, initialPageSize, initialSearch, user, authLoading])

  // Add focus listener to refresh data when returning to the library with improved throttling
  useEffect(() => {
    let lastRefresh = 0
    const REFRESH_COOLDOWN = 10000 // Increased from 5 seconds to 10 seconds between refreshes
    let refreshTimeout: NodeJS.Timeout | null = null

    const handleFocus = () => {
      const now = Date.now()
      // Only refresh if we're not on the initial load, not currently loading, no fetch in progress, and enough time has passed
      if (!initialLoadRef.current && !loading && !fetchInProgressRef.current && (now - lastRefresh) > REFRESH_COOLDOWN) {
        // Clear any existing timeout
        if (refreshTimeout) {
          clearTimeout(refreshTimeout)
        }
        
        // Add a small delay to prevent rapid successive calls
        refreshTimeout = setTimeout(() => {
          lastRefresh = now
          console.log('🔄 Library: Refreshing data after focus event', { loading, fetchInProgress: fetchInProgressRef.current })
          setRefreshTrigger(prev => prev + 1)
          refreshTimeout = null
        }, 500) // 500ms delay
      }
    }

    const handleVisibilityChange = () => {
      const now = Date.now()
      if (!document.hidden && !initialLoadRef.current && !loading && !fetchInProgressRef.current && (now - lastRefresh) > REFRESH_COOLDOWN) {
        // Clear any existing timeout
        if (refreshTimeout) {
          clearTimeout(refreshTimeout)
        }
        
        // Add a small delay to prevent rapid successive calls
        refreshTimeout = setTimeout(() => {
          lastRefresh = now
          console.log('🔄 Library: Refreshing data after visibility change', { loading, fetchInProgress: fetchInProgressRef.current })
          setRefreshTrigger(prev => prev + 1)
          refreshTimeout = null
        }, 1000) // 1 second delay for visibility change
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [loading])

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
    if (!contentToDelete || !user) return;

    try {
      await deleteContent(contentToDelete.id);
      try {
        await removeCachedContent(contentToDelete.id)
      } catch (err) {
        console.error('Failed to remove cached content', err)
      }
      const controller = new AbortController()
      const { data, total } = await getUserContentPage({
        page,
        pageSize,
        search: searchQuery,
        sortBy,
        filters: selectedFilters,
      }, undefined, { id: user.uid, email: user.email }, controller.signal);
      setContent(data);
      setTotalCount(total);
      try {
        await saveContent(data)
      } catch (err) {
        console.error('Failed to cache offline content', err)
      }
      setDeleteDialog(false);
      setContentToDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };

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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading your music library...
            </h3>
            <p className="text-[#A69B8E]">
              Please wait while we fetch your content
            </p>
          </CardContent>
        </Card>
      ) : content.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No content found
            </h3>
            <p className="text-[#A69B8E] mb-4">
              {searchQuery ||
              Object.values(selectedFilters).some((v) =>
                Array.isArray(v) ? v.length > 0 : v,
              )
                ? "Try adjusting your search or filters"
                : "Add your first piece of music content to get started"}
            </p>
            <Button
              onClick={handleAddContent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {loading && content.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-t-amber-600 border-amber-200 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-700">Refreshing...</span>
              </div>
            </div>
          )}
          <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-amber-50 transition-colors flex items-center"
                >
                  <div className="mr-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border-gray-200 border"
                    >
                      {getContentIcon(item.content_type)}
                    </div>
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectContent(item)}
                  >
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center text-sm text-[#A69B8E]">
                      <span className="truncate">
                        {item.artist || "Unknown Artist"}
                      </span>
                      {item.album && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{item.album}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {item.key && (
                      <Badge variant="outline" className="bg-white">
                        {item.key}
                      </Badge>
                    )}
                    {item.difficulty && (
                      <Badge
                        className={
                          item.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : item.difficulty === "Intermediate"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {item.difficulty}
                      </Badge>
                    )}
                    {item.is_favorite && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="ml-4 hidden md:flex items-center text-sm text-[#A69B8E]">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(item.created_at)}
                  </div>
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectContent(item)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditContent(item)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadContent(item)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteContent(item)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
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
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contentToDelete?.title}
              &quot;? This action cannot be undone.
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
