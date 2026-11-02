import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  alertsApi, reportsApi, vehiclesApi, type AlertDetail, type OwnerResponseType, type Report, type Vehicle,
} from '@/lib/api';
import { notifyAlertsChanged } from '@/lib/alertCount';
import { REPLY_SENT, formatTime, isReportOpen, issueLabel } from '@/lib/labels';
import { REPORT_HREF } from '@/lib/navigation';
import { timeLeftToJoin } from '@/lib/report';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { Button } from '@/components/Button';
import { KerbStripe } from '@/components/KerbStripe';
import { Plate } from '@/components/Plate';
import { ReportFab } from '@/components/ReportFab';
import { SkeletonCard } from '@/components/Skeleton';
import { ListError } from '@/components/States';
import { useToast } from '@/components/Toast';
import { ChevronRight, Plus, Send, ShieldCheck } from '@/components/icons';

type HomeData = { vehicles: Vehicle[]; alerts: AlertDetail[]; reports: Report[] };

/** Home (screens.md): Needs your reply → Your reports in progress → Your vehicles. */
export default function HomeScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [vehicles, alerts, reports] = await Promise.all([vehiclesApi.list(), alertsApi.list(), reportsApi.list()]);
      setData({ vehicles, alerts, reports });
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const respond = async (alert: AlertDetail, response: OwnerResponseType) => {
    setResponding(alert.id);
    try {
      const updated = await alertsApi.respond(alert.id, response);
      setData(prev => prev && { ...prev, alerts: prev.alerts.map(a => (a.id === alert.id ? updated : a)) });
      toast(REPLY_SENT);
      notifyAlertsChanged();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setResponding(null);
    }
  };

  const needsReply = data?.alerts.filter(a => !a.owner_response) ?? [];
  const inProgress = (data?.reports.filter(isReportOpen) ?? [])
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
      >
        <Text style={s.largeTitle} accessibilityRole="header">Home</Text>

        {data === null && !error && (<><SkeletonCard /><SkeletonCard /></>)}
        {error && data === null && <ListError list="home screen" onRetry={load} />}

        {needsReply.length > 0 && (
          <Section title="Needs your reply">
            {needsReply.map(alert => (
              <View key={alert.id} style={s.alertCard}>
                <KerbStripe height={6} />
                <Pressable
                  onPress={() => router.push(`/alert/${alert.id}`)}
                  style={({ pressed }) => [s.alertBody, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Alert for ${alert.plate_number}. Open details`}
                >
                  <View style={s.rowBetween}>
                    <Plate plate={alert.plate_number} />
                    <Text style={s.time}>{formatTime(alert.reported_at)}</Text>
                  </View>
                  <Text style={s.issue}>{issueLabel(alert.issue_type)}</Text>
                </Pressable>
                <View style={s.alertActions}>
                  <Button
                    label="Moving now"
                    style={s.flex}
                    loading={responding === alert.id}
                    loadingLabel="Sending"
                    disabled={responding !== null}
                    onPress={() => respond(alert, 'moving_now')}
                  />
                  <Button
                    label="Already moved"
                    variant="secondary"
                    style={s.flex}
                    disabled={responding !== null}
                    onPress={() => respond(alert, 'already_moved')}
                  />
                </View>
              </View>
            ))}
          </Section>
        )}

        {inProgress.length > 0 && (
          <Section title={inProgress.length === 1 ? 'Your report in progress' : 'Your reports in progress'}>
            <View style={s.card}>
              {inProgress.map((report, i) => (
                <Pressable
                  key={report.id}
                  onPress={() => router.push({ pathname: REPORT_HREF, params: { view: report.id } })}
                  style={({ pressed }) => [s.progressRow, i > 0 && s.divider, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Report for ${report.plate_number}. Open status`}
                >
                  <View style={s.rowCenter}>
                    <Plate plate={report.plate_number} />
                    <Text style={s.progressIssue} numberOfLines={1}>{issueLabel(report.issue_type)}</Text>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                  <View style={s.bar}>
                    {(report.owner_notified ? [true, true, false] : [true, false]).map((done, j) => (
                      <View key={j} style={[s.barPart, done && s.barDone]} />
                    ))}
                  </View>
                  <Text style={s.progressMeta}>
                    {report.owner_notified
                      ? `Owner alerted · ${formatTime(report.created_at)} · waiting`
                      : `Waiting for the owner to join · ${timeLeftToJoin(report)}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        )}

        {data && needsReply.length === 0 && inProgress.length === 0 && (
          <View style={s.allClear}>
            <View style={s.shield}><ShieldCheck size={24} color={colors.go} /></View>
            <Text style={s.allClearTitle}>Nothing needs you right now.</Text>
            <Text style={s.allClearBody}>No alerts about your cars and no reports waiting.</Text>
            <Button label="Report a car" icon={Send} size="main" onPress={() => router.push(REPORT_HREF)} style={s.allClearButton} />
          </View>
        )}

        {data && (
          <Section
            title={`Your vehicles · ${data.vehicles.length}`}
            action={data.vehicles.length > 0 ? { label: 'See all', onPress: () => router.push('/(tabs)/vehicles') } : undefined}
          >
            {data.vehicles.length === 0 ? (
              <Button label="Add a vehicle" icon={Plus} variant="secondary" onPress={() => router.push('/(tabs)/vehicles')} />
            ) : (
              <View style={s.card}>
                {data.vehicles.slice(0, 3).map((vehicle, i) => (
                  <View key={vehicle.id} style={[s.vehicleRow, i > 0 && s.divider]}>
                    <Plate plate={vehicle.plate_number} />
                    <Text style={s.vehicleName} numberOfLines={1}>{vehicle.color} {vehicle.make} {vehicle.model}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}
      </ScrollView>
      <ReportFab />
    </View>
  );
}

function Section({ title, action, children }: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  const s = useStyles();
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.kicker}>{title}</Text>
        {action && (
          <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
            <Text style={s.sectionAction}>{action.label}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  largeTitle: { fontFamily: font.heading, fontSize: 34, lineHeight: 40, letterSpacing: -0.7, color: c.text, marginBottom: 8 },
  section: { marginTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  kicker: { fontFamily: font.mono, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: c.textMuted },
  sectionAction: { fontSize: 15, fontWeight: '600', color: c.brand },
  flex: { flex: 1 },
  pressed: { backgroundColor: c.surfaceSunken },
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' },
  divider: { borderTopWidth: 1, borderTopColor: c.line },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  alertCard: {
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
    overflow: 'hidden', marginBottom: 12,
  },
  alertBody: { padding: 16, paddingBottom: 12 },
  time: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted },
  issue: { fontSize: 15, color: c.textSecondary, marginTop: 8 },
  alertActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },

  progressRow: { padding: 14 },
  progressIssue: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
  bar: { flexDirection: 'row', gap: 4, marginTop: 12 },
  barPart: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.surfaceSunken },
  barDone: { backgroundColor: c.brand },
  progressMeta: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 8 },

  allClear: {
    alignItems: 'center', padding: 24, marginTop: 16,
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },
  shield: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.goTint, alignItems: 'center', justifyContent: 'center' },
  allClearTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginTop: 14, textAlign: 'center' },
  allClearBody: { fontSize: 14, color: c.textSecondary, marginTop: 4, textAlign: 'center' },
  allClearButton: { alignSelf: 'stretch', marginTop: 20 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  vehicleName: { flex: 1, fontSize: 15, color: c.text },
}));
