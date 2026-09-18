/**
 * Supabase environment.
 *
 * Supabase has two generations of client-side key:
 *   · the newer `sb_publishable_...` key  (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 *   · the legacy `anon` JWT               (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * Either works here; the publishable key is preferred when both are set.
 *
 * Both are safe to expose to the browser — they only grant what Row Level
 * Security allows. The `service_role` / secret key must never appear in a
 * NEXT_PUBLIC_ variable: it bypasses RLS entirely and belongs only in
 * server-side code (the Stripe webhook in M8).
 *
 * Read as literal `process.env.X` expressions because Next inlines
 * NEXT_PUBLIC_ variables at build time; a dynamic lookup is not replaced.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Whether Supabase has been configured yet.
 *
 * Deliberately checked rather than assumed: until the project exists,
 * auth degrades to a clear message instead of crashing every route —
 * the splash screen stays demoable with no backend at all.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const SUPABASE_SETUP_MESSAGE =
  "The account system isn't connected yet. Add your Supabase URL and publishable key to .env.local.";
