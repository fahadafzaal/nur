"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = { title: string; body: string };

/**
 * The client's Daily Lesson for a surah, written in the admin panel.
 * Rendered as plain paragraphs — never as HTML — so nothing typed into the
 * admin panel can inject markup into the page.
 */
export default function SurahLesson({
  surah,
  name,
}: {
  surah: number;
  name: string;
}) {
  const [state, setState] = useState<"loading" | "empty" | "error" | Lesson>(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("surah_lessons")
      .select("title, body")
      .eq("surah_no", surah)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setState("error");
        else if (!data || !data.body.trim()) setState("empty");
        else setState(data);
      });
    return () => {
      cancelled = true;
    };
  }, [surah]);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="bg-surface/60 h-6 w-2/3 animate-pulse rounded" />
        <div className="bg-surface/60 h-4 w-full animate-pulse rounded" />
        <div className="bg-surface/60 h-4 w-5/6 animate-pulse rounded" />
      </div>
    );
  }

  if (state === "empty" || state === "error") {
    return (
      <div className="border-gold/15 bg-surface/40 rounded-2xl border px-6 py-10 text-center">
        <p className="font-display text-parchment text-lg">
          The lesson for {name} is being prepared
        </p>
        <p className="font-body text-muted mx-auto mt-3 max-w-sm text-sm leading-relaxed">
          {state === "error"
            ? "It couldn't be loaded just now — please try again shortly."
            : "Lessons are added surah by surah. In the meantime, the My Notes tab is yours to reflect in."}
        </p>
      </div>
    );
  }

  const paragraphs = state.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="border-gold/15 bg-surface/40 rounded-2xl border px-6 py-8">
      <p className="font-body text-gold/70 text-[10px] tracking-[0.22em] uppercase">
        Daily lesson · {name}
      </p>
      {state.title ? (
        <h2 className="font-display text-gold-light mt-3 text-2xl">
          {state.title}
        </h2>
      ) : null}
      <div className="mt-5 flex flex-col gap-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="font-body text-parchment/90 text-[15px] leading-relaxed whitespace-pre-line"
          >
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
