"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  Library,
  Music,
  Settings,
  Plus,
  Search,
  Guitar,
  BookOpen,
  Mic,
  List,
  Star,
  Clock,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { UserHeader } from "@/components/user-header"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ activeScreen, onNavigate, onCollapsedChange }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Notify parent component when collapsed state changes
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed)
    }
  }, [collapsed, onCollapsedChange])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, description: "Overview of your music" },
    { id: "library", label: "Library", icon: Library, description: "Browse all your content" },
    { id: "setlists", label: "Setlists", icon: Music, description: "Organize performances" },
    { id: "settings", label: "Settings", icon: Settings, description: "Customize your experience" },
  ]

  const quickCreateItems = [
    { id: "lyrics", label: "Lyrics Sheet", icon: Mic, description: "Create a new lyrics sheet" },
    { id: "chords", label: "Chord Chart", icon: Guitar, description: "Create a new chord chart" },
    { id: "tab", label: "Tablature", icon: List, description: "Create a new tab" },
    { id: "sheet", label: "Sheet Music", icon: BookOpen, description: "Create a new sheet music" },
  ]

  const recentItems = [
    { id: "recent1", label: "Autumn Leaves", icon: Star },
    { id: "recent2", label: "All of Me", icon: Clock },
    { id: "recent3", label: "Fly Me to the Moon", icon: Star },
  ]

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-md"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5 text-amber-800" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 shadow-lg overflow-hidden">
          {/* Logo and Collapse Button */}
          <div className="p-4 border-b border-amber-200 flex items-center justify-between">
            <div
              className={cn("flex items-center space-x-3 transition-opacity", collapsed ? "opacity-0" : "opacity-100")}
            >
              <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
              <Image src="/logos/octavia-wordmark.png" alt="Octavia" width={120} height={24} />
            </div>
            <div
              className={cn(
                "absolute left-1/2 transform -translate-x-1/2 transition-opacity",
                collapsed ? "opacity-100" : "opacity-0",
              )}
            >
              <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
            </div>
            <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100" onClick={toggleCollapsed}>
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          {/* User Profile */}
          <div
            className={cn(
              "p-4 border-b border-amber-200 flex justify-center transition-all",
              collapsed ? "opacity-70 hover:opacity-100" : "",
            )}
          >
            <UserHeader compact={collapsed} />
          </div>

          {/* Quick Actions */}
          <div className="p-4 space-y-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      "w-full justify-start bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md",
                      collapsed && "justify-center px-0",
                    )}
                    size="sm"
                    onClick={() => onNavigate("add-content")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {!collapsed && <span>Add Content</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Add Content</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start border-amber-300 text-amber-800 hover:bg-amber-100",
                      collapsed && "justify-center px-0",
                    )}
                    size="sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {!collapsed && <span>Search</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Search</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-transparent">
            <div className={cn("mb-6", collapsed ? "px-0" : "px-2")}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Navigation</h3>
              )}
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeScreen === item.id
                  return (
                    <li key={item.id}>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start transition-all",
                                isActive
                                  ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white hover:from-amber-600 hover:to-orange-600"
                                  : "text-amber-800 hover:bg-amber-100/80",
                                collapsed && "justify-center p-2",
                              )}
                              onClick={() => onNavigate(item.id)}
                            >
                              <Icon className={cn("w-5 h-5", collapsed ? "" : "mr-3")} />
                              {!collapsed && <span>{item.label}</span>}
                            </Button>
                          </TooltipTrigger>
                          {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Recent Items */}
            {!collapsed && (
              <div className="mb-6 px-2">
                <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Recent</h3>
                <ul className="space-y-1">
                  {recentItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.id}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-amber-700 hover:bg-amber-100/80 h-8"
                        >
                          <Icon className="w-4 h-4 mr-2 text-amber-500" />
                          <span className="truncate">{item.label}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Quick Create */}
            <div className={cn("mb-6", collapsed ? "px-0" : "px-2")}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Quick Create</h3>
              )}
              <ul className="space-y-1">
                {quickCreateItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-amber-700 hover:bg-amber-100/80",
                                collapsed && "justify-center p-2",
                              )}
                              size={collapsed ? "icon" : "sm"}
                            >
                              <Icon className={cn("w-4 h-4", collapsed ? "" : "mr-2")} />
                              {!collapsed && <span>{item.label}</span>}
                            </Button>
                          </TooltipTrigger>
                          {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-amber-200">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-amber-700 hover:bg-amber-100",
                      collapsed && "justify-center px-0",
                    )}
                    size="sm"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {!collapsed && <span>Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </>
  )
}
