import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAccess, getTracks } from "@/lib/nasheeds";
import NasheedLibrary from "@/components/nasheeds/NasheedLibrary";

export const metadata = { title: "Nasheed — NUR" };

export default async function NasheedsPage() {
  const supabase = await createClient();
  const [tracks, { isMember, isAdmin }] = await Promise.all([
    getTracks(supabase),
    getAccess(supabase),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-12 pb-44">
      <header className="text-center">
        <p lang="ar" dir="rtl" className="font-arabic text-gold-light text-4xl">
          نشيد
        </p>
        <h1 className="font-display text-parchment mt-3 text-3xl">Nasheed</h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          Streamed here, for members — never downloaded, never shared out.
        </p>
      </header>

      {!isMember ? (
        <Link
          href="/membership"
          className="border-gold/30 bg-gold/[0.05] hover:border-gold/60 mt-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition"
        >
          <span>
            <span className="font-display text-gold-light block text-base">
              Hear every nasheed in full
            </span>
            <span className="font-body text-muted block text-xs">
              You can listen to previews now. Membership unlocks the whole library.
            </span>
          </span>
          <span className="text-gold-light shrink-0">→</span>
        </Link>
      ) : null}

      {isAdmin ? (
        <p className="mt-6 text-center">
          <Link
            href="/admin/nasheeds"
            className="font-body text-gold-light text-xs underline underline-offset-4"
          >
            Manage the library
          </Link>
        </p>
      ) : null}

      <div className="mt-8">
        {tracks.length > 0 ? (
          <NasheedLibrary tracks={tracks} isMember={isMember} />
        ) : (
          <div className="border-gold/15 bg-surface/40 rounded-2xl border px-6 py-12 text-center">
            <p className="font-display text-parchment text-lg">
              The library is being prepared
            </p>
            <p className="font-body text-muted mx-auto mt-3 max-w-sm text-sm leading-relaxed">
              The first nasheeds — <em>This Dunya Tests Me</em>,{" "}
              <em>Nights of Mercy</em>, <em>Save Your Soul</em> and{" "}
              <em>Lost and Found</em> — arrive here soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
