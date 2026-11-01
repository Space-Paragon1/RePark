# RePark

> **Work in progress** — MVP 1.0 is under active development.

Privacy-preserving vehicle obstruction notification platform.

RePark lets nearby users report vehicles that are blocking access, then relays anonymous alerts to registered vehicle owners — without exposing anyone's personal contact details.

Available as an Android app, a website (for people who don't want to install an app), and soon an iPhone app. All three share one backend and one account system.

---

## What's Built (MVP 1.0)

### Website (`web/`)
- Public home page explaining RePark, with links to sign in, report, or register a car
- Phone number + one-time code sign-in (same accounts as the app)
- Report a car using the browser's location; `/report?plate=ABC123` pre-fills the plate
- Register and remove vehicles, file ownership claims
- Reply to alerts, with live updates
- Download data, delete account, sign out
- Works on desktop and phone browsers (bottom tab bar on phones)
- Website-only owners get alerts by SMS, since they have no app for push notifications

See [`web/README.md`](web/README.md) for details.

### Authentication
- Phone number login with SMS OTP via Supabase Auth + Twilio
- Sessions persisted securely on device with `expo-secure-store`
- ES256 JWT verification on the backend using Supabase JWKS endpoint

### Vehicle Management
- Register up to 10 vehicles (plate, make, model, colour, parking zone)
- View and delete registered vehicles
- One account per plate (enforced by a unique index), so every alert reaches exactly one owner
- Ownership claims: if a plate is already registered to someone else, the user can file a claim for manual review

### Reporting
- Report a vehicle by plate number with GPS location
- 5 structured issue types (blocking driveway, construction access, garbage pickup, restricted zone, emergency access)
- Optional free-text message
- Rate limiting: max 3 reports per hour, 15-minute cooldown per plate
- Report history with live status tracking — reporters see when owners respond

### Alerts (Owner Notifications)
- When a registered plate is reported, the owner receives an alert instantly
- Alerts tab shows vehicle info, issue type, timestamp, and status badge
- Owner can respond: Moving Now, Already Moved, or Incorrect Report
- Response updates the report status visible to the reporter
- Real-time updates via Supabase Realtime WebSocket — new alerts appear automatically without refreshing
- Pull-to-refresh and auto-reload on tab focus

### Alert Delivery
- Owners get an Expo push notification when their plate is reported
- **SMS fallback via Twilio** when the owner has no working push token (no app, notifications off, or push rejected)
- Each alert records whether it was delivered and how (`push` or `sms`); failures are recorded, not ignored
- Dead push tokens (app uninstalled) are removed automatically
- Delivery runs after the report is saved, so reporters aren't kept waiting
- Reporters get a push when the owner responds

### Report Lifecycle
| Situation | What happens |
|---|---|
| Plate registered | Owner alerted → status **Owner Notified** |
| Owner responds | Status **Owner Responded** or **Incorrect Report**; reporter gets a push |
| No response in 24 hours | Closed automatically → **No Response** |
| Plate not registered | Reporter told straight away → **Owner Not on RePark Yet** |
| Plate registered within 2 hours of the report | New owner still gets the alert |
| Plate still not registered after 2 hours | Closed automatically → **Owner Not on RePark** |

Automatic closing runs every 15 minutes in the database (`close_stale_reports()` via `pg_cron`).

### Abuse Safeguards
- Anonymous relay — reporter never sees owner identity
- Rate limits and cooldowns enforced server-side
- `incorrect_report` response logs an abuse event against the reporter
- Users with 5+ abuse events in 24 hours are temporarily blocked from submitting reports

### Account Management
- Export all personal data as JSON (GDPR-style)
- Delete account — permanently removes all vehicles, reports, alerts, and auth record
- Push token management

### Home Dashboard
- Live stats: vehicles registered, pending alerts, reports filed
- Numbers animate on load (count-up effect)
- Quick-action shortcuts to all core flows

### UI & Polish
- Consistent design system (`lib/theme.ts`) with shared colours, shadows, and border radii
- Branded blue hero sections on all major screens
- Skeleton loading cards instead of spinners
- Staggered fade + slide-in animations on list items
- Spring-scale press feedback on every button
- Bounce animation on report success screen

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.88 + Expo SDK 58 + TypeScript |
| Website | Next.js 16 + TypeScript + Tailwind CSS 4 |
| Routing | Expo Router (SDK 58) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Phone OTP + Twilio SMS) |
| Real-time | Supabase Realtime (WebSocket) |
| Push Notifications | Expo Push API + EAS Build |
| CI/CD | GitHub Actions: backend tests, website build, EAS Android build, EAS iPhone build (started by hand) |
| Hosting | Railway (backend), Vercel (website), EAS (mobile builds) |
| HTTP client | httpx (backend), fetch (mobile) |

