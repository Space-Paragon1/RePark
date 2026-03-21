# RePark

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
- Duplicate plate detection

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

### Push Notifications
- Expo push notifications delivered when a registered plate is reported
- Push token registered on login and stored server-side
- Notifications fire even when the app is closed
- Built and distributed via EAS Build (preview profile)

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
│   │   ├── services/             # push.py (Expo Push API)
│   │   ├── dependencies/         # JWT auth (JWKS)
│   │   ├── db.py                 # PostgREST helpers
│   │   └── main.py
│   ├── tests/                    # pytest test suite
│   │   ├── test_reports.py       # Rate limit, cooldown, abuse block, pipeline
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

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
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

Realtime is enabled on the `alerts` table (`supabase_realtime` publication).

---

## Documentation

- `docs/TROUBLESHOOTING.md` — all issues encountered during development and their fixes
- `docs/PRODUCT_SPEC.md` — full product requirements
- `docs/SYSTEM_ARCHITECTURE.md` — system design and data flow
- `docs/MVP_EXECUTION_PLAN.md` — build plan and milestones
