import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaUrl, type Track } from "@/lib/media";

type NasheedRow = {
  id: string;
  title: string;
  artist: string;
  description: string;
  audio_path: string | null;
  preview_path: string | null;
  cover_path: string | null;
  duration_s: number | null;
  is_member_only: boolean;
  themes: string[];
};

const COLUMNS =
  "id, title, artist, description, audio_path, preview_path, cover_path, duration_s, is_member_only, themes";

/**
 * Maps a database row to what the browser is allowed to know. Notably
 * `audio_path` is reduced to a boolean: the private file's location is
 * never serialised into a page.
 */
export function toTrack(row: NasheedRow): Track {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    description: row.description,
    cover: mediaUrl(row.cover_path),
    preview: mediaUrl(row.preview_path),
    durationS: row.duration_s,
    memberOnly: row.is_member_only,
    hasAudio: Boolean(row.audio_path),
    themes: row.themes ?? [],
  };
}

export async function getTracks(supabase: SupabaseClient): Promise<Track[]> {
  const { data } = await supabase
    .from("nasheeds")
    .select(COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => toTrack(r as NasheedRow));
}

export async function getTrack(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from("nasheeds")
    .select(COLUMNS)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  return data ? toTrack(data as NasheedRow) : null;
}

/** The first published track tagged with a theme, for reminder pairing. */
export async function getTrackForTheme(supabase: SupabaseClient, theme: string) {
  const { data } = await supabase
    .from("nasheeds")
    .select(COLUMNS)
    .eq("published", true)
    .contains("themes", [theme])
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? toTrack(data as NasheedRow) : null;
}

/** Whether the signed-in user is a member (or an admin). */
export async function getAccess(supabase: SupabaseClient) {
  const [{ data: member }, { data: admin }] = await Promise.all([
    supabase.rpc("is_member"),
    supabase.rpc("is_admin"),
  ]);
  return { isMember: Boolean(member), isAdmin: Boolean(admin) };
}
