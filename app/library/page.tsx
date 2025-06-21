import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUserContentPageServer } from "@/lib/content-service-server";
import LibraryPageClient from "@/components/library-page-client";

export default async function LibraryPage({ searchParams }: { searchParams?: any }) {
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

  const searchParam = searchParams?.search;
  const search = Array.isArray(searchParam)
    ? searchParam[0]
    : searchParam ?? "";

  const pageParam = searchParams?.page;
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
