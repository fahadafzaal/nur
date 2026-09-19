import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TRAITS } from "@/lib/seerah";

export const metadata = { title: "Seerah — NUR" };

export default async function SeerahPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seerah_episodes")
    .select("trait")
    .eq("published", true);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.trait, (counts.get(row.trait) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-12 pb-44">
      <header className="text-center">
        <p lang="ar" dir="rtl" className="font-arabic text-gold-light text-4xl">
          السِّيرَة
        </p>
        <h1 className="font-display text-parchment mt-3 text-3xl">Seerah</h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          The life of the Prophet ﷺ, told through his character rather than
          his calendar — six qualities, one at a time.
        </p>
      </header>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {TRAITS.map((t) => {
          const n = counts.get(t.slug) ?? 0;
          return (
            <li key={t.slug}>
              <Link
                href={`/seerah/${t.slug}`}
                className="group border-gold/15 bg-surface/40 hover:border-gold/45 hover:bg-surface/70 relative flex h-full flex-col overflow-hidden rounded-3xl border px-6 py-6 transition"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 transition group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(201,162,39,0.18) 0%, transparent 70%)" }}
                />
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-parchment text-2xl">{t.name}</span>
                  <span lang="ar" dir="rtl" className="font-arabic text-gold-light text-3xl">
                    {t.arabic}
                  </span>
                </span>
                <span className="font-body text-gold/60 mt-1 text-[11px] tracking-wide">
                  {t.translit}
                </span>
                <span className="font-body text-muted mt-4 flex-1 text-sm leading-relaxed">
                  {t.line}
                </span>
                <span className="font-body text-muted/60 mt-5 text-[10px] tracking-[0.18em] uppercase">
                  {n === 0 ? "Episodes coming" : `${n} ${n === 1 ? "episode" : "episodes"}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
