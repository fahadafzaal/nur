"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/player/NasheedPlayer";
import { formatDuration, type Track } from "@/lib/media";

/**
 * One track, with a play button that knows what this listener may hear:
 * the full nasheed for members (or free tracks), a preview otherwise, or a
 * clear reason when neither is possible — never a button that does nothing.
 */
export default function TrackRow({
  track,
  isMember,
}: {
  track: Track;
  isMember: boolean;
}) {
  const player = usePlayer();
  const [message, setMessage] = useState<string | null>(null);

  const isCurrent = player.track?.id === track.id;
  const isPlaying = isCurrent && player.playing;

  function onPlay() {
    if (isCurrent) {
      player.toggle();
      return;
    }
    const result = player.play(track, isMember);
    setMessage(
      result === "locked"
        ? "Members hear this nasheed in full."
        : result === "unavailable"
          ? "The audio for this track is on its way."
          : null,
    );
  }

  const locked = track.memberOnly && !isMember;

  return (
    <li
      className={`rounded-2xl border px-4 py-3.5 transition ${
        isCurrent ? "border-gold/45 bg-gold/[0.06]" : "border-gold/10 bg-surface/40"
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPlay}
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition ${
            isCurrent ? "border-gold/60" : "border-gold/20 hover:border-gold/50"
          }`}
        >
          {track.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          ) : null}
          <span className="text-gold-light relative">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-display text-parchment truncate text-base">{track.title}</p>
          <p className="font-body text-muted truncate text-xs">
            {[track.artist, formatDuration(track.durationS)].filter(Boolean).join(" · ")}
          </p>
        </div>

        {locked ? (
          <span className="font-body border-gold/30 text-gold/80 shrink-0 rounded-full border px-2.5 py-1 text-[10px] tracking-wide">
            {track.preview ? "Preview" : "Members"}
          </span>
        ) : !track.memberOnly ? (
          <span className="font-body text-muted shrink-0 text-[10px] tracking-wide">Free</span>
        ) : null}
      </div>

      {track.description ? (
        <p className="font-body text-muted mt-3 text-xs leading-relaxed">{track.description}</p>
      ) : null}

      {message ? (
        <p className="font-body text-gold-light mt-3 text-xs">
          {message}{" "}
          {locked ? (
            <Link href="/membership" className="underline underline-offset-4">
              Become a member
            </Link>
          ) : null}
        </p>
      ) : null}
    </li>
  );
}