---

## Project Structure

```
RePark/
├── .github/
│   └── workflows/
│       ├── ci.yml                # Backend tests + website lint/build on every push
│       └── eas-build.yml         # Android APK on push to main; iPhone build started by hand
│
├── web/                          # Next.js website (see web/README.md)
│   ├── app/
│   │   ├── page.tsx              # Public home page
│   │   ├── login/                # Phone + code sign-in
│   │   └── (app)/                # Signed-in pages: dashboard, report, vehicles, alerts, account
│   ├── components/               # AppShell (nav + sign-in guard), AuthProvider, UI pieces
│   └── lib/                      # API client, Supabase client, labels
│
├── mobile/                       # Expo React Native app
│   ├── app/
│   │   ├── (auth)/               # Login + OTP verification screens
│   │   └── (tabs)/               # Home, Report, Vehicles, Alerts, Profile
│   ├── assets/
│   │   └── images/               # App icons and splash screen
│   ├── components/
│   │   ├── PressableScale.tsx    # Animated press-scale button wrapper
│   │   ├── FadeInView.tsx        # Fade + slide-up entrance animation
│   │   └── Skeleton.tsx          # Pulsing skeleton loader cards
│   ├── contexts/                 # AuthContext (session management)
│   ├── lib/
│   │   ├── api.ts                # Typed API client
│   │   ├── supabase.ts           # Supabase client
│   │   ├── notifications.ts      # Push notification helpers
│   │   └── theme.ts              # Design tokens (colours, shadows, radii)
│   ├── eas.json                  # EAS Build profiles (development/preview/production)
│   └── .env.local                # From eas env:pull: Supabase URL/key, API URL (not committed)
│
├── backend/                      # FastAPI API
│   ├── app/
│   │   ├── routers/              # auth, vehicles, reports, alerts, push_tokens, account
│   │   ├── schemas/              # Pydantic models
│   │   ├── services/             # notify.py (push, SMS fallback, alert delivery)
│   │   ├── dependencies/         # JWT auth (JWKS)
│   │   ├── db.py                 # PostgREST helpers
│   │   └── main.py
│   ├── tests/                    # pytest test suite
│   │   ├── test_reports.py       # Rate limit, cooldown, abuse block, pipeline
│   │   ├── test_vehicles.py      # One owner per plate, claims, late registration
│   │   ├── test_notify.py        # Push, SMS fallback, delivery status
│   │   ├── test_alerts.py        # List, respond, abuse logging
│   │   └── test_auth.py          # 401/403 on unauthenticated requests
│   ├── Procfile                  # Railway deployment start command
│   └── .env                      # Supabase credentials
│
├── database/
│   └── schema.sql                # Full database schema
│
└── docs/
    ├── PRODUCT_SPEC.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── MVP_EXECUTION_PLAN.md
    └── TROUBLESHOOTING.md        # All issues encountered and how they were fixed
```

---

## Test Credentials

To log in and explore the app without real SMS verification, use these Supabase test credentials:

| Field | Value |
|---|---|
| Phone number | `+18773356146` |
| OTP code | `171717` |

No SMS will be sent — enter these values directly in the login and verification screens.

---

## Running Locally

### Backend
Requires Python 3.12 (matches `runtime.txt`; the code does not run on 3.9).
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0
```

### Mobile (Expo Go — no push notifications)
Requires Node.js 22.13+, 24.3+ or 26+, and the latest **Expo Go** on your phone. Expo Go only runs the newest Expo SDK, so the app's SDK has to match it.
```bash
cd mobile
npm ci   # not "npm install --legacy-peer-deps": that strips packages from package-lock.json and breaks EAS builds
npx eas-cli@latest login
npx eas-cli@latest env:pull --environment preview   # writes .env.local
npx expo start --go
```

Scan the QR code with the iPhone Camera app, or from Expo Go on Android. If your phone isn't on the same Wi-Fi as your computer, add `--tunnel`.

> **Note:** Keep the `--go` flag. The project includes `expo-dev-client`, so without it the QR code tries to open a development build, and the iPhone camera shows "No usable data found".

> **Note:** Push notifications require an EAS preview/production build, not Expo Go.

### Android (EAS Build — full features including push)
```bash
cd mobile
eas build --profile preview --platform android
```

Download and install the APK from the link provided after the build completes.

### iPhone (EAS Build → TestFlight)
Needs a paid Apple Developer account. Run the first build from your own terminal, so EAS can sign in to Apple and create the signing certificates, push key and App Store Connect key:
```bash
cd mobile
npx eas-cli@latest build --platform ios --profile production --auto-submit
```
After that, start iPhone builds from GitHub (see CI/CD below). Each build is sent to TestFlight.

### Website
```bash
cd web
cp .env.example .env.local       # fill in Supabase URL/key and API URL
npm install
npm run dev                      # http://localhost:3000
```
Set `CORS_ORIGINS=http://localhost:3000` in `backend/.env` so the API accepts requests from it.

