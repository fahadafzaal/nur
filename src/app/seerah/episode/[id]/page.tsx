import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/nasheeds";
import { getTrait } from "@/lib/seerah";
import type { Track } from "@/lib/media";
import TrackRow from "@/components/nasheeds/TrackRow";
import PrivateJournal from "@/components/PrivateJournal";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Seerah — NUR" };

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: episode }, access] = await Promise.all([
    supabase
      .from("seerah_episodes")
      .select("id, trait, title, summary, story, audio_path, duration_s, is_member_only")
      .eq("id", id)
      .maybeSingle(),
    getAccess(supabase),
  ]);
  if (!episode) notFound();

  const trait = getTrait(episode.trait);
  const locked = episode.is_member_only && !access.isMember;

  // The narration plays through the shared player, streamed from the
  // Seerah route; the file path itself is never sent to the page.
  const narration: Track | null = episode.audio_path
    ? {
        id: episode.id,
        title: episode.title,
        artist: trait ? `Seerah · ${trait.name}` : "Seerah",
        description: "",
        cover: null,
        preview: null,
        durationS: episode.duration_s,
        memberOnly: episode.is_member_only,
        hasAudio: true,
        themes: [],
        streamUrl: `/api/seerah/${episode.id}/stream`,
      }
    : null;

  const story: string = episode.story ?? "";
  const paragraphs = story
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-8 pb-44">
      <Link
        href={trait ? `/seerah/${trait.slug}` : "/seerah"}
        className="font-body text-muted hover:text-parchment text-xs transition"
      >
        ← {trait?.name ?? "Seerah"}
      </Link>

      <header className="mt-6">
        <p className="font-body text-gold/70 text-[10px] tracking-[0.24em] uppercase">
          Seerah · {trait?.name}
        </p>
        <h1 className="font-display text-parchment mt-3 text-3xl leading-tight">{episode.title}</h1>
        {episode.summary ? (
          <p className="font-body text-muted mt-4 text-[15px] leading-relaxed">{episode.summary}</p>
        ) : null}
      </header>

      {narration ? (
        <ul className="mt-8">
          <TrackRow track={narration} isMember={access.isMember} />
        </ul>
      ) : null}

      <article className="mt-10">
        {locked ? (
          <div className="border-gold/25 bg-gold/[0.04] rounded-2xl border px-6 py-8 text-center">
            <p className="font-display text-gold-light text-lg">This episode is for members</p>
            <p className="font-body text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
              The full story and narration open with membership.
            </p>
            <Link href="/membership" className="nur-btn-primary font-body mt-5 inline-block rounded-full px-6 py-2.5 text-xs font-semibold">
              Become a member
            </Link>
          </div>
        ) : paragraphs.length > 0 ? (
          <div className="flex flex-col gap-5">
            {paragraphs.map((p: string, i: number) => (
              <p key={i} className="font-body text-parchment/90 text-base leading-[1.85] whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="font-body text-muted text-sm">The written story for this episode is on its way.</p>
        )}
      </article>

      {!locked ? (
        <section className="mt-14">
          <PrivateJournal
            table="seerah_reflections"
            keys={{ episode_id: episode.id }}
            title="Your reflection"
            placeholder={`What does ${trait?.name.toLowerCase() ?? "this"} ask of you this week?`}
            label="Your reflection on this episode"
          />
        </section>
      ) : null}
    </main>
  );
}
