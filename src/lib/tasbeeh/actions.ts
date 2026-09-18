"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DhikrOption = {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
};

export const DHIKR: DhikrOption[] = [
  { id: "subhanallah", arabic: "سُبْحَانَ ٱللَّٰه", translit: "SubhanAllah", meaning: "Glory be to Allah" },
  { id: "alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰه", translit: "Alhamdulillah", meaning: "All praise is for Allah" },
  { id: "allahuakbar", arabic: "ٱللَّٰهُ أَكْبَر", translit: "Allahu Akbar", meaning: "Allah is the greatest" },
  { id: "tahlil", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰه", translit: "La ilaha illa Allah", meaning: "There is no god but Allah" },
  { id: "istighfar", arabic: "أَسْتَغْفِرُ ٱللَّٰه", translit: "Astaghfirullah", meaning: "I seek forgiveness from Allah" },
];

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
