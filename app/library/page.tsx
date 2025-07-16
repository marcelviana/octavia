import { getServerSideUser } from "@/lib/firebase-server-utils";
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
  
  const user = await getServerSideUser(cookieStore, requestUrl);
  
  // If no user despite middleware check, something is wrong with token validation
  if (!user) {
    console.error('Library: User not found despite middleware authentication check')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p>Loading your library...</p>
        </div>
      </div>
    )
  }

  const resolvedSearchParams = await searchParams;
  const searchParam = resolvedSearchParams?.search;
  const search = Array.isArray(searchParam)
    ? searchParam[0]
    : searchParam ?? "";

  const pageParam = resolvedSearchParams?.page;
  const parsedPage = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam, 10) : 1;
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
