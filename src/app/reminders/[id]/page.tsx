import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { REMINDERS, reminderForDate } from "@/lib/reminders";
import { getAccess, getTrack, getTrackForTheme } from "@/lib/nasheeds";
import TrackRow from "@/components/nasheeds/TrackRow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = REMINDERS[Number(id) - 1];
  return { title: r ? `Reminder ${r.id} — NUR` : "Reminder — NUR" };
}

/**
 * A daily reminder, opened up — the client's refinement: tapping a
 * reminder leads to (a) a longer reflection on its theme and (b) a nasheed
 * on the same theme.
 *
 * The nasheed is the one the client paired explicitly in the admin panel,
 * or failing that the first published track tagged with the same theme —
 * so pairing works automatically as the library grows.
 */
export default async function ReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reminder = REMINDERS[Number(id) - 1];
  if (!reminder) notFound();

  const supabase = await createClient();
  const [{ data: article }, access] = await Promise.all([
    supabase
      .from("reminder_articles")
      .select("title, body, nasheed_id")
      .eq("reminder_id", reminder.id)
      .maybeSingle(),
    getAccess(supabase),
  ]);

  const track =
    (article?.nasheed_id ? await getTrack(supabase, article.nasheed_id) : null) ??
    (await getTrackForTheme(supabase, reminder.theme));

  const body: string = article?.body ?? "";
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const isToday = reminderForDate().id === reminder.id;
  const prev = reminder.id > 1 ? reminder.id - 1 : REMINDERS.length;
  const next = reminder.id < REMINDERS.length ? reminder.id + 1 : 1;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-8 pb-44">
      <nav className="flex items-center justify-between">
        <Link
          href="/reminders"
          className="font-body text-muted hover:text-parchment text-xs transition"
        >
          ← All reminders
        </Link>
        <div className="flex gap-1">
          <Link href={`/reminders/${prev}`} className="font-body text-muted hover:text-parchment rounded-full px-3 py-1.5 text-xs">
            ←
          </Link>
          <Link href={`/reminders/${next}`} className="font-body text-muted hover:text-parchment rounded-full px-3 py-1.5 text-xs">
            →
          </Link>
        </div>
      </nav>

      <section className="border-gold/20 relative mt-6 overflow-hidden rounded-3xl border px-7 py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 70% at 50% 0%, rgba(201,162,39,0.14) 0%, transparent 70%)",
          }}
        />
        <p className="font-body text-gold/70 relative text-[10px] tracking-[0.24em] uppercase">
          {isToday ? "Today's reminder" : `Reminder ${reminder.id} of ${REMINDERS.length}`}
          {" · "}
          <span className="capitalize">{reminder.theme}</span>
        </p>
        <blockquote className="font-display text-parchment relative mt-5 text-2xl leading-relaxed">
          {reminder.text}
        </blockquote>
      </section>

      <section className="mt-10">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">
          Reflection
        </h2>
        {paragraphs.length > 0 ? (
          <article className="mt-4">
            {article?.title ? (
              <h3 className="font-display text-gold-light text-xl">{article.title}</h3>
            ) : null}
            <div className="mt-4 flex flex-col gap-4">
              {paragraphs.map((p: string, i: number) => (
                <p key={i} className="font-body text-parchment/90 text-[15px] leading-relaxed whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </article>
        ) : (
          <p className="font-body text-muted mt-4 text-sm leading-relaxed">
            A longer reflection on this reminder is being written. Until then,
            sit with the words above — perhaps note what they bring to mind.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">
          A nasheed on {reminder.theme}
        </h2>
        {track ? (
          <ul className="mt-4">
            <TrackRow track={track} isMember={access.isMember} />
          </ul>
        ) : (
          <p className="font-body text-muted mt-4 text-sm leading-relaxed">
            A nasheed for this theme will appear here as the library grows.
          </p>
        )}
      </section>
    </main>
  );
}
