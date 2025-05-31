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
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">MusicSheet Pro</h1>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button className="w-full justify-start" size="sm" onClick={() => onNavigate("add-content")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={activeScreen === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
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
      <div className="p-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-3">Quick Create</p>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Lyrics Sheet
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Guitar className="w-4 h-4 mr-2" />
            Chord Chart
          </Button>
        </div>
      </div>
    </div>
  )
}
