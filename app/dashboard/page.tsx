import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  getUserContentServer,
  getUserStatsServer,
} from "@/lib/content-service-server";
import DashboardPageClient from "@/components/dashboard-page-client";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [contentData, stats] = await Promise.all([
    getUserContentServer(),
    getUserStatsServer(),
  ]);

  const sortedContent = [...contentData].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const recentContent = sortedContent.slice(0, 5);
  const favoriteContent = contentData.filter((c) => c.is_favorite).slice(0, 5);

  return (
    <DashboardPageClient
      recentContent={recentContent}
      favoriteContent={favoriteContent}
      stats={stats}
    />
  );
}
