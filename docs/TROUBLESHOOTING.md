# RePark — Troubleshooting Log

A record of every issue encountered during development and how it was resolved.

---

## 1. Expo Go SDK version mismatch

**Error:**
> The installed version of Expo Go is for SDK 54.0.0. The project uses SDK 52.

**Cause:**
Project was scaffolded manually with SDK 52 in `package.json`, but the installed Expo Go app on the device requires SDK 54.

**Fix:**
Upgraded the project to SDK 54 by updating all dependencies in `package.json` to their SDK 54 compatible versions and running:
```bash
npm install --legacy-peer-deps
```
Key version changes:
- `expo`: `~52.0.0` → `~54.0.0`
- `react`: `18.3.1` → `19.1.0`
- `react-native`: `0.76.5` → `0.81.5`
- `expo-router`: `~4.0.0` → `~6.0.23`

---

## 2. Missing core Expo packages

**Error:**
> The required package `expo-asset` cannot be found

**Cause:**
`package.json` was written manually instead of using `create-expo-app`, so core Expo dependencies were missing.

**Fix:**
```bash
npx expo install expo-asset expo-font expo-constants expo-modules-core
```
Used `npx expo install` (not plain `npm install`) so Expo picks the correct SDK-compatible versions automatically.

---

## 3. npm peer dependency conflicts during SDK upgrade

**Error:**
> ERESOLVE could not resolve — conflicting peer dependency: react@19.1.0

**Cause:**
`@react-native-community/datetimepicker` was accidentally installed when adding web support and conflicted with React 19.

**Fix:**
Removed `@react-native-community/datetimepicker` from `package.json` and `app.json` plugins, then ran:
```bash
npm install --legacy-peer-deps
```

---

## 4. Web support missing react-native-web

**Error:**
> It looks like you're trying to use web support but don't have the required dependencies installed. Please install react-native-web

**Cause:**
`react-native-web` was not included in the initial `package.json`.

**Fix:**
```bash
npx expo install react-native-web react-dom
```

---

## 5. Android SDK not found

**Error:**
> Failed to resolve the Android SDK path. Default install location not found: C:\Users\DELL\AppData\Local\Android\Sdk

**Cause:**
Android Studio is not installed on the development machine.

**Fix:**
Not critical for development. Use **Expo Go** on a physical device (scan QR code) or press `w` to test in the browser instead.

---

## 6. New Architecture render crash — boolean/string type mismatch

**Error:**
> TypeError: expected dynamic type 'boolean', but had type 'string'

**Cause:**
`@react-native-community/datetimepicker` was registered as a native module via `app.json` plugins even though it was never used in the app. In React Native 0.81 New Architecture (Fabric), this caused a prop type mismatch crash on initial render.

**Fix:**
1. Removed `@react-native-community/datetimepicker` from `package.json` dependencies
2. Removed it from `app.json` plugins
3. Ran `npm uninstall @react-native-community/datetimepicker --legacy-peer-deps`
4. Updated auth guard pattern in `_layout.tsx` from `useRouter` + `useEffect` to Expo Router 6's idiomatic `Redirect` component pattern in group layouts

---

## 7. Missing react-native-safe-area-context

**Error:**
> Unable to resolve module react-native-safe-area-context from expo-router/build/ExpoRoot.js

**Cause:**
`react-native-safe-area-context` was a transitive dependency of `expo-router` but not installed at the project root level. Metro bundler requires peer dependencies to be hoisted to the root `node_modules`.

**Fix:**
```bash
npx expo install react-native-safe-area-context -- --legacy-peer-deps
```

---

## 8. Missing expo-router peer dependencies

**Errors (appeared one at a time):**
> Unable to resolve module expo-linking
> Unable to resolve module react-native-screens
> Unable to resolve module react-native-gesture-handler

**Cause:**
Same root cause as #7 — transitive dependencies of `expo-router` not hoisted to project root.

**Fix:**
```bash
npx expo install expo-linking expo-splash-screen expo-web-browser expo-system-ui -- --legacy-peer-deps
npx expo install react-native-screens react-native-gesture-handler -- --legacy-peer-deps
```

**Lesson:** When scaffolding an Expo project manually (without `create-expo-app`), install all `expo-router` peer dependencies upfront to avoid whack-a-mole missing module errors.

