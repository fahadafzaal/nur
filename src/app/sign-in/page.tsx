import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign In — NUR" };

/**
 * Supabase and /auth/callback send people here with ?error=... when an
 * email link fails. The commonest cause is harmless — the link was already
 * used, often by opening the same email twice — so the message says what to
 * do next rather than just reporting a failure.
 */
const LINK_ERRORS: Record<string, string> = {
  otp_expired:
    "That link has already been used or has expired. If you've confirmed your email before, just sign in below. Otherwise, join again and we'll send a fresh link.",
  link: "That link didn't work. If you've already confirmed your email, sign in below — otherwise join again for a fresh link.",
  access_denied:
    "That link has expired. Sign in below, or join again for a fresh confirmation link.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const initialError = error
    ? (LINK_ERRORS[error] ?? LINK_ERRORS.link)
    : undefined;

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-14">
      <AuthForm mode="sign-in" next={next} initialError={initialError} />
    </main>
  );
}
