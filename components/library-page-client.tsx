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
          <Library onSelectContent={handleSelectContent} initialContent={initialContent} />
        </main>
      </div>
    </div>
  );
}
