import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
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

const RESPONSE_BUTTONS: { value: OwnerResponseType; label: string; color: string }[] = [
  { value: 'moving_now',       label: 'Moving Now',       color: '#2563EB' },
  { value: 'already_moved',    label: 'Already Moved',    color: '#16A34A' },
  { value: 'incorrect_report', label: 'Incorrect Report', color: '#DC2626' },
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
            <TouchableOpacity
              key={btn.value}
              style={[styles.responseBtn, { borderColor: btn.color }, responding && styles.buttonDisabled]}
              onPress={() => confirmRespond(btn.value, btn.label)}
              disabled={responding}
            >
              {responding ? (
                <ActivityIndicator color={btn.color} size="small" />
              ) : (
                <Text style={[styles.responseBtnText, { color: btn.color }]}>{btn.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
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
      <View style={styles.centered}>
        <ActivityIndicator color="#2563EB" size="large" />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />
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
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onRespond={handleRespond}
            responding={respondingId === item.id}
          />
        )}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plate: { fontSize: 20, fontWeight: '700', color: '#111827', letterSpacing: 1 },
  vehicleDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeResponded: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextPending: { color: '#92400E' },
  badgeTextResponded: { color: '#065F46' },
  issueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  issueIcon: { fontSize: 14, marginRight: 6 },
  issueText: { fontSize: 14, color: '#374151', flex: 1 },
  reportedAt: { fontSize: 12, color: '#9CA3AF', marginBottom: 14 },
  responseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  responseLabel: { fontSize: 13, color: '#6B7280' },
  responseValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  responseButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  responseBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  responseBtnText: { fontSize: 13, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
