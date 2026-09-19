"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;

/**
 * Admins can move an order along (e.g. paid → fulfilled). The database
 * lets them change only the status column; totals and items are fixed.
 * Refunds themselves are issued in Stripe — this only records them.
 */
export default function OrderStatus({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setSaving(true);
    setError(null);
    const { error } = await createClient().from("orders").update({ status: next }).eq("id", id);
    setSaving(false);
    if (error) {
      setValue(prev);
      setError(error.message);
    }
  }

  return (
    <div className="text-right">
      <select
        value={value}
        onChange={(e) => void change(e.target.value)}
        disabled={saving}
        aria-label="Order status"
        className={`font-body rounded-full border bg-transparent px-3 py-1 text-xs capitalize outline-none ${
          value === "paid" ? "border-gold/60 text-gold-light" : value === "fulfilled" ? "text-muted border-white/20" : "text-muted border-white/10"
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-ink">
            {s}
          </option>
        ))}
      </select>
      {error ? <p className="text-rose font-body mt-1 text-[10px]">{error}</p> : null}
    </div>
  );
}
