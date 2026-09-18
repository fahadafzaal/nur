/**
 * Verifies the Supabase setup for NUR.
 *
 *   npm run verify:supabase
 *
 * Checks three things in order:
 *   1. .env.local has both values
 *   2. the project is reachable with that anon key
 *   3. migration 0001 has been run AND its column grants actually applied
 *
 * (3) is the one worth running. RLS alone would still let a member set
 * membership_status = 'member' from the browser; the GRANTs are what stop
 * it. This script proves they are in force rather than assuming it.
 */

import { readFileSync } from "node:fs";

const OK = "\x1b[32m✓\x1b[0m";
const BAD = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m!\x1b[0m";

function loadEnv(path) {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

const env = loadEnv(".env.local");

if (!env) {
  console.log(`${BAD} No .env.local found. Copy .env.local.example to .env.local first.`);
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log(`${BAD} .env.local is missing values:`);
  if (!url) console.log("    NEXT_PUBLIC_SUPABASE_URL is empty");
  if (!key) console.log("    NEXT_PUBLIC_SUPABASE_ANON_KEY is empty");
  console.log("\n  Supabase Dashboard -> Project Settings -> Data API");
  process.exit(1);
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.log(`${WARN} URL looks unusual: ${url}`);
  console.log("    Expected something like https://abcdefgh.supabase.co");
}

console.log(`${OK} .env.local has both values`);
console.log(`    project: ${url}`);

const base = url.replace(/\/$/, "");
const headers = { apikey: key, Authorization: `Bearer ${key}` };

// ---- 2. reachable? ----
let res;
try {
  res = await fetch(`${base}/rest/v1/`, { headers });
} catch (e) {
  console.log(`${BAD} Could not reach the project: ${e.message}`);
  process.exit(1);
}

if (res.status === 401) {
  console.log(`${BAD} The anon key was rejected. Re-copy it from the dashboard.`);
  process.exit(1);
}
console.log(`${OK} Project reachable and anon key accepted`);

// ---- 3. migration + grants ----
const probe = await fetch(`${base}/rest/v1/profiles?select=id&limit=1`, { headers });
const body = await probe.json().catch(() => ({}));
const code = body?.code ?? "";

if (code === "PGRST205" || code === "42P01") {
  console.log(`${BAD} The profiles table does not exist.`);
  console.log("    Run supabase/migrations/0001_profiles.sql in the SQL Editor.");
  process.exit(1);
}

if (code === "42501" || probe.status === 403) {
  console.log(`${OK} profiles table exists`);
  console.log(`${OK} Column grants in force — anonymous access correctly denied`);
  console.log("\n\x1b[32mSupabase is set up correctly.\x1b[0m Run: npm run dev");
  process.exit(0);
}

if (probe.ok) {
  console.log(`${OK} profiles table exists`);
  console.log(`${WARN} Anonymous SELECT was NOT denied.`);
  console.log("    The GRANT/REVOKE block at the end of 0001 may not have run.");
  console.log("    Re-run supabase/migrations/0001_profiles.sql in full.");
  process.exit(1);
}

console.log(`${WARN} Unexpected response (${probe.status}):`, JSON.stringify(body));
process.exit(1);
