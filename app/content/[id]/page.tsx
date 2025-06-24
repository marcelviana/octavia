import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import { cookies } from "next/headers";
import { getContentByIdServer } from "@/lib/content-service-server";
import ContentPageClient from "@/components/content-page-client";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check for Firebase authentication instead of Supabase
  const cookieStore = await cookies();
  const user = await getServerSideUser(cookieStore);
  
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const content = await getContentByIdServer(resolvedParams.id, cookieStore);

  return <ContentPageClient content={content} />;
}
