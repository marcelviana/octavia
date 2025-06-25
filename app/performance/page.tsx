import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import { cookies, headers } from "next/headers";
import {
  getContentByIdServer,
  getSetlistByIdServer,
} from "@/lib/content-service-server";
import PerformancePageClient from "@/components/performance-page-client";

export default async function PerformancePage({ searchParams }: { searchParams?: Promise<any> }) {
  // Check for Firebase authentication instead of Supabase
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Construct the request URL for proper token validation
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const requestUrl = host ? `${protocol}://${host}/performance` : undefined;
  
  const user = await getServerSideUser(cookieStore, requestUrl);
  
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const contentId = params?.contentId as string | undefined;
  const setlistId = params?.setlistId as string | undefined;
  const startingSongIndex = params?.startingSongIndex ? parseInt(params.startingSongIndex, 10) : undefined;

  let content: any | null = null;
  let setlist: any | null = null;

  if (contentId) {
    content = await getContentByIdServer(contentId, cookieStore, requestUrl);
  }

  if (setlistId) {
    setlist = await getSetlistByIdServer(setlistId, cookieStore, requestUrl);
  }

  return <PerformancePageClient content={content} setlist={setlist} startingSongIndex={startingSongIndex} />;
}
