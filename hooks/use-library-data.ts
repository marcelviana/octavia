"use client"
import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { getUserContentPage } from '@/lib/content-service'
import { saveContent, getCachedContent } from '@/lib/offline-cache'
import { useSearchParams } from 'next/navigation'

interface Options {
  user: any | null
  ready: boolean
  initialContent: any[]
  initialTotal: number
  initialPage: number
  initialPageSize: number
  initialSearch?: string
}

export interface Filters {
  contentType: string[]
  difficulty: string[]
  key: string[]
  favorite: boolean
}

export interface UseLibraryDataResult {
  content: any[]
  totalCount: number
  page: number
  setPage: Dispatch<SetStateAction<number>>
  pageSize: number
  setPageSize: Dispatch<SetStateAction<number>>
  searchQuery: string
  setSearchQuery: (v: string) => void
  sortBy: 'recent' | 'title' | 'artist'
  setSortBy: (v: 'recent' | 'title' | 'artist') => void
  selectedFilters: Filters
  setSelectedFilters: Dispatch<SetStateAction<Filters>>
  loading: boolean
  reload: () => Promise<void>
}

export function useLibraryData(options: Options): UseLibraryDataResult {
  const {
    user,
    ready,
    initialContent,
    initialTotal,
    initialPage,
    initialPageSize,
    initialSearch = ''
  } = options
  
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  
  // Sync search query with URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch !== searchQuery) {
      console.log('🔍 useLibraryData: Syncing search from URL', { urlSearch, currentSearch: searchQuery })
      setSearchQuery(urlSearch)
    }
  }, [searchParams, searchQuery])
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist'>('recent')

  const [content, setContent] = useState<any[]>(initialContent)
  const [totalCount, setTotalCount] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    contentType: [],
    difficulty: [],
    key: [],
    favorite: false,
  })
  const [loading, setLoading] = useState(false)
  const inProgressRef = useRef(false)
  const lastFocusTimeRef = useRef(Date.now())
  
  // Track whether we've moved away from the initial state
  const hasNavigatedAwayRef = useRef(false)

  // Debug logging for state initialization
  useEffect(() => {
    console.log('🔍 useLibraryData: State initialized', {
      initialContentLength: initialContent.length,
      contentLength: content.length,
      initialTotal,
      totalCount,
      ready,
      hasUser: !!user,
      userUid: user?.uid
    });
  }, []) // Only run once on mount

  // Debug logging for content state changes
  useEffect(() => {
    console.log('🔍 useLibraryData: Content state changed', {
      contentLength: content.length,
      totalCount,
      loading,
      firstItem: content[0]?.title || 'N/A'
    });
  }, [content, totalCount, loading])

  const load = useCallback(async (forceRefresh = false) => {
    if (!user || inProgressRef.current) {
      console.log('🔍 useLibraryData.load: Skipping load', { 
        hasUser: !!user, 
        userUid: user?.uid,
        inProgress: inProgressRef.current 
      })
      return
    }
    inProgressRef.current = true
    try {
      setLoading(true)
      
      // Ensure we have a valid user with proper authentication
      const userForQuery = user && user.uid ? { id: user.uid, email: user.email } : null
      if (!userForQuery) {
        console.warn('🔍 useLibraryData.load: No valid user found for content query')
        return
      }
      
      console.log('🔍 useLibraryData.load: Starting query', {
        userId: userForQuery.id,
        userEmail: userForQuery.email,
        forceRefresh,
        page,
        pageSize
      })
      
      const result = await getUserContentPage({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        filters: selectedFilters,
        useCache: !forceRefresh,
      }, undefined, userForQuery)

      console.log('🔍 useLibraryData.load: Query completed', {
        dataLength: result.data?.length || 0,
        total: result.total,
        requestedPage: page,
        returnedPage: result.page,
        totalPages: result.totalPages,
        hasData: !!(result.data && result.data.length > 0)
      })

      // Handle different scenarios for empty results
      if (result.data.length === 0) {
        if (result.total === 0) {
          // No data at all - this is fine, just show empty state
          console.log('🔍 useLibraryData.load: No data in database, showing empty state')
          setContent([])
          setTotalCount(0)
          // Reset to page 1 if we're on a higher page with no data
          if (page > 1) {
            setPage(1)
          }
          return
        } else if (result.total > 0 && page > result.totalPages) {
          // Requested page beyond available pages
          console.log('🔍 useLibraryData.load: Requested page out of bounds, adjusting to last page')
          const lastPage = Math.max(1, result.totalPages)
          setPage(lastPage)
          return
        } else if (result.total > 0 && page > 1) {
          // Has data but current page is empty (shouldn't happen with proper pagination)
          console.log('🔍 useLibraryData.load: Empty data but total > 0, adjusting to page 1')
          setPage(1)
          return
        }
      }

      console.log('🔍 useLibraryData.load: About to set content', {
        dataIsArray: Array.isArray(result.data),
        dataLength: result.data?.length || 0,
        dataFirstItem: result.data?.[0]?.title || 'N/A',
        willSetEmptyArray: !(result.data && result.data.length > 0)
      })

      setContent(result.data || [])
      setTotalCount(result.total || 0)
      
      console.log('🔍 useLibraryData.load: Content set successfully')
      
      if (result.data && result.data.length > 0) {
        try { await saveContent(result.data) } catch {}
      }
    } catch (err) {
      console.error('🔍 useLibraryData.load: Error loading library data:', err)
      
      // Check if this is a pagination error (offset out of range)
      if (err && typeof err === 'object' && 'code' in err && err.code === 'PGRST103') {
        console.log('🔍 useLibraryData.load: Pagination offset error, resetting to page 1')
        setPage(1)
        return
      }
      
      // Only fall back to cached content if this is not just a refresh
      // and we don't already have content displayed
      if (!forceRefresh || content.length === 0) {
        try {
          const cached = await getCachedContent()
          console.log('🔍 useLibraryData.load: Using cached content', { cachedLength: cached.length })
          setContent(cached)
          setTotalCount(cached.length)
        } catch {
          // Only clear content if we have no fallback and no existing content
          if (content.length === 0) {
            console.log('🔍 useLibraryData.load: Clearing content due to no fallback')
            setContent([])
            setTotalCount(0)
          }
        }
      }
      // If this is a refresh and we already have content, keep the existing content
      // and just log the error instead of clearing everything
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user, page, pageSize, debouncedSearch, sortBy, selectedFilters, content.length])

  useEffect(() => {
    if (ready) {
      // Only load if we don't have initial content or if we need to refresh
      // This prevents overriding server-rendered content with empty results
      if (initialContent.length === 0) {
        console.log('🔍 useLibraryData: No initial content, loading from API...')
        // Add a small delay to ensure Firebase Auth is fully initialized
        const timeoutId = setTimeout(() => {
          load()
        }, 100)
        
        return () => clearTimeout(timeoutId)
      } else {
        console.log('🔍 useLibraryData: Initial content available, skipping initial load')
      }
    }
  }, [ready, load, initialContent.length])

  // Reset page to 1 when search or filters change
  useEffect(() => {
    if (ready && hasNavigatedAwayRef.current) {
      setPage(1)
    }
  }, [ready, debouncedSearch, selectedFilters, sortBy])

  // Effect to reload data when pagination, search, or filters change
  useEffect(() => {
    if (ready && user && user.uid) {
      // Check if current state matches initial state
      const isInitialState = page === initialPage && 
                            debouncedSearch === initialSearch && 
                            selectedFilters.contentType.length === 0 &&
                            selectedFilters.difficulty.length === 0 &&
                            selectedFilters.key.length === 0 &&
                            !selectedFilters.favorite &&
                            sortBy === 'recent'
      
      // If we're not in initial state, mark that we've navigated away
      if (!isInitialState) {
        hasNavigatedAwayRef.current = true
      }
      
      // Only skip reload if we have initial content, we're in initial state, 
      // AND we haven't navigated away yet
      if (initialContent.length > 0 && isInitialState && !hasNavigatedAwayRef.current) {
        console.log('🔍 useLibraryData: Skipping reload for initial state with initial content')
        return
      }
      
      console.log('🔍 useLibraryData: Reloading due to parameter change', {
        page,
        pageSize,
        debouncedSearch,
        sortBy,
        selectedFilters,
        hasNavigatedAway: hasNavigatedAwayRef.current,
        isInitialState,
        hasInitialContent: initialContent.length > 0
      })
      load()
    }
  }, [ready, user, page, pageSize, debouncedSearch, sortBy, selectedFilters, load, initialPage, initialSearch, initialContent.length])

  // Add window focus listener to refresh data when user returns to the tab
  useEffect(() => {
    const handleWindowFocus = () => {
      const now = Date.now()
      // Only refresh if it's been more than 30 seconds since last focus
      // and we have a valid user - this prevents excessive refreshing
      if (ready && user && user.uid && (now - lastFocusTimeRef.current) > 30000) {
        console.log('Window focused after 30+ seconds, refreshing library data...')
        load(true) // Force refresh to bypass cache
      }
      lastFocusTimeRef.current = now
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleWindowFocus()
      }
    }

    // Only add listeners if we have a valid user
    if (user && user.uid) {
      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ready, user, load])

  return {
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
    reload: () => load(true), // Force refresh to bypass cache
  }
}
