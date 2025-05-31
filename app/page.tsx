"use client"

import { useState } from "react"
import { Dashboard } from "@/components/dashboard"
import { Library } from "@/components/library"
import { SetlistManager } from "@/components/setlist-manager"
import { ContentViewer } from "@/components/content-viewer"
import { PerformanceMode } from "@/components/performance-mode"
import { Settings } from "@/components/settings"
import { Sidebar } from "@/components/sidebar"
import { AddContent } from "@/components/add-content"

export default function MusicSheetPro() {
  const [activeScreen, setActiveScreen] = useState("dashboard")
  const [selectedContent, setSelectedContent] = useState(null)
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)

  const renderScreen = () => {
    if (isPerformanceMode) {
      return <PerformanceMode onExitPerformance={() => setIsPerformanceMode(false)} selectedContent={selectedContent} />
    }

    switch (activeScreen) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={setActiveScreen}
            onSelectContent={setSelectedContent}
            onEnterPerformance={() => setIsPerformanceMode(true)}
          />
        )
      case "library":
        return (
          <Library
            onSelectContent={(content) => {
              setSelectedContent(content)
              setActiveScreen("viewer")
            }}
          />
        )
      case "setlists":
        return <SetlistManager onEnterPerformance={() => setIsPerformanceMode(true)} />
      case "viewer":
        return (
          <ContentViewer
            content={selectedContent}
            onBack={() => setActiveScreen("library")}
            onEnterPerformance={() => setIsPerformanceMode(true)}
          />
        )
      case "settings":
        return <Settings />
      case "add-content":
        return (
          <AddContent onBack={() => setActiveScreen("dashboard")} onContentAdded={() => setActiveScreen("library")} />
        )
      default:
        return <Dashboard onNavigate={setActiveScreen} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {!isPerformanceMode && <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />}
      <main className={`flex-1 ${!isPerformanceMode ? "ml-64" : ""}`}>{renderScreen()}</main>
    </div>
  )
}
