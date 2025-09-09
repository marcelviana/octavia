import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Wake Lock Hook
 * 
 * Manages screen wake lock to prevent device sleep during performance.
 * Critical requirement: Keep screen active during live performances.
 * 
 * Features:
 * - Automatic wake lock request on mount
 * - Wake lock re-request on visibility change
 * - Proper cleanup on unmount
 * - Error handling with user notification
 * - Browser compatibility checking
 */

export function useWakeLock() {
  const wakeLock = useRef<any>(null)

  useEffect(() => {
    const requestLock = async () => {
      try {
        // @ts-ignore - Wake Lock API not fully typed yet
        if (navigator.wakeLock) {
          // @ts-ignore
          wakeLock.current = await navigator.wakeLock.request("screen")
        } else {
          toast.warning(
            "Heads up! Your browser does not support preventing screen sleep. Please adjust your device settings to avoid screen timeout during your performance."
          )
        }
      } catch (err) {
        console.error("Wake lock error", err)
        toast.warning(
          "Heads up! Your browser does not support preventing screen sleep. Please adjust your device settings to avoid screen timeout during your performance."
        )
      }
    }

    // Request initial wake lock
    requestLock()

    // Handle visibility change to re-request wake lock when page becomes visible
    const handleVisibility = () => {
      if (wakeLock.current && document.visibilityState === "visible") {
        requestLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      if (wakeLock.current) {
        try {
          wakeLock.current.release()
        } catch (error) {
          console.warn("Failed to release wake lock:", error)
        }
      }
    }
  }, [])

  return {
    // Could expose wake lock state if needed in the future
    isActive: wakeLock.current !== null
  }
}