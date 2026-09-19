import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/nasheeds";
import { isMembershipConfigured } from "@/lib/stripe/config";
import MembershipActions from "@/components/membership/MembershipActions";

export const metadata = { title: "Membership — NUR" };

const BENEFITS = [
  ["The full nasheed library", "Every track in full, streamed in the app — including the client's own releases."],
  ["Seerah by character", "Narrated episodes on Mercy, Honesty, Patience, Humility, Justice and Forgiveness."],
  ["Daily lessons", "A reflection for each surah, added as the series grows."],
  ["Everything else, kept", "Your Qur'an journal, dhikr history and health log stay yours."],
] as const;

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { isMember, isAdmin } = await getAccess(supabase);

  return (
    <main className="mx-auto w-full max-w-xl px-6 pt-12 pb-44">
      <header className="text-center">
        <p className="font-body text-gold/70 text-[10px] tracking-[0.24em] uppercase">
          Membership
        </p>
        <h1 className="font-display text-gold-light mt-3 text-4xl">
          Light upon light
        </h1>
        <p className="font-body text-muted mx-auto mt-4 max-w-md text-sm leading-relaxed">
          Your account is free and always will be. Membership opens the rest.
        </p>
      </header>

      {status === "success" ? (
        <p role="status" className="border-gold/40 bg-gold/10 text-gold-light font-body mt-8 rounded-2xl border px-5 py-4 text-center text-sm">
          Welcome — your membership is being activated. It can take a few
          seconds to appear.
        </p>
      ) : null}
      {status === "cancelled" ? (
        <p role="status" className="font-body text-muted mt-8 rounded-2xl border border-white/10 px-5 py-4 text-center text-sm">
          No payment was taken. You can come back whenever you like.
        </p>
      ) : null}

      <ul className="mt-10 flex flex-col gap-3">
        {BENEFITS.map(([title, body]) => (
          <li key={title} className="border-gold/15 bg-surface/40 flex gap-4 rounded-2xl border px-5 py-4">
            <svg viewBox="0 0 24 24" className="text-gold mt-0.5 h-4 w-4 shrink-0">
              <path d="M12 1 L23 12 L12 23 L1 12 Z M12 5.5 L18.5 12 L12 18.5 L5.5 12 Z" fill="currentColor" />
            </svg>
            <span>
              <span className="font-display text-parchment block text-base">{title}</span>
              <span className="font-body text-muted mt-1 block text-xs leading-relaxed">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {isMember ? (
          <div className="text-center">
            <p className="font-display text-gold-light text-lg">
              {isAdmin ? "You have full access as an administrator." : "You're a member. Jazakallahu khayran."}
            </p>
            {!isAdmin ? <MembershipActions mode="manage" enabled={isMembershipConfigured} /> : null}
          </div>
        ) : (
          <MembershipActions mode="join" enabled={isMembershipConfigured} />
        )}
      </div>

      <p className="mt-8 text-center">
        <Link href="/home" className="font-body text-muted hover:text-parchment text-xs">
          Back to home
        </Link>
      </p>
    </main>
  );
}
