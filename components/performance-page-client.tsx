"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const OptimizedPerformanceMode = dynamic(() => import("@/components/optimized-performance-mode"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900 mb-2">
          Loading high-performance mode...
        </div>
        <div className="text-sm text-gray-600">
          Optimizing for best live performance experience
        </div>
      </div>
    </div>
  ),
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
    <OptimizedPerformanceMode
      onExitPerformance={handleExitPerformance}
      selectedContent={content || undefined}
      selectedSetlist={setlist || undefined}
      startingSongIndex={startingSongIndex}
    />
  );
}
