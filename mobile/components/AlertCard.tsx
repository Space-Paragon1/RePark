import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { KerbStripe } from '@/components/KerbStripe';
import { Plate } from '@/components/Plate';
import { TriangleAlert } from '@/components/icons';
import type { AlertDetail, OwnerResponseType } from '@/lib/api';
import { alertMeta, alertStatus, issueFor, issueLabel } from '@/lib/labels';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';

/**
 * Alert card (components.md). Needs reply: kerb stripe on top, plate + car, signal chip,
 * issue, mono meta, then Moving now / Already moved / Incorrect. Replied: no stripe,
 * go or stop chip, and the meta adds when you replied. Tapping the card opens the alert.
 */
export function AlertCard({
  alert,
  onOpen,
  onRespond,
  onIncorrect,
  responding = false,
}: {
  alert: AlertDetail;
  onOpen: () => void;
  onRespond: (response: OwnerResponseType) => void;
  onIncorrect: () => void;
  responding?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const needsReply = !alert.owner_response;
  const IssueIcon = issueFor(alert.issue_type)?.Icon ?? TriangleAlert;

  return (
    <View style={styles.card}>
      {needsReply && <KerbStripe height={6} />}
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Alert for ${alert.plate_number}. ${alertStatus(alert).label}. Open details`}
      >
        <View style={styles.top}>
          <View style={styles.car}>
            <Plate plate={alert.plate_number} />
            <Text style={styles.carText} numberOfLines={1}>{alert.color} {alert.make} {alert.model}</Text>
          </View>
          <Chip status={alertStatus(alert)} />
        </View>
        <View style={styles.issueRow}>
          <IssueIcon size={20} color={colors.textSecondary} />
          <Text style={styles.issue}>{issueLabel(alert.issue_type)}</Text>
        </View>
        <Text style={styles.meta}>{alertMeta(alert)}</Text>
      </Pressable>
      {needsReply && (
        <View style={styles.actions}>
          <Button
            label="Moving now"
            size="compact"
            style={styles.flex}
            loading={responding}
            loadingLabel="Sending"
            onPress={() => onRespond('moving_now')}
          />
          <Button
            label="Already moved"
            variant="secondary"
            size="compact"
            style={styles.flex}
            disabled={responding}
            onPress={() => onRespond('already_moved')}
          />
          <Button label="Incorrect" variant="quietStop" size="compact" disabled={responding} onPress={onIncorrect} />
        </View>
      )}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
    marginBottom: 12,
  },
  body: { padding: 16, paddingBottom: 14 },
  pressed: { backgroundColor: c.surfaceSunken },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  car: { flex: 1, gap: 6 },
  carText: { fontSize: 14, color: c.textSecondary },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  issue: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
  meta: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  flex: { flex: 1 },
}));
