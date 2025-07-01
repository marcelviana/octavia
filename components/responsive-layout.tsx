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