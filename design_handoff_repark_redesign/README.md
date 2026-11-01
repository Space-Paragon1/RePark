# Handoff: RePark redesign (website, iPhone, Android)

## Overview
A full redesign of RePark, direction A "Curbside": one design system across the Next.js website (`web/`) and the Expo app (`mobile/`). It replaces the default Tailwind blue, Geist, emoji icons, identical white cards and `confirm()` dialogs with an owned palette (Traffic Blue + Curb Yellow), Overpass / Overpass Mono type, Lucide icons, a plate component used wherever a car appears, a status timeline, and light + dark themes.

Product behaviour, the API and the data model do **not** change. Anything that would need new behaviour is marked **FUTURE**.

## About the design files
The `.dc.html` files in `design/` are **design references built in HTML**. They show the intended look and behaviour; they are not production code. Recreate them in the existing stack:
- `web/`: Next.js 16 App Router, TypeScript, Tailwind CSS 4 (`@theme` tokens in `web/app/globals.css`).
- `mobile/`: Expo SDK 58, React Native 0.88, Expo Router (tokens in `mobile/lib/theme.ts`).

Open any `design/*.dc.html` in a browser (keep `support.js` next to it). Theme values are CSS variables named `--rp-*`; the light and dark sets are listed in `tokens.md`.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, copy and states are final. Match them exactly using the codebase's own patterns. The map tiles on the location block are placeholders.

## What's in this folder
| File | Contents |
|---|---|
| `tokens.md` | Every token in light and dark with contrast ratios, and the exact mapping/rename into `globals.css` and `theme.ts` |
| `code/globals.css` | Drop-in replacement `@theme` block for `web/app/globals.css` |
| `code/theme.ts` | Drop-in replacement for `mobile/lib/theme.ts` (light + dark) |
| `components.md` | Spec for every component: sizes, spacing, states, behaviour, and which existing file it replaces |
| `screens.md` | Every screen, per platform, with layout notes and redlines |
| `motion.md` | Durations, easings, springs, haptics, reduced-motion fallbacks |
| `copy.md` | Every changed string, including push and text-message wording |
| `assets/` | Logo, wordmark, app icons, favicon, splash, share image (SVG) |
| `assets/png/` | iOS icons 1024/180/120 (light, dark, tinted), Android adaptive layers and monochrome 432 (108 dp @4x), favicon 512/192/32/16, splash icon 288, mark 512, share image 1200×630 |
| `screenshots/` | Full boards: 00 design system, 01–03 key screens (light + dark), 04–09 everything else (light) |
| `design/` | The HTML design references |

## Implementation order (biggest visible improvement first)
1. **Tokens and fonts.** Replace `globals.css` `@theme` and `theme.ts` with the files in `code/`. Load Overpass + Overpass Mono via `next/font/google` on web and `expo-font` / `@expo-google-fonts/overpass` in the app. Add dark mode (`prefers-color-scheme` on web, `useColorScheme` in the app).
2. **Icons.** Install `lucide-react` and `lucide-react-native`. Replace every emoji and text symbol (table in `components.md`). Delete `web/components/icons.tsx` once migrated.
3. **Plate component** (display L/M, compact, input) on web and mobile. Use it everywhere a car appears.
4. **Buttons, status chip, confirmation sheet.** Remove every `confirm()`.
5. **Owner alert flow:** alert card, alert screen, the Incorrect confirmation, and the new push and text wording (`copy.md`). This is the most important moment in the product.
6. **Report flow:** 3-step flow with plate input, location block, issue picker, sent screen with timeline.
7. **Website home:** hero with live plate input and alert phone, timeline "How it works", privacy, owners, get the app, footer.
8. **Navigation:** iOS native tabs (Liquid Glass via Expo Router native tabs), Android nav bar + Report extended FAB, web top bar ≥ 840 px and bottom tabs below.
9. **Everything else:** sign-in, dashboard, vehicles/claims, account, list and form states, Privacy/Terms/Contact, 404, share image, app icons and splash.

## Licences
- Overpass, Overpass Mono: SIL Open Font License 1.1.
- Lucide icons: ISC.
- Roboto (Android body): Apache 2.0. SF Pro (iOS body): Apple platform use only.
- All marks and illustrations in `assets/` are original to this project.
