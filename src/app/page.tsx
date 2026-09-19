"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Fanous from "@/components/Fanous";

/** Shared reveal — the splash unfolds rather than appearing all at once. */
const reveal = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function SplashPage() {
  const router = useRouter();

  // A failed email link (already used, expired) arrives here from Supabase
  // with the reason in the query string and the hash. Without this the
  // visitor sees the splash screen and no hint that anything went wrong.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code =
      query.get("error_code") ?? hash.get("error_code") ??
      query.get("error") ?? hash.get("error");
    if (code) router.replace(`/sign-in?error=${encodeURIComponent(code)}`);
  }, [router]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-14">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.15, ease }}
        className="flex justify-center"
      >
        <Fanous className="h-auto w-[210px] sm:w-[250px]" />
      </motion.div>

      {/* Wordmark: نور → NUR → the invitation */}
      <div className="mt-10 flex flex-col items-center text-center">
        <motion.p
          {...reveal}
          transition={{ duration: 0.9, delay: 1.1, ease }}
          className="text-gold-light font-arabic text-5xl leading-none sm:text-6xl"
          lang="ar"
          dir="rtl"
        >
          نور
        </motion.p>

        <motion.h1
          {...reveal}
          transition={{ duration: 0.9, delay: 1.6, ease }}
          className="font-body mt-5 bg-[var(--gold-gradient)] bg-clip-text text-3xl font-light tracking-[0.42em] text-transparent sm:text-4xl"
        >
          <span className="pl-[0.42em]">NUR</span>
        </motion.h1>

        <motion.p
          {...reveal}
          transition={{ duration: 0.9, delay: 2.1, ease }}
          className="font-display text-muted mt-5 text-sm italic sm:text-base"
        >
          — enter with peace —
        </motion.p>
      </div>

      {/* Membership gate */}
      <motion.div
        {...reveal}
        transition={{ duration: 0.9, delay: 2.7, ease }}
        className="mt-12 flex w-full max-w-xs flex-col gap-3"
      >
        <Link
          href="/join"
          className="nur-btn-primary font-body rounded-full px-8 py-3.5 text-center text-sm font-semibold tracking-wide"
        >
          Become a Member
        </Link>
        <Link
          href="/sign-in"
          className="nur-btn-secondary font-body rounded-full px-8 py-3.5 text-center text-sm font-medium tracking-wide"
        >
          Already a Member
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 3.4, ease }}
        className="font-display text-muted/60 absolute bottom-6 px-6 text-center text-[11px] italic"
      >
        Nur ala Nur · light upon light
      </motion.p>
    </main>
  );
}
