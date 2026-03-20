import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { vehiclesApi, alertsApi, reportsApi } from '@/lib/api';
import { colors, shadow, radius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonBox } from '@/components/Skeleton';

type Stats = { vehicles: number; pendingAlerts: number; reports: number };

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number | undefined, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === undefined) return;
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, highlight }: {
  label: string; value?: number; icon: string; highlight?: boolean;
}) {
  const displayed = useCountUp(value);
  return (
    <View style={[s.statCard, highlight && s.statCardHL]}>
      <Text style={s.statIcon}>{icon}</Text>
      {value === undefined
        ? <SkeletonBox width={32} height={24} borderRadius={4} style={{ marginVertical: 4 }} />
        : <Text style={[s.statValue, highlight && s.statValueHL]}>{displayed}</Text>}
      <Text style={[s.statLabel, highlight && s.statLabelHL]}>{label}</Text>
    </View>
  );
}

// ─── Action card ──────────────────────────────────────────────────────────────

function ActionCard({ icon, title, description, onPress, primary, badge, delay }: {
  icon: string; title: string; description: string;
  onPress: () => void; primary?: boolean; badge?: number; delay?: number;
}) {
  return (
    <FadeInView delay={delay} style={{ marginHorizontal: 16, marginBottom: 10 }}>
      <PressableScale onPress={onPress} style={[s.actionCard, primary && s.actionCardPrimary]}>
        <View style={[s.actionIconBox, primary && s.actionIconBoxPrimary]}>
          <Text style={s.actionIcon}>{icon}</Text>
        </View>
        <View style={s.actionText}>
          <Text style={[s.actionTitle, primary && s.actionTitlePrimary]}>{title}</Text>
          <Text style={[s.actionDesc,  primary && s.actionDescPrimary]}>{description}</Text>
        </View>
        {!!badge && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={[s.chevron, primary && s.chevronPrimary]}>›</Text>
      </PressableScale>
    </FadeInView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const phone = session?.user.phone ?? '';
  const greeting = `Hi, ···${phone.slice(-4) || '...'}`;

  useFocusEffect(
    useCallback(() => {
      Promise.all([vehiclesApi.list(), alertsApi.list(), reportsApi.list()])
        .then(([vehicles, alerts, reports]) =>
          setStats({
            vehicles: vehicles.length,
            pendingAlerts: alerts.filter(a => !a.owner_response).length,
            reports: reports.length,
          }),
        )
        .catch(() => {});
    }, []),
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <View style={s.header}>
          <Text style={s.greeting}>{greeting} 👋</Text>
          <Text style={s.appName}>RePark</Text>
        </View>
      </FadeInView>

      <FadeInView delay={60}>
        <View style={s.statsRow}>
          <StatCard label="Vehicles"      value={stats?.vehicles}      icon="🚗" />
          <StatCard label="Alerts"        value={stats?.pendingAlerts} icon="🔔" highlight={!!stats?.pendingAlerts} />
          <StatCard label="Reports Filed" value={stats?.reports}       icon="📋" />
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
      </FadeInView>

      <ActionCard
        icon="📋" title="Report a Vehicle" description="Alert an owner anonymously"
        onPress={() => router.push('/(tabs)/report')} primary delay={140}
      />
      <ActionCard
        icon="🚗" title="My Vehicles" description="Manage your registered plates"
        onPress={() => router.push('/(tabs)/vehicles')} delay={180}
      />
      <ActionCard
        icon="🔔" title="Alerts" description="Check your notification inbox"
        onPress={() => router.push('/(tabs)/alerts')}
        badge={stats?.pendingAlerts || undefined} delay={220}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 32,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  appName:  { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 28,
  },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    padding: 14, alignItems: 'center', ...shadow.md,
  },
  statCardHL:    { backgroundColor: colors.primary },
  statIcon:      { fontSize: 20, marginBottom: 4 },
  statValue:     { fontSize: 22, fontWeight: '800', color: colors.text },
  statValueHL:   { color: '#fff' },
  statLabel:     { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  statLabelHL:   { color: 'rgba(255,255,255,0.8)' },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginHorizontal: 20, marginBottom: 12,
  },

  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: 16, ...shadow.sm,
  },
  actionCardPrimary: { backgroundColor: colors.primary },
  actionIconBox: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: colors.bg, justifyContent: 'center',
    alignItems: 'center', marginRight: 14,
  },
  actionIconBoxPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  actionIcon:         { fontSize: 22 },
  actionText:         { flex: 1 },
  actionTitle:        { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  actionTitlePrimary: { color: '#fff' },
  actionDesc:         { fontSize: 13, color: colors.textSecondary },
  actionDescPrimary:  { color: 'rgba(255,255,255,0.75)' },
  chevron:            { fontSize: 22, color: colors.textMuted, marginLeft: 8 },
  chevronPrimary:     { color: 'rgba(255,255,255,0.6)' },
  badge: {
    backgroundColor: '#fff', borderRadius: radius.full,
    minWidth: 22, height: 22, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 6, marginRight: 6,
  },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
});
