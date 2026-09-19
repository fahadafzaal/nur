import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/lib/auth/actions";
import { reminderForDate } from "@/lib/reminders";

export const metadata = { title: "Home — NUR" };

/** The six pillars. `href` null means the section is not built yet. */
const PILLARS: {
  name: string;
  detail: string;
  href: string | null;
  note?: string;
}[] = [
  { name: "Qur'an Explorer", detail: "114 surahs, recitation, notes", href: "/quran" },
  { name: "Nasheed", detail: "Members-only library", href: "/nasheeds" },
  { name: "Seerah", detail: "By character, not by date", href: "/seerah" },
  { name: "Tasbeeh", detail: "Dhikr counter", href: "/tasbeeh" },
  { name: "Health", detail: "Sleep, water, fasting", href: "/health" },
  { name: "Shop", detail: "Modest fashion", href: "/shop" },
];

export default async function HomePage() {
  if (!isSupabaseConfigured) redirect("/sign-in");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/home");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, membership_status, role")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name?.trim();
  const reminder = reminderForDate();

  return (
    <main className="mx-auto w-full max-w-lg px-6 pt-12 pb-28">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-muted text-xs tracking-[0.2em] uppercase">
            Assalamu alaikum
          </p>
          <h1 className="font-display text-gold-light mt-2 text-3xl">
            {name ?? "Welcome"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "admin" ? (
            <Link
              href="/admin"
              className="font-body border-gold/40 text-gold-light rounded-full border px-4 py-2 text-xs"
            >
              Admin
            </Link>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="font-body text-muted hover:text-parchment rounded-full border border-white/10 px-4 py-2 text-xs transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Today's reminder — the daily ritual the whole app is built around */}
      <section className="border-gold/20 from-surface/70 to-surface/30 relative mt-9 overflow-hidden rounded-3xl border bg-gradient-to-b p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,162,39,0.18) 0%, transparent 70%)",
          }}
        />
        <p className="font-body text-gold/70 text-[10px] tracking-[0.22em] uppercase">
          Today&apos;s reminder
        </p>
        <blockquote className="font-display text-parchment mt-4 text-lg leading-relaxed">
          {reminder.text}
        </blockquote>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-body text-muted text-[11px] tracking-wide capitalize">
            on {reminder.theme}
          </p>
          <Link
            href={`/reminders/${reminder.id}`}
            className="font-body text-gold-light text-xs underline-offset-4 hover:underline"
          >
            Reflect &amp; listen →
          </Link>
        </div>
      </section>

      <section className="mt-9">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">
          Explore
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {PILLARS.map((pillar) => {
            const inner = (
              <>
                <p className="font-display text-parchment text-base">
                  {pillar.name}
                </p>
                <p className="font-body text-muted mt-1 text-xs leading-relaxed">
                  {pillar.detail}
                </p>
                {pillar.note ? (
                  <p className="font-body text-muted/50 mt-3 text-[10px] tracking-[0.16em] uppercase">
                    {pillar.note}
                  </p>
                ) : null}
              </>
            );

            return pillar.href ? (
              <Link
                key={pillar.name}
                href={pillar.href}
                className="border-gold/20 bg-surface/50 hover:border-gold/50 hover:bg-surface/70 rounded-2xl border p-4 transition"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={pillar.name}
                aria-disabled="true"
                className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 opacity-55"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
