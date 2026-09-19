import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * GET /api/nasheeds/:id/stream
 *
 * The only way to reach a full member track. The <audio> element's src is
 * this URL; the file's real location is never sent to the browser.
 *
 *   1. signed in?                       401 otherwise
 *   2. the track exists and is visible  404 otherwise
 *   3. member, or the track is free     403 otherwise
 *   4. mint a signed URL and redirect
 *
 * Step 3 is checked here for a clear error, and again by the storage policy
 * on the private bucket — so a non-member calling the Storage API directly,
 * bypassing this route, is refused by the database too.
 *
 * Why the signed URL lasts an hour rather than seconds: browsers fetch audio
 * in ranged chunks *throughout* playback, not all at once. A 60-second URL
 * would cut a four-minute nasheed off partway through. An hour is still
 * useless as a link to share.
 */
const SIGNED_URL_SECONDS = 60 * 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const { data: track } = await supabase
    .from("nasheeds")
    .select("audio_path, is_member_only")
    .eq("id", id)
    .maybeSingle();

  if (!track?.audio_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (track.is_member_only) {
    const { data: member } = await supabase.rpc("is_member");
    if (!member) {
      return NextResponse.json({ error: "members_only" }, { status: 403 });
    }
  }

  const { data: signed, error } = await supabase.storage
    .from("nasheeds")
    .createSignedUrl(track.audio_path, SIGNED_URL_SECONDS);

  if (error || !signed?.signedUrl) {
    // Also what a non-member sees if they reach here for a free-flagged
    // track whose file sits in the private bucket: the storage policy wins.
    return NextResponse.json({ error: "unavailable" }, { status: 403 });
  }

  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "private, no-store" },
  });
}
