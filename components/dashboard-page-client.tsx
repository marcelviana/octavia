"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard, ContentItem, UserStats } from "@/components/dashboard";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

interface DashboardPageClientProps {
  recentContent: ContentItem[];
  favoriteContent: ContentItem[];
  stats: UserStats | null;
}

export default function DashboardPageClient({
  recentContent,
  favoriteContent,
  stats,
}: DashboardPageClientProps) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavigate = (screen: string) => {
    if (screen === "dashboard") {
      setActiveScreen(screen);
    } else {
      router.push(`/${screen}`);
    }
  };

  const handleSelectContent = (content: ContentItem) => {
    router.push(`/content/${content.id}`);
  };

  const handleEnterPerformance = () => {
    router.push("/performance");
  };

  return (
    <div className="flex h-screen bg-[#fffcf7]">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "ml-20" : "ml-72",
        )}
      >
        <Dashboard
          onNavigate={handleNavigate}
          onSelectContent={handleSelectContent}
          onEnterPerformance={handleEnterPerformance}
          recentContent={recentContent}
          favoriteContent={favoriteContent}
          stats={stats}
        />
      </main>
    </div>
  );
}
