"use client";

import { useState } from "react";
import { inputClass } from "./ui";

/** Tags as toggleable chips, plus free entry for anything not suggested. */
export default function ThemePicker({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");
  const all = [...new Set([...suggestions, ...value])];

  function toggle(t: string) {
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  }

  function add() {
    const t = draft.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {all.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={value.includes(t)}
            className={`font-body rounded-full border px-2.5 py-1 text-[11px] capitalize transition ${
              value.includes(t)
                ? "border-gold/60 bg-gold/10 text-gold-light"
                : "text-muted hover:text-parchment border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add another theme"
          className={inputClass}
        />
        <button type="button" onClick={add} className="nur-btn-secondary font-body rounded-full px-4 text-xs">
          Add
        </button>
      </div>
    </div>
  );
}
