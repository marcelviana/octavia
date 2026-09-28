"use client";

/**
 * `/content/[id]` (I1-PR-10): a casca (I1-PR-9) e a visualização pela folha `5-content-visualizacao`. O content vem
 * do SSR (`app/content/[id]/page.tsx`, div. 732). *Voltar* é o `router.back()` de antes (decisão 6). O editar
 * inline de antes (`isEditing` + `ContentEditor` + `updateContent`) era inalcançável — o `onEdit` nunca descia a um
 * botão — e saiu: *Editar* leva a `/content/[id]/edit` (decisão 5, div. 736). O limite de render é o do corpo
 * (`components/content/limite-do-corpo.tsx`); o global de `app/layout.tsx` segue por cima.
 */
import { useRouter } from "next/navigation";
import { Casca } from "@/components/identidade/casca";
import { ContentViewer } from "@/components/content-viewer";
import type { ConteudoVisto } from "@/components/content/tipos";

export default function ContentPageClient({ content }: { content: ConteudoVisto }) {
  const router = useRouter();
  return (
    <Casca>
      <ContentViewer content={content} onBack={() => router.back()} />
    </Casca>
  );
}
