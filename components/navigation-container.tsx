"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"

interface NavigationContainerProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function NavigationContainer({
  activeScreen,
  onNavigate,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
}: NavigationContainerProps) {
  const [shouldShowBottomNav, setShouldShowBottomNav] = useState(false)

  useEffect(() => {
    const checkNavType = () => {
      // Defensive check for window.matchMedia availability (helps with testing and SSR)
      if (typeof window === 'undefined' || !window.matchMedia) {
        // Default to desktop layout in test/SSR environments
        setShouldShowBottomNav(false)
        return
      }

      try {
        const orientationQuery = window.matchMedia("(orientation: portrait)")
        const sizeQuery = window.matchMedia("(max-width: 1024px)")
        
        // Check if the MediaQueryList objects are valid
        if (!orientationQuery || !sizeQuery) {
          setShouldShowBottomNav(false)
          return
        }
        
        const isPortrait = orientationQuery.matches
        const isMobileOrTablet = sizeQuery.matches
        
        // Show bottom nav for mobile/tablet in portrait orientation
        setShouldShowBottomNav(isMobileOrTablet && isPortrait)
      } catch (error) {
        // Fallback to desktop layout if matchMedia fails
        setShouldShowBottomNav(false)
      }
    }

    // Check on mount
    checkNavType()

    // Only set up listeners if matchMedia is available
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        // Listen for orientation and resize changes
        const orientationQuery = window.matchMedia("(orientation: portrait)")
        const sizeQuery = window.matchMedia("(max-width: 1024px)")
        
        // Only add listeners if queries are valid
        if (orientationQuery && sizeQuery) {
          orientationQuery.addEventListener("change", checkNavType)
          sizeQuery.addEventListener("change", checkNavType)

          return () => {
            orientationQuery.removeEventListener("change", checkNavType)
            sizeQuery.removeEventListener("change", checkNavType)
          }
        }
      } catch (error) {
        // Silently fail if event listener setup fails
      }
    }
  }, [])

  if (shouldShowBottomNav) {
    return (
      <div className="nav-transition">
        <BottomNav activeScreen={activeScreen} onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div className="nav-transition">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        mobileOpen={mobileOpen}
        onMobileOpenChange={onMobileOpenChange}
      />
    </div>
  )
} 