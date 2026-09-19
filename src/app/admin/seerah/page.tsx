import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TRAITS } from "@/lib/seerah";
import { StatusPill } from "@/components/admin/ui";

export default async function AdminSeerah() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seerah_episodes")
    .select("id, trait, title, published, is_member_only, audio_path, sort_order")
    .order("sort_order")
    .order("created_at");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-body text-muted text-sm">Episodes, grouped by the six qualities.</p>
        <Link href="/admin/seerah/new" className="nur-btn-primary font-body shrink-0 rounded-full px-5 py-2 text-xs font-semibold">
          + New episode
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-8">
        {TRAITS.map((t) => {
          const eps = (data ?? []).filter((e) => e.trait === t.slug);
          return (
            <section key={t.slug}>
              <h2 className="flex items-baseline gap-3">
                <span className="font-display text-parchment text-lg">{t.name}</span>
                <span lang="ar" dir="rtl" className="font-arabic text-gold-light text-xl">{t.arabic}</span>
                <Link href={`/admin/seerah/new?trait=${t.slug}`} className="font-body text-gold/80 hover:text-gold-light ml-auto text-xs">
                  + Add
                </Link>
              </h2>
              {eps.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {eps.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/admin/seerah/${e.id}`}
                        className="border-gold/10 bg-surface/40 hover:border-gold/40 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 transition"
                      >
                        <span className="font-body text-parchment min-w-0 flex-1 truncate text-sm">{e.title}</span>
                        <span className="flex gap-1.5">
                          <StatusPill on={Boolean(e.audio_path)} onLabel="Narrated" offLabel="Text only" />
                          <StatusPill on={!e.is_member_only} onLabel="Free" offLabel="Members" />
                          <StatusPill on={e.published} onLabel="Live" offLabel="Draft" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-muted/60 mt-2 text-xs">No episodes yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
