"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "./ui";

export type Member = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  membership_status: "free" | "member" | "lapsed";
  created_at: string;
  last_sign_in_at: string | null;
};

function Row({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const [m, setM] = useState(member);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: string, args: Record<string, string>, apply: Partial<Member>) {
    setBusy(true);
    setError(null);
    const { error } = await createClient().rpc(fn, args);
    setBusy(false);
    if (error) setError(error.message);
    else setM((x) => ({ ...x, ...apply }));
  }

  const isMember = m.membership_status === "member";
  const isAdmin = m.role === "admin";

  return (
    <li className="border-gold/10 bg-surface/40 rounded-xl border px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-parchment truncate text-sm">
            {m.display_name || m.email}
            {isSelf ? <span className="text-muted"> (you)</span> : null}
          </p>
          <p className="font-body text-muted/70 truncate text-[11px]">
            {m.email} · joined {new Date(m.created_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                "admin_set_membership",
                { target: m.id, status: isMember ? "free" : "member" },
                { membership_status: isMember ? "free" : "member" },
              )
            }
            className={`font-body rounded-full border px-3 py-1 text-[11px] transition disabled:opacity-50 ${
              isMember ? "border-gold/60 bg-gold/10 text-gold-light" : "text-muted hover:text-parchment border-white/10"
            }`}
          >
            {isMember ? "Member ✓" : m.membership_status === "lapsed" ? "Lapsed — grant" : "Grant membership"}
          </button>
          <button
            type="button"
            disabled={busy || (isSelf && isAdmin)}
            title={isSelf && isAdmin ? "You can't remove your own admin role" : undefined}
            onClick={() => {
              if (!isAdmin && !confirm(`Make ${m.email} an admin? They'll be able to edit all content and see all members.`)) return;
              void run(
                "admin_set_role",
                { target: m.id, new_role: isAdmin ? "user" : "admin" },
                { role: isAdmin ? "user" : "admin" },
              );
            }}
            className={`font-body rounded-full border px-3 py-1 text-[11px] transition disabled:opacity-50 ${
              isAdmin ? "border-rose/50 text-rose" : "text-muted hover:text-parchment border-white/10"
            }`}
          >
            {isAdmin ? "Admin" : "Make admin"}
          </button>
        </div>
      </div>
      {error ? <p className="text-rose font-body mt-2 text-[11px]">{error}</p> : null}
    </li>
  );
}

export default function MemberList({ members, selfId }: { members: Member[]; selfId: string }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? members.filter((m) => m.email.toLowerCase().includes(s) || (m.display_name ?? "").toLowerCase().includes(s))
      : members;
  }, [members, q]);

  return (
    <>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className={inputClass}
      />
      <p className="font-body text-muted mt-3 text-xs">
        {members.length} accounts · {members.filter((m) => m.membership_status === "member").length} members
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {shown.map((m) => (
          <Row key={m.id} member={m} isSelf={m.id === selfId} />
        ))}
      </ul>
    </>
  );
}
