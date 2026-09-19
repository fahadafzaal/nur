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
| `0003_hardening.sql` | fixes from the Supabase security advisor |
| `0004_quran.sql` | Daily Lessons, private Qur'an notes, is_admin/is_member |
| `0005_nasheeds.sql` | nasheeds, storage buckets, reminder articles, app settings |
| `0006_seerah.sql` | Seerah episodes, private reflections |
| `0007_shop_admin.sql` | products, orders, admin functions |

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

All nine milestones are built and live. What remains is content and keys.

| Section | Built | Waiting on |
|---|---|---|
| Splash, accounts, reminders, tasbeeh, health | yes | — |
| Qur'an Explorer (114 surahs, recitation, notes) | yes | lessons, added in /admin |
| Nasheed library + ambient audio | yes | audio files, uploaded in /admin |
| Seerah by character | yes | scripts and narration, in /admin |
| Admin panel | yes | — |
| Membership + shop | yes | Stripe keys (below) |
| Installable Android/iPhone app | yes | Play Store listing (optional) |

## Environment variables (Vercel)

| Name | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | everything |
| `SUPABASE_SECRET_KEY` | payments — server only, never `NEXT_PUBLIC_` |
| `STRIPE_SECRET_KEY` | payments |
| `STRIPE_MEMBERSHIP_PRICE_ID` | membership |
| `STRIPE_WEBHOOK_SECRET` | payments — endpoint `/api/stripe/webhook` |
| `ANDROID_PACKAGE_NAME`, `ANDROID_SHA256` | Google Play release only |

Without the payment keys, membership and checkout show "opens soon";
nothing else is affected. `/admin` shows which keys are set.

## Audio

Upload the full **Lost and Found** track in **/admin → Settings** and set the
loop window (1:08–1:53). No trimming needed, no deploy needed. Until a track
is set the ambient control hides itself.

Members-only tracks must **not** live in `public/` — they go in a private
Supabase Storage bucket behind signed URLs (M5), or the membership has
nothing behind it.
