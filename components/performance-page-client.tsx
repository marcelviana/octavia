"use client";
import { useRouter } from "next/navigation";
import { PerformanceMode } from "@/components/performance-mode";

interface PerformancePageClientProps {
  content: any | null;
  setlist: any | null;
}

export default function PerformancePageClient({
  content,
  setlist,
}: PerformancePageClientProps) {
  const router = useRouter();

  const handleExitPerformance = () => {
    router.back();
  };

  return (
    <PerformanceMode
      onExitPerformance={handleExitPerformance}
      selectedContent={content || undefined}
      selectedSetlist={setlist || undefined}
    />
  );
}
