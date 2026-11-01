# RePark website

The browser version of RePark, for people who don't want to install the app.
Users sign in with their phone number and can report a car, register their own
vehicles, reply to alerts, and manage their account. It uses the same Supabase
project and FastAPI backend as the mobile app.

Built with Next.js 16 (App Router), TypeScript and Tailwind CSS 4.

## Pages

| Path | What it does |
|---|---|
| `/` | Public home page |
| `/login` | Phone number + one-time code sign-in. `?next=/path` returns there afterwards |
| `/dashboard` | Counts, pending alerts, recent reports |
| `/report` | Report a car using the browser's location. `?plate=ABC123` fills in the plate (for QR stickers) |
| `/vehicles` | Add or remove vehicles; file an ownership claim if a plate is taken |
| `/alerts` | Alerts about your vehicles, with live updates; reply Moving now / Already moved / Incorrect |
| `/account` | Sign out, download your data, delete your account |

Signed-in pages live in `app/(app)/`. `components/AppShell.tsx` sends signed-out
visitors to `/login`. The session is kept in the browser's localStorage by
supabase-js.

## Running locally

```bash
cd web
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

The backend must allow the site's address: set `CORS_ORIGINS` in `backend/.env`
(e.g. `http://localhost:3000`).

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL as the mobile app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. the Railway URL |
| `NEXT_PUBLIC_ANDROID_APP_URL` | Optional. Shows a "Get the Android app" button |
| `NEXT_PUBLIC_IOS_APP_URL` | Optional. Shows a "Get the iPhone app" button |

These are built into the page code, so rebuild after changing them.

## Keeping in step with the app

`lib/api.ts` mirrors `mobile/lib/api.ts`, and `lib/labels.ts` mirrors the
mobile status labels. When the backend changes, update both.

## Deploying

Vercel is the simplest option: import the repo, set **Root Directory** to `web`,
add the environment variables above, and deploy. Then add the site's URL to
`CORS_ORIGINS` on Railway (comma-separated, no trailing slash).

Location only works on HTTPS (or localhost), which Vercel provides.
