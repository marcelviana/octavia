import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getContentByIdServer,
  getSetlistByIdServer,
} from "@/lib/content-service-server";
import PerformancePageClient from "@/components/performance-page-client";

export default async function PerformancePage({ searchParams }: { searchParams?: any }) {
  let user = null
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

  const contentId = searchParams?.contentId as string | undefined;
  const setlistId = searchParams?.setlistId as string | undefined;

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
