# Components

All sizes in px (web) = pt (iOS) = dp (Android) unless noted. Minimum touch target 44 pt iOS / 48 dp Android.

## Replaces
| New | Replaces |
|---|---|
| Plate, Button, Chip, Field, PhoneField, CodeField, Segmented, IssuePicker, Timeline, AlertCard, ReportRow, VehicleCard, ClaimRow, EmptyState, Skeleton, Toast, Banner, ConfirmSheet, LocationBlock | `web/components/ui.tsx` |
| Lucide (`lucide-react`) | `web/components/icons.tsx` (delete) |
| Same set in RN, plus `PressableScale` (keep, retune to motion.press) and `Skeleton` (rebuild as plate-shaped bones) | `mobile/components/*` |
| Native tabs (Expo Router native tabs on iOS; M3 nav bar + extended FAB on Android) | `mobile/app/(tabs)/_layout.tsx` |
| `FadeInView` | keep, 220 ms ui easing, opacity only under reduced motion |

## Plate
- **Display L:** 80 h (320 w on component sheet; fills width in screens), 2 px text-colour border, radius 6, inner inset ring (3 px surface + 1 px line-strong). Left region strip 20 w, brand fill, radius 3 0 0 3. Text Overpass Mono 600 40, +12% tracking, centred.
- **Display M:** 52 h, strip 14, border 2, radius 5, mono 24. Used on review, vehicle cards, the owner hero phone.
- **Compact:** 28 h, padding 0 9, 1.5 px text border, radius 4, mono 600 15, +10%. Used in every list row and chip-row.
- **Input:** 88 h in apps / 72–80 on web. Empty: 2 px dashed line-strong border, placeholder "ABC 123" in text-muted. Focused: 2 px brand border + 4 px brand-tint ring; caret 2 px brand. Each new character "stamps": translateY(−3) scale(1.08) → 1 over 180 ms, brand colour → text. Light haptic per character in apps. Error: 2 px stop border, message below (stop, circle-alert icon). Disabled: 45% opacity. Input normalises to uppercase, strips spaces and punctuation for submit, keeps a single display space.
- Every place a car appears leads with a plate: vehicle cards, alerts, report rows, claims, notifications (as text), the share image.

## Buttons
Height 48 (52–56 for the main action in apps), radius 10, label Overpass 700 15 (17 in apps). Pressed: scale 0.97 on press spring. Focus: 2 px outline, 3 px offset. Disabled: 45%. Loading: keep width, swap label to present participle ("Sending") with a 16 px spinner; spinners only inside buttons.
- **Primary:** brand fill, on-brand label; pressed brand-pressed.
- **Secondary:** 1.5 px text border, transparent; pressed surface-sunken.
- **Quiet:** brand text, no border; pressed brand-tint.
- **Destructive:** stop fill, on-stop label; pressed stop-pressed. "Incorrect report" on alert screens is a quiet button in stop colour; the sheet holds the destructive fill.

## Status chip
28 h (24 in dense rows), padding 0 10, radius 5, Overpass 700 13, 14 px icon at 2.4 stroke, 6 gap. Colours per `tokens.md` status table. Delivery chips use Overpass Mono 600 12 with a 1 px outline.

## Segmented control
iOS/web: sunken track, 1 px line, radius 10 (9 iOS), 3 px padding; selected segment surface + 0 1 2 shadow, 700 label. Android: M3 segmented button, 40 h, 1 px line-strong outline, radius 20, selected brand-tint with 16 px check.

## Text field / Note
Label 600 14 above. Field 48 h, 1.5 px line-strong, radius 10, surface, 16 px text. Focus: brand border + 4 px brand-tint ring. Error: stop border, message below in stop 500 13 with icon. Android uses M3 outlined fields with the label in the border. Note: 500 max, counter "0/500" in mono muted; rejects phone numbers and emails client-side with "Remove the phone number. Notes can't include contact details." (server stays the authority).

## Phone field
52–56 h. Left: country button (flag-free: "US +1" in mono 600 16 + chevron-down) separated by a 1 px line; opens a searchable sheet. Right: number in mono 500 17–19, formats as typed. Helper: "We'll text you a 6-digit code. No password needed."

## Code field
6 boxes, 56–58 h, 8 gap, radius 10, mono 600 26. Active box 2 px brand + ring. Paste/autofill fills all six and submits. iOS `textContentType="oneTimeCode"`; Android SMS Retriever (shows "Filled from your texts" go chip). Resend link disabled with "Resend in 0:42" (mono) until 60 s pass. Error: all boxes stop border + message.

## Issue picker (5 options)
List rows 50–52 h, 14 padding, 12 gap, 20 px icon. Selected: brand-tint fill, inset 3 px brand edge, filled check (iOS/web) or radio (Android). Web desktop uses a 2-column grid of the same rows with 1.5 px brand border when selected. Icons: house, construction, trash-2, ban (circle-slash), siren.

