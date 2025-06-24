import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import { cookies } from "next/headers";
import {
  getUserContentServer,
  getUserStatsServer,
} from "@/lib/content-service-server";
import DashboardPageClient from "@/components/dashboard-page-client";
import type { ContentItem } from "@/components/dashboard";

export default async function DashboardPage() {
  // Check for Firebase authentication instead of Supabase
  const cookieStore = await cookies()
  const user = await getServerSideUser(cookieStore)
  
  if (!user) {
    redirect("/login")
  }

  const [rawContentData, stats] = await Promise.all([
    getUserContentServer(cookieStore),
    getUserStatsServer(cookieStore),
  ])
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
