"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Library } from "@/components/library";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

interface LibraryPageClientProps {
  initialContent: any[];
}

export default function LibraryPageClient({
  initialContent,
}: LibraryPageClientProps) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState("library");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`);
  };

  const handleSelectContent = (content: any) => {
    router.push(`/content/${content.id}`);
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
        <Header onMenuClick={() => setSidebarMobileOpen(true)} title="Library" />
        <main className="flex-1 overflow-auto">
          <Library onSelectContent={handleSelectContent} initialContent={initialContent} />
        </main>
      </div>
    </div>
  );
}
