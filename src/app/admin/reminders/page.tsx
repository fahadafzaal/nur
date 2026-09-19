import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REMINDERS } from "@/lib/reminders";

export default async function AdminReminders() {
  const supabase = await createClient();
  const { data } = await supabase.from("reminder_articles").select("reminder_id, body, nasheed_id");
  const byId = new Map((data ?? []).map((r) => [r.reminder_id as number, r]));

  return (
    <div>
      <p className="font-body text-muted text-sm leading-relaxed">
        The 35 reminder lines are fixed. For each, add the longer reflection
        that opens when it is tapped, and optionally pair a nasheed — if you
        don&apos;t, the first nasheed tagged with the same theme is used.
      </p>
      <ol className="mt-5 flex flex-col gap-2">
        {REMINDERS.map((r) => {
          const a = byId.get(r.id);
          const hasArticle = Boolean(a?.body?.trim());
          return (
            <li key={r.id}>
              <Link
                href={`/admin/reminders/${r.id}`}
                className="border-gold/10 bg-surface/40 hover:border-gold/40 flex items-center gap-3 rounded-xl border px-4 py-3 transition"
              >
                <span className="font-body text-gold/60 w-6 shrink-0 text-xs tabular-nums">{r.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-body text-parchment line-clamp-1 block text-sm">{r.text}</span>
                  <span className="font-body text-muted/70 block text-[11px] capitalize">{r.theme}</span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <span className={`font-body rounded-full border px-2 py-0.5 text-[10px] ${hasArticle ? "border-gold/40 text-gold-light" : "text-muted/40 border-white/5"}`}>
                    Reflection
                  </span>
                  <span className={`font-body rounded-full border px-2 py-0.5 text-[10px] ${a?.nasheed_id ? "border-gold/40 text-gold-light" : "text-muted/40 border-white/5"}`}>
                    Nasheed
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
