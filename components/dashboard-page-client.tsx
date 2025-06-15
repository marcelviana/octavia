"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard, ContentItem, UserStats } from "@/components/dashboard";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
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
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

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
    <div className="flex flex-col h-screen bg-[#fffcf7]">
      <Header
        onMenuClick={() => setSidebarMobileOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={sidebarMobileOpen}
          onMobileOpenChange={setSidebarMobileOpen}
        />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "md:ml-20" : "md:ml-72",
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
    </div>
  );
}
