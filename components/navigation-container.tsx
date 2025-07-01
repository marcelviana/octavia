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
      const isPortrait = window.matchMedia("(orientation: portrait)").matches
      const isMobileOrTablet = window.matchMedia("(max-width: 1024px)").matches
      
      // Show bottom nav for mobile/tablet in portrait orientation
      setShouldShowBottomNav(isMobileOrTablet && isPortrait)
    }

    // Check on mount
    checkNavType()

    // Listen for orientation and resize changes
    const orientationQuery = window.matchMedia("(orientation: portrait)")
    const sizeQuery = window.matchMedia("(max-width: 1024px)")
    
    orientationQuery.addEventListener("change", checkNavType)
    sizeQuery.addEventListener("change", checkNavType)

    return () => {
      orientationQuery.removeEventListener("change", checkNavType)
      sizeQuery.removeEventListener("change", checkNavType)
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