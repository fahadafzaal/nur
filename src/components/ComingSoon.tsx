import Link from "next/link";

/** Honest placeholder for a pillar that is specified but not yet built. */
export default function ComingSoon({
  title,
  body,
  blockedOn,
}: {
  title: string;
  body: string;
  blockedOn?: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-6 pt-24 pb-28 text-center">
      <svg viewBox="0 0 24 24" className="text-gold/50 h-6 w-6">
        <path
          d="M12 1 L23 12 L12 23 L1 12 Z M12 5.5 L18.5 12 L12 18.5 L5.5 12 Z"
          fill="currentColor"
        />
      </svg>
      <h1 className="font-display text-gold-light mt-6 text-3xl">{title}</h1>
      <p className="font-body text-muted mt-4 max-w-sm text-sm leading-relaxed">
        {body}
      </p>
      {blockedOn ? (
        <p className="border-gold/20 bg-gold/5 text-muted font-body mt-6 rounded-xl border px-4 py-3 text-xs leading-relaxed">
          {blockedOn}
        </p>
      ) : null}
      <Link
        href="/home"
        className="nur-btn-secondary font-body mt-8 rounded-full px-6 py-2.5 text-xs"
      >
        Back to home
      </Link>
    </main>
  );
}
