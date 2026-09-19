import Link from "next/link";
import { REMINDERS, reminderForDate } from "@/lib/reminders";

export const metadata = { title: "Reminders — NUR" };

export default function RemindersPage() {
  const todayId = reminderForDate().id;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-12 pb-44">
      <header className="text-center">
        <h1 className="font-display text-gold-light text-3xl">Reminders</h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          Thirty-five short lines from the Prophet&apos;s teaching ﷺ — one for
          each day, turning in a cycle.
        </p>
      </header>

      <ol className="mt-10 flex flex-col gap-2.5">
        {REMINDERS.map((r) => (
          <li key={r.id}>
            <Link
              href={`/reminders/${r.id}`}
              className={`flex gap-4 rounded-2xl border px-5 py-4 transition ${
                r.id === todayId
                  ? "border-gold/50 bg-gold/[0.06]"
                  : "border-gold/10 bg-surface/40 hover:border-gold/35"
              }`}
            >
              <span className="font-body text-gold/60 w-6 shrink-0 pt-0.5 text-xs tabular-nums">
                {r.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display text-parchment line-clamp-2 block text-[15px] leading-relaxed">
                  {r.text}
                </span>
                <span className="font-body text-muted mt-1.5 block text-[11px] capitalize">
                  {r.id === todayId ? "Today · " : ""}
                  {r.theme}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
