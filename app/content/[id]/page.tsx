import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import { getContentByIdServer } from "@/lib/content-service-server";
import ContentPageClient from "@/components/content-page-client";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check for Firebase authentication instead of Supabase
  const user = await getServerSideUser();
  
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const content = await getContentByIdServer(resolvedParams.id);

  return <ContentPageClient content={content} />;
}
