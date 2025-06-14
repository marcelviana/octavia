"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import { ContentViewer } from "@/components/content-viewer";
import { Sidebar } from "@/components/sidebar";
import dynamic from "next/dynamic";

const ContentEditor = dynamic(() => import("@/components/content-editor"), {
  loading: () => <p>Loading editor...</p>,
});
import { updateContent } from "@/lib/content-service";
import { cn } from "@/lib/utils";

type Content = Database["public"]["Tables"]["content"]["Row"];

interface ContentPageClientProps {
  content: Content;
}

export default function ContentPageClient({
  content: initialContent,
}: ContentPageClientProps) {
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeScreen, setActiveScreen] = useState("library");

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleEnterPerformance = () => {
    if (!content) return;
    router.push(`/performance?contentId=${content.id}`);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (updatedContent: any) => {
    try {
      if (!content) return;
      await updateContent(content.id, updatedContent);
      setContent({ ...content, ...updatedContent });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
          sidebarCollapsed ? "md:ml-20" : "md:ml-72",
        )}
      >
        {isEditing ? (
          <ContentEditor
            content={content}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <ContentViewer
            content={content}
            onBack={handleBack}
            onEnterPerformance={handleEnterPerformance}
            onEdit={handleEdit}
          />
        )}
      </main>
    </div>
  );
}
