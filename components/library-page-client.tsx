"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ResponsiveLayout } from "@/components/responsive-layout";

// Bundle splitting: Lazy load management features
const Library = dynamic(() => import("@/components/library").then(mod => ({ default: mod.Library })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading library...</p>
      </div>
    </div>
  ),
  ssr: false // Client-side only for better performance
});

interface LibraryPageClientProps {
  initialContent: any[]
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
  const [activeScreen, setActiveScreen] = useState("library");
  const [currentSearch, setCurrentSearch] = useState(initialSearch || '');

  // Keep current search in sync with URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setCurrentSearch(urlSearch);
  }, [searchParams]);

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`);
  };

  const handleSelectContent = (content: any) => {
    router.push(`/content/${content.id}`);
  };

  return (
    <ResponsiveLayout 
      activeScreen={activeScreen} 
      onNavigate={handleNavigate}
      initialSearch={currentSearch}
    >
      <Library
        onSelectContent={handleSelectContent}
        initialContent={initialContent}
        initialTotal={initialTotal}
        initialPage={initialPage}
        initialPageSize={pageSize}
        initialSearch={initialSearch}
      />
    </ResponsiveLayout>
  );
}
