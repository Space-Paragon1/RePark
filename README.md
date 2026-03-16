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
- Duplicate plate detection

### Reporting
- Report a vehicle by plate number with GPS location
- 5 structured issue types (blocking driveway, construction access, garbage pickup, restricted zone, emergency access)
- Optional free-text message
- Rate limiting: max 3 reports per hour, 15-minute cooldown per plate

### Alerts (Owner Notifications)
- When a registered plate is reported, the owner receives an alert instantly
- Alerts tab shows vehicle info, issue type, timestamp, and status badge
- Owner can respond: Moving Now, Already Moved, or Incorrect Report
- Response updates the report status visible to the reporter
- Real-time updates via Supabase Realtime WebSocket — new alerts appear automatically without refreshing
- Pull-to-refresh and auto-reload on tab focus

### Abuse Safeguards
- Anonymous relay — reporter never sees owner identity
- Rate limits and cooldowns enforced server-side
- `incorrect_report` response flags potential abuse

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
| HTTP client | httpx (backend), fetch (mobile) |

---

## Project Structure

```
RePark/
├── mobile/                  # Expo React Native app
│   ├── app/
│   │   ├── (auth)/          # Login + OTP verification screens
│   │   └── (tabs)/          # Home, Report, Vehicles, Alerts, Profile
│   ├── contexts/            # AuthContext (session + push token registration)
│   ├── lib/
│   │   ├── api.ts           # Typed API client
│   │   ├── supabase.ts      # Supabase client
│   │   └── notifications.ts # Push notification helpers
│   └── .env                 # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_API_URL
│
├── backend/                 # FastAPI API
│   ├── app/
│   │   ├── routers/         # auth, vehicles, reports, alerts, push_tokens
│   │   ├── schemas/         # Pydantic models
│   │   ├── services/        # push.py (Expo Push API)
│   │   ├── dependencies/    # JWT auth (JWKS)
│   │   ├── db.py            # PostgREST helpers
│   │   └── main.py
│   └── .env                 # Supabase credentials
│
├── database/
│   └── schema.sql           # Full database schema
│
└── docs/
    ├── PRODUCT_SPEC.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── MVP_EXECUTION_PLAN.md
    └── TROUBLESHOOTING.md   # All issues encountered and how they were fixed
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

### Mobile
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Open in **Expo Go** (iOS/Android) by scanning the QR code.

> **Note:** Push notifications require a development build (not Expo Go). Real-time alerts via Supabase Realtime work fully in Expo Go.

---

## Environment Variables

### `mobile/.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
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
| `push_tokens` | Expo push tokens for notifications |
| `abuse_events` | Flagged abuse incidents |

Realtime is enabled on the `alerts` table (`supabase_realtime` publication).

---

## Documentation

- `docs/TROUBLESHOOTING.md` — all issues encountered during development and their fixes
- `docs/PRODUCT_SPEC.md` — full product requirements
- `docs/SYSTEM_ARCHITECTURE.md` — system design and data flow
- `docs/MVP_EXECUTION_PLAN.md` — build plan and milestones
