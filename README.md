# RePark

Privacy-preserving vehicle notification platform.

RePark allows nearby users to report vehicles that may be obstructing access, then relays anonymous alerts to registered vehicle owners without exposing personal contact details.

## MVP 1.0 Scope

- Phone number login with OTP
- Vehicle registration
- Vehicle obstruction reporting
- Anonymous notification relay
- Owner response workflow
- Abuse safeguards (rate limits, proximity checks, structured issue types)

## Documentation

- Product requirements: `docs/PRODUCT_SPEC.md`
- System architecture: `docs/SYSTEM_ARCHITECTURE.md`
- MVP execution plan: `docs/MVP_EXECUTION_PLAN.md`

## Primary Stack (MVP)

- Mobile: React Native + Expo + TypeScript
- Backend: FastAPI (Python)
- Data/Auth: PostgreSQL + Supabase
- Messaging: Push notifications + SMS fallback (Twilio)
- Hosting: Expo EAS (mobile), Render/Railway/Fly.io (API), Supabase (DB/Auth)