### Running Tests
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```
Tests mock the database and don't need a `.env` file.

---

## CI/CD

Every push and pull request runs the backend tests and checks that the website type-checks, lints, and builds (`.github/workflows/ci.yml`).

Every push to `main` also triggers an Android APK build via GitHub Actions + EAS Build.

iPhone builds don't run on push, because each one uses EAS build credit. Start one by hand from GitHub → **Actions** → **EAS Build** → **Run workflow** → `ios`. It builds the `production` profile and sends it to TestFlight. It only works after the first iPhone build has been run from a terminal (see Running Locally).

**Required GitHub secret:**
| Secret | Description |
|---|---|
| `EXPO_TOKEN` | Expo access token (expo.dev → Account → Access Tokens) |

**Required EAS environment variables** (set via `eas env:create` or expo.dev dashboard):
| Variable | Environment | Visibility |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | preview, production | Plain text |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | preview, production | Sensitive |
| `EXPO_PUBLIC_API_URL` | preview, production | Plain text |

Android test builds read `preview`. iPhone App Store builds read `production`, so they need the variables there too, or the app can't reach Supabase and crashes on launch.

---

## Deployment

The backend is deployed on **Railway** and runs 24/7 at a public `https://` URL.

Set the following environment variables in Railway → Variables:

| Key | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `CORS_ORIGINS` | Website URL(s) allowed to call the API, comma-separated, e.g. `https://repark.vercel.app`. Defaults to any site |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (SMS fallback, optional) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (SMS fallback, optional) |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service to send from. Set this **or** `TWILIO_FROM_NUMBER` |
| `TWILIO_FROM_NUMBER` | Twilio phone number to send from, e.g. `+15551234567` |

Without the Twilio variables, alerts go out by push only. Failures are logged and the alert is marked `failed`.

### Website (Vercel)
Import the repo in Vercel, set **Root Directory** to `web`, and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_API_URL`. After the first deploy, add the site's URL to `CORS_ORIGINS` on Railway.

**Deploy order:** run any new database migration *before* deploying backend code that depends on it.

---

## Environment Variables

### `mobile/.env.local` (local development only — not used in EAS builds)
Created by `eas env:pull` (see Running Locally), or write it by hand:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

### `backend/.env`
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Websites allowed to call the API from a browser (comma-separated). Default: any.
CORS_ORIGINS=http://localhost:3000

# Optional: SMS fallback
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=   # or TWILIO_FROM_NUMBER
TWILIO_FROM_NUMBER=
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `vehicles` | Registered vehicles per user |
| `reports` | Obstruction reports filed by users |
| `alerts` | Notifications sent to vehicle owners |
| `push_tokens` | Expo push tokens for notification delivery |
| `abuse_events` | Flagged abuse incidents |
| `plate_claims` | Ownership disputes for plates registered to another account |

Realtime is enabled on the `alerts` table (`supabase_realtime` publication). Row Level Security policies limit each signed-in user to alerts for their own vehicles, so Realtime only delivers a user's own alerts.

### Setting up or updating the database
- **New database:** run `database/schema.sql` in the Supabase SQL editor.
- **Existing database:** run each file in `database/migrations/` in order. Read the comments at the top of each file first. Run migrations before deploying the backend that needs them.

### Resolving plate ownership claims
Claims are reviewed by hand in the Supabase SQL editor for now. List pending claims:
```sql
select * from plate_claims where status = 'pending' order by created_at;
```
To **approve** a claim, move the plate to the claimant. This deletes the previous holder's vehicle and its alert history.
```sql
begin;
delete from vehicles where id = '<current_vehicle_id>';
insert into vehicles (user_id, plate_number, make, model, color)
  select claimant_user_id, plate_number, make, model, color
  from plate_claims where id = '<claim_id>';
update plate_claims set status = 'approved', reviewed_at = now() where id = '<claim_id>';
update plate_claims set status = 'rejected', reviewed_at = now()
  where plate_number = (select plate_number from plate_claims where id = '<claim_id>')
    and status = 'pending' and id <> '<claim_id>';
commit;
```
To **reject** a claim:
```sql
update plate_claims set status = 'rejected', reviewed_at = now() where id = '<claim_id>';
```

---

## Documentation

- `docs/TROUBLESHOOTING.md` — all issues encountered during development and their fixes
- `docs/PRODUCT_SPEC.md` — full product requirements
- `docs/SYSTEM_ARCHITECTURE.md` — system design and data flow
- `docs/MVP_EXECUTION_PLAN.md` — build plan and milestones
