"use client"

import { Button } from "@/components/ui/button"
import { Home, Library, Music, Settings, Plus, Search, FileText, Guitar } from "lucide-react"

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
}

export function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "setlists", label: "Setlists", icon: Music },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#fff9f0] border-r border-[#A69B8E] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#A69B8E]">
        <div className="flex items-center justify-center space-x-3">
          <img src="/logos/octavia-icon.png" alt="Octavia" className="w-8 h-8" />
          <img src="/logos/octavia-wordmark.png" alt="Octavia" className="h-6" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button
          className="w-full justify-start bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white"
          size="sm"
          onClick={() => onNavigate("add-content")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeScreen === item.id
            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive ? "bg-[#2E7CE4] text-white hover:bg-[#1E5BB8]" : "text-[#1A1F36] hover:bg-[#F2EDE5]"
                  }`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Content Types */}
      <div className="p-4 border-t border-[#A69B8E]">
        <p className="text-sm font-medium text-[#A69B8E] mb-3">Quick Create</p>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#1A1F36] hover:bg-[#F2EDE5]">
            <FileText className="w-4 h-4 mr-2" />
            Lyrics Sheet
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#1A1F36] hover:bg-[#F2EDE5]">
            <Guitar className="w-4 h-4 mr-2" />
            Chord Chart
          </Button>
        </div>
      </div>
    </div>
  )
}
