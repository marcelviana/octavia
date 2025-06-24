import { getSupabaseServerClient } from "@/lib/supabase-server";
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

export async function getUserContentServer(cookieStore: ReadonlyRequestCookies) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore);
  if (firebaseUser) {
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContent(supabase, supabaseCompatibleUser);
  }

  const supabase = await getSupabaseServerClient();
  return getUserContent(supabase);
}

export async function getUserContentPageServer(
  params: ContentQueryParams,
  cookieStore: ReadonlyRequestCookies
) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore);
  if (firebaseUser) {
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContentPage(params, supabase, supabaseCompatibleUser);
  }

  const supabase = await getSupabaseServerClient();
  return getUserContentPage(params, supabase);
}

export async function getContentByIdServer(
  id: string,
  cookieStore: ReadonlyRequestCookies
) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore);
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getContentById(id, supabase, supabaseCompatibleUser);
  }

  const supabase = await getSupabaseServerClient();
  return getContentById(id, supabase);
}

export async function getUserStatsServer(cookieStore: ReadonlyRequestCookies) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser(cookieStore);
  if (firebaseUser) {
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserStats(supabase, supabaseCompatibleUser);
  }

  const supabase = await getSupabaseServerClient();
  return getUserStats(supabase);
}

export async function getSetlistByIdServer(
  id: string,
  cookieStore: ReadonlyRequestCookies
) {

  const firebaseUser = await getServerSideUser(cookieStore);
  if (!firebaseUser) {
    throw new Error("User not authenticated");
  }

  const supabase = await getSupabaseServerClient();

  const { data: setlist, error: setlistError } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", firebaseUser.uid)
    .single();

  if (setlistError) {
    throw setlistError;
  }

  const { data: songs, error: songsError } = await supabase
    .from("setlist_songs")
    .select(
      `
        id,
        setlist_id,
        content_id,
        position,
        notes,
        content:content_id (
          id,
          title,
          artist,
          content_type,
          key,
          bpm,
          file_url,
          content_data
        )
      `,
    )
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  if (songsError) {
    logger.error(`Error fetching songs for setlist ${id}:`, songsError);
    return { ...setlist, setlist_songs: [] };
  }

  const formattedSongs = songs.map((song: any) => ({
    id: song.id,
    setlist_id: song.setlist_id,
    content_id: song.content_id,
    position: song.position,
    notes: song.notes,
    content: {
      id: song.content?.id || song.content_id,
      title: song.content?.title || "Unknown Title",
      artist: song.content?.artist || "Unknown Artist",
      content_type: song.content?.content_type || "Unknown Type",
      key: song.content?.key || null,
      bpm: song.content?.bpm || null,
      file_url: song.content?.file_url || null,
      content_data: song.content?.content_data || null,
    },
  }));

  return { ...setlist, setlist_songs: formattedSongs };
}
