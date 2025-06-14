import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getUserContent,
  getContentById,
  getUserStats,
} from "@/lib/content-service";
import { getSetlistById } from "@/lib/setlist-service";

export async function getUserContentServer() {
  if (!isSupabaseConfigured) {
    return getUserContent();
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching content:", error);
    return [];
  }

  return data || [];
}

export async function getContentByIdServer(id: string) {
  if (!isSupabaseConfigured) {
    return getContentById(id);
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserStatsServer() {
  if (!isSupabaseConfigured) {
    return getUserStats();
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      totalContent: 0,
      totalSetlists: 0,
      favoriteContent: 0,
      recentlyViewed: 0,
    };
  }

  const { count: totalContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: favoriteContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_favorite", true);

  let totalSetlists = 0;
  try {
    const { count } = await supabase
      .from("setlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    totalSetlists = count || 0;
  } catch {
    totalSetlists = 0;
  }

  const recentlyViewed = Math.min(totalContent || 0, 10);

  return {
    totalContent: totalContent || 0,
    totalSetlists,
    favoriteContent: favoriteContent || 0,
    recentlyViewed,
  };
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
          bpm
        )
      `,
    )
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  if (songsError) {
    console.error(`Error fetching songs for setlist ${id}:`, songsError);
    return { ...setlist, setlist_songs: [] };
  }

  const formattedSongs = songs.map((song) => ({
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
    },
  }));

  return { ...setlist, setlist_songs: formattedSongs };
}