---

## 9. Corrupted expo-linking build

**Error:**
> Unable to resolve module ./RNLinking from expo-linking/build/Linking.js — None of these files exist: node_modules\expo-linking\build\RNLinking

**Cause:**
The `expo-linking` package build was incomplete — `RNLinking.js` was missing from its build output, likely due to an interrupted install.

**Fix:**
```bash
rm -rf node_modules/expo-linking
npm install --legacy-peer-deps
```

---

## 10. Supabase Phone OTP — invalid From Number

**Error:**
> Error sending confirmation OTP to provider due to an invalid "From Number" (caller ID) — VA250783f...

**Cause:**
A Twilio **Verify Service SID** (`VA...`) was entered in the Supabase Phone provider's **Twilio Message Service SID** field. These are different products:
- `VA...` = Twilio Verify Service (handles the whole OTP flow itself)
- `MG...` = Twilio Messaging Service (just sends SMS — what Supabase needs)

**Fix:**
1. In Twilio Console → **Messaging → Services** → create a Messaging Service
2. Copy the `MG...` SID
3. In Supabase → Authentication → Sign In / Providers → Phone → paste the `MG...` SID

---

## 11. SMS OTP template not injecting code

**Error:**
OTP messages sent but showed `{{ 123456 }}` literally instead of the actual code.

**Cause:**
The SMS Message template in Supabase had `{{ 123456 }}` (a literal example) instead of the actual template variable.

**Fix:**
Change the SMS Message field in Supabase Phone provider settings to:
```
Your code is {{ .Code }}
```

---

## 12. OTP token expired immediately

**Error:**
> Token has expired or is invalid

**Cause:**
The SMS OTP Expiry was set to `60` seconds in Supabase. By the time the OTP was received and entered, it had already expired.

**Fix:**
In Supabase → Authentication → Sign In / Providers → Phone → set **SMS OTP Expiry** to `3600` (1 hour) for development.

---

## 13. API unreachable from physical device

**Error:**
> API Error: Unable to connect to API (ENOTFOUND)

**Cause:**
`EXPO_PUBLIC_API_URL` was set to `http://localhost:8000`. On a physical device, `localhost` refers to the device itself, not the development PC.

**Fix:**
1. Find the PC's local IP address: run `ipconfig` → look for **IPv4 Address** under **Wireless LAN adapter Wi-Fi**
2. Update `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://<your-pc-ip>:8000
```
3. Ensure the phone and PC are on the same WiFi network
4. Restart both Expo and FastAPI

---

## 14. Real credentials committed to .env.example

**Risk:**
`backend/.env.example` was accidentally populated with real Supabase credentials instead of placeholder values, risking exposure if pushed to GitHub.

**Fix:**
1. Reset `backend/.env.example` to placeholder values only
2. Updated `.gitignore` to be comprehensive — covering all `.env` files, build artifacts, signing keys, IDE folders, and the `.claude/` directory
3. **If already committed:** rotate all keys in Supabase dashboard immediately

---

## 15. Twilio toll-free number verification required

**Issue:**
Purchased a US toll-free number (+1 8xx...) on Twilio which requires business verification before it can send SMS. Verification takes days.

**Workaround for development:**
Use Supabase's built-in **Test Phone Numbers** feature instead of real SMS:
1. Supabase → Authentication → Sign In / Providers → Phone → **Test Phone Numbers and OTPs**
2. Add: `<phone>=<otp>` e.g. `18773356146=123456`
3. Set **Test OTPs Valid Until** to a future date
4. Set **SMS OTP Expiry** to `3600`
5. In the app enter `+18773356146` and use `123456` as the OTP — no SMS needed

---

## General Lessons Learned

- Always use `npx expo install` instead of `npm install` for Expo/React Native packages — it resolves the correct SDK-compatible version automatically
- When writing `package.json` manually, install all `expo-router` peer deps upfront
- Never put real credentials in `.env.example` — use placeholders only
- Physical device testing requires the PC's local IP, not `localhost`
- Twilio Messaging Service SID starts with `MG...` — not `VA...` (Verify) or `AC...` (Account)
- Set OTP expiry to a longer value during development
