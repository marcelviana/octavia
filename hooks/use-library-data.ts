"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { getUserContentPage } from '@/lib/content-service'
import { saveContent, getCachedContent } from '@/lib/offline-cache'

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
  setPage: (n: number) => void
  pageSize: number
  setPageSize: (n: number) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  sortBy: 'recent' | 'title' | 'artist'
  setSortBy: (v: 'recent' | 'title' | 'artist') => void
  selectedFilters: Filters
  setSelectedFilters: (f: Filters) => void
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
  const [searchQuery, setSearchQuery] = useState(initialSearch)
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

  const load = useCallback(async () => {
    if (!user || inProgressRef.current) return
    inProgressRef.current = true
    try {
      setLoading(true)
      const { data, total } = await getUserContentPage({
        page,
        pageSize,
        search: debouncedSearch,
        sortBy,
        filters: selectedFilters,
      }, undefined, { id: user.uid, email: user.email })

      setContent(data || [])
      setTotalCount(total || 0)
      if (data && data.length > 0) {
        try { await saveContent(data) } catch {}
      }
    } catch (err) {
      try {
        const cached = await getCachedContent()
        setContent(cached)
        setTotalCount(cached.length)
      } catch {
        setContent([])
        setTotalCount(0)
      }
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user, page, pageSize, debouncedSearch, sortBy, selectedFilters])

  useEffect(() => {
    if (ready) {
      load()
    }
  }, [ready, load])

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
    reload: load,
  }
}
