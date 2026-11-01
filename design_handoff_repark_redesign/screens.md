# Screens

Each screen exists in light and dark. Open the matching `design/` file for exact rendering. Phone frames: iOS 390×844, Android 392×852, web phone 390.

## Website, public — design/RePark Screens Home.dc.html
**Home (/)**, desktop 1280 / phone 390.
- Header 72 h: logo, How it works / Privacy / For car owners, Sign in (quiet), Get the app (secondary).
- Hero grid `1fr 560px`, min 680 h. Left padding 88 56 64 64: kicker; display 64/64 "Blocked in?" + dimmed (text-muted) "Tell the owner in under a minute. Neither of you learns who the other is."; label "Enter the plate that's blocking you"; plate input 72 h + Continue 72 h primary; mono hint. Submit goes to `/login?next=/report&plate=XXX` (or straight to `/report?plate=` if signed in). Bottom: 3 facts above a hairline.
- Right panel: field colour, phone 280×580 showing the owner alert, three floating e1 cards (Report sent 21:42:08, Owner alerted by push 21:42:11, Owner replied: Moving now 21:44:30) joined by a dashed relay path (2 px, 6/8 dash, white 50%) with the signal dot. Kerb stripe 8 px at the bottom.
- How it works: grid `320px 1fr`; 4-stop horizontal timeline (solid brand to step 3, dashed to "closes"). Phone: vertical timeline.
- Privacy: two hairline lists "The owner sees" / "The reporter sees", each ending in a stop "Never: …" line with eye-off.
- For car owners: two vehicle cards + dashed "Add a plate · up to 10", copy, Register a plate.
- Get the app: inverse band, two outlined store buttons (use the official store badges in production per their guidelines).
- Footer 88 h: Privacy, Terms, Contact, © 2026 RePark.
- No horizontal scroll at 360: hero stacks, plate input full width, panel becomes a vertical status strip.

## Report flow — design/RePark Screens Report.dc.html
Three steps + sent. Target under 60 s one-handed. Primary action always in the lower third.
1. **Plate:** segmented New/History (iOS) or M3 segmented (Android); 3-part progress bar 4 h; "STEP 1 OF 3"; title "Which car is blocking you?"; plate input 88 h; helper; Continue above the keyboard.
2. **Where and what:** back "Plate"; compact plate + Change; location block (auto-located, Refresh); issue picker; Continue bottom.
3. **Check and send:** summary card (plate M, issue, location with pin); note (optional, 500); privacy line with shield-check; Send alert (primary with send icon) + "1 of 3 reports this hour".
4. **Sent:** relay graphic (you → RePark → plate) with the travelling dot; "We've let the owner know." / "They won't see who you are. We'll tell you as soon as they reply."; timeline waiting state; Done (secondary) + See all reports (quiet).
- Variants shown: replied by text (Android), Owner not on RePark yet with countdown "1 h 58 m left" (web phone).
- Web desktop: one page, numbered sections 1–4, 2-column issue grid, approximate-location warning, right column "What happens next" timeline + privacy + limits.
- Android opens this flow full screen from the Report FAB with an X to close.

## Owner alert and reply — design/RePark Screens Alert.dc.html
- **Lock screen / shade:** title "Someone's blocked in by your car.", body with plate, colour, make, model, issue. Actions: Moving now, Already moved (iOS long-press list; Android pill buttons). iOS: time-sensitive interruption level. Android: high-importance channel "Alerts about your cars".
- **Alert screen:** kerb stripe under the nav bar; signal chip; title; plate L; rows car / issue / mono "Reported 21:42 · Push delivered 21:42"; privacy line; Moving now 56 h, Already moved 52 h, Incorrect report quiet stop 44 h, all in the lower third.
- **Incorrect:** confirmation sheet (see components). Never offered as a notification action.
- **Replied:** go chip with the reply, "Thanks. We've told them you're on your way." (Moving now) / "…the car has gone." (Already moved), timeline Reported → You were alerted by push → You replied, toast/snackbar "Reply sent. We've let them know."
- **Text fallback:** see copy.md; link opens the web alert at phone width (needs sign-in with `?next=`).
- **Reporter push:** see copy.md.
- **Web /alerts:** Needs your reply (horizontal card: plate L 300 | details | button stack 220) then Replied list rows (plate | issue | mono times | chip). Dialog variant for Incorrect.

## Sign-in — design/RePark Screens SignIn.dc.html
Phone → code → (first time) notification primer. Context banner "Sign in to alert the owner of 8KTR 214" when arriving with a plate. Web: split card, field-colour left panel with the plate, form right; step kicker "STEP 1 OF 2". Primer appears after first sign-in, never on launch; Not now always available.

## Home, dashboard, history — design/RePark Screens Home Tab.dc.html
Order everywhere: Needs your reply → Your reports in progress → Your vehicles. All-clear state: go shield, "Nothing needs you right now." + Report a car. History lists every status with its chip.

## Vehicles, claims, account — design/RePark Screens Vehicles.dc.html
Vehicles (2 of 10), Add sheet (plate, make, model, colour chips, usual area optional), "already registered" inline error with File a claim, claims list (Under review / Approved / Not approved), Remove sheet, Profile rows (phone, notifications, download my data, privacy and terms, sign out, delete account), Delete with type-DELETE.

## States — design/RePark Screens States.dc.html
Skeleton, empty, error and populated for Alerts, Reports, Vehicles, Claims. Twelve form errors with exact copy (also in copy.md).

## Public pages — design/RePark Screens Public.dc.html
Privacy and Terms (TOC + sections, placeholder text, "LAST UPDATED · [DATE]"), Contact (topic segmented, email, message, emergency notice), 404 (blank plate "404", kerb stripe), share image 1200×630.

## Brand — design/RePark Screens Brand.dc.html
App icons, adaptive layers, monochrome, splash, favicon, FUTURE Live Activity / Dynamic Island / Android live update.

## Redlines worth calling out
- Owner reply buttons sit within the bottom 40% of the screen at every size; at the largest Dynamic Type the content scrolls and the buttons stay pinned.
- Plate text never truncates: plates up to 8 characters + 1 space fit L at 320 w; beyond that, step down to M.
- Kerb stripe appears at most once per screen.
- Yellow is never text. On dark it's still a fill with #0D1117 text.
