# NUR

A premium Islamic lifestyle app — nasheeds, Qur'an, Seerah, dhikr, health
tracking and a modest-fashion shop, in one quiet place to return to daily.

*Nur ala Nur* — light upon light (Surah An-Nur, 24:35).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind v4 — brand tokens in `src/app/globals.css` |
| Animation | CSS/SVG for perpetual motion, Motion for choreography |
| Database, auth, storage | Supabase (Postgres + RLS) |
| Hosting | Vercel |

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the two Supabase values
npm run verify:supabase            # confirms setup, including RLS grants
npm run dev
```

## Database

Migrations live in `supabase/migrations/` and are applied by pasting them
into the Supabase SQL Editor, in order. All are safe to re-run.

| File | Adds |
|---|---|
| `0001_profiles.sql` | accounts, profiles, RLS, column grants |
| `0002_tracking.sql` | tasbeeh sessions, health logs |

> **Why the column grants matter.** RLS is row-level, so a policy allowing
> "update your own row" would still let a member set their own
> `membership_status` to `'member'` from the browser and walk through the
> paid gate. `display_name` is the only column members may write;
> `membership_status` moves only via the service-role key.
> `npm run verify:supabase` checks this is actually in force.

## Brand

Locked tokens, defined once in `globals.css`. Never hand-type a hex value.

| Token | Hex |
|---|---|
| Ink | `#0B0A12` |
| Surface | `#15131F` |
| Gold | `#C9A227` → `#F5D98A` |
| Dusty Rose | `#D98C7A` |
| Parchment | `#F3ECDD` |
| Muted | `#9C93A8` |

Fraunces (headings) · Manrope (UI) · Amiri (Arabic)

## Status

| Milestone | State |
|---|---|
| M1 — design system, Fanous splash | done |
| M2 — accounts, sessions, route protection | done |
| M3 — daily reminder, tasbeeh, health | done |
| M4 — Qur'an Explorer | next, unblocked |
| M5 — nasheed library, ambient audio | awaiting audio files |
| M6 — Seerah | awaiting content |
| M7 — admin panel | — |
| M8 — Stripe membership, shop | — |
| M9 — QA, PWA, launch | — |

## Audio

Drop the full **Lost and Found** track at `public/audio/ambient.mp3`. The
player loops 1:08–1:53 out of it, so it does not need trimming. Until the
file exists the ambient control hides itself.

Members-only tracks must **not** live in `public/` — they go in a private
Supabase Storage bucket behind signed URLs (M5), or the membership has
nothing behind it.
