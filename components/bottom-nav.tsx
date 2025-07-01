"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  Library,
  Settings,
  Disc3,
  MusicIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const menuItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "setlists", label: "Setlists", icon: Disc3 },
    { id: "add-content", label: "Add", icon: MusicIcon },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-amber-200 shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1 safe-area-pb">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-16 min-w-[60px] flex-1 p-1 transition-all duration-200 rounded-xl",
                isActive
                  ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-lg scale-105"
                  : "text-amber-800 hover:bg-amber-100/80 hover:scale-105"
              )}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "drop-shadow-sm")} />
              <span className={cn(
                "text-xs font-medium leading-none",
                isActive && "font-semibold drop-shadow-sm"
              )}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
} 