import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUserContentPageServer } from "@/lib/content-service-server";
import LibraryPageClient from "@/components/library-page-client";

export default async function LibraryPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  let user = null;
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    user = supabaseUser;
    if (!user) {
      redirect("/login");
    }
  }

  const resolvedSearchParams = await searchParams;
  const searchParam = resolvedSearchParams?.search;
  const search = Array.isArray(searchParam)
    ? searchParam[0]
    : searchParam ?? "";

  const pageParam = resolvedSearchParams?.page;
  const page = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam, 10) : 1;
  const pageSize = 20;
  const { data, total } = await getUserContentPageServer({
    page,
    pageSize,
    search,
  });

  return (
    <LibraryPageClient
      initialContent={data}
      initialTotal={total}
      initialPage={page}
      pageSize={pageSize}
      initialSearch={search}
    />
  );
}
