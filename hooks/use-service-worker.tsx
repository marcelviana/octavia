"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { processQueue } from "@/lib/offline-queue"

export function useServiceWorker() {
  useEffect(() => {
    // Only register service worker in production or when PWA is enabled
    if (typeof window === "undefined" || 
        !("serviceWorker" in navigator) || 
        process.env.NODE_ENV === 'development') {
      return
    }

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
              }
            }}
          >
            Reload
          </ToastAction>
        ),
      })
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(registration => {
        registration.update()

        if (registration.waiting) {
          showUpdateToast(registration)
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                showUpdateToast(registration)
              }
            })
          }
        })

        navigator.serviceWorker.addEventListener("message", event => {
          if (event.data?.type === "OFFLINE_FALLBACK") {
            toast({
              title: "Offline Mode",
              description: "Showing cached content while offline.",
              action: (
                <ToastAction
                  altText="Offline"
                  onClick={() => {
                    window.location.href = "/_offline"
                  }}
                >
                  Offline Page
                </ToastAction>
              ),
            })
          }
        })

        processQueue()
      })
      .catch(err => {
        console.error("Service worker registration failed", err)
      })
  }, [])
}

