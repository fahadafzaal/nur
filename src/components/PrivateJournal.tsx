"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX = 20000;
const SAVE_DELAY_MS = 900;

type Status = "loading" | "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * A private journal attached to something — a surah, a Seerah episode.
 *
 * Saves itself shortly after typing stops, on blur, and on the way out of
 * the page, so a reflection is never lost to a forgotten button. The table
 * must have (user_id, …keys) as its primary key and a `body` column; Row
 * Level Security keeps every entry private to its author.
 */
export default function PrivateJournal({
  table,
  keys,
  title,
  placeholder,
  label,
}: {
  table: "quran_notes" | "seerah_reflections";
  /** Identifies the entry besides the user, e.g. { surah_no: 2 }. */
  keys: Record<string, string | number>;
  title: string;
  placeholder: string;
  label: string;
}) {
  const supabase = useRef(createClient()).current;
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const userIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef("");
  const lastSavedRef = useRef("");

  // Stable across renders for a given entry.
  const keyJson = JSON.stringify(keys);
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setStatus("error");
        return;
      }
      userIdRef.current = user.id;

      let query = supabase.from(table).select("body, updated_at").eq("user_id", user.id);
      for (const [k, v] of Object.entries(keysRef.current)) query = query.eq(k, v);
      const { data, error } = await query.maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      const text: string = data?.body ?? "";
      setBody(text);
      latestRef.current = text;
      lastSavedRef.current = text;
      setSavedAt(data?.updated_at ? new Date(data.updated_at) : null);
      setStatus("idle");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, table, keyJson]);

  const save = useCallback(async () => {
    const text = latestRef.current;
    const userId = userIdRef.current;
    if (!userId || text === lastSavedRef.current) return;

    setStatus("saving");
    const { error } = await supabase
      .from(table)
      .upsert(
        { user_id: userId, ...keysRef.current, body: text },
        { onConflict: ["user_id", ...Object.keys(keysRef.current)].join(",") },
      );
    if (error) {
      setStatus("error");
      return;
    }
    lastSavedRef.current = text;
    setSavedAt(new Date());
    setStatus(latestRef.current === text ? "saved" : "dirty");
  }, [supabase, table]);

  // Flush on the way out, so closing the tab doesn't lose the last sentence.
  useEffect(() => {
    const flush = () => {
      if (latestRef.current !== lastSavedRef.current) void save();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [save]);

  function onChange(text: string) {
    const clipped = text.slice(0, MAX);
    setBody(clipped);
    latestRef.current = clipped;
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), SAVE_DELAY_MS);
  }

  const statusText =
    status === "loading"
      ? "Opening your journal…"
      : status === "saving"
        ? "Saving…"
        : status === "dirty"
          ? "Editing…"
          : status === "error"
            ? "Couldn't save — check your connection. Your text is still here."
            : savedAt
              ? `Saved ${savedAt.toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Private to you";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-parchment text-lg">{title}</h2>
        <span className="font-body text-muted/60 text-[10px] tracking-[0.18em] uppercase">
          Private
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => void save()}
        disabled={status === "loading"}
        rows={10}
        placeholder={placeholder}
        aria-label={label}
        className="bg-surface/70 text-parchment placeholder:text-muted/50 focus:border-gold/50 focus:ring-gold/30 font-body mt-4 w-full resize-y rounded-2xl border border-white/10 px-5 py-4 text-[15px] leading-relaxed outline-none focus:ring-1 disabled:opacity-50"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p
          role="status"
          className={`font-body text-xs ${status === "error" ? "text-rose" : "text-muted"}`}
        >
          {statusText}
        </p>
        <p className="font-body text-muted/50 text-[10px] tabular-nums">
          {body.length.toLocaleString()} / {MAX.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
