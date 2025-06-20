import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getUserContentPageServer } from "@/lib/content-service-server";
import LibraryPageClient from "@/components/library-page-client";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
