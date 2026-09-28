"use client";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";
import dynamic from "next/dynamic";
import { Casca } from "@/components/identidade/casca";
import { updateContent, clearContentCache } from "@/lib/content-service";
import { toast } from "sonner";

const ContentEditor = dynamic(() => import("@/components/content-editor").then(mod => ({ default: mod.ContentEditor })), {
  loading: () => <p>Loading editor...</p>,
});

type Content = Database["public"]["Tables"]["content"]["Row"];

interface ContentEditPageClientProps {
  content: Content;
}

export default function ContentEditPageClient({ content }: ContentEditPageClientProps) {
  const router = useRouter();
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
    // I1-PR-9: a casca nova (barra superior) no lugar do ResponsiveLayout; o corpo velho fica como estava, com o fundo de antes (a folha desta tela é de uma PR seguinte)
    <Casca>
      <div className="flex-1 bg-[#fffcf7]">
      <ContentEditor content={content} onSave={handleSave} onCancel={handleCancel} />
      </div>
    </Casca>
  );
}
