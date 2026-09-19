"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SurahMeta } from "@/lib/quran";

/** Lower-case, strip apostrophes/hyphens, so "al fatiha" finds "Al-Faatiha". */
function fold(s: string) {
  return s.toLowerCase().replace(/[''`\-\s]/g, "").replace(/aa/g, "a");
}

export default function SurahList({ surahs }: { surahs: SurahMeta[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === query.trim() ||
        fold(s.name).includes(q) ||
        fold(s.meaning).includes(q) ||
        s.arabic.includes(query.trim()),
    );
  }, [query, surahs]);

  return (
    <>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="text-muted pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, meaning or number"
          aria-label="Search surahs"
          className="bg-surface/80 text-parchment placeholder:text-muted/60 focus:border-gold/60 focus:ring-gold/40 w-full rounded-full border border-white/10 py-3 pr-4 pl-11 text-sm outline-none focus:ring-1"
        />
      </div>

      <p className="font-body text-muted mt-4 text-xs">
        {results.length === surahs.length
          ? "114 surahs"
          : `${results.length} of 114`}
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {results.map((s) => (
          <li key={s.number}>
            <Link
              href={`/quran/${s.number}`}
              className="group border-gold/10 bg-surface/40 hover:border-gold/40 hover:bg-surface/70 flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition"
            >
              {/* Number set inside an eight-point star */}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <svg viewBox="0 0 40 40" className="text-gold/50 group-hover:text-gold absolute inset-0 transition">
                  <path
                    d="M20 2 L25.5 9 L34 8 L33 16.5 L38 20 L33 23.5 L34 32 L25.5 31 L20 38 L14.5 31 L6 32 L7 23.5 L2 20 L7 16.5 L6 8 L14.5 9 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                <span className="font-body text-parchment relative text-xs tabular-nums">
                  {s.number}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="font-display text-parchment block truncate text-base">
                  {s.name}
                </span>
                <span className="font-body text-muted block truncate text-xs">
                  {s.meaning} · {s.ayahs} verses
                </span>
              </span>

              <span
                lang="ar"
                dir="rtl"
                className="font-arabic text-gold-light shrink-0 text-xl"
              >
                {s.arabic.replace(/^سُورَةُ\s*/, "")}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 ? (
        <p className="font-body text-muted mt-8 text-center text-sm">
          No surah matches &ldquo;{query}&rdquo;.
        </p>
      ) : null}
    </>
  );
}
