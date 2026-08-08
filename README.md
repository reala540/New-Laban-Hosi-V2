# The Laban Hospital Website

A React + TypeScript + Vite site for The Laban Hospital, deployed on Vercel.
This is a **read-only public site**: there is no admin panel and no
web-based way to edit content. Content updates now happen by editing the
database directly or by rebuilding/redeploying the project.

## Architecture

- **Neon (Postgres)** — stores structured content: banner, offers, services,
  doctors, gallery captions/URLs, appointments, and contact messages. See
  `db/schema.sql`.
- **Vercel Functions** (`/api/*.ts`) — a small, public-only backend:
  - `content.ts` — GET, aggregates banner + offers + services + doctors +
    gallery into one response for the public site.
  - `appointments.ts` — POST only, accepts new "Book Appointment" form
    submissions.
  - `messages.ts` — POST only, accepts new contact-form messages.
- **Photo showcase** — the cinematic homepage photo slider (`PhotoShowcase.tsx`)
  uses real, curated photos of the hospital and its community work, bundled
  as static files under `public/gallery/`. These are **not** pulled from the
  `gallery_items` database table, since there is no longer an admin write
  path to populate it live — see "Content updates" below.

## What changed from the previous version

An earlier version of this site had a hidden admin panel at
`/manage/<ADMIN_SECRET>` for editing content from a browser. That has been
**fully removed**:

- `src/admin/` (all editor components) — deleted
- `api/banner.ts`, `services.ts`, `doctors.ts`, `offers.ts`, `gallery.ts`,
  `upload.ts`, `health.ts` — deleted (these only existed to serve admin writes)
- `server/auth.ts` and the `x-admin-key` header check — deleted
- The `/manage/:secret` route in `main.tsx` — deleted
- The `@vercel/blob` dependency — removed (no more uploads)

The database tables themselves were **not** dropped — `appointments` and
`contact_messages` still fill up from the public forms, and `services`,
`doctors`, `offers`, and `gallery_items` still exist and are still read by
`content.ts` if you want to populate them directly.

## Content updates (now that there's no admin panel)

Since there's no web UI to add/edit services, doctors, offers, or gallery
items anymore, updating them means either:

1. **Editing the database directly** — open the Neon SQL Editor and run
   `insert`/`update` statements against the relevant table (see
   `db/schema.sql` for the exact columns). `content.ts` will pick up the
   change on the next page load automatically — no redeploy needed.
2. **Editing the code and redeploying** — e.g. to change the photos and
   captions in the homepage showcase, edit the `PHOTOS` array at the top of
   `src/components/PhotoShowcase.tsx` and push a new deploy.

If you outgrow this (multiple staff needing to make frequent updates), a
lightweight admin panel could be rebuilt later on the same database schema
— the tables and public API are untouched.

## One-time setup (you, the developer)

1. **Push this project to GitHub** and import it into Vercel as normal.

2. **Create a Neon database**: Vercel dashboard → your project → **Storage**
   → **Create Database** → **Neon** (or **Postgres**). This automatically
   adds a `DATABASE_URL` environment variable to your project.

3. **Run the schema**: open the Neon database's **SQL Editor** and run
   everything in `db/schema.sql`. This creates all the tables and seeds 8
   default services so the site isn't empty on first load.

4. **Redeploy** so the environment variables take effect.

Note: **Vercel Blob is no longer required.** The old setup needed a Blob
store for admin-uploaded photos/videos; since uploads were removed, you can
skip that step entirely for a fresh deployment.

## Local development

```bash
npm install
npm run dev
```

The `/api` routes only work when running through Vercel's own dev server
(`vercel dev`), not plain `vite dev`, since they need a real Neon
connection. For local testing, create a `.env` file pointing at your Neon
database.

## Project structure

```
db/
  schema.sql        Run once against Neon - creates all tables + seed data

server/             Shared backend helpers (NOT routes - just imported by api/*.ts)
  db.ts             Neon connection (the `sql` tagged-template function)
  cors.ts           Shared CORS + no-cache headers
  errorHandler.ts   Wraps every route so a bug returns JSON, not a crash

api/
  content.ts        GET (public) - aggregates banner+offers+services+doctors+gallery in one call
  appointments.ts   POST (public submit only)
  messages.ts       POST (public submit only)

src/
  components/       Public site sections (Header, Hero, PhotoShowcase, Services, Offers, etc.)
  lib/api.ts         Frontend helpers that call the /api routes above
  lib/ContentContext.tsx   Loads public content once, shares it across components

public/
  gallery/          Real, curated photos used by the homepage photo showcase
```
