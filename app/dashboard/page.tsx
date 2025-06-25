import { getServerSideUser } from "@/lib/firebase-server-utils";
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
  
  const user = await getServerSideUser(cookieStore, requestUrl)
  
  // If no user despite middleware check, something is wrong with token validation
  if (!user) {
    console.error('Dashboard: User not found despite middleware authentication check')
    
    // Log additional debugging information
    const sessionCookie = cookieStore.get('firebase-session')
    console.error('Dashboard: Session cookie present:', !!sessionCookie?.value)
    if (sessionCookie?.value) {
      console.error('Dashboard: Session cookie length:', sessionCookie.value.length)
    }
    
    // Return a loading state instead of redirecting to avoid loops
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

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
