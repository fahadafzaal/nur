"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AMBIENT_STORAGE_KEY, AMBIENT_TRACK } from "@/lib/audio/ambient";

/**
 * The app-wide ambient nasheed.
 *
 * Constraints taken from §5 of the project documentation, all of them
 * deliberate:
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
 * It loops a window (1:08–1:53) out of the full track rather than needing a
 * pre-trimmed file. If no audio file has been supplied yet, the whole
 * control removes itself rather than showing a button that does nothing.
 */
export default function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);

  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState<number>(AMBIENT_TRACK.defaultVolume);
  const [open, setOpen] = useState(false);

  // Restore the listener's previous choice. Wrapped because storage throws
  // in private windows and when site data is blocked.
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
      localStorage.setItem(
        AMBIENT_STORAGE_KEY,
        JSON.stringify({ muted, volume }),
      );
    } catch {
      /* not fatal */
    }
  }, [muted, volume]);

  // Push state onto the element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const begin = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || startedRef.current) return;
    startedRef.current = true;
    try {
      audio.currentTime = AMBIENT_TRACK.clipStart;
      await audio.play();
      setPlaying(true);
    } catch {
      // Autoplay still refused; let the visible control start it instead.
      startedRef.current = false;
    }
  }, []);

  // First interaction anywhere on the page starts it.
  useEffect(() => {
    if (!available) return;
    const onFirst = () => void begin();
    const opts = { once: true, passive: true } as const;
    document.addEventListener("pointerdown", onFirst, opts);
    document.addEventListener("keydown", onFirst, opts);
    return () => {
      document.removeEventListener("pointerdown", onFirst);
      document.removeEventListener("keydown", onFirst);
    };
  }, [available, begin]);

  // Keep playback inside the clip window.
  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (
      audio.currentTime >= AMBIENT_TRACK.clipEnd ||
      audio.currentTime < AMBIENT_TRACK.clipStart - 0.5
    ) {
      audio.currentTime = AMBIENT_TRACK.clipStart;
    }
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!startedRef.current) {
      void begin();
      setMuted(false);
      return;
    }
    setMuted((m) => !m);
  }, [begin]);

  if (!available) return null;

  const silent = muted || volume === 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={AMBIENT_TRACK.src}
        preload="metadata"
        loop
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        // No file supplied yet (or it failed to load) — hide the control
        // rather than leave a dead button on screen.
        onError={() => setAvailable(false)}
      />

      <div
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
          aria-label={
            silent ? "Turn on ambient nasheed" : "Mute ambient nasheed"
          }
          title={
            playing && !silent
              ? `${AMBIENT_TRACK.title} — playing softly`
              : "Ambient nasheed"
          }
          className="border-gold/25 bg-surface/80 text-gold-light hover:border-gold/60 hover:text-gold flex h-11 w-11 items-center justify-center rounded-full border opacity-70 backdrop-blur transition hover:opacity-100"
        >
          {silent ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path
                d="M16 9.5 21 15M21 9.5 16 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path
                d="M15 9.5a3.5 3.5 0 0 1 0 5M17.8 7a7 7 0 0 1 0 10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
