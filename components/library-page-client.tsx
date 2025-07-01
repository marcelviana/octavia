"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Library } from "@/components/library";
import { ResponsiveLayout } from "@/components/responsive-layout";

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
