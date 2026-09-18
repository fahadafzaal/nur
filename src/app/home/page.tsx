import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/lib/auth/actions";

export const metadata = { title: "Home — NUR" };

/** The six pillars, in the order agreed with the client. */
const PILLARS = [
  { name: "Nasheed", detail: "Members-only library", milestone: "M5" },
  { name: "Qur'an Explorer", detail: "Mushaf, lessons, notes", milestone: "M4" },
  { name: "Seerah", detail: "By character, not by date", milestone: "M6" },
  { name: "Tasbeeh", detail: "Dhikr counter", milestone: "M3" },
  { name: "Shop", detail: "Modest fashion", milestone: "M8" },
  { name: "Health", detail: "Sleep, water, fasting", milestone: "M3" },
];

export default async function HomePage() {
  // Before Supabase is configured the proxy passes everything through, so
  // this route is reachable. Bounce rather than crash on an empty client.
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already guards this route; this is defence in depth in
  // case the matcher ever changes.
  if (!user) redirect("/sign-in?next=/home");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, membership_status")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name?.trim();
  const status = profile?.membership_status ?? "free";

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-14">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-muted text-xs tracking-[0.2em] uppercase">
            Assalamu alaikum
          </p>
          <h1 className="font-display text-gold-light mt-2 text-3xl">
            {name ? name : "Welcome"}
          </h1>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="font-body text-muted hover:text-parchment rounded-full border border-white/10 px-4 py-2 text-xs transition"
          >
            Sign out
          </button>
        </form>
      </header>

      <p className="font-body text-muted mt-6 text-sm leading-relaxed">
        Your account is active
        {status === "member" ? " with full membership." : " on a free account."}{" "}
        The daily reminder, tasbeeh and health tracker arrive next.
      </p>

      <section className="mt-10 grid grid-cols-2 gap-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.name}
            className="border-gold/15 bg-surface/50 rounded-2xl border p-4"
          >
            <p className="font-display text-parchment text-base">
              {pillar.name}
            </p>
            <p className="font-body text-muted mt-1 text-xs leading-relaxed">
              {pillar.detail}
            </p>
            <p className="font-body text-gold/60 mt-3 text-[10px] tracking-[0.18em] uppercase">
              {pillar.milestone}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
