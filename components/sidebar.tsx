"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  Library,
  Music,
  Settings,
  Guitar,
  BookOpen,
  Mic,
  List,
  Star,
  Clock,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function Sidebar({
  activeScreen,
  onNavigate,
  collapsed: collapsedProp,
  onCollapsedChange,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
}: SidebarProps) {
  const collapsed = collapsedProp ?? false
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)
  const isControlled = mobileOpenProp !== undefined
  const mobileOpen = isControlled ? mobileOpenProp : internalMobileOpen

  const setMobileOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalMobileOpen(open)
    }
    if (onMobileOpenChange) {
      onMobileOpenChange(open)
    }
  }



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


  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-40 transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 shadow-lg overflow-hidden">

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

        </div>
      </div>
    </>
  )
}
