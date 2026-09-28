"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";
import { ContentViewer } from "@/components/content-viewer";
import { Casca } from "@/components/identidade/casca";
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
  const handleBack = () => {
    router.back();
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
      {/* I1-PR-9: a casca nova (barra superior) no lugar do ResponsiveLayout; o corpo velho fica como estava, com o fundo de antes (a folha desta tela é de uma PR seguinte) */}
      <Casca>
        <div className="flex-1 bg-[#fffcf7]">
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
            onEdit={handleEdit}
            showToolbar={false}
          />
        )}
        </div>
      </Casca>
    </ErrorBoundary>
  );
}
