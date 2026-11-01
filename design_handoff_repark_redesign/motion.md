# Motion

| Use | Duration / spring | Easing | Reduced motion |
|---|---|---|---|
| Press (buttons, rows) | 150 ms · spring stiffness 600, damping 38 | — | no scale; 120 ms colour change |
| Plate stamp (per character) | 180 ms · scale 1.08→1, y −3→0, brand→text | ui | no transform; colour only |
| UI state (chips, fields, toggles) | 220 ms | cubic-bezier(.2,.8,.2,1) | 120 ms crossfade |
| Timeline step lands | 260 ms · spring 380 / 30 | — | appears in place, 120 ms fade |
| Screen / sheet | 380 ms · spring 300 / 32 | — | 120 ms fade, no slide |
| Relay dot on send | 1200 ms ease-in-out along the dashed path, once | ease-in-out | dot shown at destination |
| Toast / snackbar | in 220 ms, out 180 ms, 4 s on screen | ui | fade only |
| Skeleton shimmer | 1.4 s loop | linear | static bones |
| Splash → first screen | 250 ms crossfade | ui | same |

Haptics (apps): light impact per plate character; success notification on Send and when the owner's reply arrives; warning on opening the Incorrect sheet. Use `expo-haptics`.

Web: wrap transforms in `@media (prefers-reduced-motion: no-preference)`. Apps: `AccessibilityInfo.isReduceMotionEnabled()` / Reanimated `useReducedMotion()`.
