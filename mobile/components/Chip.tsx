import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from '@/components/icons';
import type { ChipTone, Status } from '@/lib/labels';
import { font, themedStyles, useTheme, type Colors } from '@/lib/theme';

function toneColors(tone: ChipTone, c: Colors): { bg: string; fg: string } {
  switch (tone) {
    case 'signal':  return { bg: c.signal, fg: c.onSignal };
    case 'brand':   return { bg: c.brandTint, fg: c.brand };
    case 'go':      return { bg: c.goTint, fg: c.go };
    case 'stop':    return { bg: c.stopTint, fg: c.stop };
    case 'neutral': return { bg: c.surfaceSunken, fg: c.textSecondary };
  }
}

/** Status chip: icon + word + colour, always together. 28 high (24 in dense rows). */
export function Chip({ status, dense = false, style }: { status: Status; dense?: boolean; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { bg, fg } = toneColors(status.tone, colors);
  const { Icon } = status;
  return (
    <View style={[styles.chip, { height: dense ? 24 : 28, backgroundColor: bg }, style]}>
      <Icon size={14} strokeWidth={2.4} color={fg} />
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>{status.label}</Text>
    </View>
  );
}

/** Delivery chip: mono label with a 1 px outline, e.g. "Push · 21:42". */
export function DeliveryChip({ icon: Icon, failed = false, label }: { icon: LucideIcon; failed?: boolean; label: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fg = failed ? colors.stop : colors.textSecondary;
  return (
    <View style={[styles.chip, styles.delivery, { borderColor: failed ? colors.stop : colors.lineStrong }]}>
      <Icon size={14} color={fg} />
      <Text style={[styles.deliveryLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

const useStyles = themedStyles(() => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  label: { fontFamily: font.headingBold, fontSize: 13 },
  delivery: { height: 28, borderWidth: 1 },
  deliveryLabel: { fontFamily: font.mono, fontSize: 12 },
}));
