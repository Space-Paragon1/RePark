# RePark System Architecture (MVP 1.0)

## 1. Architecture Overview

RePark uses an anonymized relay model:

1. Reporter submits obstruction report
2. API verifies identity, location, and abuse limits
3. API resolves matching registered vehicle
4. Notification service relays alert to owner
5. Owner response updates report lifecycle

Direct reporter-owner communication is explicitly blocked.

## 2. Selected Technology Stack

### Mobile Layer

- React Native
- Expo
- Expo Router
- TypeScript

Responsibilities:

- Phone onboarding and OTP UI
- Vehicle registration and management
- Report submission and status tracking
- Alert inbox and owner responses
- Device APIs (location, push token registration)

### Backend Layer

- FastAPI (Python)
- Pydantic validation
- SQLAlchemy or Supabase server-side client

Responsibilities:

- API contracts and validation
- Business rules and report orchestration
- Plate lookup and anonymous relay
- Abuse prevention and rate limiting
- Audit trail generation

### Data and Auth Layer

- PostgreSQL (Supabase-hosted)
- Supabase Auth for phone OTP (MVP default)

Responsibilities:

- User identity and session state
- Relational storage for vehicles/reports/alerts
- Retention and deletion workflows

### Messaging Layer

- Expo push notifications (primary)
- Twilio SMS (fallback for failed or unavailable push)
- Optional Twilio Verify (future OTP migration path)

### Hosting and Delivery

- API hosting: Render, Railway, or Fly.io
- Mobile build/distribution: Expo EAS
- Database/Auth hosting: Supabase

## 3. Service Boundaries

### Mobile App

- Collect input, display state, and call API
- Never receives owner/reporter private identity from API

### FastAPI Service

- Trust boundary and policy enforcement point
- Owns all abuse checks, state transitions, and relay decisions

### Supabase/PostgreSQL

- Source of truth for user, vehicle, report, and alert records

### Notification Providers

- Channel execution only (push/SMS)
- Delivery callbacks mapped back to alert state

## 4. Data Model (MVP)

### users

- id (uuid, pk)
- phone_number (unique)
- created_at (timestamp)
- status (active/restricted/deleted)

### vehicles

- id (uuid, pk)
- user_id (fk -> users.id)
- plate_number (indexed, normalized)
- make
- model
- color
- parking_zone (nullable)
- created_at

### reports

- id (uuid, pk)
- plate_number
- reporter_user_id (fk -> users.id)
- latitude
- longitude
- issue_type
- message (nullable)
- created_at
- status (submitted/notified/responded/closed/rejected)

### alerts

- id (uuid, pk)
- vehicle_id (fk -> vehicles.id)
- report_id (fk -> reports.id)
- delivery_status (pending/sent/failed)
- owner_response (moving_now/already_moved/incorrect_report/abuse_reported)
- responded_at (nullable)

### abuse_events

- id (uuid, pk)
- user_id (fk -> users.id)
- report_id (nullable, fk -> reports.id)
- event_type
- metadata (jsonb)
- created_at

## 5. API Surface (MVP)

Auth:

- `POST /auth/start-phone-otp`
- `POST /auth/verify-phone-otp`

Vehicles:

- `POST /vehicles`
- `GET /vehicles`
- `DELETE /vehicles/{vehicle_id}`

Reports and alerts:

- `POST /reports`
- `GET /reports/{report_id}`
- `GET /alerts`
- `POST /alerts/{alert_id}/respond`

Privacy operations:

- `POST /users/export-data`
- `DELETE /users/me`

## 6. Report-to-Alert Sequence

1. Reporter calls `POST /reports`
2. API verifies:
   - phone-verified auth token
   - per-user rate limits
   - per-plate cooldown
   - location/proximity requirements
   - valid issue type
3. API writes report record
4. API searches vehicle by normalized plate
5. If match exists:
   - create alert
   - send push
   - queue SMS fallback when required
6. Owner response updates alert and report status
7. Reporter sees status timeline updates

## 7. Security, Privacy, and Compliance Controls

- HTTPS-only transport
- Encryption at rest for sensitive fields
- No direct PII exchange between users
- Auth required for all mutating endpoints
- Audit logging for reporting and moderation actions
- Account deletion and personal data export endpoints
- Data minimization aligned with GDPR/CCPA principles

## 8. Abuse Prevention Controls

- OTP-verified identity before reporting
- GPS/location confirmation on report submission
- Report rate cap (example: 3/hour/user)
- Reporter-plate cooldown (example: 1/15 minutes)
- Structured issue categories
- Owner abuse feedback loop
- Progressive enforcement:
  - warning
  - cooldown
  - temporary suspension
  - manual review

## 9. Scale-Up Plan (Post-MVP)

- Redis-backed distributed rate limiter
- Queue workers for notification orchestration
- Web admin console for moderation and operators
- Analytics and incident intelligence pipeline
