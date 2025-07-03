"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { processQueue } from "@/lib/offline-queue"

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true)
  const [registrationError, setRegistrationError] = useState<string | null>(null)

  useEffect(() => {
    // Check if service worker is supported
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported in this browser")
      return
    }

    // Allow service worker in development for testing, but with additional logging
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log("🔧 Service Worker enabled in development mode for testing")
    }

    // Network status monitoring
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (online) {
        toast({
          title: "Back Online",
          description: "Connection restored. Syncing pending changes...",
        })
        // Process any queued offline requests
        processQueue().catch(err => {
          console.error("Failed to process offline queue:", err)
        })
      } else {
        toast({
          title: "Gone Offline",
          description: "You're now offline. Changes will sync when connection returns.",
          variant: "destructive"
        })
      }
    }

    // Set initial online status
    setIsOnline(navigator.onLine)
    
    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    const showUpdateToast = (registration: ServiceWorkerRegistration) => {
      toast({
        title: "Update Available",
        description: "A new version is ready.",
        action: (
          <ToastAction
            altText="Reload"
            onClick={() => {
              const waiting = registration.waiting
              if (waiting) {
                waiting.postMessage({ type: "SKIP_WAITING" })
                registration.addEventListener("controllerchange", () => {
                  window.location.reload()
                })
              } else {
                window.location.reload()
              }
            }}
          >
            Reload
          </ToastAction>
        ),
      })
    }

    const handleRegistrationError = (error: Error) => {
      const errorMessage = `Service Worker registration failed: ${error.message}`
      setRegistrationError(errorMessage)
      console.error(errorMessage, error)
      
      // Show user-friendly error in development
      if (isDev) {
        toast({
          title: "Service Worker Error",
          description: "SW registration failed in development. Check console for details.",
          variant: "destructive"
        })
      }
    }

    const handleServiceWorkerError = (event: Event) => {
      console.error("Service Worker runtime error:", event)
      toast({
        title: "Offline Features Unavailable",
        description: "Some offline features may not work properly.",
        variant: "destructive"
      })
    }

    // Register service worker with enhanced error handling
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none" // Always check for updates
        })

        if (isDev) {
          console.log("🎉 Service Worker registered successfully:", registration)
        }

        // Check for updates periodically
        const checkForUpdates = () => {
          registration.update().catch(err => {
            console.warn("Failed to check for SW updates:", err)
          })
        }

        // Check for updates every 30 seconds in development, 5 minutes in production
        const updateInterval = setInterval(checkForUpdates, isDev ? 30000 : 300000)

        // Handle waiting service worker
        if (registration.waiting) {
          showUpdateToast(registration)
        }

        // Handle new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            if (isDev) {
              console.log("🔄 New Service Worker installing...")
            }

            newWorker.addEventListener("statechange", () => {
              if (isDev) {
                console.log("🔄 Service Worker state changed to:", newWorker.state)
              }

              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                showUpdateToast(registration)
              }
            })
          }
        })

        // Handle service worker messages
        navigator.serviceWorker.addEventListener("message", event => {
          if (isDev) {
            console.log("📨 Message from Service Worker:", event.data)
          }

          switch (event.data?.type) {
            case "OFFLINE_FALLBACK":
              toast({
                title: "Offline Mode",
                description: "Showing cached content while offline.",
                action: (
                  <ToastAction
                    altText="Offline Page"
                    onClick={() => {
                      window.location.href = "/_offline"
                    }}
                  >
                    Offline Page
                  </ToastAction>
                ),
              })
              break
            
            case "CACHE_ERROR":
              toast({
                title: "Cache Error",
                description: "Failed to cache some content for offline use.",
                variant: "destructive"
              })
              break

            case "SYNC_SUCCESS":
              toast({
                title: "Sync Complete",
                description: "All pending changes have been synchronized.",
              })
              break
          }
        })

        // Handle service worker errors
        navigator.serviceWorker.addEventListener("error", handleServiceWorkerError)

        // Process any pending offline requests
        try {
          await processQueue()
          if (isDev) {
            console.log("✅ Offline queue processed successfully")
          }
        } catch (err) {
          console.error("Failed to process offline queue:", err)
        }

        // Cleanup function
        return () => {
          clearInterval(updateInterval)
          navigator.serviceWorker.removeEventListener("error", handleServiceWorkerError)
          window.removeEventListener('online', updateOnlineStatus)
          window.removeEventListener('offline', updateOnlineStatus)
        }

      } catch (error) {
        handleRegistrationError(error as Error)
      }
    }

    // Start registration
    const cleanup = registerServiceWorker()

    // Return cleanup function
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.()).catch(console.error)
    }
  }, [])

  // Return online status for components that need it
  return { isOnline, registrationError }
}
