import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/media";
import { StatusPill } from "@/components/admin/ui";

export default async function AdminNasheeds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nasheeds")
    .select("id, title, artist, duration_s, published, is_member_only, audio_path, preview_path, themes")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-body text-muted text-sm">
          Full tracks are stored privately and stream only to members.
        </p>
        <Link href="/admin/nasheeds/new" className="nur-btn-primary font-body shrink-0 rounded-full px-5 py-2 text-xs font-semibold">
          + New nasheed
        </Link>
      </div>

      {data && data.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {data.map((n) => (
            <li key={n.id}>
              <Link
                href={`/admin/nasheeds/${n.id}`}
                className="border-gold/10 bg-surface/40 hover:border-gold/40 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-body text-parchment block truncate text-sm">{n.title}</span>
                  <span className="font-body text-muted/70 block truncate text-[11px]">
                    {[n.artist, formatDuration(n.duration_s), (n.themes as string[]).join(", ")].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <StatusPill on={Boolean(n.audio_path)} onLabel="Audio" offLabel="No audio" />
                  <StatusPill on={Boolean(n.preview_path)} onLabel="Preview" offLabel="No preview" />
                  <StatusPill on={!n.is_member_only} onLabel="Free" offLabel="Members" />
                  <StatusPill on={n.published} onLabel="Live" offLabel="Draft" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-gold/15 font-body text-muted mt-6 rounded-2xl border px-6 py-10 text-center text-sm">
          No nasheeds yet. Add the first one — start with <em>Lost and Found</em>.
        </p>
      )}
    </div>
  );
}
