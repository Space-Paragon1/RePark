import { Pressable, Text, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Plate } from '@/components/Plate';
import { ChevronRight } from '@/components/icons';
import type { Report } from '@/lib/api';
import { formatWhen, issueLabel, reportStatus } from '@/lib/labels';
import { font, themedStyles, useTheme } from '@/lib/theme';

/** Report row (components.md): plate, issue, mono time, chevron; status chip beneath. */
export function ReportRow({ report, onPress, divider = false }: { report: Report; onPress?: () => void; divider?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const status = reportStatus(report);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${report.plate_number}, ${issueLabel(report.issue_type)}, ${status.label}`}
    >
      <View style={styles.top}>
        <Plate plate={report.plate_number} />
        <View style={styles.text}>
          <Text style={styles.issue} numberOfLines={1}>{issueLabel(report.issue_type)}</Text>
          <Text style={styles.time}>{formatWhen(report.created_at)}</Text>
        </View>
        {onPress && <ChevronRight size={18} color={colors.textMuted} />}
      </View>
      <Chip status={status} dense style={styles.chip} />
    </Pressable>
  );
}

const useStyles = themedStyles((c) => ({
  row: { padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: c.line },
  pressed: { backgroundColor: c.surfaceSunken },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1 },
  issue: { fontSize: 14, fontWeight: '600', color: c.text },
  time: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 2 },
  chip: { marginTop: 10 },
}));
