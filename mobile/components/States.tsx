import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button } from '@/components/Button';
import { CircleAlert, type LucideIcon } from '@/components/icons';
import { radius, themedStyles, useTheme } from '@/lib/theme';

/** Empty state (components.md): dashed card, icon disc, title 700 17, body (max 260), optional action. */
export function EmptyState({ icon: Icon, title, body, actionLabel, actionIcon, onAction, style }: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.empty, style]}>
      <View style={s.disc}><Icon size={26} color={colors.textSecondary} /></View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} icon={actionIcon} variant="secondary" onPress={onAction} style={s.action} />
      )}
    </View>
  );
}

/** List error: what failed, reassurance, and Try again. */
export function ListError({ list, onRetry }: { list: string; onRetry: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.error} accessibilityRole="alert">
      <CircleAlert size={20} color={colors.stop} />
      <View style={s.errorText}>
        <Text style={s.errorTitle}>We couldn't load your {list}.</Text>
        <Text style={s.errorBody}>Check your connection. Nothing you've sent is lost.</Text>
      </View>
      <Button label="Try again" variant="secondary" size="compact" onPress={onRetry} />
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  empty: {
    alignItems: 'center',
    padding: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.lineStrong,
    borderRadius: radius.card,
  },
  disc: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, color: c.textSecondary, textAlign: 'center', maxWidth: 260 },
  action: { marginTop: 20 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12,
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },
  errorText: { flex: 1 },
  errorTitle: { fontSize: 15, fontWeight: '600', color: c.text },
  errorBody: { fontSize: 13, lineHeight: 18, color: c.textSecondary, marginTop: 2 },
}));
