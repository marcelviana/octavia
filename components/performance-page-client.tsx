"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const PerformanceMode = dynamic(() => import("@/components/performance-mode").then(mod => ({ default: mod.PerformanceMode })), {
  loading: () => <p>Loading performance mode...</p>,
});

interface PerformancePageClientProps {
  content: any | null;
  setlist: any | null;
  startingSongIndex?: number;
}

export default function PerformancePageClient({
  content,
  setlist,
  startingSongIndex,
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
      startingSongIndex={startingSongIndex}
    />
  );
}
