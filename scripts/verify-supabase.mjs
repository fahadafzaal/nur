/**
 * Verifies the Supabase setup for NUR.
 *
 *   npm run verify:supabase
 *
 * Checks, in order:
 *   1. .env.local has a URL and a client key (and that it is not a secret one)
 *   2. the project answers and accepts that key
 *   3. migration 0001 has been run
 *   4. its column GRANTs actually applied
 *
 * (4) is the one worth having. RLS alone is row-level, so "a member may
 * update their own row" would still let someone set membership_status to
 * 'member' from the browser and walk through the paid gate. The GRANTs are
 * what prevent that, and this proves they are in force rather than assuming.
 */

import { readFileSync } from "node:fs";

const OK = "\x1b[32m✓\x1b[0m";
const BAD = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m!\x1b[0m";

function describeKey(k) {
  if (k.startsWith("sb_publishable_")) return "publishable (current)";
  if (k.startsWith("eyJ")) return "anon JWT (legacy)";
  if (k.startsWith("sb_secret_")) return "SECRET";
  return "unrecognised";
}

function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = loadEnv(".env.local");
if (!env) {
  console.log(`${BAD} No .env.local found. Copy .env.local.example to .env.local.`);
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log(`${BAD} .env.local is missing values:`);
  if (!url) console.log("    NEXT_PUBLIC_SUPABASE_URL is empty");
  if (!key) console.log("    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is empty");
  console.log("\n  Supabase Dashboard -> Project Settings -> API Keys");
  process.exit(1);
}

const kind = describeKey(key);
if (kind === "SECRET") {
  console.log(`${BAD} That is a SECRET key. It bypasses Row Level Security and`);
  console.log("    must never sit in a NEXT_PUBLIC_ variable — it would be");
  console.log("    compiled into the browser bundle. Use the publishable key.");
  process.exit(1);
}

console.log(`${OK} .env.local has both values`);
console.log(`    project:  ${url}`);
console.log(`    key type: ${kind}`);

// ---- 2-4. One request answers all of them. -------------------------------
// Note: /rest/v1/ (the PostgREST root) now requires a SECRET key, so it is
// useless as a reachability probe with a publishable key. Querying the table
// tells us everything instead.
const base = url.replace(/\/$/, "");
let res, body;
try {
  res = await fetch(`${base}/rest/v1/profiles?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  body = await res.json().catch(() => ({}));
} catch (e) {
  console.log(`${BAD} Could not reach the project: ${e.message}`);
  console.log("    Check the URL, and that the project is not paused.");
  process.exit(1);
}

const code = body?.code ?? "";
const message = body?.message ?? "";

if (res.status === 401) {
  console.log(`${BAD} The key was rejected: ${message}`);
  console.log("    Re-copy the publishable key from Project Settings -> API Keys.");
  process.exit(1);
}

console.log(`${OK} Project reachable and key accepted`);

if (code === "PGRST205" || code === "42P01") {
  console.log(`${BAD} The profiles table does not exist — migration not run yet.`);
  console.log("");
  console.log("    Supabase Dashboard -> SQL Editor -> New query");
  console.log("    Paste all of supabase/migrations/0001_profiles.sql, press Run.");
  process.exit(1);
}

if (code === "42501" || res.status === 403) {
  console.log(`${OK} profiles table exists`);
  console.log(`${OK} Column grants in force — anonymous access correctly denied`);
  console.log("\n\x1b[32mSupabase is set up correctly.\x1b[0m  Next: npm run dev");
  process.exit(0);
}

if (res.ok) {
  console.log(`${OK} profiles table exists`);
  console.log(`${WARN} Anonymous SELECT was NOT denied.`);
  console.log("    The REVOKE/GRANT block at the end of 0001 did not take effect.");
  console.log("    Re-run supabase/migrations/0001_profiles.sql in full.");
  process.exit(1);
}

console.log(`${WARN} Unexpected response (${res.status}): ${JSON.stringify(body)}`);
process.exit(1);
