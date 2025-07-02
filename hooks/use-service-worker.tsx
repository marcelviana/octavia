"use client"

import { useEffect } from "react"
import { Workbox } from "workbox-window"
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

    const wb = new Workbox("/sw.js")

    const handleWaiting = () => {
      toast({
        title: "Update Available",
        description: "A new version is ready.",
        action: (
          <ToastAction
            altText="Reload"
            onClick={() => {
              wb.addEventListener("controlling", () => {
                window.location.reload()
              })
              wb.messageSkipWaiting()
            }}
          >
            Reload
          </ToastAction>
        ),
      })
    }

    wb.addEventListener("waiting", handleWaiting)

    wb.register()
      .then(() => {
        wb.update()
        processQueue()
      })
      .catch(err => {
        console.error("Service worker registration failed", err)
      })
  }, [])
}
