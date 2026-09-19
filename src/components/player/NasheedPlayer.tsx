"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  claimAudioFocus,
  onAudioFocus,
  releaseAudioFocus,
} from "@/lib/audio/focus";
import { formatDuration, type Track } from "@/lib/media";
import { usePlayerBarHeight } from "@/lib/audio/player-bar";

const FOCUS_OWNER = "nasheed";

type PlayResult = "full" | "preview" | "locked" | "unavailable";

type PlayerState = {
  track: Track | null;
  mode: "full" | "preview" | null;
  playing: boolean;
  /** Plays the full track if allowed, else its preview, else reports why not. */
  play: (track: Track, isMember: boolean) => PlayResult;
  toggle: () => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <NasheedPlayerProvider>");
  return ctx;
}

/** The splash and auth screens stay free of any player chrome. */
const HIDDEN_ON = ["/", "/join", "/sign-in"];

/**
 * App-wide nasheed player. Lives in the root layout so a track keeps
 * playing while the listener moves around the app.
 *
 * Full tracks are streamed through /api/nasheeds/:id/stream — never a
 * storage URL — so the file's location never reaches the browser. If that
 * refuses (membership lapsed mid-session), it falls back to the preview.
 */
export function NasheedPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [mode, setMode] = useState<"full" | "preview" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const pathname = usePathname();
  const trackRef = useRef<Track | null>(null);
  trackRef.current = track;

  const start = useCallback((src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    setTime(0);
    setDuration(0);
    claimAudioFocus(FOCUS_OWNER);
    void audio.play().catch(() => setPlaying(false));
  }, []);

  const play = useCallback(
    (next: Track, isMember: boolean): PlayResult => {
      setNotice(null);
      if (next.hasAudio && (!next.memberOnly || isMember)) {
        setTrack(next);
        setMode("full");
        start(next.streamUrl ?? `/api/nasheeds/${next.id}/stream`);
        return "full";
      }
      if (next.preview) {
        setTrack(next);
        setMode("preview");
        start(next.preview);
        return "preview";
      }
      return next.hasAudio ? "locked" : "unavailable";
    },
    [start],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setTrack(null);
    setMode(null);
    setPlaying(false);
    setNotice(null);
    releaseAudioFocus(FOCUS_OWNER);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      claimAudioFocus(FOCUS_OWNER);
      void audio.play().catch(() => {});
    } else {
      audio.pause();
      releaseAudioFocus(FOCUS_OWNER);
    }
  }, [track]);

  // If recitation starts, get out of the way entirely.
  useEffect(
    () =>
      onAudioFocus({
        claimed: (owner) => {
          if (owner !== FOCUS_OWNER && trackRef.current) stop();
        },
        released: () => {},
      }),
    [stop],
  );

  const onError = useCallback(() => {
    // The stream route refused (e.g. membership ended) — try the preview.
    if (mode === "full" && track?.preview) {
      setMode("preview");
      setNotice("Playing a preview — full tracks are for members.");
      start(track.preview);
      return;
    }
    setPlaying(false);
    setNotice("This track couldn't be played just now.");
    releaseAudioFocus(FOCUS_OWNER);
  }, [mode, start, track]);

  const value = useMemo(
    () => ({ track, mode, playing, play, toggle, stop }),
    [track, mode, playing, play, toggle, stop],
  );

  const hidden = HIDDEN_ON.includes(pathname) || pathname.startsWith("/auth");
  usePlayerBarHeight(Boolean(track) && !hidden);
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <PlayerContext.Provider value={value}>
      {children}

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          releaseAudioFocus(FOCUS_OWNER);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) =>
          setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)
        }
        onError={onError}
      />

      {track && !hidden ? (
        <div
          className="fixed inset-x-0 z-40 px-4"
          style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="border-gold/25 bg-ink/90 mx-auto max-w-lg overflow-hidden rounded-2xl border shadow-2xl backdrop-blur">
            {/* Seekable progress */}
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={time}
              disabled={!duration}
              aria-label="Seek"
              onChange={(e) => {
                const audio = audioRef.current;
                if (audio) audio.currentTime = Number(e.target.value);
              }}
              className="accent-gold block h-1 w-full cursor-pointer appearance-none bg-white/10"
              style={{
                background: `linear-gradient(to right, var(--color-gold) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
              }}
            />

            <div className="flex items-center gap-3 px-4 py-3">
              {track.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.cover}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="border-gold/30 text-gold flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0m10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  </svg>
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-display text-parchment truncate text-sm">
                  {track.title}
                </p>
                <p className="font-body text-muted truncate text-[11px]">
                  {mode === "preview" ? (
                    <span className="text-gold-light">Preview · </span>
                  ) : null}
                  {notice ??
                    [track.artist, duration ? `${formatDuration(time)} / ${formatDuration(duration)}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                </p>
              </div>

              {mode === "preview" ? (
                <Link
                  href="/membership"
                  className="font-body border-gold/50 text-gold-light hidden rounded-full border px-2.5 py-1 text-[10px] sm:block"
                >
                  Unlock
                </Link>
              ) : null}

              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="nur-btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                )}
              </button>
              <button
                type="button"
                onClick={stop}
                aria-label="Close player"
                className="text-muted hover:text-parchment p-1"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PlayerContext.Provider>
  );
}
