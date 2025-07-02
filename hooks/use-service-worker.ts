"use client"

import { useEffect } from "react"
import { Workbox } from "workbox-window"
import { toast } from "@/hooks/use-toast"

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const wb = new Workbox("/sw.js")

    const handleWaiting = () => {
      const t = toast({
        title: "Update Available",
        description: "A new version is ready.",
        action: {
          label: "Reload",
          onClick: () => {
            wb.addEventListener("controlling", () => {
              window.location.reload()
            })
            wb.messageSkipWaiting()
          },
        },
      })
    }

    wb.addEventListener("waiting", handleWaiting)

    wb.register().catch(err => {
      console.error("Service worker registration failed", err)
    })
  }, [])
}
