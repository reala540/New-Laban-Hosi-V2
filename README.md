# The Laban Hospital Website

A React + TypeScript + Vite site for The Laban Hospital, deployed on Vercel,
with a **secure, hidden admin panel** so the hospital owner can update the
website without touching code.

## Architecture

- **Neon (Postgres)** — the only database. Stores all content (banner,
  offers, services, doctors, gallery photos, appointments, contact messages)
  plus uploaded image bytes (`media` table), the admin password hash and
  rate-limit buckets. See `db/schema.sql`.
- **Vercel Functions** (`/api/*.ts`) — the backend:
  - Public: `content.ts` (GET site content), `appointments.ts` and
    `messages.ts` (POST form submissions), `media.ts` (GET an uploaded image).
  - Admin only (`/api/admin/*`): login/logout/session check plus full
    create/edit/delete for banner, services, doctors, offers and gallery,
    viewing and status updates for appointment requests and contact messages,
    image upload, and password change. Every admin route verifies the session
    cookie on the server before doing anything.
- **Hidden admin panel** — lives at `/manage/<ADMIN_URL_KEY>` where
  `ADMIN_URL_KEY` is a random string set as a Vercel environment variable.
  No page on the public site links to it, `robots.txt` excludes `/manage`,
  and any wrong `/manage/*` URL shows the same plain "page not found" as any
  other unknown URL. Signing in requires the admin password (scrypt-hashed in
  the database); the session is an HttpOnly, Secure, SameSite=Strict cookie
  that expires after 8 hours.

## Security measures (summary)

- Secrets live only in server-side environment variables; none are in the
  frontend bundle or the repo.
- Every admin action is authenticated server-side; mutations additionally
  require a custom header and a matching Origin (CSRF defence).
- All input is validated on the server; all SQL is parameterized.
- Login and public forms are rate limited (database-backed, per IP).
- Uploads accept only real JPG/PNG/WebP images (checked by magic bytes),
  max 2 MB; filenames and claimed types are ignored.
- The site connects to the database as `laban_app`, a least-privilege role.
- No user input is ever rendered as raw HTML (React escaping everywhere).
- Error responses are generic; details are logged server-side only.

## Setup

See **SETUP-GUIDE.md** (delivered with the project) for the complete,
beginner-friendly walkthrough: connecting Neon, setting the four environment
variables in Vercel, signing in for the first time, and using the admin
panel. The short version for developers:

1. Push to GitHub and import into Vercel.
2. Create a Neon project and run `db/schema.sql` in its SQL Editor.
3. Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_URL_KEY` and
   `ADMIN_INITIAL_PASSWORD` in the Vercel project's environment variables
   (see `.env.example`).
4. Redeploy, then visit `/manage/<ADMIN_URL_KEY>` to sign in.

## Local development

```bash
npm install
npm run dev
```

The `/api` routes only work under `vercel dev` (they need a real Neon
connection). Create a local `.env` with the same variables for that.

## Project structure

```
db/
  schema.sql        Creates all tables + seeds services (run once in Neon)

server/             Shared backend helpers (imported by api/*.ts)
  db.ts             Neon connection (the `sql` tagged-template function)
  auth.ts           Session cookies, scrypt password hashing, requireAdmin()
  rateLimit.ts      Database-backed fixed-window rate limiting
  validate.ts       Server-side input validation helpers
  cors.ts           CORS/cache headers (same-origin only, no wildcard)
  errorHandler.ts   Wraps routes so bugs return generic JSON, never internals

api/
  content.ts        GET (public) - banner+offers+services+doctors+gallery
  appointments.ts   POST (public) - appointment form submissions
  messages.ts       POST (public) - contact form submissions
  media.ts          GET (public) - serves an uploaded image by id
  admin/            All require a valid admin session
    login.ts        POST - rate limited; sets the session cookie
    logout.ts       POST - clears the session cookie
    me.ts           GET  - "am I signed in?" check for the panel
    banner.ts       GET/PUT the announcement banner
    services.ts     GET/POST/PUT/DELETE services
    doctors.ts      GET/POST/PUT/DELETE doctors
    offers.ts       GET/POST/PUT/DELETE offers
    gallery.ts      GET/POST/PUT/DELETE gallery photos
    appointments.ts GET/PATCH appointment request statuses
    messages.ts     GET/PATCH contact message statuses
    upload.ts       POST - validates & stores an uploaded image
    password.ts     POST - change the admin password

src/
  components/       Public site sections (Header, Hero, PhotoShowcase, ...)
  pages/            Privacy Policy, Terms of Service, 404
  admin/            The admin panel (hidden route)
  lib/              Public-site data fetching and helpers
```
