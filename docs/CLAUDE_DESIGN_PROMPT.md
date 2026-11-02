# Redesign brief: RePark (website, iPhone app, Android app)

You are the lead product designer for RePark. Redesign the website, the iPhone app and the Android app as one product with one design system. The result must look and feel like a funded, carefully designed product made by a real team: distinctive, consistent, platform-correct and trustworthy. It must not look like a template or something "vibe-coded".

Work in this order and show me each stage before moving on:

1. **Directions:** show 3 distinct visual directions on one board. Each direction includes a website hero, the owner's alert screen on a phone, and the license plate component. Direction A must be the "Curbside" direction described below; B and C are your own. Wait for my pick.
2. **Design system:** tokens, type, icons, components and states, in light and dark.
3. **Key screens:** website home, the report flow, and the owner's alert and response, on web, iPhone and Android.
4. **Everything else:** all remaining screens and states listed below.
5. **Developer handoff:** as described at the end of this brief.

---

## 1. The product

RePark lets someone whose way is blocked by a parked car alert the car's owner anonymously, in under 60 seconds, without either person learning who the other is.

- **Reporter:** "A car is blocking my driveway, loading bay or site gate. I type its plate, confirm where I am, pick the problem, send. Then I watch for the owner's reply."
- **Owner:** "I registered my plates. When someone reports my car, I get a push notification, or a text if I don't use the app. I reply Moving now, Already moved, or Incorrect report."
- One account does both. Sign-in is a phone number plus a 6-digit text code. There is no password, profile photo or username.

When people use it: often stressed, outdoors, standing next to a car, holding a phone one-handed, sometimes at night or in bright sun. Owners receive alerts at unpredictable times. The design must be calm, fast, legible at a glance and reachable with one thumb.

The emotional job: make an awkward confrontation polite, private and quick. The product should feel like a neutral, trustworthy go-between, closer to a city service crossed with a premium transit app than a social or gamified app.

## 2. What exists today

- **Repo:** GitHub `Space-Paragon1/RePark`.
- **Website:** `web/`, built with Next.js 16 (App Router), TypeScript and Tailwind CSS 4. Design tokens live in `web/app/globals.css` (`@theme`), shared UI in `web/components/ui.tsx`, line icons in `web/components/icons.tsx`.
- **iPhone and Android apps:** one Expo codebase in `mobile/` (Expo SDK 58, React Native 0.88, Expo Router). Tokens live in `mobile/lib/theme.ts` (`colors`, `shadow`, `radius`). Shared pieces are in `mobile/components/` (`PressableScale`, `FadeInView`, `Skeleton`).
- **Website pages:**
  - `/` is the public home page.
  - `/login` is phone and code sign-in. `?next=` returns the person to where they were going, and `/report?plate=ABC123` links (from QR stickers) pre-fill the plate.
  - `/dashboard`, `/report`, `/vehicles`, `/alerts` and `/account` are the signed-in pages.
  - There is a branded 404 page.
- **App screens:**
  - Sign-in: phone number, then code.
  - Tabs: Home, Report (with "New" and "History" segments), Vehicles, Alerts, Profile.

## 3. Why it looks vibe-coded today (remove every one of these)

- Default Tailwind blue `#2563EB` and slate greys. The palette is indistinguishable from thousands of starter projects.
- The default framework font (Geist) with no typographic personality or scale.
- Every container is the same white card with `rounded-2xl` and `shadow-sm`, and everything has equal visual weight.
- A centred hero with two buttons and an empty right half. A row of three numbered "How it works" cards. A checklist with tick marks. A pale-blue call-to-action box.
- Emoji used as icons throughout the mobile app (🏠 📋 🚗 🔔 👤 ⚠️ 💬 📤 🚪 🗑️) and text symbols such as ← and ✕.
- A logo that is just a letter "P" in a rounded square.
- No real product imagery, no illustration or photography direction, no motion system, no dark mode.
- Spinners where content shapes should show. Browser `confirm()` dialogs for important actions.
- Website and apps that look like siblings rather than one product, and apps that ignore iOS and Android conventions.

## 4. What the best-reviewed products do (apply the principles; copy nothing)

- **Flighty** (Apple Design Award winner; live flight status):
  - The hero shows the product's real output, its notifications, floating around a real phone.
  - Status is told as a journey with clear moments.
  - Data is dense but calm, in an instrument-panel style.
  - It has a domain-native visual language, borrowed from departure boards.
  - **Lesson:** RePark's hero is the alert itself, and report status is a journey timeline.
