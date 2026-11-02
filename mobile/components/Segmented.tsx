import { Platform, Pressable, Text, View } from 'react-native';
import { Check } from '@/components/icons';
import { font, themedStyles, useTheme } from '@/lib/theme';

/**
 * iOS: sunken track, 1 px line, radius 9, selected segment on surface.
 * Android: M3 segmented button, 40 high, radius 20, selected brand-tint with a check.
 */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const android = Platform.OS === 'android';

  return (
    <View style={android ? styles.m3Track : styles.track} accessibilityRole="tablist">
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              android ? styles.m3Segment : styles.segment,
              android && i > 0 && styles.m3Divider,
              selected && (android ? styles.m3Selected : styles.selected),
            ]}
          >
            {android && selected && <Check size={16} color={colors.brand} />}
            <Text style={[styles.label, selected && styles.labelSelected, android && selected && { color: colors.brand }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surfaceSunken,
  },
  segment: { flex: 1, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  selected: {
    backgroundColor: c.surface,
    shadowColor: '#0D1117', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  m3Track: { flexDirection: 'row', height: 40, borderRadius: 20, borderWidth: 1, borderColor: c.lineStrong, overflow: 'hidden' },
  m3Segment: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  m3Divider: { borderLeftWidth: 1, borderLeftColor: c.lineStrong },
  m3Selected: { backgroundColor: c.brandTint },
  label: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  labelSelected: { fontFamily: font.headingBold, fontWeight: undefined, color: c.text },
}));
