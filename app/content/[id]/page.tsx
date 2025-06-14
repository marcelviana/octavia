import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getContentByIdServer } from "@/lib/content-service-server";
import ContentPageClient from "@/components/content-page-client";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const content = await getContentByIdServer(resolvedParams.id);

  return <ContentPageClient content={content} />;
}
