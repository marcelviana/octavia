"use client"

import { useEffect, useState } from "react"

declare global {
  function gtag(...args: any[]): void
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Download, 
  X, 
  Smartphone, 
  Wifi, 
  Zap, 
  Music,
  Monitor,
  Clock
} from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export function EnhancedPwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)
  const [platform, setPlatform] = useState<string>('')

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('octavia-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (dismissedDate > weekAgo) {
        setInstallDismissed(true)
        return
      }
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('android')) {
      setPlatform('Android')
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('iOS')
    } else if (userAgent.includes('mac')) {
      setPlatform('macOS')
    } else if (userAgent.includes('win')) {
      setPlatform('Windows')
    } else {
      setPlatform('Desktop')
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after user has been on the site for 30 seconds
      setTimeout(() => {
        if (!installDismissed) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener("beforeinstallprompt", handler as any)
    
    return () => window.removeEventListener("beforeinstallprompt", handler as any)
  }, [installDismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    setIsInstalling(true)
    
    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        // Track installation event
        if (typeof gtag !== 'undefined') {
          gtag('event', 'pwa_install', {
            platform: platform,
            method: 'install_prompt'
          })
        }
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
      
    } catch (error) {
      console.error('Install prompt failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setInstallDismissed(true)
    localStorage.setItem('octavia-install-dismissed', new Date().toISOString())
    
    // Track dismissal
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_dismissed', {
        platform: platform
      })
    }
  }

  const handleLater = () => {
    setShowPrompt(false)
    // Don't mark as dismissed, will show again later
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-0 overflow-hidden">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Install Octavia</CardTitle>
              <p className="text-amber-100 text-sm">Get the full experience on {platform}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          
          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Perfect for musicians on the go:</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                <Wifi className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Works Offline</p>
                  <p className="text-sm text-gray-600">Access your music even without internet</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Lightning Fast</p>
                  <p className="text-sm text-gray-600">Instant startup, no browser tabs needed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                <Music className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Stage Ready</p>
                  <p className="text-sm text-gray-600">Full-screen performance mode optimized for gigs</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                {platform === 'iOS' ? (
                  <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <Monitor className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Native Experience</p>
                  <p className="text-sm text-gray-600">
                    {platform === 'iOS' 
                      ? 'Add to home screen for app-like experience'
                      : 'Desktop app with system notifications'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Install instructions for iOS */}
          {platform === 'iOS' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">iOS Installation:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Tap the Share button in Safari</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to install Octavia</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3"
            >
              {isInstalling ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleLater}
              variant="outline"
              className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Free installation • No app store required • Uninstall anytime
          </p>
        </CardContent>
      </Card>
    </div>
  )
}