import { createClient } from "@/lib/supabase/server";
import TasbeehCounter from "@/components/TasbeehCounter";

export const metadata = { title: "Tasbeeh — NUR" };

export default async function TasbeehPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("tasbeeh_sessions")
    .select("id, dhikr, count, target, completed_at")
    .eq("user_id", user?.id ?? "")
    .order("completed_at", { ascending: false })
    .limit(7);

  const total = (sessions ?? []).reduce((sum, s) => sum + (s.count ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-lg px-6 pt-12 pb-28">
      <header className="text-center">
        <h1 className="font-display text-gold-light text-3xl">Tasbeeh</h1>
        <p className="font-body text-muted mt-2 text-sm">
          Take your time. The count is kept for you.
        </p>
      </header>

      <div className="mt-10">
        <TasbeehCounter />
      </div>

      <section className="mt-14">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">
          Recent
        </h2>

        {sessions && sessions.length > 0 ? (
          <>
            <ul className="mt-4 flex flex-col gap-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="border-gold/10 bg-surface/40 flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <div>
                    <p className="font-body text-parchment text-sm">
                      {s.dhikr}
                    </p>
                    <p className="font-body text-muted mt-0.5 text-[11px]">
                      {new Date(s.completed_at).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <p className="font-display text-gold-light text-xl tabular-nums">
                    {s.count}
                  </p>
                </li>
              ))}
            </ul>
            <p className="font-body text-muted mt-4 text-center text-xs">
              {total.toLocaleString()} counted across your last{" "}
              {sessions.length} {sessions.length === 1 ? "round" : "rounds"}
            </p>
          </>
        ) : (
          <p className="font-body text-muted mt-4 text-sm leading-relaxed">
            Nothing yet. Finish a round and it will appear here.
          </p>
        )}
      </section>
    </main>
  );
}
