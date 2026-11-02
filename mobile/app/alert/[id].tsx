import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi, type AlertDetail, type OwnerResponseType } from '@/lib/api';
import {
  REPLY_SENT, RESPONSE_LABELS, alertMeta, alertStatus, formatTime, issueFor, issueLabel, replyThanks,
} from '@/lib/labels';
import { font, themedStyles, useTheme } from '@/lib/theme';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { KerbStripe } from '@/components/KerbStripe';
import { Plate } from '@/components/Plate';
import { SkeletonBox } from '@/components/Skeleton';
import { Timeline, type TimelineStep } from '@/components/Timeline';
import { useToast } from '@/components/Toast';
import { notifyAlertsChanged } from '@/lib/alertCount';
import {
  Bell, Car, CheckCheck, Flag, ShieldCheck, TriangleAlert, type LucideIcon,
} from '@/components/icons';

/** One alert, opened from the list or a notification. Reply buttons sit in the lower third. */
export default function AlertScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { session, loading: authLoading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [responding, setResponding] = useState<OwnerResponseType | null>(null);
  const [incorrectOpen, setIncorrectOpen] = useState(false);

  // There's no single-alert endpoint; the list is small, so find it there.
  const load = useCallback(async () => {
    try {
      const found = (await alertsApi.list()).find(a => a.id === id) ?? null;
      setAlert(found);
      setStatus(found ? 'ready' : 'missing');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const respond = async (response: OwnerResponseType) => {
    setResponding(response);
    try {
      setAlert(await alertsApi.respond(id, response));
      toast(REPLY_SENT);
      notifyAlertsChanged();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setResponding(null);
      setIncorrectOpen(false);
    }
  };

  if (!authLoading && !session) return <Redirect href="/(auth)" />;

  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        title: 'Alert',
        headerBackTitle: 'Alerts',
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.text, fontFamily: font.headingBold },
        headerShadowVisible: false,
      }}
    />
  );

  if (status !== 'ready' || !alert) {
    return (
      <View style={styles.container}>
        {header}
        {status === 'loading' ? (
          <View style={styles.content}>
            <SkeletonBox width={140} height={28} />
            <SkeletonBox height={64} style={{ marginTop: 20 }} />
            <SkeletonBox height={80} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>
              {status === 'missing' ? "This alert isn't available." : "We couldn't load this alert."}
            </Text>
            <Text style={styles.body}>
              {status === 'missing' ? 'It may have been removed with the vehicle.' : 'Check your connection and try again.'}
            </Text>
            <View style={styles.inlineActions}>
              {status === 'error' && <Button label="Try again" variant="secondary" onPress={() => { setStatus('loading'); load(); }} />}
              <Button label="Back to alerts" variant="quiet" onPress={() => router.back()} />
            </View>
          </View>
        )}
      </View>
    );
  }

  const reply = alert.owner_response;
  const IssueIcon = issueFor(alert.issue_type)?.Icon ?? TriangleAlert;

  return (
    <View style={styles.container}>
      {header}
      {!reply && <KerbStripe height={6} />}
      <ScrollView contentContainerStyle={styles.content}>
        <Chip status={alertStatus(alert)} />
        <Text style={styles.title} accessibilityRole="header">
          {reply ? replyThanks(reply) : "Someone's blocked in by your car."}
        </Text>
        <Plate plate={alert.plate_number} size={reply ? 'M' : 'L'} style={styles.plate} />
        <View style={styles.rows}>
          <InfoRow icon={Car} text={`${alert.color} ${alert.make} ${alert.model}`} />
          <InfoRow icon={IssueIcon} text={issueLabel(alert.issue_type)} />
        </View>
        {reply ? (
          <View style={styles.timeline}>
            <Timeline steps={repliedSteps(alert, reply)} />
          </View>
        ) : (
          <Text style={styles.meta}>{alertMeta(alert)}</Text>
        )}
        <View style={styles.privacy}>
          <ShieldCheck size={18} color={colors.textSecondary} />
          <Text style={styles.privacyText}>You won't see who reported this, and they won't see who you are.</Text>
        </View>
      </ScrollView>

      {!reply && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label="Moving now"
            size="main"
            loading={responding === 'moving_now'}
            loadingLabel="Sending"
            disabled={!!responding}
            onPress={() => respond('moving_now')}
          />
          <Button
            label="Already moved"
            variant="secondary"
            style={styles.secondaryAction}
            loading={responding === 'already_moved'}
            loadingLabel="Sending"
            disabled={!!responding}
            onPress={() => respond('already_moved')}
          />
          <Button
            label="Incorrect report"
            variant="quietStop"
            style={styles.quietAction}
            disabled={!!responding}
            onPress={() => setIncorrectOpen(true)}
          />
        </View>
      )}

      <ConfirmSheet
        visible={incorrectOpen}
        icon={Flag}
        warn
        title="Mark this report as incorrect?"
        body="Only choose this if your car wasn't there or wasn't in the way. Incorrect reports count against the person who sent them."
        confirmLabel="Mark as incorrect"
        confirmingLabel="Marking"
        cancelLabel="Keep the report"
        busy={responding === 'incorrect_report'}
        onConfirm={() => respond('incorrect_report')}
        onCancel={() => setIncorrectOpen(false)}
      />
    </View>
  );
}

function repliedSteps(alert: AlertDetail, reply: OwnerResponseType): TimelineStep[] {
  const replyIcon = reply === 'moving_now' ? Car : reply === 'already_moved' ? CheckCheck : Flag;
  const isIncorrect = reply === 'incorrect_report' || reply === 'abuse_reported';
  return [
    { title: 'Reported', time: formatTime(alert.reported_at), state: 'done' },
    {
      title: 'You were alerted',
      time: alert.delivery_status === 'sent' ? `${formatTime(alert.created_at)} · delivered` : formatTime(alert.created_at),
      state: 'done',
      icon: Bell,
    },
    {
      title: `You replied: ${RESPONSE_LABELS[reply]}`,
      time: alert.responded_at ? formatTime(alert.responded_at) : undefined,
      state: isIncorrect ? 'stop' : 'go',
      icon: replyIcon,
    },
  ];
}

function InfoRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon size={20} color={colors.textSecondary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  content: { padding: 20, paddingBottom: 32 },
  title: {
    fontFamily: font.heading, fontSize: 28, lineHeight: 33, letterSpacing: -0.5,
    color: c.text, marginTop: 14,
  },
  body: { fontSize: 16, lineHeight: 23, color: c.textSecondary, marginTop: 8 },
  inlineActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  plate: { marginTop: 20 },
  rows: { marginTop: 20, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { flex: 1, fontSize: 17, fontWeight: '600', color: c.text },
  meta: { fontFamily: font.monoMedium, fontSize: 13, color: c.textMuted, marginTop: 16 },
  timeline: { marginTop: 24 },
  privacy: {
    flexDirection: 'row', gap: 10, marginTop: 24, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: c.line,
  },
  privacyText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.textSecondary },
  actions: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  secondaryAction: { height: 52 },
  quietAction: { height: 44 },
}));