- **SpotHero** (top-rated parking app, very high App Store rating from hundreds of thousands of reviews):
  - The task is the hero: you can start immediately from the first screen.
  - It uses trust numbers and real people.
  - **Lesson:** put the plate input in the website hero. Earn trust with specifics, not adjectives.
- **Citymapper** (repeated App of the Year):
  - One owned brand colour, used with confidence in large fields.
  - A consistent illustration line style and a brand mark that becomes a motif.
  - A clear, human promise.
  - **Lesson:** own a colour and a motif. Personality comes from consistency, not decoration.
- **Linear** (widely admired product website):
  - Restraint, precise grid, hairline rules and small monospace labels.
  - A headline where the key phrase is bright and the rest is dimmed.
  - **Lesson:** fewer, sharper elements. Precision reads as quality.
- **Platform leaders on iOS and Android:** follow the current Apple Human Interface Guidelines (Liquid Glass belongs to the navigation layer, such as tab bars and toolbars, never the content) and Material 3 Expressive (shape, colour, size, motion and space as expressive tools, and spring motion).
  - Primary actions sit in the lower third of the screen, where the thumb reaches.
- **Common complaint in parking-app reviews:** notifications arrive late or not at all.
  - **Lesson:** make delivery visible and trustworthy, showing when it was sent and how (push or text).

## 5. Creative direction A: "Curbside"

The visual language of streets, signs and kerbs, made calm and premium. Parking signs, road markings and license plates are the native materials of this product; use them as the brand's raw material, not as clip art.

**Colour (starting values; refine them, but keep every text pair at 4.5:1 or better):**

| Token | Light | Dark | Use |
|---|---|---|---|
| Traffic Blue (brand) | `#0B46C9` | `#7C9BFF` | Brand fields, primary buttons, links. White on light value is 7.7:1 |
| Curb Yellow (signal) | `#F5B800` | `#F5B800` | Urgent alerts and "needs your reply" only. Always as a fill with dark `#0D1117` text (10.6:1) in both themes, never yellow text on white |
| Ink | `#0D1117` | `#ECEEF2` | Primary text |
| Paper / Surface | `#F7F6F2` / `#FFFFFF` | `#0D1117` / `#161B22` | Page and raised surfaces. Warm off-white, not blue-grey |
| Secondary text | `#4A5160` | `#A3A9B5` | Body and secondary copy |
| Muted text | `#69707D` | `#8B929E` | Captions and timestamps. Must still pass 4.5:1 |
| Go / Moving | `#0A7A50` | lighter tint | Owner responded or moving |
| Stop / Incorrect | `#C2362F` | lighter tint | Incorrect report, destructive actions |

- Blue means "RePark is handling it". Yellow means "a person needs to act". Never rely on colour alone: every status also has an icon and a word.

**Type:**
- **Overpass** (open source, inspired by US Highway Gothic road-sign lettering) for display and UI on the web, and for headings in the apps.
- **Overpass Mono** for plates, times, codes and counts, using tabular figures.
- On iOS and Android, body text may use the platform font (SF Pro or Roboto) for native feel and Dynamic Type support. Keep Overpass for headings and plates.
- Build a real type scale with clear jumps: about 56/64 display on the web hero down to 13 for captions. Tighten letter-spacing on large sizes.
- If Overpass fails a legibility check at small sizes, propose a better open-source pairing and explain why.

**Signature elements (these make it ownable):**
1. **The plate.** A license plate component used everywhere a car appears: a raised border, mono letters, and an optional small region strip. The report form's plate input looks like a blank plate you "stamp" letters onto. Vehicle cards, alerts and report history all lead with the plate.
2. **The relay.** A visual metaphor for the anonymous go-between: a short dashed path with a moving dot from reporter to owner, used in the hero, on the report-sent screen and in the status timeline. It must be subtle, not cartoonish.
3. **The status timeline.** Like a parcel or flight tracker: Report sent → Owner alerted (by push or text, with time) → Owner replied ("Moving now", with time), or the closed states. It shows exactly where things stand, at a glance.
4. **Kerb stripe.** An optional thin diagonal-hatch or kerb-paint stripe used sparingly as a section divider or on urgent cards. Use it at most once per screen.

**Logo:** propose 3 marks that go beyond "P in a square". Ideas: a P whose bowl is a return arrow (re-park), a plate silhouette, or a sign-post form. It must work at app-icon size, as a favicon and in one colour. Include the wordmark lock-up, the app icon (iOS and Android adaptive) and the splash screen.

