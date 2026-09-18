# Deployment

## There is no separate backend to upload

This is the most common point of confusion with this stack, so it is worth
stating plainly: **nothing is deployed separately.**

| Piece | Lives where | How it gets there |
|---|---|---|
| Pages and UI | Vercel (CDN) | `git push` |
| Server actions, API routes, auth proxy | Vercel (serverless functions) | `git push` — same deploy |
| Database | Supabase (London) | paste migrations into the SQL Editor |
| Authentication | Supabase | configured in the dashboard |
| Audio, images | Supabase Storage | uploaded through the admin panel (M7) |
| Secrets | Vercel env vars + Supabase dashboard | pasted once per environment |

The "backend" is the server half of the same Next.js codebase — every
`"use server"` file and every `route.ts`. Vercel compiles those into
serverless functions automatically on each push. There is no second repo,
no second host, no separate API to deploy and keep in sync.

Supabase is already hosted. We never deploy it; we only apply migrations
to it.

---

## Region matters more than it looks

Supabase is in **London (eu-west-2)**. Vercel's serverless functions
default to **Washington DC (iad1)**.

Left alone, every database query on every page load crosses the Atlantic
and back — roughly 150ms of pure latency, repeated for each query. A page
making three queries pays it three times.

`vercel.json` pins functions to `lhr1` (London), putting them in the same
city as the database. This is a one-line change that is very hard to
notice as a bug later, because the site still *works* — it is just slow
for reasons that never show up in an error log.

---

## Environments

Vercel creates a preview deployment for every branch automatically, and
production from `main`.

**Today, all of them share one Supabase project.** That is acceptable
pre-launch with a single developer, but it means a preview branch writes
to the same database the client is looking at.

**Before real users sign up**, create a second Supabase project
(`nur-staging`), and set the preview environment's variables to point at
it. Vercel supports different values per environment on the same variable
names, so no code changes.

---

## Media does not belong in git

Nasheed MP3s are 3–6MB each. Do not commit them.

- Git repositories keep every version of every binary forever, so the repo
  grows permanently even if a file is later deleted
- Vercel deployments have a size ceiling, and it is not a media host
- Replacing a track would mean a code deploy

**Where audio actually goes:**

| File | Location | Why |
|---|---|---|
| Ambient loop (45s excerpt) | `public/audio/ambient.mp3` | Small, plays before login, safe to be public |
| Full member tracks | Supabase Storage, **private bucket** | Must sit behind signed expiring URLs |
| Preview clips | Supabase Storage, public bucket | Cheap, cacheable, safe to expose |

If full tracks are served from `public/`, "members only" means nothing —
anyone can read the URL from the network tab and share the file. The
membership would have no product behind it.

---

## Costs and the licensing point

| Service | Free tier | First real limit |
|---|---|---|
| Vercel Hobby | 100GB bandwidth | **Non-commercial use only** |
| Supabase Free | 500MB database, 1GB storage, 50k monthly users | Storage, once audio lands |

**The Vercel licensing point is worth raising with the client.** The Hobby
plan is for non-commercial projects. NUR is paid client work with a
membership product, which is commercial. That means Vercel Pro (~$20/month)
at some point — ideally budgeted before launch rather than discovered when
a deployment is blocked.

Supabase Free is genuinely fine to launch on. The constraint that will bite
first is the 1GB storage ceiling once nasheeds are uploaded — roughly
150–300 tracks, so not soon.

---

## First deploy

1. Push `main` to GitHub
2. **vercel.com/new** → import the repo → do not change build settings
3. Add environment variables **before** deploying:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy
5. In Supabase → **Authentication → URL Configuration**:
   - **Site URL** → the Vercel URL
   - **Redirect URLs** → `https://<app>.vercel.app/**`

Step 5 is not optional. Without it, confirmation emails contain links
pointing at `localhost`, so account creation appears to work and then
silently fails for everyone who is not the developer.

## Custom domain

Once the Vercel deployment is stable, add **mynuralanur.com** under
Vercel → Project → Settings → Domains, then point DNS at Vercel (an `A`
record to `76.76.21.21`, or the `CNAME` Vercel shows for `www`).

Then update the Supabase Site URL and Redirect URLs again to the real
domain, or confirmation links will keep pointing at `.vercel.app`.
