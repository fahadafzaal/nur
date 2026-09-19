"use client";

import { useMemo, useState } from "react";
import type { Track } from "@/lib/media";
import TrackRow from "./TrackRow";

export default function NasheedLibrary({
  tracks,
  isMember,
}: {
  tracks: Track[];
  isMember: boolean;
}) {
  const [theme, setTheme] = useState<string | null>(null);

  const themes = useMemo(
    () => [...new Set(tracks.flatMap((t) => t.themes))].sort(),
    [tracks],
  );

  const shown = theme ? tracks.filter((t) => t.themes.includes(theme)) : tracks;

  return (
    <>
      {themes.length > 1 ? (
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          {[null, ...themes].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              onClick={() => setTheme(t)}
              className={`font-body rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                theme === t
                  ? "border-gold/60 bg-gold/10 text-gold-light"
                  : "text-muted hover:text-parchment border-white/10"
              }`}
            >
              {t ?? "All"}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="mt-5 flex flex-col gap-2.5">
        {shown.map((t) => (
          <TrackRow key={t.id} track={t} isMember={isMember} />
        ))}
      </ul>
    </>
  );
}
