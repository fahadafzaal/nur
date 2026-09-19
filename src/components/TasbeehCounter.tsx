"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveTasbeehSession } from "@/lib/tasbeeh/actions";
import { DHIKR } from "@/lib/tasbeeh/dhikr";

const TARGETS = [33, 99, 100] as const;

/** Short pulse on each count, a longer one when the target is reached. */
function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — silent */
  }
}

export default function TasbeehCounter() {
  const [dhikrId, setDhikrId] = useState(DHIKR[0].id);
  const [target, setTarget] = useState<number | null>(33);
  const [count, setCount] = useState(0);
  const [reached, setReached] = useState(false);
  const [saved, setSaved] = useState<null | "saving" | "saved">(null);

  const dhikr = DHIKR.find((d) => d.id === dhikrId) ?? DHIKR[0];
  const pct = target ? Math.min(100, (count / target) * 100) : 0;

  // Guards against firing the completion buzz repeatedly past the target.
  const announcedRef = useRef(false);

  const increment = useCallback(() => {
    setCount((c) => {
      const next = c + 1;
      if (target && next >= target && !announcedRef.current) {
        announcedRef.current = true;
        setReached(true);
        buzz([40, 60, 120]);
      } else {
        buzz(12);
      }
      return next;
    });
  }, [target]);

  // Space and Enter count too, so it works on a desktop demo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        const el = document.activeElement;
        if (el instanceof HTMLButtonElement && el.dataset.counter !== "true") {
          return;
        }
        e.preventDefault();
        increment();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [increment]);

  const reset = useCallback(async () => {
    if (count > 0) {
      setSaved("saving");
      await saveTasbeehSession(dhikr.translit, count, target);
      setSaved("saved");
      setTimeout(() => setSaved(null), 2200);
    }
    setCount(0);
    setReached(false);
    announcedRef.current = false;
  }, [count, dhikr.translit, target]);

  function pickTarget(t: number | null) {
    setTarget(t);
    setReached(false);
    announcedRef.current = false;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Dhikr selector */}
      <div className="flex w-full flex-wrap justify-center gap-2">
        {DHIKR.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setDhikrId(d.id);
              setCount(0);
              setReached(false);
              announcedRef.current = false;
            }}
            className={`font-body rounded-full border px-3 py-1.5 text-xs transition ${
              d.id === dhikrId
                ? "border-gold/60 bg-gold/10 text-gold-light"
                : "text-muted hover:text-parchment border-white/10"
            }`}
          >
            {d.translit}
          </button>
        ))}
      </div>

      <p
        lang="ar"
        dir="rtl"
        className="font-arabic text-gold-light mt-8 text-center text-3xl"
      >
        {dhikr.arabic}
      </p>
      <p className="font-body text-muted mt-2 text-center text-xs">
        {dhikr.meaning}
      </p>

      {/* The counter */}
      <button
        type="button"
        data-counter="true"
        onClick={increment}
        aria-label={`Count ${dhikr.translit}. Currently ${count}.`}
        className="group relative mt-8 flex h-56 w-56 items-center justify-center rounded-full outline-none select-none active:scale-[0.98]"
        style={{ transition: "transform 120ms ease" }}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/8"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#tasbeeh-arc)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 339.3} 339.3`}
            style={{ transition: "stroke-dasharray 260ms ease" }}
          />
          <defs>
            <linearGradient id="tasbeeh-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9a227" />
              <stop offset="100%" stopColor="#f5d98a" />
            </linearGradient>
          </defs>
        </svg>

        <span
          className="border-gold/20 bg-surface/60 group-hover:border-gold/40 flex h-44 w-44 flex-col items-center justify-center rounded-full border backdrop-blur transition"
        >
          <span className="font-display text-parchment text-6xl tabular-nums">
            {count}
          </span>
          {target ? (
            <span className="font-body text-muted mt-1 text-xs">
              of {target}
            </span>
          ) : null}
        </span>
      </button>

      <p className="font-body text-muted mt-4 h-4 text-center text-xs">
        {reached ? (
          <span className="text-gold-light">Target reached — alhamdulillah.</span>
        ) : (
          "Tap the circle to count"
        )}
      </p>

      {/* Targets */}
      <div className="mt-6 flex items-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => pickTarget(t)}
            className={`font-body rounded-full border px-4 py-1.5 text-xs transition ${
              target === t
                ? "border-gold/60 bg-gold/10 text-gold-light"
                : "text-muted hover:text-parchment border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => pickTarget(null)}
          className={`font-body rounded-full border px-4 py-1.5 text-xs transition ${
            target === null
              ? "border-gold/60 bg-gold/10 text-gold-light"
              : "text-muted hover:text-parchment border-white/10"
          }`}
        >
          Free
        </button>
      </div>

      <button
        type="button"
        onClick={reset}
        disabled={count === 0 && saved === null}
        className="font-body text-muted hover:text-parchment mt-6 rounded-full border border-white/10 px-5 py-2 text-xs transition disabled:opacity-40"
      >
        {saved === "saving"
          ? "Saving…"
          : saved === "saved"
            ? "Saved to your history"
            : "Finish & reset"}
      </button>
    </div>
  );
}