**Imagery:**
- Product UI on real devices.
- Close-cropped, real-world street photography: kerbs, driveways, loading bays, site gates, with people's faces not the focus.
- Optionally, a restrained line-illustration set in one stroke weight for empty states.
- No generic stock smiles, no 3D blobs, no purple-gradient AI aesthetics.

**Motion:**
- Spring-based and quick (about 150–250 ms for UI, 300–450 ms for screen transitions).
- The relay dot travels when a report is sent.
- The plate input reacts per character.
- Status changes animate in the timeline.
- Haptics on send and on owner reply in the apps.
- Respect reduced-motion settings everywhere.

**Voice:**
- Calm, neighbourly and plain. Firm about privacy.
- Short sentences, sentence case, no exclamation marks, no emoji.
- Examples: "Someone's blocked in by your car." "We've let the owner know. They won't see who you are."
- Rewrite all interface copy and the push and text-message wording to this voice. Today the push title is "⚠️ Alert for {plate}"; drop the emoji.

## 6. Design system to deliver

- **Tokens:**
  - Colour (light and dark, semantic names such as `surface`, `text-secondary`, `status-moving`), with the contrast ratio noted for each text pair.
  - Type scale, spacing (4-pt base), radii (fewer and more deliberate: sharp plate corners, softer sheets), elevation and borders (prefer hairlines over shadows), motion durations and easings.
- **Icons:**
  - Replace every emoji and text symbol.
  - Either use one open-source set (for example Lucide or Phosphor, which have React and React Native packages) customised to the brand stroke, or use SF Symbols on iOS and Material Symbols on Android with matching meaning. Recommend one approach and justify it.
- **Components (with all states: default, pressed, focused, disabled, loading, error):**
  - Plate (display, input and compact variants).
  - Buttons: primary, secondary, quiet and destructive.
  - Segmented control, text field, phone field with country prefix, 6-digit code field with SMS autofill, and issue-type picker (5 options).
  - Status chip, status timeline, alert card, report row, vehicle card and claim row.
  - Empty state, skeleton loader, toast or banner, confirmation sheet (replacing `confirm()`), navigation (web header, phone tab bar, iOS tab bar, Android navigation bar) and the location-confirmation block.
- **Content states:**
  - Every list has a skeleton, empty, error and populated state.
  - Every form has validation and server-error states.

## 7. Screens to design

Use only the data that exists. If a screen would benefit from something new, mark it "future" rather than designing it as if it were real.

