"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ayahAudioUrl } from "@/lib/quran-audio";
import { claimAudioFocus, releaseAudioFocus } from "@/lib/audio/focus";
import VerseMarker from "./VerseMarker";
import SurahLesson from "./SurahLesson";
import SurahNotes from "./SurahNotes";

export type ReaderVerse = {
  n: number;
  g: number;
  ar: string;
  en: string;
  sajda: boolean;
};

type Props = {
  number: number;
  name: string;
  bismillah: boolean;
  verses: ReaderVerse[];
};

const FOCUS_OWNER = "quran";
const PREFS_KEY = "nur.quran.prefs.v1";
const SIZES = ["text-2xl", "text-3xl", "text-4xl"] as const;

/** Index -1 is the Bismillah, recited before verse 1 where the surah has one. */
const BISMILLAH = -1;

const PlayIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

const PauseIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </svg>
);

export default function SurahReader({ number, name, bismillah, verses }: Props) {
  const [tab, setTab] = useState<"read" | "lesson" | "notes">("read");
  const [showTranslation, setShowTranslation] = useState(true);
  const [size, setSize] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [follow, setFollow] = useState(true);

  // Al-Fatiha's Bismillah *is* verse 1, so it is never recited separately.
  const recitesBismillah = bismillah && number !== 1;

  // ---- Reading preferences, remembered per device ----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      if (typeof saved.translation === "boolean") {
        setShowTranslation(saved.translation);
      }
      if (typeof saved.size === "number") {
        setSize(Math.min(2, Math.max(0, saved.size)));
      }
    } catch {
      /* defaults */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ translation: showTranslation, size }),
      );
    } catch {
      /* not fatal */
    }
  }, [showTranslation, size]);

  // ---- Playback ----
  const urlFor = useCallback(
    // The Bismillah is recited using Al-Fatiha 1:1, global ayah 1.
    (index: number) => ayahAudioUrl(index === BISMILLAH ? 1 : verses[index].g),
    [verses],
  );

  const playAt = useCallback(
    async (index: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      setCurrent(index);
      audio.src = urlFor(index);
      claimAudioFocus(FOCUS_OWNER);
      try {
        await audio.play();
      } catch {
        setPlaying(false);
        return;
      }
      // Warm the next file so there is no gap between verses.
      const next = index + 1;
      if (next < verses.length) {
        const warm = preloadRef.current ?? new Audio();
        warm.preload = "auto";
        warm.src = urlFor(next);
        preloadRef.current = warm;
      }
    },
    [urlFor, verses.length],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setPlaying(false);
    releaseAudioFocus(FOCUS_OWNER);
  }, []);

  const playSurah = useCallback(() => {
    void playAt(recitesBismillah ? BISMILLAH : 0);
  }, [playAt, recitesBismillah]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (current === null) {
      playSurah();
      return;
    }
    if (audio.paused) {
      claimAudioFocus(FOCUS_OWNER);
      void audio.play();
    } else {
      audio.pause();
      releaseAudioFocus(FOCUS_OWNER);
    }
  }, [current, playSurah]);

  const onEnded = useCallback(() => {
    if (current === null) return;
    const next = current + 1;
    // After the Bismillah always carry on to verse 1, even in one-verse mode.
    if ((continuous || current === BISMILLAH) && next < verses.length) {
      void playAt(next);
    } else {
      stop();
    }
  }, [continuous, current, playAt, stop, verses.length]);

  // Release focus if the reader leaves mid-recitation.
  useEffect(() => () => releaseAudioFocus(FOCUS_OWNER), []);

  // Keep the verse being recited in view.
  useEffect(() => {
    if (!follow || current === null || tab !== "read") return;
    const id = current === BISMILLAH ? "bismillah" : `v-${verses[current].n}`;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current, follow, tab, verses]);

  const nowLabel =
    current === null
      ? ""
      : current === BISMILLAH
        ? "Bismillah"
        : `Verse ${verses[current].n} of ${verses.length}`;

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Surah sections"
        className="border-gold/15 bg-surface/50 mx-auto flex w-full max-w-sm rounded-full border p-1"
      >
        {(
          [
            ["read", "Read"],
            ["lesson", "Daily Lesson"],
            ["notes", "My Notes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`font-body flex-1 rounded-full px-3 py-2 text-xs transition ${
              tab === id
                ? "bg-gold/15 text-gold-light"
                : "text-muted hover:text-parchment"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "read" ? (
        <>
          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={current === null ? playSurah : toggle}
              className="nur-btn-primary font-body flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
            >
              {playing ? (
                <PauseIcon className="h-3.5 w-3.5" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5" />
              )}
              {playing ? "Pause" : current === null ? "Play surah" : "Resume"}
            </button>

            <button
              type="button"
              onClick={() => setShowTranslation((v) => !v)}
              aria-pressed={showTranslation}
              className={`font-body rounded-full border px-4 py-2.5 text-xs transition ${
                showTranslation
                  ? "border-gold/50 text-gold-light"
                  : "text-muted border-white/10"
              }`}
            >
              Translation
            </button>

            <div className="flex items-center rounded-full border border-white/10">
              <button
                type="button"
                aria-label="Smaller Arabic text"
                onClick={() => setSize((s) => Math.max(0, s - 1))}
                disabled={size === 0}
                className="font-body text-muted hover:text-parchment px-3.5 py-2.5 text-xs disabled:opacity-30"
              >
                A−
              </button>
              <button
                type="button"
                aria-label="Larger Arabic text"
                onClick={() => setSize((s) => Math.min(2, s + 1))}
                disabled={size === 2}
                className="font-body text-muted hover:text-parchment px-3.5 py-2.5 text-sm disabled:opacity-30"
              >
                A+
              </button>
            </div>
          </div>

          {recitesBismillah ? (
            <p
              id="bismillah"
              lang="ar"
              dir="rtl"
              className={`font-arabic mt-10 scroll-mt-24 rounded-2xl py-3 text-center text-3xl transition ${
                current === BISMILLAH
                  ? "bg-gold/10 text-gold-light"
                  : "text-gold-light/90"
              }`}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          ) : null}

          <ol className="mt-8 flex flex-col gap-3">
            {verses.map((v, i) => {
              const active = current === i;
              return (
                <li
                  key={v.n}
                  id={`v-${v.n}`}
                  className={`scroll-mt-24 rounded-2xl border px-5 py-5 transition ${
                    active
                      ? "border-gold/50 bg-gold/[0.07]"
                      : "border-transparent hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-muted text-[11px] tabular-nums">
                      {number}:{v.n}
                      {v.sajda ? (
                        <span
                          className="text-gold/80 ml-2"
                          title="Verse of prostration"
                        >
                          ۩ Sajdah
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => (active ? toggle() : void playAt(i))}
                      aria-label={
                        active && playing
                          ? `Pause verse ${v.n}`
                          : `Play verse ${v.n}`
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        active
                          ? "border-gold/60 text-gold-light"
                          : "text-muted hover:border-gold/40 hover:text-gold-light border-white/10"
                      }`}
                    >
                      {active && playing ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon className="ml-0.5 h-3 w-3" />
                      )}
                    </button>
                  </div>

                  <p
                    lang="ar"
                    dir="rtl"
                    className={`font-arabic text-parchment mt-4 text-right leading-[2.2] ${SIZES[size]}`}
                  >
                    {v.ar}
                    <VerseMarker n={v.n} />
                  </p>

                  {showTranslation ? (
                    <p className="font-body text-muted mt-4 text-sm leading-relaxed">
                      {v.en}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <p className="font-body text-muted/50 mt-10 text-center text-[10px] leading-relaxed">
            Arabic text: Tanzil Project (tanzil.net) · Translation: Saheeh
            International · Recitation: Mishary Rashid Alafasy
          </p>
        </>
      ) : null}

      {tab === "lesson" ? (
        <div className="mt-8">
          <SurahLesson surah={number} name={name} />
        </div>
      ) : null}

      {tab === "notes" ? (
        <div className="mt-8">
          <SurahNotes surah={number} name={name} />
        </div>
      ) : null}

      {/* Now-playing bar, sitting above the bottom navigation */}
      {current !== null ? (
        <div
          className="fixed inset-x-0 z-40 px-4"
          style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="border-gold/25 bg-ink/90 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause recitation" : "Resume recitation"}
              className="nur-btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            >
              {playing ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="ml-0.5 h-4 w-4" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="font-display text-parchment truncate text-sm">
                {name}
              </p>
              <p className="font-body text-muted text-[11px]">{nowLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => setContinuous((c) => !c)}
              aria-pressed={continuous}
              title={
                continuous
                  ? "Plays on to the next verse"
                  : "Stops after this verse"
              }
              className={`font-body rounded-full border px-2.5 py-1 text-[10px] ${
                continuous
                  ? "border-gold/50 text-gold-light"
                  : "text-muted border-white/10"
              }`}
            >
              {continuous ? "Continuous" : "One verse"}
            </button>
            <button
              type="button"
              onClick={() => setFollow((f) => !f)}
              aria-pressed={follow}
              title="Scroll to follow the recitation"
              className={`font-body hidden rounded-full border px-2.5 py-1 text-[10px] sm:block ${
                follow
                  ? "border-gold/50 text-gold-light"
                  : "text-muted border-white/10"
              }`}
            >
              Follow
            </button>
            <button
              type="button"
              onClick={stop}
              aria-label="Stop recitation"
              className="text-muted hover:text-parchment p-1"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
