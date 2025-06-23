import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getServerSideUser } from "@/lib/firebase-server-utils";
import logger from "@/lib/logger";
import {
  getUserContent,
  getContentById,
  getUserStats,
  getUserContentPage,
} from "@/lib/content-service";
import type { ContentQueryParams } from "@/lib/content-types";
import { getSetlistById } from "@/lib/setlist-service";

export async function getUserContentServer() {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser();
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    if (!isSupabaseConfigured) {
      return getUserContent();
    }
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContent(supabase, supabaseCompatibleUser);
  }
  
  // Fallback to original Supabase authentication
  if (!isSupabaseConfigured) {
    return getUserContent();
  }
  const supabase = await getSupabaseServerClient();
  return getUserContent(supabase);
}

export async function getUserContentPageServer(params: ContentQueryParams) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser();
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    if (!isSupabaseConfigured) {
      return getUserContentPage(params);
    }
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserContentPage(params, supabase, supabaseCompatibleUser);
  }
  
  // Fallback to original Supabase authentication
  if (!isSupabaseConfigured) {
    // reuse browser implementation in demo mode
    return getUserContentPage(params);
  }
  const supabase = await getSupabaseServerClient();
  return getUserContentPage(params, supabase);
}

export async function getContentByIdServer(id: string) {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser();
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    if (!isSupabaseConfigured) {
      return getContentById(id);
    }
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getContentById(id, supabase, supabaseCompatibleUser);
  }
  
  // Fallback to original Supabase authentication
  if (!isSupabaseConfigured) {
    return getContentById(id);
  }
  const supabase = await getSupabaseServerClient();
  return getContentById(id, supabase);
}

export async function getUserStatsServer() {
  // Check Firebase authentication first
  const firebaseUser = await getServerSideUser();
  if (firebaseUser) {
    // User is authenticated with Firebase, but we need to use Supabase for data
    if (!isSupabaseConfigured) {
      return getUserStats();
    }
    const supabase = await getSupabaseServerClient();
    // Convert Firebase user to match Supabase format for content service
    const supabaseCompatibleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
    return getUserStats(supabase, supabaseCompatibleUser);
  }
  
  // Fallback to original Supabase authentication
  if (!isSupabaseConfigured) {
    return getUserStats();
  }
  const supabase = await getSupabaseServerClient();
  return getUserStats(supabase);
}

export async function getSetlistByIdServer(id: string) {
  if (!isSupabaseConfigured) {
    return getSetlistById(id);
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: setlist, error: setlistError } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
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
