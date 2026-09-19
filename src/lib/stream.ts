import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Shared by every route that plays PRIVATE audio (library nasheeds, Seerah
 * narration). The <audio> element points at the route; the file's real
 * location is never sent to the browser.
 *
 *   1. signed in?                       401 otherwise
 *   2. the item exists and is visible   404 otherwise (RLS decides)
 *   3. member, or the item is free      403 otherwise
 *   4. mint a signed URL and redirect
 *
 * Step 3 is also enforced by the storage policy on the private bucket, so a
 * non-member calling the Storage API directly is refused by the database.
 *
 * Signed URLs last an hour rather than seconds: browsers fetch audio in
 * ranged chunks *throughout* playback, so a 60-second URL would cut a track
 * off partway. An hour is still useless as a link to share.
 */
const SIGNED_URL_SECONDS = 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function streamPrivateAudio(
  table: "nasheeds" | "seerah_episodes",
  id: string,
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const { data: item } = await supabase
    .from(table)
    .select("audio_path, is_member_only")
    .eq("id", id)
    .maybeSingle();

  if (!item?.audio_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (item.is_member_only) {
    const { data: member } = await supabase.rpc("is_member");
    if (!member) {
      return NextResponse.json({ error: "members_only" }, { status: 403 });
    }
  }

  const { data: signed, error } = await supabase.storage
    .from("nasheeds")
    .createSignedUrl(item.audio_path, SIGNED_URL_SECONDS);

  if (error || !signed?.signedUrl) {
    // Also what a non-member gets for a free-flagged item whose file sits in
    // the private bucket: the storage policy has the final word.
    return NextResponse.json({ error: "unavailable" }, { status: 403 });
  }

  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "private, no-store" },
  });
}
