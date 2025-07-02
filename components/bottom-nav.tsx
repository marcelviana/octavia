"use client"

import { Button } from "@/components/ui/button"
import {
  Home,
  Library,
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
  ]

  return (
    <nav className="fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-amber-200 shadow-2xl" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-center px-2 py-2 gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center h-16 w-16 px-1 py-2 transition-all duration-200 rounded-xl mx-1",
                isActive
                  ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-lg"
                  : "text-amber-800 hover:bg-amber-100/80 hover:scale-105"
              )}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className={cn("w-9 h-9 mb-0.5", isActive && "drop-shadow-sm")} />
              <span className={cn(
                "text-xs font-medium leading-tight",
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