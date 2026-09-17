import Link from "next/link";

/**
 * Temporary landing for the two membership-gate routes.
 * Replaced by the real Supabase auth forms in M2 — this exists only so
 * the splash screen can be demoed without dead links.
 */
export default function GatePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-gold-light text-3xl sm:text-4xl">
        {title}
      </h1>
      <p className="font-body text-muted mt-4 max-w-sm text-sm leading-relaxed">
        {body}
      </p>
      <Link
        href="/"
        className="nur-btn-secondary font-body mt-9 rounded-full px-7 py-3 text-sm"
      >
        Back
      </Link>
    </main>
  );
}
