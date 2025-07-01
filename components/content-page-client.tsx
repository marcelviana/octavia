"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import { ContentViewer } from "@/components/content-viewer";
import { cacheFileForContent } from "@/lib/offline-cache";
import { ResponsiveLayout } from "@/components/responsive-layout";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/lib/error-boundary"

const ContentEditor = dynamic(() => import("@/components/content-editor").then(mod => ({ default: mod.ContentEditor })), {
  loading: () => <p>Loading editor...</p>,
});
import { updateContent } from "@/lib/content-service";

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
  const [activeScreen, setActiveScreen] = useState("library");

  useEffect(() => {
    if (!initialContent) return
    cacheFileForContent(initialContent).catch(err => {
      console.error('Failed to cache file for content', err)
    })
  }, [initialContent])

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
    <ErrorBoundary>
      <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
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
            showToolbar={false}
          />
        )}
      </ResponsiveLayout>
    </ErrorBoundary>
  );
}
