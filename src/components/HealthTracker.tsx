"use client";

import { useState, useTransition } from "react";
import { saveHealthLog, type HealthLog } from "@/lib/health/actions";

const GLASS_ML = 250;

export default function HealthTracker({
  logDate,
  initial,
}: {
  logDate: string;
  initial: HealthLog | null;
}) {
  const [sleep, setSleep] = useState<number>(initial?.sleep_hours ?? 7);
  const [water, setWater] = useState<number>(initial?.water_ml ?? 0);
  const [fasted, setFasted] = useState<boolean>(initial?.fasted ?? false);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function persist(next: Partial<HealthLog>) {
    const payload = {
      logDate,
      sleepHours: next.sleep_hours ?? sleep,
      waterMl: next.water_ml ?? water,
      fasted: next.fasted ?? fasted,
    };
    startTransition(async () => {
      const res = await saveHealthLog(payload);
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
    });
  }

  const glasses = Math.round(water / GLASS_ML);

  return (
    <div className="flex flex-col gap-4">
      {/* Sleep */}
      <section className="border-gold/15 bg-surface/40 rounded-2xl border p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-parchment text-lg">Sleep</h2>
          <p className="font-display text-gold-light text-2xl tabular-nums">
            {sleep.toFixed(1)}
            <span className="font-body text-muted ml-1 text-xs">hrs</span>
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={sleep}
          aria-label="Hours slept"
          onChange={(e) => setSleep(Number(e.target.value))}
          onPointerUp={() => persist({ sleep_hours: sleep })}
          onKeyUp={() => persist({ sleep_hours: sleep })}
          className="accent-gold mt-4 h-1 w-full cursor-pointer"
        />
      </section>

      {/* Water */}
      <section className="border-gold/15 bg-surface/40 rounded-2xl border p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-parchment text-lg">Water</h2>
          <p className="font-display text-gold-light text-2xl tabular-nums">
            {(water / 1000).toFixed(2)}
            <span className="font-body text-muted ml-1 text-xs">L</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} glasses`}
              onClick={() => {
                const next = (i + 1) * GLASS_ML === water ? i * GLASS_ML : (i + 1) * GLASS_ML;
                setWater(next);
                persist({ water_ml: next });
              }}
              className={`h-9 w-7 rounded-md border transition ${
                i < glasses
                  ? "border-gold/60 bg-gold/25"
                  : "hover:border-gold/40 border-white/12"
              }`}
            />
          ))}
        </div>
        <p className="font-body text-muted mt-2 text-[11px]">
          {glasses} of 8 glasses
        </p>
      </section>

      {/* Fasting */}
      <section className="border-gold/15 bg-surface/40 flex items-center justify-between rounded-2xl border p-5">
        <div>
          <h2 className="font-display text-parchment text-lg">Fasting</h2>
          <p className="font-body text-muted mt-0.5 text-xs">
            Did you fast today?
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={fasted}
          onClick={() => {
            const next = !fasted;
            setFasted(next);
            persist({ fasted: next });
          }}
          className={`relative h-7 w-13 rounded-full border transition ${
            fasted ? "border-gold/60 bg-gold/30" : "border-white/12 bg-white/5"
          }`}
          style={{ width: "3.25rem" }}
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${
              fasted ? "bg-gold-light left-[calc(100%-1.5rem)]" : "bg-muted left-1"
            }`}
          />
        </button>
      </section>

      <p className="font-body text-muted h-4 text-center text-[11px]">
        {pending ? "Saving…" : savedAt ? `Saved at ${savedAt}` : ""}
      </p>
    </div>
  );
}
