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
    <div className="fixed left-0 top-0 h-full w-64 bg-[#F7F9FA] border-r border-[#AAB4C3] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#AAB4C3]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#295EFF] rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1F36]">MusicSheet Pro</h1>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button
          className="w-full justify-start bg-[#295EFF] hover:bg-[#1E4BCC] text-white"
          size="sm"
          onClick={() => onNavigate("add-content")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start border-[#AAB4C3] text-[#1A1F36] hover:bg-[#E8ECF4]"
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
                    isActive ? "bg-[#295EFF] text-white hover:bg-[#1E4BCC]" : "text-[#1A1F36] hover:bg-[#E8ECF4]"
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
      <div className="p-4 border-t border-[#AAB4C3]">
        <p className="text-sm font-medium text-[#AAB4C3] mb-3">Quick Create</p>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#1A1F36] hover:bg-[#E8ECF4]">
            <FileText className="w-4 h-4 mr-2" />
            Lyrics Sheet
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#1A1F36] hover:bg-[#E8ECF4]">
            <Guitar className="w-4 h-4 mr-2" />
            Chord Chart
          </Button>
        </div>
      </div>
    </div>
  )
}
