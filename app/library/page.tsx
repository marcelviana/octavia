import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getUserContentPageServer } from "@/lib/content-service-server";
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

  const resolved = await searchParams;
  const search = resolved?.search || "";
  const page = resolved?.page ? parseInt(resolved.page, 10) : 1;
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
