# RePark Product Specification (MVP 1.0)

## 1. Product Definition

RePark is a privacy-preserving vehicle notification platform that lets nearby users report obstruction incidents and anonymously notify vehicle owners.

Core outcome: enable notification in under 60 seconds without revealing personal contact details.

## 2. Problem Statement

Vehicles frequently block:

- Construction access
- Waste collection routes
- Emergency lanes
- Loading docks
- Temporary work zones

Current alternatives (door-knocking, paper notes, towing, waiting) are slow, inconsistent, and conflict-prone.

## 3. Users and Roles

One account can act in both roles:

- Vehicle Owner: registers vehicles and receives alerts
- Reporter: submits obstruction reports and tracks status

## 4. Design Principles

- Simplicity: minimal input, fast completion
- Privacy by design: no owner/reporter identity sharing
- Abuse resistance: anti-spam and misuse controls by default
- Low-friction onboarding: phone number + OTP only
- Single app model: no separate apps for owners/reporters

## 5. MVP Scope

Required for launch:

- Phone number authentication with OTP
- Vehicle registration
- Vehicle reporting flow
- Anonymous alert relay
- Owner response actions
- Reporter-visible status tracking
- Abuse safeguards (proximity + throttling + moderation flags)

Out of scope for MVP:

- Plate image recognition/OCR
- Operator and municipality integrations
- Construction scheduling integration
- Analytics dashboards for institutions
- Advanced moderation portal

## 6. Functional Requirements

### 6.1 Authentication

- Users sign in with phone number and one-time code
- Unverified users cannot create reports
- Single phone number maps to one user account

### 6.2 Vehicle Registration

Each vehicle includes:

- Plate number (required)
- Make (required)
- Model (required)
- Color (required)
- Parking zone (optional)

Rules:

- Plate is normalized and searchable
- Multiple vehicles per owner allowed

### 6.3 Report Submission

Report flow:

1. Enter plate number
2. Confirm current location
3. Select issue type
4. Add optional note
5. Submit

Required issue types:

- Blocking driveway/access
- Construction access blocked
- Garbage pickup obstruction
- Restricted parking zone
- Emergency access blocked

### 6.4 Anonymous Alert Relay

- If a plate is registered, an alert is generated and sent
- Reporter never sees owner identity/contact info
- Owner never sees reporter identity
- All communication is mediated server-side

### 6.5 Owner Response

Owner response options:

- Moving now
- Already moved
- Incorrect report

Optional moderation flag:

- Mark report as abuse

### 6.6 Status Tracking

Reporter can view status progression:

- Submitted
- Owner notified
- Owner responded
- Closed or rejected

## 7. Privacy and Compliance Requirements

Data never shown to reporters:

- Owner name
- Phone number
- Address
- Any direct identifier

Data minimization baseline:

- Phone number
- Plate number
- Vehicle attributes needed for verification
- Report metadata required for workflow, safety, and audit

Controls:

- HTTPS for all network traffic
- Encryption at rest for sensitive data
- Account deletion
- Vehicle removal
- Personal data export support

Compliance target:

- GDPR principles (EU)
- CCPA principles (California)
- Regional equivalents as rollout expands

## 8. Abuse Prevention Requirements

- OTP-verified identity required to report
- Location confirmation for each report
- GPS proximity checks where permitted
- Rate limits per user (example: max 3 reports/hour)
- Cooldown per reporter+plate pair (example: 1 report/15 minutes)
- Structured issue types (not freeform-only)
- Progressive sanctions for repeated abuse reports

## 9. Navigation and UX

Main tabs:

- Home
- Report
- My Vehicles
- Alerts
- Profile

Home quick actions:

- Register My Vehicle
- Report a Vehicle
- View Alerts

## 10. Primary User Flows

Owner flow:

1. Install app
2. Verify phone via OTP
3. Register one or more vehicles
4. Receive notifications
5. Respond to alerts

Reporter flow:

1. Install app
2. Verify phone via OTP
3. Open report flow
4. Submit obstruction report
5. Track report status

## 11. Success Criteria (MVP)

- Median time-to-report under 60 seconds
- High alert delivery success (push + SMS fallback)
- Low abuse incident rate through throttling and moderation
- Stable completion of owner response flow after notification
