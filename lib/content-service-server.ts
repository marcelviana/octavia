import { getSupabaseServiceClient } from "@/lib/supabase-service";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import logger from "@/lib/logger";
import {
  getUserContent,
  getContentById,
  getUserStats,
  getUserContentPage,
} from "@/lib/content-service";
import type { ContentQueryParams } from "@/lib/content-types";
import { getSetlistById } from "@/lib/setlist-service";

export async function getUserContentServer(cookieStore: ReadonlyRequestCookies, requestUrl?: string) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore, requestUrl);
  if (firebaseUser) {
    const supabase = getSupabaseServiceClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContent(supabase, supabaseCompatibleUser);
  }

  const supabase = getSupabaseServiceClient();
  return getUserContent(supabase);
}

export async function getUserContentPageServer(
  params: ContentQueryParams,
  cookieStore: ReadonlyRequestCookies,
  requestUrl?: string
) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore, requestUrl);
  if (firebaseUser) {
    const supabase = getSupabaseServiceClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContentPage(params, supabase, supabaseCompatibleUser);
  }

  const supabase = getSupabaseServiceClient();
  return getUserContentPage(params, supabase);
}

export async function getContentByIdServer(
  id: string,
  cookieStore: ReadonlyRequestCookies,
  requestUrl?: string
) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore, requestUrl);
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    const supabase = getSupabaseServiceClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getContentById(id, supabase, supabaseCompatibleUser);
  }

  const supabase = getSupabaseServiceClient();
  return getContentById(id, supabase);
}

export async function getUserStatsServer(cookieStore: ReadonlyRequestCookies, requestUrl?: string) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore, requestUrl);
  if (firebaseUser) {
    const supabase = getSupabaseServiceClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserStats(supabase, supabaseCompatibleUser);
  }

  const supabase = getSupabaseServiceClient();
  return getUserStats(supabase);
}
