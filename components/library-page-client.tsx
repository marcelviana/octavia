"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Casca, ConteudoDaCasca } from "@/components/identidade/casca";
import LibraryHeader from "@/components/library/LibraryHeader";
import LibraryLoadingState from "@/components/library/LibraryLoadingState";
import type { ContentItem } from "@/types/library";

const semAcao = () => undefined;
const SEM_FILTRO = { contentType: [], difficulty: [], key: [], favorite: false };

// Bundle splitting: Lazy load management features. I1-PR-9 (folha 4, `LIB-carregando-chunk`): enquanto
// o pedaço carrega, o cabeçalho (inerte) e "carregando a biblioteca…" — no lugar de "Loading library...".
const Library = dynamic(() => import("@/components/library").then(mod => ({ default: mod.Library })), {
  loading: () => (
    <>
      <LibraryHeader searchQuery="" onSearchChange={semAcao} sortBy="recent" onSortChange={semAcao} filters={SEM_FILTRO} onFiltersChange={semAcao} onAddContent={semAcao} />
      <LibraryLoadingState />
    </>
  ),
  ssr: false // Client-side only for better performance
});

interface LibraryPageClientProps {
  initialContent: ContentItem[]
  initialTotal: number
  initialPage: number
  pageSize: number
  initialSearch?: string
}

export default function LibraryPageClient({
  initialContent,
  initialTotal,
  initialPage,
  pageSize,
  initialSearch,
}: LibraryPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSearch, setCurrentSearch] = useState(initialSearch || '');

  // Keep current search in sync with URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setCurrentSearch(urlSearch);
  }, [searchParams]);

  const handleSelectContent = (content: ContentItem) => {
    router.push(`/content/${content.id}`);
  };

  // I1-PR-9: a casca nova (barra superior) no lugar do ResponsiveLayout; a busca da casca mostra o termo da URL
  return (
    <Casca buscaInicial={currentSearch}>
      <ConteudoDaCasca>
        <Library
          onSelectContent={handleSelectContent}
          initialContent={initialContent}
          initialTotal={initialTotal}
          initialPage={initialPage}
          initialPageSize={pageSize}
          initialSearch={initialSearch}
        />
      </ConteudoDaCasca>
    </Casca>
  );
}