## Status timeline
24 px rail column, 14 gap. Node 20 px circle. Done: brand fill + check. Replied: go fill + car/check, label in go. Pending: 2 px dashed line-strong ring. Connectors 2 px: solid brand between done steps, go into a reply, dashed line-strong into pending. The relay dot (10–12 px signal circle with 3 px bg ring) travels the dashed segment. Each row: title Overpass 700 15–16, time in mono 500 12 muted ("21:42:11 · delivered"). Closed and not-on-RePark states per `screens.md`.

## Alert card
Surface, 1 px line, radius 14. Needs reply: kerb stripe 5–6 px on top, compact plate + car, "Needs your reply" signal chip, issue row with icon, mono meta "Reported 21:42 · Push · 21:42", actions: Moving now (primary), Already moved (secondary), Incorrect (quiet stop). Replied: no stripe, go/stop chip, meta adds "You replied 09:13".

## Report row / Claim row / Vehicle card
- Report row: compact plate, issue 600 14, mono time, chevron; status chip beneath. 14 padding, rows divided by hairlines inside one card.
- Claim row: compact plate, "Filed 31 Oct" mono, claim chip.
- Vehicle card: plate M, make/model/colour 600 17, optional usual area 400 14 with map-pin, "Added 3 Mar 2026" mono. Remove via iOS swipe, Android overflow menu, web text button; always confirms with a sheet.

## Location block
Map tile 76–110 h (placeholder), accuracy circle in brand-tint with brand dot. Row: locate-fixed icon (brand), "Near 142 Elm Street" 600–700 15–16, "Accurate to 12 m · not shared" mono, Refresh quiet button. Web approximate state: dashed accuracy ring, "Approximate · about 800 m", signal-tint banner with the warning copy.

## Empty state / Skeleton / Error
- Empty: 1 px dashed line-strong card, radius 14, 24–28 padding, centred title 700 17, body 400 14 text-secondary (max 260), optional secondary button.
- Skeleton: copies the real row; plate-shaped bone first (92×28, sunken + 1.5 px line), two text bones. 1.4 s shimmer; static under reduced motion. Never a spinner for content.
- List error: surface card, stop icon, "We couldn't load your {list}.", "Check your connection. Nothing you've sent is lost.", Try again (secondary).

## Toast / Snackbar / Banner
- iOS/web toast: inverse fill, on-inverse 600 14–15, 20 px go-on-inverse check disc, radius 12, e1, above the tab bar, 4 s.
- Android snackbar: 48 h, radius 6, inverse, action in go-on-inverse.
- Banner: radius 10, 12 14 padding. Error: 1 px stop + stop-tint. Notice: line-strong + sunken. Warning: signal-tint (no border).

## Confirmation sheet (replaces confirm())
iOS: sheet with 22 top radius, 36×5 grabber, 48 px tinted icon disc, title Overpass 800 22–24, body 15–17, then destructive fill + secondary "Keep …" stacked, 52–54 h. Android: M3 modal bottom sheet (28 radius, 32×4 handle) over a 55% scrim; or an M3 dialog for Delete account. Web: centred dialog 460 w, radius 14, e2-level shadow, focus trapped, Esc and backdrop click = the safe action. Uses: Incorrect report, Remove vehicle, Sign out (no sheet; immediate), Delete account (type DELETE; button disabled until it matches, case-sensitive).

## Navigation
- Web desktop (≥ 840): 64 h top bar, surface, 1 px line. Logo + wordmark, nav 600 14 with 2 px brand underline on active, Alerts badge (signal, mono 11), account icon, "Report a car" primary.
- Web phone (< 840): 64 h bottom tab bar, 5 items (Home, Report, Vehicles, Alerts, Account), 20 px icons, 600 10 labels, active brand + 2 px top edge.
- iOS: Expo Router native tabs (system Liquid Glass), 5 tabs, SF Symbols: house, paperplane, car, bell, person.crop.circle. Large titles. Swipe-back. Liquid Glass only on the bar.
- Android: M3 nav bar, 4 items (Home, Vehicles, Alerts, Profile), active pill 60×32 brand-tint, Material Symbols: home, directions_car, notifications, account_circle. Report is an extended FAB (56 h, radius 16, brand) bottom-right above the bar on Home/Vehicles/Alerts; it opens the report flow full screen. Predictive back, ripple, edge-to-edge.

## Icon replacement table
🏠 house · 📋/📤 send · 🚗 car · 🔔 bell · 👤 user · ⚠️ triangle-alert · 💬 message-square · 🚪 log-out · 🗑️ trash-2 · ← chevron-left (iOS) / arrow-left (Android, web) · ✕ x. Stroke 2 at 16–24, 1.75 at 26+, round caps and joins.
