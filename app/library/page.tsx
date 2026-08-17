import { requirePageUser } from "@/lib/require-page-user";
import { cookies, headers } from "next/headers";
import { getUserContentPageServer } from "@/lib/content-service-server";
import LibraryPageClient from "@/components/library-page-client";

export default async function LibraryPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // Get user info - middleware already handles authentication, so this should always succeed
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Construct the request URL for proper token validation
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const requestUrl = host ? `${protocol}://${host}/library` : undefined;
  
  // B1.2a: enforcement na página — user nulo expulsa (mesma arqueologia
  // do dashboard: o spinner era defesa da era dos 429, causa morta)
  await requirePageUser(cookieStore);

  const resolvedSearchParams = await searchParams;
  const searchParam = resolvedSearchParams?.search;
  const search = Array.isArray(searchParam)
    ? searchParam[0]
    : searchParam ?? "";

  const pageParam = resolvedSearchParams?.page;
  const pageParamString = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsedPage = pageParamString ? parseInt(pageParamString, 10) : 1;
  const page = isNaN(parsedPage) ? 1 : parsedPage;
  const pageSize = 20;
  const { data, total } = await getUserContentPageServer(
    {
      page,
      pageSize,
      search,
    },
    cookieStore,
    requestUrl
  );

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
