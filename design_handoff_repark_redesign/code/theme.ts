import { useColorScheme } from 'react-native';

export const light = {
  bg: '#F7F6F2', surface: '#FFFFFF', surfaceSunken: '#EFEDE7',
  line: '#E2DFD6', lineStrong: '#CFCBBF',
  text: '#0D1117', textSecondary: '#4A5160', textMuted: '#626976',
  brand: '#0B46C9', brandPressed: '#0938A3', brandTint: '#E7EDFB', onBrand: '#FFFFFF',
  signal: '#F5B800', onSignal: '#0D1117', signalTint: '#FDF1CC',
  go: '#0A7A50', goTint: '#E3F2EB',
  stop: '#C2362F', stopPressed: '#A32C26', stopTint: '#FBE9E7', onStop: '#FFFFFF',
  inverse: '#0D1117', onInverse: '#ECEEF2', goOnInverse: '#4CC38A',
  field: '#0B46C9',
} as const;

export const dark: Record<keyof typeof light, string> = {
  bg: '#0D1117', surface: '#161B22', surfaceSunken: '#0A0D12',
  line: '#262D37', lineStrong: '#3A4250',
  text: '#ECEEF2', textSecondary: '#A3A9B5', textMuted: '#8B929E',
  brand: '#7C9BFF', brandPressed: '#A3B9FF', brandTint: '#1A2440', onBrand: '#0D1117',
  signal: '#F5B800', onSignal: '#0D1117', signalTint: '#3A2F0A',
  go: '#4CC38A', goTint: '#12261D',
  stop: '#FF7B72', stopPressed: '#FFA39C', stopTint: '#2C1715', onStop: '#0D1117',
  inverse: '#ECEEF2', onInverse: '#0D1117', goOnInverse: '#0A7A50',
  field: '#1A2440',
};

export type Colors = typeof dark;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: (isDark ? dark : light) as Colors, isDark, shadow: isDark ? shadowNone : shadow };
}

export const radius = { plateSm: 4, plate: 6, control: 10, card: 14, sheet: 22, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48, 16: 64 } as const;

export const shadow = {
  e1: { shadowColor: '#0D1117', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  e2: { shadowColor: '#0D1117', shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
};
const shadowNone = { e1: {}, e2: {} };

export const font = {
  heading: 'Overpass_800ExtraBold',
  headingBold: 'Overpass_700Bold',
  mono: 'OverpassMono_600SemiBold',
  monoMedium: 'OverpassMono_500Medium',
};

export const motion = {
  press: { damping: 38, stiffness: 600 },
  timeline: { damping: 30, stiffness: 380 },
  screen: { damping: 32, stiffness: 300 },
  stampMs: 180, uiMs: 220, relayMs: 1200, reducedMs: 120,
};
