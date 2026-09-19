import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSurahIndex } from "@/lib/quran";

export default async function AdminLessons() {
  const supabase = await createClient();
  const [index, { data: lessons }] = await Promise.all([
    getSurahIndex(),
    supabase.from("surah_lessons").select("surah_no, title, published"),
  ]);
  const bySurah = new Map((lessons ?? []).map((l) => [l.surah_no as number, l]));
  const done = (lessons ?? []).filter((l) => l.published).length;

  return (
    <div>
      <p className="font-body text-muted text-sm">
        One lesson per surah. {done} of 114 published — drafts are visible only to admins.
      </p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {index.map((s) => {
          const l = bySurah.get(s.number);
          return (
            <li key={s.number}>
              <Link
                href={`/admin/lessons/${s.number}`}
                className="border-gold/10 bg-surface/40 hover:border-gold/40 flex items-center gap-3 rounded-xl border px-4 py-2.5 transition"
              >
                <span className="font-body text-gold/60 w-7 shrink-0 text-xs tabular-nums">{s.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-body text-parchment block truncate text-sm">{s.name}</span>
                  <span className="font-body text-muted/70 block truncate text-[11px]">
                    {l?.title || s.meaning}
                  </span>
                </span>
                <span
                  className={`font-body shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                    l?.published
                      ? "border-gold/40 text-gold-light"
                      : l
                        ? "text-muted border-white/15"
                        : "text-muted/40 border-white/5"
                  }`}
                >
                  {l?.published ? "Published" : l ? "Draft" : "Empty"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
