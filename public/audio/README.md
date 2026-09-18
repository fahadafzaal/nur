# Audio assets

## ambient.mp3 — the app-wide background nasheed

Drop the **Lost and Found** master here as `ambient.mp3`.

The player loops **1:08 – 1:53** out of it automatically, so upload the
*full* track — it does not need trimming. The in/out points live in
`src/lib/audio/ambient.ts` if the client revises them again.

Until this file exists the ambient control hides itself, so the app is
safe to deploy and demo without it.

## A note for later

This folder is `public/`, which means anything here is downloadable by
anyone who knows the URL. That is fine for the ambient loop (it is a
45-second excerpt used as atmosphere) but **not** for the members-only
full tracks — those go in a private Supabase Storage bucket behind signed
URLs in M5, or the membership has nothing behind it.
