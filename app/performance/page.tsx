import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  getContentByIdServer,
  getSetlistByIdServer,
} from "@/lib/content-service-server";
import PerformancePageClient from "@/components/performance-page-client";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string };
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const contentId = searchParams?.contentId;
  const setlistId = searchParams?.setlistId;

  let content: any | null = null;
  let setlist: any | null = null;

  if (contentId) {
    content = await getContentByIdServer(contentId);
  }

  if (setlistId) {
    setlist = await getSetlistByIdServer(setlistId);
  }

  return <PerformancePageClient content={content} setlist={setlist} />;
}
