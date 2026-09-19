import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSurah } from "@/lib/quran";
import { TRAITS, getTrait } from "@/lib/seerah";
import { formatDuration } from "@/lib/media";
import VerseMarker from "@/components/quran/VerseMarker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trait: string }>;
}) {
  const { trait } = await params;
  const t = getTrait(trait);
  return { title: t ? `${t.name} · Seerah — NUR` : "Seerah — NUR" };
}

export default async function TraitPage({
  params,
}: {
  params: Promise<{ trait: string }>;
}) {
  const { trait: slug } = await params;
  const trait = getTrait(slug);
  if (!trait) notFound();

  const supabase = await createClient();
  const [{ data: episodes }, surah] = await Promise.all([
    supabase
      .from("seerah_episodes")
      .select("id, title, summary, duration_s, is_member_only, audio_path")
      .eq("trait", trait.slug)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getSurah(trait.verse.surah),
  ]);

  // Read verbatim from the Qur'an data, never retyped.
  const verse = surah?.ayahs.find((a) => a.n === trait.verse.ayah);
  const index = TRAITS.findIndex((t) => t.slug === trait.slug);
  const next = TRAITS[(index + 1) % TRAITS.length];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-8 pb-44">
      <Link href="/seerah" className="font-body text-muted hover:text-parchment text-xs transition">
        ← All qualities
      </Link>

      <header className="mt-6 text-center">
        <p lang="ar" dir="rtl" className="font-arabic text-gold-light text-6xl leading-tight">
          {trait.arabic}
        </p>
        <h1 className="font-display text-parchment mt-3 text-3xl">{trait.name}</h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          {trait.line}
        </p>
      </header>

      {verse && surah ? (
        <figure className="border-gold/20 relative mt-10 overflow-hidden rounded-3xl border px-6 py-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(80% 80% at 50% 0%, rgba(201,162,39,0.12) 0%, transparent 70%)" }}
          />
          <p lang="ar" dir="rtl" className="font-arabic text-parchment relative text-right text-2xl leading-[2.1]">
            {verse.ar}
            <VerseMarker n={verse.n} />
          </p>
          <blockquote className="font-display text-muted relative mt-4 text-[15px] leading-relaxed italic">
            {verse.en}
          </blockquote>
          <figcaption className="relative mt-4">
            <Link
              href={`/quran/${surah.number}#v-${verse.n}`}
              className="font-body text-gold/80 hover:text-gold-light text-xs"
            >
              {surah.name} {surah.number}:{verse.n} →
            </Link>
          </figcaption>
        </figure>
      ) : null}

      <section className="mt-10">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">Episodes</h2>

        {episodes && episodes.length > 0 ? (
          <ol className="mt-4 flex flex-col gap-2.5">
            {episodes.map((e, i) => (
              <li key={e.id}>
                <Link
                  href={`/seerah/episode/${e.id}`}
                  className="border-gold/10 bg-surface/40 hover:border-gold/40 flex gap-4 rounded-2xl border px-5 py-4 transition"
                >
                  <span className="font-display text-gold/70 w-6 shrink-0 text-lg tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display text-parchment block text-base">{e.title}</span>
                    {e.summary ? (
                      <span className="font-body text-muted mt-1 line-clamp-2 block text-xs leading-relaxed">
                        {e.summary}
                      </span>
                    ) : null}
                    <span className="font-body text-muted/60 mt-2 block text-[10px] tracking-wide">
                      {[e.audio_path ? "Narrated" : "Written", formatDuration(e.duration_s), e.is_member_only ? "Members" : "Free"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border-gold/15 bg-surface/40 font-body text-muted mt-4 rounded-2xl border px-6 py-8 text-center text-sm leading-relaxed">
            The episodes on {trait.name.toLowerCase()} are being written and
            narrated. They will appear here as each one is ready.
          </p>
        )}
      </section>

      <p className="mt-12 text-center">
        <Link href={`/seerah/${next.slug}`} className="font-body text-gold-light text-sm">
          Next: {next.name} →
        </Link>
      </p>
    </main>
  );
}
