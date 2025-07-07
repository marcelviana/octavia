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
  // Track if we need to refresh on the next load (e.g., after returning from navigation)
  const needsRefreshRef = useRef(false)

  const load = useCallback(async (forceRefresh = false) => {
    if (!user || inProgressRef.current) {
      return
    }
    inProgressRef.current = true
    try {
      setLoading(true)
      
      // Ensure we have a valid user with proper authentication
      const userForQuery = user && user.uid ? { id: user.uid, email: user.email } : null
      if (!userForQuery) {
        console.warn('useLibraryData.load: No valid user found for content query')
        return
      }
      
      const result = await getUserContentPage({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        filters: selectedFilters,
        useCache: !forceRefresh,
      }, undefined, userForQuery)

      // Handle different scenarios for empty results
      if (result.data.length === 0) {
        if (result.total === 0) {
          // No data at all - this is fine, just show empty state
          setContent([])
          setTotalCount(0)
          // Reset to page 1 if we're on a higher page with no data
          if (page > 1) {
            setPage(1)
          }
          return
        } else if (result.total > 0 && page > result.totalPages) {
          // Requested page beyond available pages
          const lastPage = Math.max(1, result.totalPages)
          setPage(lastPage)
          return
        } else if (result.total > 0 && page > 1) {
          // Has data but current page is empty (shouldn't happen with proper pagination)
          setPage(1)
          return
        }
      }

      setContent(result.data || [])
      setTotalCount(result.total || 0)
      
      if (result.data && result.data.length > 0) {
        try { await saveContent(result.data) } catch {}
      }
    } catch (err) {
      console.error('useLibraryData.load: Error loading library data:', err)
      
      // Check if this is a pagination error (offset out of range)
      if (err && typeof err === 'object' && 'code' in err && err.code === 'PGRST103') {
        setPage(1)
        return
      }
      
      // Only fall back to cached content if this is not just a refresh
      // and we don't already have content displayed
      if (!forceRefresh || content.length === 0) {
        try {
          const cached = await getCachedContent()
          setContent(cached)
          setTotalCount(cached.length)
        } catch {
          // Only clear content if we have no fallback and no existing content
          if (content.length === 0) {
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
  }, [user, page, pageSize, debouncedSearch, sortBy, selectedFilters])

  useEffect(() => {
    if (ready && user && user.uid) {
      // Always refresh data when the component is ready and we have a user
      // This ensures we get the latest data from the server, preventing deleted
      // items from reappearing due to stale server-rendered content
      
      // Use a small delay to ensure Firebase Auth is fully initialized
      const timeoutId = setTimeout(() => {
        load(true) // Force refresh to bypass cache
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [ready, user?.uid, load]) // Only depend on ready and user.uid to avoid excessive reloads

  // Reset page to 1 when search or filters change
  useEffect(() => {
    if (ready && hasNavigatedAwayRef.current) {
      setPage(1)
    }
  }, [ready, debouncedSearch, selectedFilters, sortBy])

  // Effect to reload data when pagination, search, or filters change
  useEffect(() => {
    if (ready && user && user.uid) {
      // Always reload if we need a refresh (e.g., returning from navigation)
      if (needsRefreshRef.current) {
        needsRefreshRef.current = false
        load(true) // Force refresh
        return
      }
      
      // Mark that we've navigated away from initial state if parameters changed
      const isInitialState = page === initialPage && 
                            debouncedSearch === initialSearch && 
                            selectedFilters.contentType.length === 0 &&
                            selectedFilters.difficulty.length === 0 &&
                            selectedFilters.key.length === 0 &&
                            !selectedFilters.favorite &&
                            sortBy === 'recent'
      
      if (!isInitialState) {
        hasNavigatedAwayRef.current = true
      }
      
      load()
    }
  }, [ready, user, page, pageSize, debouncedSearch, sortBy, selectedFilters, load])

  // Add window focus listener to refresh data when user returns to the tab
  useEffect(() => {
    const handleWindowFocus = () => {
      const now = Date.now()
      // Always mark for refresh when user returns to the page
      // This ensures deleted items don't reappear from stale data
      if (ready && user && user.uid) {
        needsRefreshRef.current = true
        
        // Only refresh immediately if it's been more than 30 seconds since last focus
        // Otherwise, let the next effect cycle handle it
        if ((now - lastFocusTimeRef.current) > 30000) {
          load(true) // Force refresh to bypass cache
        }
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
