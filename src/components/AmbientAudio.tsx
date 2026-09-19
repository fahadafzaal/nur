"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AMBIENT_STORAGE_KEY, AMBIENT_TRACK } from "@/lib/audio/ambient";
import { onAudioFocus } from "@/lib/audio/focus";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { mediaUrl } from "@/lib/media";

type Source = { src: string; title: string; start: number; end: number };

/** Screens with no bottom navigation, where the control sits in the corner. */
const NAVLESS = ["/", "/join", "/sign-in"];

/**
 * The app-wide ambient nasheed.
 *
 * Constraints taken from §5 of the project documentation, all deliberate:
 *
 *   · it starts on the first user interaction, never on page load — both
 *     because browsers block autoplay-with-sound, and because sound
 *     arriving unasked is the fastest way to make someone close a tab
 *   · the mute control is always visible
 *   · it must never feel intrusive, so it opens quietly at 35%
 *   · it lives in the root layout, so it survives navigation instead of
 *     restarting on every page
 *   · the choice is remembered per device
 *
 * Which track, and which window of it, comes from app_settings, so the
 * client can change it from the admin panel without a deploy. Until one is
 * set it falls back to /audio/ambient.mp3; if neither exists the control
 * removes itself rather than leaving a button that does nothing.
 *
 * It steps aside for recitation and library nasheeds (audio focus), and
 * rises above any player bar via --nur-player-h so they never overlap.
 */
export default function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const pathname = usePathname();

  const [source, setSource] = useState<Source | null>(null);
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState<number>(AMBIENT_TRACK.defaultVolume);
  const [open, setOpen] = useState(false);

  // Clip bounds read inside media callbacks — kept in a ref so the
  // callbacks don't need to be recreated when settings arrive.
  const clipRef = useRef<{ start: number; end: number }>({
    start: AMBIENT_TRACK.clipStart,
    end: AMBIENT_TRACK.clipEnd,
  });

  // ---- Which track to play ----
  useEffect(() => {
    const fallback: Source = {
      src: AMBIENT_TRACK.src,
      title: AMBIENT_TRACK.title,
      start: AMBIENT_TRACK.clipStart,
      end: AMBIENT_TRACK.clipEnd,
    };
    if (!isSupabaseConfigured) {
      setSource(fallback);
      return;
    }
    let cancelled = false;
    createClient()
      .from("app_settings")
      .select("ambient_path, ambient_title, ambient_start, ambient_end")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const url = mediaUrl(data?.ambient_path);
        setSource(
          url && data
            ? {
                src: url,
                title: data.ambient_title,
                start: data.ambient_start,
                end: data.ambient_end,
              }
            : fallback,
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (source) clipRef.current = { start: source.start, end: source.end };
  }, [source]);

  // ---- Remembered preference. Storage throws in private windows. ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AMBIENT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { muted?: boolean; volume?: number };
      if (typeof saved.muted === "boolean") setMuted(saved.muted);
      if (typeof saved.volume === "number") {
        setVolume(Math.min(1, Math.max(0, saved.volume)));
      }
    } catch {
      /* no stored preference — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AMBIENT_STORAGE_KEY, JSON.stringify({ muted, volume }));
    } catch {
      /* not fatal */
    }
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted, source]);

  const begin = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || startedRef.current) return;
    startedRef.current = true;
    try {
      audio.currentTime = clipRef.current.start;
      await audio.play();
      setPlaying(true);
    } catch {
      // Autoplay still refused; the visible control can start it instead.
      startedRef.current = false;
    }
  }, []);

  // First interaction anywhere on the page starts it.
  useEffect(() => {
    if (!available || !source) return;
    const onFirst = () => void begin();
    const opts = { once: true, passive: true } as const;
    document.addEventListener("pointerdown", onFirst, opts);
    document.addEventListener("keydown", onFirst, opts);
    return () => {
      document.removeEventListener("pointerdown", onFirst);
      document.removeEventListener("keydown", onFirst);
    };
  }, [available, source, begin]);

  // Step aside for recitation or a library nasheed and come back after —
  // but only if the ambient loop was actually playing when asked.
  const pausedForRef = useRef<Set<string>>(new Set());
  useEffect(
    () =>
      onAudioFocus({
        claimed: (owner) => {
          const audio = audioRef.current;
          if (!audio) return;
          // Paused because the listener muted/stopped it: nothing to restore.
          // Paused on another player's behalf: record this claim too, so
          // that player's release doesn't resume us under this one.
          if (audio.paused && pausedForRef.current.size === 0) return;
          pausedForRef.current.add(owner);
          audio.pause();
        },
        released: (owner) => {
          const audio = audioRef.current;
          if (!audio || !pausedForRef.current.delete(owner)) return;
          if (pausedForRef.current.size === 0) void audio.play().catch(() => {});
        },
      }),
    [],
  );

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const { start, end } = clipRef.current;
    if (audio.currentTime >= end || audio.currentTime < start - 0.5) {
      audio.currentTime = start;
    }
  }, []);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (!startedRef.current) {
      void begin();
      setMuted(false);
      return;
    }
    setMuted((m) => !m);
  }, [begin]);

  if (!available || !source) return null;

  const silent = muted || volume === 0;
  const navless = NAVLESS.includes(pathname) || pathname.startsWith("/auth");
  const bottom = navless
    ? "calc(1rem + env(safe-area-inset-bottom, 0px))"
    : "calc(4.75rem + var(--nur-player-h, 0rem) + env(safe-area-inset-bottom, 0px))";

  return (
    <>
      <audio
        ref={audioRef}
        src={source.src}
        preload="metadata"
        loop
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        // No file supplied yet (or it failed to load): hide the control
        // rather than leave a dead button on screen.
        onError={() => setAvailable(false)}
      />

      <div
        className="fixed right-4 z-50 flex items-center gap-2 transition-[bottom] duration-300"
        style={{ bottom }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div
          className={`border-gold/25 bg-surface/80 flex items-center gap-2 overflow-hidden rounded-full border backdrop-blur transition-all duration-300 ${
            open ? "w-40 px-3" : "w-0 border-transparent px-0"
          }`}
        >
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label="Ambient volume"
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (Number(e.target.value) > 0) setMuted(false);
            }}
            className="accent-gold h-1 w-full cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-pressed={!silent}
          aria-label={silent ? "Turn on ambient nasheed" : "Mute ambient nasheed"}
          title={playing && !silent ? `${source.title} — playing softly` : "Ambient nasheed"}
          className="border-gold/25 bg-surface/80 text-gold-light hover:border-gold/60 hover:text-gold flex h-11 w-11 items-center justify-center rounded-full border opacity-70 backdrop-blur transition hover:opacity-100"
        >
          {silent ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path d="M16 9.5 21 15M21 9.5 16 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.8 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
