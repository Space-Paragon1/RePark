import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { CircleAlert, Info, TriangleAlert } from '@/components/icons';
import { radius, themedStyles, useTheme } from '@/lib/theme';

type Tone = 'error' | 'notice' | 'warning';

/** Radius 10, 12 × 14 padding. Error: stop outline on stop-tint. Notice: sunken. Warning: signal-tint. */
export function Banner({ tone, message, style }: { tone: Tone; message: string; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const Icon = tone === 'error' ? CircleAlert : tone === 'warning' ? TriangleAlert : Info;
  return (
    <View
      style={[styles.banner, styles[tone], style]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={tone === 'error' ? colors.stop : colors.text} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  banner: { flexDirection: 'row', gap: 10, borderRadius: radius.control, paddingVertical: 12, paddingHorizontal: 14 },
  error: { borderWidth: 1, borderColor: c.stop, backgroundColor: c.stopTint },
  notice: { borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.surfaceSunken },
  warning: { backgroundColor: c.signalTint },
  icon: { marginTop: 1 },
  text: { flex: 1, fontSize: 15, lineHeight: 21, color: c.text },
}));
