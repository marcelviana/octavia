"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { updateContent } from "@/lib/content-service";
import { toast } from "sonner";
import { cacheFileForContent } from "@/lib/offline-cache";

const ContentEditor = dynamic(() => import("@/components/content-editor").then(mod => ({ default: mod.ContentEditor })), {
  loading: () => <p>Loading editor...</p>,
});

type Content = Database["public"]["Tables"]["content"]["Row"];

interface ContentEditPageClientProps {
  content: Content;
}

export default function ContentEditPageClient({ content }: ContentEditPageClientProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeScreen, setActiveScreen] = useState("library");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  useEffect(() => {
    if (!content) return
    cacheFileForContent(content).catch(err => {
      console.error('Failed to cache file for content', err)
    })
  }, [content])

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`);
  };

  const handleSave = async (updatedContent: any) => {
    try {
      await updateContent(content.id, updatedContent);
      toast.success("Changes saved successfully");
      router.push(`/content/${content.id}`);
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-screen bg-[#fffcf7]">
      <Header
        onMenuClick={() => setSidebarMobileOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
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
            sidebarCollapsed ? "md:ml-20" : "md:ml-72"
          )}
        >
          <ContentEditor content={content} onSave={handleSave} onCancel={handleCancel} />
        </main>
      </div>
    </div>
  );
}