**Data available:**
- **Vehicle:** plate, make, model, colour, optional usual parking area, date added. Up to 10 per account. One account per plate.
- **Report (reporter's view):** plate, issue type, created time, and status.
  - Status shows as: Owner notified, Owner responded, Incorrect report, No response (closed after 24 hours), Owner not on RePark yet (they have 2 hours to register), Owner not on RePark (closed).
  - The reporter's optional note is up to 500 characters and must not include contact details.
- **Alert (owner's view):** plate, make, model, colour, issue type, reported time, delivery status (push, text, or failed), and owner response with time.
  - The owner does not see the location, the note or anything about the reporter.
- **Issue types:** Blocking driveway or access, Construction access blocked, Garbage pickup obstruction, Restricted parking zone, Emergency access blocked.
- **Owner responses:** Moving now, Already moved, Incorrect report. "Incorrect report" counts against the reporter, so it needs a deliberate confirmation.
- **Ownership claim:** plate, filed time, status (Under review, Approved, Not approved).
- **Limits:**
  - Up to 3 reports per hour, and 15 minutes before the same plate can be reported again.
  - Repeated false reports block reporting for a while.
  - Sign-in codes can be resent after 60 seconds.
  - Reporting needs the device's location. On the web, warn when the location is only approximate.

**Website, public pages:**
- **Home page:**
  - The hero has the promise, a working plate input ("Enter the plate that's blocking you" → continues to sign-in with the plate kept), and a phone showing the owner's alert, with relay and status notifications floating around it.
  - Below the hero:
    - how it works, as a timeline rather than three cards;
    - privacy proof;
    - an owner section;
    - get the app;
    - a footer with Privacy, Terms and Contact links.
- **Sign-in:** phone, then code, with resend and the "Sign in to alert the owner of ABC123" context.
- **New pages:** Privacy and Terms (layout only, with placeholder text I will replace) and Contact.
- **Other:** the 404 page and a social share image (1200×630).

**Website, signed in (desktop and phone widths):**
- **Dashboard:** needs-reply alerts first, then reports in progress, then vehicles.
- **Report:** the form, the sent screen with the timeline, and history with live status.
- **Vehicles:** list, add, "plate already registered" leading to the claim flow, claims list, and remove with a confirmation sheet.
- **Alerts:** needs-reply and replied states, and the reply confirmation.
- **Account:** phone number, sign out, download my data, delete account (type DELETE to confirm).

**iPhone and Android apps (design both and show where they differ):**
- **Sign-in:**
  - Phone entry with country picker.
  - Code entry with autofill and resend countdown.
  - A notification permission primer that explains why, before the system prompt.
- **Tabs:**
  - **Home:** the most urgent thing first.
  - **Report:** a step flow with the plate as hero, location, issue and note; a sent state with relay animation; then history.
  - **Vehicles**, **Alerts** (with reply actions) and **Profile**.
- **Notifications and texts:**
  - The owner's push notification, including lock-screen layout, notification actions (Moving now / Already moved) and the text-message fallback wording.
  - The reporter's "owner replied" push.
  - Optional and marked "future": an iOS Live Activity and Android live update for the reporter while waiting for a reply.
- **Branding:** app icon (iOS light, dark and tinted, plus Android adaptive and monochrome) and splash screen.

## 8. Platform rules

- **iOS:** follow the current Human Interface Guidelines.
  - Native tab bar (Expo Router native tabs, so iOS draws its own Liquid Glass bar).
  - Large titles, sheets for confirmation and for adding a vehicle, swipe-back, SF Symbols if chosen, Dynamic Type and haptics.
  - Liquid Glass only on navigation chrome, never on content cards.
- **Android:** follow Material 3 Expressive.
  - Navigation bar with a pill indicator, predictive back, ripple feedback, edge-to-edge layout and 48 dp touch targets.
  - Consider a prominent floating Report action.
  - Keep RePark's colours rather than the phone's wallpaper colours.
- **Web:**
  - Fully responsive. On phone widths, a bottom tab bar that mirrors the apps; on desktop, a top bar.
  - Real focus styles and keyboard support.
  - No horizontal scroll at 360 px.
  - Use only fonts that can be loaded through Next.js.
- **All platforms:** dark mode is required, since people get blocked in at night. Contrast meets WCAG 2.2 AA. Touch targets are at least 44 pt (iOS) or 48 dp (Android). Text must still work at 200% zoom and the largest Dynamic Type size.

## 9. Hard constraints

- Do not change product behaviour, the API or the data model. Design within the data listed above. If you think behaviour should change, list it separately as a recommendation.
- Never show or imply the reporter's or owner's identity, phone number or exact location to the other person.
- Keep all factual copy accurate: the limits, the 2-hour and 24-hour windows, and text-message delivery for owners without the app.
- Do not reuse any other brand's logos, illustrations, screenshots or distinctive trade dress. The references in section 4 are for principles only.
- Every font, icon set and image source must be licensed for commercial use. Name the licence for each.

## 10. Developer handoff

Produce a handoff that a developer, or Claude Code working in this repo, can implement directly:

1. **Token map:**
   - A token table with names and values for light and dark.
   - Exactly how they map into `web/app/globals.css` (Tailwind 4 `@theme`) and `mobile/lib/theme.ts`, either by replacing the existing names (`brand`, `ink`, `ink-secondary`, `ink-muted`, `success`, `warning`, `danger`, `page`, `line` on the web, and `colors.primary`, `text`, `textSecondary`, `textMuted`, `bg`, `card`, `border` in the app) or by proposing clearer names with a rename list.
2. **Component specs:** sizes, spacing, states and behaviour for each component in section 6, noting which existing files they replace (`web/components/ui.tsx`, `web/components/icons.tsx`, `mobile/components/*`, `mobile/app/(tabs)/_layout.tsx`).
3. **Screen specs:** for every screen in section 7, in light and dark, at phone and desktop widths for the web, with redlines for anything non-obvious.
4. **Assets:** logo files, app icons, splash screen, social share image and any illustrations, as SVG or PNG at the needed sizes.
5. **Motion spec:** durations, easings or spring values, and reduced-motion fallbacks.
6. **Copy deck:** every changed string, including push and text-message wording.
7. **Implementation order:** a short plan that ships the biggest visible improvement first.

## 11. Self-check before you present

- Could someone name this as RePark from a cropped screenshot, with no logo visible?
- Is there any default framework colour, default font, emoji icon or generic three-card section left?
- Is the plate component used consistently everywhere a car appears?
- Can a stressed person send a report one-handed in under 60 seconds?
- Can an owner understand an alert and reply in two taps?
- Does every status have an icon, a word and a colour, and does it pass contrast in both themes?
- Do the iPhone and Android versions each feel native while clearly being the same product?
