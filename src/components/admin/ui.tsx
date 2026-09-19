"use client";

import type { ReactNode } from "react";

/** Small shared building blocks for admin forms, in the NUR style. */

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-surface/80 px-4 py-2.5 text-sm text-parchment placeholder:text-muted/50 outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/40 disabled:opacity-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-body text-muted mb-1.5 block text-xs tracking-wide">{label}</span>
      {children}
      {hint ? <span className="font-body text-muted/60 mt-1 block text-[11px]">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span>
        <span className="font-body text-parchment block text-sm">{label}</span>
        {hint ? <span className="font-body text-muted/70 block text-[11px]">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          checked ? "border-gold/60 bg-gold/30" : "border-white/12 bg-white/5"
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
            checked ? "bg-gold-light left-[1.4rem]" : "bg-muted left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-gold/15 bg-surface/40 rounded-2xl border p-5 ${className}`}>{children}</div>
  );
}

export function SaveButton({
  saving,
  label = "Save",
  disabled,
}: {
  saving: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="nur-btn-primary font-body rounded-full px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
    >
      {saving ? "Saving…" : label}
    </button>
  );
}

export function Notice({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`font-body rounded-lg border px-3 py-2 text-xs ${
        tone === "error"
          ? "text-rose border-rose/30 bg-rose/5"
          : "text-gold-light border-gold/30 bg-gold/5"
      }`}
    >
      {children}
    </p>
  );
}

export function StatusPill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`font-body rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${
        on ? "border-gold/40 text-gold-light" : "text-muted border-white/10"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}
