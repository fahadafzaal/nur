import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Supabase client with the SECRET key. It bypasses Row Level Security.
 *
 * Used for exactly one job: applying what Stripe has confirmed (a
 * membership starting or ending, an order being paid). Members cannot set
 * their own membership_status — the column grants in migration 0001
 * forbid it — so this is the only path by which it changes, and it runs
 * only after a webhook's signature has been verified.
 *
 *   SUPABASE_SECRET_KEY        sb_secret_…  (current format), or
 *   SUPABASE_SERVICE_ROLE_KEY  the legacy service_role JWT
 *
 * Never a NEXT_PUBLIC_ variable, never imported by client code — the
 * "server-only" import above makes the build fail if it ever is.
 */
const SECRET =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isAdminClientConfigured = Boolean(SUPABASE_URL && SECRET);

export function createAdminClient() {
  if (!isAdminClientConfigured) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }
  return createClient(SUPABASE_URL, SECRET, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
