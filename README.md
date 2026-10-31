# RePark

> **Work in progress** — MVP 1.0 is under active development.

Privacy-preserving vehicle obstruction notification platform.

RePark lets nearby users report vehicles that are blocking access, then relays anonymous alerts to registered vehicle owners — without exposing anyone's personal contact details.

---

## What's Built (MVP 1.0)

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
| Mobile | React Native 0.81 + Expo SDK 54 + TypeScript |
| Routing | Expo Router v6 |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Phone OTP + Twilio SMS) |
| Real-time | Supabase Realtime (WebSocket) |
| Push Notifications | Expo Push API + EAS Build |
| CI/CD | GitHub Actions + EAS Build (auto-build on push to main) |
| Hosting | Railway (backend), EAS (mobile builds) |
| HTTP client | httpx (backend), fetch (mobile) |

---

## Project Structure

```
RePark/
├── .github/
│   └── workflows/
│       └── eas-build.yml         # Auto-build Android APK on push to main
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
│   └── .env                      # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_API_URL
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
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --tunnel
```

Open in **Expo Go** (iOS/Android) by scanning the QR code.

> **Note:** Push notifications require an EAS preview/production build, not Expo Go.

### Mobile (EAS Build — full features including push)
```bash
cd mobile
eas build --profile preview --platform android
```

Download and install the APK from the link provided after the build completes.

### Running Tests
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```
Tests mock the database and don't need a `.env` file.

---

## CI/CD

Every push to `main` automatically triggers an Android APK build via GitHub Actions + EAS Build.

**Required GitHub secret:**
| Secret | Description |
|---|---|
| `EXPO_TOKEN` | Expo access token (expo.dev → Account → Access Tokens) |

**Required EAS environment variables** (set via `eas env:create` or expo.dev dashboard):
| Variable | Environment | Visibility |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | preview | Plain text |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | preview | Sensitive |
| `EXPO_PUBLIC_API_URL` | preview | Plain text |

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
| `TWILIO_ACCOUNT_SID` | Twilio account SID (SMS fallback, optional) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (SMS fallback, optional) |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service to send from. Set this **or** `TWILIO_FROM_NUMBER` |
| `TWILIO_FROM_NUMBER` | Twilio phone number to send from, e.g. `+15551234567` |

Without the Twilio variables, alerts go out by push only. Failures are logged and the alert is marked `failed`.

**Deploy order:** run any new database migration *before* deploying backend code that depends on it.

---

## Environment Variables

### `mobile/.env` (local development only — not used in EAS builds)
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

# Optional: SMS fallback
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=   # or TWILIO_FROM_NUMBER
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
