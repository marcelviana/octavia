import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getUserContentServer,
  getUserStatsServer,
} from "@/lib/content-service-server";
import DashboardPageClient from "@/components/dashboard-page-client";
import type { ContentItem } from "@/components/dashboard";

export default async function DashboardPage() {
  let user = null
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
    if (!user) {
      redirect("/login")
    }
  }

  const [rawContentData, stats] = await Promise.all([
    getUserContentServer(),
    getUserStatsServer(),
  ]);
  const contentData = rawContentData as ContentItem[];

  const sortedContent = [...contentData].sort(
    (a: ContentItem, b: ContentItem) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const recentContent = sortedContent.slice(0, 5);
  const favoriteContent = contentData
    .filter((c: ContentItem) => c.is_favorite)
    .slice(0, 5);

  return (
    <DashboardPageClient
      recentContent={recentContent}
      favoriteContent={favoriteContent}
      stats={stats}
    />
  );
}
