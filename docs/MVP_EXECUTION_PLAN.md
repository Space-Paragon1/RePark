# RePark MVP Execution Plan

## 1. Milestones

### Milestone 1: Foundation

- Create Expo app shell with tab navigation
- Configure Supabase project and environments
- Stand up FastAPI service with health/auth scaffolding
- Define database schema and migrations

Exit criteria:

- Mobile app launches on iOS and Android
- FastAPI deployed and reachable over HTTPS
- Supabase connected in development and staging

### Milestone 2: Core User Flows

- Phone OTP authentication
- Vehicle registration/list/delete
- Report creation with issue types and location capture

Exit criteria:

- User can authenticate and register a vehicle
- Reporter can submit a valid report end-to-end

### Milestone 3: Alert Relay

- Plate lookup to owner mapping
- Alert creation pipeline
- Push notification delivery
- Owner response actions and report status updates

Exit criteria:

- Registered owner receives and responds to alert
- Reporter sees status changes in app

### Milestone 4: Safety and Compliance

- Rate limiting and cooldown rules
- Abuse flagging and enforcement hooks
- Data export and account deletion endpoints
- Privacy checks (no PII leakage)

Exit criteria:

- Abuse thresholds enforced in API tests
- Privacy/delete/export workflows verified

## 2. Recommended Build Order

1. Data model and migrations
2. Auth integration
3. Vehicle APIs and UI
4. Report APIs and UI
5. Alert/notification orchestration
6. Abuse controls
7. Compliance workflows
8. QA hardening and beta release

## 3. MVP Acceptance Checklist

- OTP login works reliably in target countries
- Report submission median flow time under 60 seconds
- Alert delivered via push or SMS fallback
- Owner response reflected for reporter in near real-time
- No direct owner/reporter contact info exposed
- Rate limiting and cooldown protections active
- Account deletion and data export available

## 4. Initial Testing Strategy

- Unit tests for validation and abuse rules
- API integration tests for report-to-alert lifecycle
- Mobile smoke tests for auth, report, and response flows
- End-to-end scenario:
  - reporter submits report
  - owner notified
  - owner responds
  - reporter sees updated status
