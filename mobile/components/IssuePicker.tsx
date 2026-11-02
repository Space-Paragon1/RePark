import { Platform, Pressable, Text, View } from 'react-native';
import { CircleCheck } from '@/components/icons';
import type { IssueType } from '@/lib/api';
import { ISSUE_TYPES } from '@/lib/labels';
import { radius, themedStyles, useTheme } from '@/lib/theme';

/**
 * The five issues as rows (52 high, 20 px icon). Selected: brand-tint fill, a 3 px brand
 * edge, and a filled check (iOS) or radio (Android). The whole row is the target.
 */
export function IssuePicker({ value, onChange }: { value: IssueType | null; onChange: (value: IssueType) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const android = Platform.OS === 'android';

  return (
    <View style={styles.card} accessibilityRole="radiogroup">
      {ISSUE_TYPES.map(({ value: issue, label, Icon }, i) => {
        const selected = issue === value;
        return (
          <Pressable
            key={issue}
            onPress={() => onChange(issue)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [
              styles.row,
              i > 0 && styles.divider,
              pressed && !selected && styles.pressed,
              selected && styles.selected,
            ]}
          >
            {selected && <View style={styles.edge} />}
            <Icon size={20} color={selected ? colors.brand : colors.textSecondary} />
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            {android ? (
              <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
            ) : selected ? (
              <CircleCheck size={22} color={colors.onBrand} fill={colors.brand} />
            ) : (
              <View style={styles.radio} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: c.line },
  pressed: { backgroundColor: c.surfaceSunken },
  selected: { backgroundColor: c.brandTint },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: c.brand },
  label: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
  labelSelected: { color: c.brand },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: c.brand, borderWidth: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.brand },
}));
