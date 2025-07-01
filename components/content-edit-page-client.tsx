"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import dynamic from "next/dynamic";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { updateContent, clearContentCache } from "@/lib/content-service";
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
  const [activeScreen, setActiveScreen] = useState("library");

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
      console.log('Starting save process for:', content.title)
      await updateContent(content.id, updatedContent);
      clearContentCache();
      console.log('Content cache cleared after update')
      toast.success("Changes saved successfully");
      router.push("/library");
    } catch (err) {
      console.error("Error saving content:", err);
      toast.error("Failed to save changes");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
      <ContentEditor content={content} onSave={handleSave} onCancel={handleCancel} />
    </ResponsiveLayout>
  );
}
