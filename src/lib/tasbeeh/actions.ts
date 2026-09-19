"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Only async functions belong in this file — see dhikr.ts for why.

/** Records a finished round. Silent on failure — never lose a count to a network blip. */
export async function saveTasbeehSession(
  dhikr: string,
  count: number,
  target: number | null,
) {
  if (!Number.isFinite(count) || count <= 0) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("tasbeeh_sessions").insert({
    user_id: user.id,
    dhikr,
    count: Math.floor(count),
    target,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasbeeh");
  return { ok: true };
}
