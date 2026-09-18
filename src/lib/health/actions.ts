"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HealthLog = {
  log_date: string;
  sleep_hours: number | null;
  water_ml: number | null;
  fasted: boolean;
};

/** Today's date as YYYY-MM-DD in the user's own timezone, not UTC. */
export async function todayKey(offsetMinutes = 0) {
  const now = new Date(Date.now() - offsetMinutes * 60_000);
  return now.toISOString().slice(0, 10);
}

export async function saveHealthLog(input: {
  logDate: string;
  sleepHours: number | null;
  waterMl: number | null;
  fasted: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("health_logs").upsert(
    {
      user_id: user.id,
      log_date: input.logDate,
      sleep_hours: input.sleepHours,
      water_ml: input.waterMl,
      fasted: input.fasted,
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/health");
  return { ok: true };
}
