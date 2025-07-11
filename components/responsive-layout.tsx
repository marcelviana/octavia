"use client"

import { useState, useEffect, ReactNode } from "react"
import { Header } from "@/components/header"
import { NavigationContainer } from "@/components/navigation-container"
import { cn } from "@/lib/utils"

interface ResponsiveLayoutProps {
  children: ReactNode
  activeScreen: string
  onNavigate: (screen: string) => void
  initialSearch?: string
}

export function ResponsiveLayout({ children, activeScreen, onNavigate, initialSearch }: ResponsiveLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
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

  return (
    <div className="flex flex-col h-screen bg-[#fffcf7]">
      <Header
        onMenuClick={shouldShowBottomNav ? undefined : () => setSidebarMobileOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        collapsed={sidebarCollapsed}
        initialSearch={initialSearch}
      />
      <div className="flex flex-1 relative">
        <NavigationContainer
          activeScreen={activeScreen}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={sidebarMobileOpen}
          onMobileOpenChange={setSidebarMobileOpen}
        />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            // Only apply sidebar margin when not using bottom nav
            !shouldShowBottomNav && (sidebarCollapsed ? "md:ml-20" : "md:ml-72"),
            // Add bottom padding when using bottom nav to account for fixed bottom navigation
            shouldShowBottomNav && "pb-16"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
} 