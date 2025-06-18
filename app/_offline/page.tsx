"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, WifiOff, RefreshCw, Music, Download } from "lucide-react"

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const [cachedContent, setCachedContent] = useState<any[]>([])

  useEffect(() => {
    // Check for cached content in localStorage or IndexedDB
    const loadCachedContent = async () => {
      try {
        // This would load from your offline storage
        const cached = localStorage.getItem('octavia-offline-content')
        if (cached) {
          setCachedContent(JSON.parse(cached))
        }
      } catch (error) {
        console.error('Failed to load cached content:', error)
      }
    }
    
    loadCachedContent()
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      // Check if we're back online
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache' 
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      // Still offline
      setTimeout(() => setIsRetrying(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#fff9f0] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Offline Status */}
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-900">You&apos;re Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-amber-700">
              No internet connection detected. Some features may be limited, but you can still access your cached content.
            </p>
            
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cached Content */}
        {cachedContent.length > 0 && (
          <Card className="border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-900">
                <Download className="w-5 h-5 mr-2" />
                Available Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cachedContent.slice(0, 5).map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <Music className="w-4 h-4 text-amber-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">{item.title}</p>
                      <p className="text-sm text-amber-700">{item.artist}</p>
                    </div>
                  </div>
                ))}
                {cachedContent.length > 5 && (
                  <p className="text-sm text-amber-600 text-center pt-2">
                    +{cachedContent.length - 5} more items available offline
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What You Can Do Offline */}
        <Card className="border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-amber-900">What you can do offline:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-amber-700">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                View cached sheet music and lyrics
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Access offline setlists
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Use performance mode with cached content
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Create and edit notes (syncs when back online)
              </li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
