/**
 * Supabase environment.
 *
 * Both values are safe to expose to the browser: the anon key only grants
 * what Row Level Security allows. The service-role key must never appear
 * in a NEXT_PUBLIC_ variable — it bypasses RLS entirely and belongs only
 * in server-side code (Stripe webhooks in M8).
 *
 * These are read as literal `process.env.X` expressions because Next
 * inlines NEXT_PUBLIC_ variables at build time; dynamic lookup would not
 * be replaced.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether Supabase has been configured yet.
 *
 * Deliberately checked rather than assumed: until the project exists,
 * auth degrades to a clear message instead of crashing every route —
 * the splash screen stays demoable with no backend at all.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SUPABASE_SETUP_MESSAGE =
  "The account system isn't connected yet. Add your Supabase URL and anon key to .env.local.";
