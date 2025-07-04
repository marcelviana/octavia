"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { UserHeader } from "@/components/user-header"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface HeaderProps {
  onMenuClick?: () => void
  onToggleCollapse?: () => void
  collapsed?: boolean
  initialSearch?: string
}

export function Header({ onMenuClick, onToggleCollapse, collapsed, initialSearch }: HeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialSearch || "")

  useEffect(() => {
    setQuery(initialSearch || "")
  }, [initialSearch])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/library?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/library")
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-amber-200">
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-shrink-0">
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
            <Image 
              src="/logos/octavia-icon.webp" 
              alt="Octavia" 
              width={32} 
              height={32}
              priority
              sizes="32px"
              className="object-contain"
            />
            <Image
              src="/logos/octavia-wordmark.webp"
              alt="Octavia"
              width={120}
              height={24}
              priority
              sizes="120px"
              className="hidden sm:block object-contain"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
          <form onSubmit={handleSubmit} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 bg-white border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-200 focus:ring-opacity-50 w-full"
            />
          </form>
          <UserHeader />
        </div>
      </div>
    </header>
  )
}
