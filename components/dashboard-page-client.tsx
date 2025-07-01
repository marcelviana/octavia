"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard, ContentItem, UserStats } from "@/components/dashboard";
import { ResponsiveLayout } from "@/components/responsive-layout";

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
    <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
      <Dashboard
        onNavigate={handleNavigate}
        onSelectContent={handleSelectContent}
        onEnterPerformance={handleEnterPerformance}
        recentContent={recentContent}
        favoriteContent={favoriteContent}
        stats={stats}
      />
    </ResponsiveLayout>
  );
}
