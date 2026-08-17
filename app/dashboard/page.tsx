import { requirePageUser } from "@/lib/require-page-user";
import { cookies, headers } from "next/headers";
import {
  getUserContentServer,
  getUserStatsServer,
} from "@/lib/content-service-server";
import DashboardPageClient from "@/components/dashboard-page-client";
import type { ContentItem } from "@/components/dashboard";

export default async function DashboardPage() {
  // Get user info - middleware already handles authentication, so this should always succeed
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Construct the request URL for proper token validation
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const requestUrl = host ? `${protocol}://${host}/dashboard` : undefined
  
  // B1.2a: enforcement na página — user nulo expulsa (o spinner "avoid
  // loops" era defesa da era dos 429 no verify; causa morta na B1.1)
  await requirePageUser(cookieStore)

  const [rawContentData, stats] = await Promise.all([
    getUserContentServer(cookieStore, requestUrl),
    getUserStatsServer(cookieStore, requestUrl),
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
