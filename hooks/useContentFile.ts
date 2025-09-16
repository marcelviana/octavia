import { useState, useEffect } from 'react'
import { getCachedFileInfo } from '@/lib/offline-cache'

interface UseContentFileReturn {
  offlineUrl: string | null
  offlineMimeType: string | null
  isLoadingUrl: boolean
  urlError: string | null
  blobUrlToRevoke: string | null
}

export function useContentFile(contentId: string): UseContentFileReturn {
  const [offlineUrl, setOfflineUrl] = useState<string | null>(null)
  const [offlineMimeType, setOfflineMimeType] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [blobUrlToRevoke, setBlobUrlToRevoke] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let url: string | null = null

    const load = async () => {
      try {
        setIsLoadingUrl(true)
        setUrlError(null)
        console.log(`Loading cached file info for content ${contentId}`)

        const fileInfo = await getCachedFileInfo(contentId)

        if (isMounted) {
          if (fileInfo) {
            setOfflineUrl(fileInfo.url)
            setOfflineMimeType(fileInfo.mimeType)
            url = fileInfo.url
            // Track blob URLs for cleanup
            if (fileInfo.url.startsWith('blob:')) {
              setBlobUrlToRevoke(fileInfo.url)
            }
            console.log(`Successfully loaded cached file for content ${contentId}, MIME: ${fileInfo.mimeType}`)
          } else {
            console.log(`No cached file found for content ${contentId}, will use file_url`)
          }
          setIsLoadingUrl(false)
        }
      } catch (error) {
        console.error(`Error loading cached file for content ${contentId}:`, error)
        if (isMounted) {
          setUrlError(error instanceof Error ? error.message : 'Failed to load cached file')
          setIsLoadingUrl(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [contentId])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlToRevoke) {
        console.log(`Revoking blob URL for content ${contentId} on unmount`)
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [blobUrlToRevoke, contentId])

  return {
    offlineUrl,
    offlineMimeType,
    isLoadingUrl,
    urlError,
    blobUrlToRevoke
  }
}