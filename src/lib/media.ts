import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Public URL for a file in the public 'media' bucket (previews, cover art,
 * the ambient loop). Built directly rather than via the client so it works
 * in server and client components alike, with no network call.
 */
export function mediaUrl(path: string | null | undefined) {
  if (!path || !SUPABASE_URL) return null;
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/media/${clean}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** What the library and players need to know about a track. */
export type Track = {
  id: string;
  title: string;
  artist: string;
  description: string;
  cover: string | null;
  preview: string | null;
  durationS: number | null;
  memberOnly: boolean;
  hasAudio: boolean;
  themes: string[];
  /** Where the full audio streams from. Defaults to the nasheed route. */
  streamUrl?: string;
};
