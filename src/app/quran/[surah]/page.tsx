import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurah, getSurahIndex } from "@/lib/quran";
import SurahReader from "@/components/quran/SurahReader";

/**
 * Every surah page is prerendered at build time from the Qur'an data that
 * ships with the site, then served from Vercel's CDN. Anything personal —
 * notes, lessons — loads in the browser afterwards, so the page itself can
 * stay fully static.
 */
export async function generateStaticParams() {
  const index = await getSurahIndex();
  return index.map((s) => ({ surah: String(s.number) }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const data = await getSurah(Number(surah));
  return {
    title: data ? `${data.name} · ${data.meaning} — NUR` : "Qur'an — NUR",
  };
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const data = await getSurah(Number(surah));
  if (!data) notFound();

  const prev = data.number > 1 ? data.number - 1 : null;
  const next = data.number < 114 ? data.number + 1 : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-44 sm:px-6">
      <nav className="flex items-center justify-between">
        <Link
          href="/quran"
          className="font-body text-muted hover:text-parchment flex items-center gap-1.5 text-xs transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All surahs
        </Link>
        <div className="flex items-center gap-1">
          {prev ? (
            <Link
              href={`/quran/${prev}`}
              className="font-body text-muted hover:text-parchment rounded-full px-3 py-1.5 text-xs transition"
            >
              ← {prev}
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/quran/${next}`}
              className="font-body text-muted hover:text-parchment rounded-full px-3 py-1.5 text-xs transition"
            >
              {next} →
            </Link>
          ) : null}
        </div>
      </nav>

      <header className="border-gold/15 relative mt-6 overflow-hidden rounded-3xl border px-6 py-9 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 90% at 50% 0%, rgba(201,162,39,0.14) 0%, transparent 70%)",
          }}
        />
        <p className="font-body text-gold/70 relative text-[10px] tracking-[0.24em] uppercase">
          Surah {data.number}
        </p>
        <p
          lang="ar"
          dir="rtl"
          className="font-arabic text-gold-light relative mt-3 text-5xl leading-tight"
        >
          {data.arabic}
        </p>
        <h1 className="font-display text-parchment relative mt-3 text-2xl">
          {data.name}
        </h1>
        <p className="font-body text-muted relative mt-1 text-sm">
          {data.meaning} · {data.revelation} · {data.ayahs.length} verses
        </p>
      </header>

      <div className="mt-8">
        <SurahReader
          number={data.number}
          name={data.name}
          bismillah={data.bismillah}
          verses={data.ayahs.map(({ n, g, ar, en, sajda }) => ({
            n,
            g,
            ar,
            en,
            sajda,
          }))}
        />
      </div>
    </main>
  );
}
