"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { UserHeader } from "@/components/user-header"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  onMenuClick?: () => void
  onToggleCollapse?: () => void
  collapsed?: boolean
}

export function Header({ onMenuClick, onToggleCollapse, collapsed }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-amber-200">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={onToggleCollapse}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5 text-amber-800" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-amber-800" />
              )}
            </Button>
          )}
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5 text-amber-800" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Image src="/logos/octavia-icon.png" alt="Octavia" width={32} height={32} />
            <Image
              src="/logos/octavia-wordmark.png"
              alt="Octavia"
              width={120}
              height={24}
              className="hidden sm:block"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-8 bg-white border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
            />
          </div>
          <UserHeader />
        </div>
      </div>
    </header>
  )
}
