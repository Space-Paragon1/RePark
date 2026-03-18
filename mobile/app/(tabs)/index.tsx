import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { vehiclesApi, alertsApi, reportsApi } from '@/lib/api';

type Stats = { vehicles: number; pendingAlerts: number; reports: number };

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        vehiclesApi.list(),
        alertsApi.list(),
        reportsApi.list(),
      ]).then(([vehicles, alerts, reports]) => {
        setStats({
          vehicles: vehicles.length,
          pendingAlerts: alerts.filter(a => !a.owner_response).length,
          reports: reports.length,
        });
      }).catch(() => {});
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>RePark</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox label="Vehicles" value={stats?.vehicles} />
        <StatBox label="Pending Alerts" value={stats?.pendingAlerts} highlight={!!stats?.pendingAlerts} />
        <StatBox label="Reports Filed" value={stats?.reports} />
      </View>

      {/* Quick actions */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/report')}>
        <Text style={styles.cardIcon}>📋</Text>
        <Text style={styles.cardTitle}>Report a Vehicle</Text>
        <Text style={styles.cardSub}>Alert an owner anonymously</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/vehicles')}>
        <Text style={styles.cardIcon}>🚗</Text>
        <Text style={styles.cardTitle}>My Vehicles</Text>
        <Text style={styles.cardSub}>Manage your registered plates</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, !!stats?.pendingAlerts && styles.cardAlert]}
        onPress={() => router.push('/(tabs)/alerts')}
      >
        <Text style={styles.cardIcon}>🔔</Text>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Alerts</Text>
          {!!stats?.pendingAlerts && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingAlerts}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSub}>Check your notification inbox</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatBox({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <View style={[styles.statBox, highlight && styles.statBoxHighlight]}>
      {value === undefined ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      )}
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  logo: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBoxHighlight: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statValueHighlight: { color: '#2563EB' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  statLabelHighlight: { color: '#2563EB' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardAlert: { borderColor: '#2563EB' },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280' },
  badge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
