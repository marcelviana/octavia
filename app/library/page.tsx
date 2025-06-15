import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getUserContentServer } from "@/lib/content-service-server";
import LibraryPageClient from "@/components/library-page-client";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string }>
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const content = await getUserContentServer();
  const resolved = await searchParams;
  const search = resolved?.search || "";

  return <LibraryPageClient initialContent={content} initialSearch={search} />;
}
