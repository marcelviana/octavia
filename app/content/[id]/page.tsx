import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import { cookies, headers } from "next/headers";
import { getContentByIdServer } from "@/lib/content-service-server";
import ContentPageClient from "@/components/content-page-client";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check for Firebase authentication instead of Supabase
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Construct the request URL for proper token validation
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  
  const resolvedParams = await params;
  const requestUrl = host ? `${protocol}://${host}/content/${resolvedParams.id}` : undefined;
  
  const user = await getServerSideUser(cookieStore, requestUrl);
  
  if (!user) {
    redirect("/login");
  }

  const content = await getContentByIdServer(resolvedParams.id, cookieStore, requestUrl);

  return <ContentPageClient content={content} />;
}
