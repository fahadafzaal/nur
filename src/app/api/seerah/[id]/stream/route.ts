import type { NextRequest } from "next/server";
import { streamPrivateAudio } from "@/lib/stream";

/** GET /api/seerah/:id/stream — Seerah narration. See src/lib/stream.ts. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return streamPrivateAudio("seerah_episodes", id);
}
