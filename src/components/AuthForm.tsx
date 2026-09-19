"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-surface/80 px-4 py-3 text-sm text-parchment placeholder:text-muted/60 outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/40";

const LABEL = "font-body text-muted mb-1.5 block text-xs tracking-wide";

export default function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "join" | "sign-in";
  next?: string;
  /** Shown until the first submit — e.g. an expired email link. */
  initialError?: string;
}) {
  const isJoin = mode === "join";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isJoin ? signUp : signIn,
    initialError ? { error: initialError } : {},
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm"
    >
      {/* Ornament */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className="via-gold/50 h-px w-14 bg-gradient-to-r from-transparent to-transparent" />
        <svg viewBox="0 0 24 24" className="text-gold h-3.5 w-3.5">
          <path
            d="M12 1 L23 12 L12 23 L1 12 Z M12 5.5 L18.5 12 L12 18.5 L5.5 12 Z"
            fill="currentColor"
          />
        </svg>
        <span className="via-gold/50 h-px w-14 bg-gradient-to-r from-transparent to-transparent" />
      </div>

      <h1 className="font-display text-gold-light text-center text-3xl">
        {isJoin ? "Become a Member" : "Welcome back"}
      </h1>
      <p className="font-body text-muted mt-3 text-center text-sm leading-relaxed">
        {isJoin
          ? "Create your account to unlock the nasheed library and keep your reflections."
          : "Sign in to return to your Qur'an notes and daily reminders."}
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {isJoin ? (
          <div>
            <label className={LABEL} htmlFor="displayName">
              Your name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              className={FIELD}
              placeholder="How should we greet you?"
            />
          </div>
        ) : null}

        <div>
          <label className={LABEL} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={FIELD}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isJoin ? 8 : undefined}
            autoComplete={isJoin ? "new-password" : "current-password"}
            className={FIELD}
            placeholder={isJoin ? "At least 8 characters" : "••••••••"}
          />
        </div>

        {state.error ? (
          <p
            role="alert"
            className="font-body text-rose rounded-lg border border-current/25 bg-current/5 px-3 py-2.5 text-xs leading-relaxed"
          >
            {state.error}
          </p>
        ) : null}

        {state.notice ? (
          <p
            role="status"
            className="font-body text-gold-light border-gold/25 bg-gold/5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed"
          >
            {state.notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="nur-btn-primary font-body mt-2 rounded-full px-8 py-3.5 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? isJoin
              ? "Creating your account…"
              : "Signing you in…"
            : isJoin
              ? "Create my account"
              : "Sign in"}
        </button>
      </form>

      <p className="font-body text-muted mt-7 text-center text-xs">
        {isJoin ? "Already a member? " : "New here? "}
        <Link
          href={isJoin ? "/sign-in" : "/join"}
          className="text-gold-light underline underline-offset-4"
        >
          {isJoin ? "Sign in" : "Become a member"}
        </Link>
      </p>

      <p className="mt-3 text-center">
        <Link
          href="/"
          className="font-body text-muted/60 hover:text-muted text-xs transition"
        >
          Back to the lantern
        </Link>
      </p>
    </motion.div>
  );
}
