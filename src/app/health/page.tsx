import { createClient } from "@/lib/supabase/server";
import HealthTracker from "@/components/HealthTracker";
import type { HealthLog } from "@/lib/health/actions";

export const metadata = { title: "Health — NUR" };

export default async function HealthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("health_logs")
    .select("log_date, sleep_hours, water_ml, fasted")
    .eq("user_id", user?.id ?? "")
    .order("log_date", { ascending: false })
    .limit(7);

  const history = (logs ?? []) as HealthLog[];
  const todayLog = history.find((l) => l.log_date === today) ?? null;

  return (
    <main className="mx-auto w-full max-w-lg px-6 pt-12 pb-28">
      <header>
        <h1 className="font-display text-gold-light text-3xl">Health</h1>
        <p className="font-body text-muted mt-2 text-sm">
          A light record of how the body is doing — it saves as you go.
        </p>
      </header>

      <div className="mt-8">
        <HealthTracker logDate={today} initial={todayLog} />
      </div>

      <section className="mt-12">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">
          Last 7 days
        </h2>

        {history.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {history.map((log) => (
              <li
                key={log.log_date}
                className="border-gold/10 bg-surface/40 flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <p className="font-body text-parchment text-sm">
                  {new Date(`${log.log_date}T00:00:00`).toLocaleDateString(
                    undefined,
                    { weekday: "short", day: "numeric", month: "short" },
                  )}
                </p>
                <p className="font-body text-muted text-xs tabular-nums">
                  {log.sleep_hours != null ? `${log.sleep_hours}h` : "—"}
                  {"  ·  "}
                  {log.water_ml != null
                    ? `${(log.water_ml / 1000).toFixed(2)}L`
                    : "—"}
                  {log.fasted ? "  ·  fasted" : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-muted mt-4 text-sm">
            Nothing logged yet.
          </p>
        )}
      </section>
    </main>
  );
}
