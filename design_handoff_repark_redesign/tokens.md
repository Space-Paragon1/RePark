# Tokens

Contrast ratios are WCAG 2.2 against the token's usual ground. Every text pair is 4.5:1 or better.

## Colour
| Token | Light | Dark | Use |
|---|---|---|---|
| bg | #F7F6F2 | #0D1117 | Page ground. Warm paper, not blue-grey |
| surface | #FFFFFF | #161B22 | Cards, sheets, plate face |
| surface-sunken | #EFEDE7 | #0A0D12 | Segment tracks, skeleton bones, neutral chips, keyboards |
| line | #E2DFD6 | #262D37 | Hairlines between rows (decorative) |
| line-strong | #CFCBBF | #3A4250 | Field borders, empty-state dashes |
| text | #0D1117 (17.5:1) | #ECEEF2 (16.3:1) | Headings, plates, primary copy |
| text-secondary | #4A5160 (7.4:1) | #A3A9B5 (8.0:1) | Body and supporting copy |
| text-muted | #626976 (5.1:1, 4.7 on sunken) | #8B929E (6.0:1) | Captions, timestamps |
| brand | #0B46C9 (white on it 7.7:1) | #7C9BFF (ink on it 7.2:1) | "RePark is handling it": primary buttons, links, focus |
| brand-pressed | #0938A3 | #A3B9FF | Pressed primary |
| brand-tint | #E7EDFB (brand text 6.5:1) | #1A2440 (5.8:1) | Chip and selection fills |
| on-brand | #FFFFFF | #0D1117 | Label on brand fills (flips in dark) |
| signal | #F5B800 | #F5B800 | "A person needs to act". Always a fill with #0D1117 text (10.6:1). Never yellow text |
| signal-tint | #FDF1CC | #3A2F0A | Warning banners (approximate location) |
| status-moving (go) | #0A7A50 (5.0:1, 4.6 on tint) | #4CC38A (8.5:1) | Owner responded, Moving now, Already moved, Approved |
| go-tint | #E3F2EB | #12261D | |
| status-stop | #C2362F (5.0:1, 4.6 on tint) | #FF7B72 (7.5:1) | Incorrect report, errors, Not approved, destructive |
| stop-pressed | #A32C26 | #FFA39C | |
| stop-tint | #FBE9E7 | #2C1715 | |
| on-stop | #FFFFFF | #0D1117 | |
| inverse / on-inverse | #0D1117 / #ECEEF2 | #ECEEF2 / #0D1117 | Toasts, snackbars, get-the-app band |
| field | #0B46C9 | #1A2440 | Large brand fields (hero panel, sign-in panel, lock-screen wallpaper in mocks) |
| glass | rgba(255,255,255,.72) | rgba(22,27,34,.72) | Web phone tab bar only. Native tab bars draw their own |
| kerb stripe | repeating-linear-gradient(-45deg, #F5B800 0 12px, #0D1117 12px 24px) | same | Max once per screen. 5–8 px tall |

Status always pairs icon + word + colour:
| Status | Chip | Icon (Lucide) |
|---|---|---|
| Needs your reply | signal fill | triangle-alert |
| Owner notified | brand-tint / brand | bell |
| Owner responded | go-tint / go | check |
| Moving now | go-tint / go | car |
| Already moved | go-tint / go | check-check |
| Incorrect report | stop-tint / stop | flag |
| No response | sunken / text-secondary | clock |
| Owner not on RePark yet | brand-tint / brand | hourglass |
| Owner not on RePark | sunken / text-secondary | user-x |
| Under review / Approved / Not approved | brand / go / stop | clock / check / x |
| Delivery: Push · 21:42 / Text · 21:42 / Not delivered | outline line-strong / outline stop | bell / message-square / circle-alert |

## Type
Overpass (display + UI on web, headings in apps), Overpass Mono (plates, times, codes, counts, kickers; tabular figures). App body uses SF Pro (iOS 17 pt) and Roboto (Android 16 sp) for Dynamic Type / font scale.

| Token | Size / line | Weight | Tracking |
|---|---|---|---|
| display | 64/64 (web hero) · 40/42 at phone width | 800 | −3.5% |
| h1 | 44/48 | 800 | −3% |
| h2 | 32/36 (section 40/44 on home) | 800 | −2% |
| h3 | 24/28 | 700 | −1.5% |
| h4 | 19/24 | 700 | 0 |
| app large title | 34/40 | 800 | −2% |
| app screen title | 28–30/32–34 | 800 | −2% |
| body-lg | 18/28 | 400 | 0 |
| body | 16/24 | 400 | 0 |
| label | 15/20 | 700 | 0 |
| small | 14/20 | 500 | 0 |
| caption-mono | 13/18 Mono | 500 | 0 |
| kicker-mono | 11–12/12 Mono, uppercase | 600 | +12–14% |
| plate L / M / compact | 40 / 24 / 15 Mono | 600 | +12% (+10% compact) |

Legibility: Overpass is used at 14 px and up at weight ≥ 500; captions at 13 and below are Overpass Mono.

## Spacing (4 pt base)
space-1 4 · 2 8 · 3 12 · 4 16 · 5 20 · 6 24 · 8 32 · 12 48 · 16 64 · 24 96. Phone screen gutters 16 (iOS) / 16 (Android) / 20 (web phone). Desktop page padding 40, marketing 64.

## Radii (five only)
plate-sm 4 · plate 6 (L) / 5 (M) · control 10 (buttons, fields) · card 14 · sheet 22 top corners (iOS) / 28 (Android M3) · pill 999 (Android nav indicator, Android notification actions).

## Elevation and borders
Hairlines first. e0: 1 px line. e1: 0 6 20 rgba(13,17,23,.12) (toasts, floating cards). e2: 0 −8 32 rgba(13,17,23,.16) (sheets). In dark, drop shadows; step from bg to surface and keep the hairline. Borders: 1 px hairline, 1.5 px controls, 2 px plate. Focus: 2 px brand outline, 3 px offset (`:focus-visible` only).

## Mapping into the codebase
### web/app/globals.css (`@theme`) — rename list
| Old | New | Notes |
|---|---|---|
| --color-brand #2563eb | --color-brand #0B46C9 | same name |
| --color-brand-dark | --color-brand-pressed | rename |
| --color-brand-light | --color-brand-tint | rename |
| --color-brand-border | remove | use --color-brand at 1.5 px |
| --color-success / -light | --color-go / --color-go-tint | rename |
| --color-warning / -light | --color-signal / --color-signal-tint | rename; signal is a fill only |
| --color-danger / -light | --color-stop / --color-stop-tint | rename |
| --color-page | --color-bg | rename |
| --color-line | --color-line | same name, new value |
| --color-ink / -secondary / -muted | --color-text / --color-text-secondary / --color-text-muted | rename |
| — | --color-surface, --color-surface-sunken, --color-line-strong, --color-on-brand, --color-on-stop, --color-inverse, --color-on-inverse, --color-field | new |
Dark values go in a `@media (prefers-color-scheme: dark)` `:root` override (see `code/globals.css`). Tailwind classes become e.g. `bg-bg`, `bg-surface`, `text-text-secondary`, `border-line`, `bg-brand text-on-brand`.

### mobile/lib/theme.ts — rename list
| Old | New |
|---|---|
| colors.primary / primaryDark / primaryLight | brand / brandPressed / brandTint |
| primaryBorder | remove |
| success / successLight / successBorder | go / goTint / (remove) |
| warning / warningLight | signal / signalTint |
| danger / dangerLight | stop / stopTint |
| bg / card / border | bg / surface / line |
| text / textSecondary / textMuted | text / textSecondary / textMuted (new values; textMuted was #94A3B8 and failed contrast) |
| — | surfaceSunken, lineStrong, onBrand, onStop, inverse, onInverse, field |
`colors` becomes `light` and `dark` objects with the same keys; read with `useTheme()` (see `code/theme.ts`). `shadow` keeps two levels (e1, e2), disabled in dark. `radius` becomes plateSm 4, plate 6, control 10, card 14, sheet 22, pill 999.
