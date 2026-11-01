import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonCard } from '@/components/Skeleton';
import { AlertDetail, OwnerResponseType, alertsApi } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_LABELS: Record<string, string> = {
  blocking_driveway:    'Blocking driveway / access',
  construction_access: 'Construction access blocked',
  garbage_pickup:      'Garbage pickup obstruction',
  restricted_zone:     'Restricted parking zone',
  emergency_access:    'Emergency access blocked',
};

const RESPONSE_LABELS: Record<string, string> = {
  moving_now:       'Moving now',
  already_moved:    'Already moved',
  incorrect_report: 'Incorrect report',
  abuse_reported:   'Reported as abuse',
};

const RESPONSE_BUTTONS: { value: OwnerResponseType; label: string; tone: 'brand' | 'go' | 'stop' }[] = [
  { value: 'moving_now',       label: 'Moving Now',       tone: 'brand' },
  { value: 'already_moved',    label: 'Already Moved',    tone: 'go' },
  { value: 'incorrect_report', label: 'Incorrect Report', tone: 'stop' },
];

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onRespond,
  responding,
}: {
  alert: AlertDetail;
  onRespond: (id: string, response: OwnerResponseType) => void;
  responding: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const responded = !!alert.owner_response;
  const reportedDate = new Date(alert.reported_at).toLocaleString();

  const confirmRespond = (response: OwnerResponseType, label: string) => {
    Alert.alert(
      'Confirm response',
      `Mark this alert as "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onRespond(alert.id, response) },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.plate}>{alert.plate_number}</Text>
          <Text style={styles.vehicleDesc}>
            {alert.color} {alert.make} {alert.model}
          </Text>
        </View>
        <View style={[styles.badge, responded ? styles.badgeResponded : styles.badgePending]}>
          <Text style={[styles.badgeText, responded ? styles.badgeTextResponded : styles.badgeTextPending]}>
            {responded ? 'Responded' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Issue */}
      <View style={styles.issueRow}>
        <Text style={styles.issueIcon}>⚠️</Text>
        <Text style={styles.issueText}>{ISSUE_LABELS[alert.issue_type] ?? alert.issue_type}</Text>
      </View>

      <Text style={styles.reportedAt}>Reported: {reportedDate}</Text>

      {/* Response */}
      {responded ? (
        <View style={styles.responseRow}>
          <Text style={styles.responseLabel}>Your response: </Text>
          <Text style={styles.responseValue}>{RESPONSE_LABELS[alert.owner_response!] ?? alert.owner_response}</Text>
        </View>
      ) : (
        <View style={styles.responseButtons}>
          {RESPONSE_BUTTONS.map(btn => (
            <PressableScale
              key={btn.value}
              style={[styles.responseBtn, { borderColor: colors[btn.tone] }, responding && styles.buttonDisabled]}
              onPress={() => confirmRespond(btn.value, btn.label)}
              disabled={responding}
            >
              {responding ? (
                <ActivityIndicator color={colors[btn.tone]} size="small" />
              ) : (
                <Text style={[styles.responseBtnText, { color: colors[btn.tone] }]}>{btn.label}</Text>
              )}
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<AlertDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await alertsApi.list();
      setAlerts(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  // Live updates: re-fetch whenever a new alert is inserted in the database
  useEffect(() => {
    const channel = supabase
      .channel('alerts-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => {
        load(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleRespond = async (alertId: string, response: OwnerResponseType) => {
    setRespondingId(alertId);
    try {
      const updated = await alertsApi.respond(alertId, response);
      setAlerts(prev => prev.map(a => (a.id === alertId ? updated : a)));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Reports about your registered vehicles</Text>
        </View>
        <View style={{ padding: 16 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Reports about your registered vehicles</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={a => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptySub}>
              When someone reports one of your vehicles, it will appear here.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 60}>
            <AlertCard
              alert={item}
              onRespond={handleRespond}
              responding={respondingId === item.id}
            />
          </FadeInView>
        )}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 18,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  title: { fontSize: 24, fontFamily: font.heading, color: c.text },
  subtitle: { fontSize: 13, color: c.textMuted, marginTop: 3 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.line,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  plate: { fontSize: 20, fontFamily: font.mono, color: c.text, letterSpacing: 1 },
  vehicleDesc: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgePending: { backgroundColor: c.signal },
  badgeResponded: { backgroundColor: c.goTint },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPending: { color: c.onSignal },
  badgeTextResponded: { color: c.go },
  issueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  issueIcon: { fontSize: 14, marginRight: 6 },
  issueText: { fontSize: 14, color: c.textSecondary, flex: 1 },
  reportedAt: { fontSize: 11, fontFamily: font.monoMedium, color: c.textMuted, marginBottom: 14 },
  responseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  responseLabel: { fontSize: 13, color: c.textMuted },
  responseValue: { fontSize: 13, fontWeight: '700', color: c.text },
  responseButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  responseBtn: {
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 105,
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  responseBtnText: { fontSize: 13, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: font.headingBold, color: c.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21 },
}));
