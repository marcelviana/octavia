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
    <div className="flex h-screen bg-[#fffcf7]">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onMobileOpenChange={setSidebarMobileOpen}
      />
      <div className={cn("flex-1 flex flex-col transition-all duration-300 ease-in-out", sidebarCollapsed ? "md:ml-20" : "md:ml-72")}
      >
        <Header onMenuClick={() => setSidebarMobileOpen(true)} title="Dashboard" />
        <main className="flex-1 overflow-auto">
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
