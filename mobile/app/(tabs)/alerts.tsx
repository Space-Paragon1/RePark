import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, SectionList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { AlertDetail, OwnerResponseType, alertsApi } from '@/lib/api';
import { REPLY_SENT } from '@/lib/labels';
import { font, themedStyles, useTheme } from '@/lib/theme';
import { AlertCard } from '@/components/AlertCard';
import { Button } from '@/components/Button';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonCard } from '@/components/Skeleton';
import { ReportFab } from '@/components/ReportFab';
import { useToast } from '@/components/Toast';
import { notifyAlertsChanged } from '@/lib/alertCount';
import { Bell, Flag, Plus } from '@/components/icons';

export default function AlertsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [alerts, setAlerts] = useState<AlertDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  // The alert waiting on the "Mark as incorrect?" sheet.
  const [incorrectFor, setIncorrectFor] = useState<AlertDetail | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setAlerts(await alertsApi.list());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  // Live updates: re-fetch whenever a new alert is inserted in the database.
  useEffect(() => {
    const channel = supabase
      .channel('alerts-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const respond = async (alert: AlertDetail, response: OwnerResponseType) => {
    setRespondingId(alert.id);
    try {
      const updated = await alertsApi.respond(alert.id, response);
      setAlerts(prev => prev.map(a => (a.id === alert.id ? updated : a)));
      toast(REPLY_SENT);
      notifyAlertsChanged();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRespondingId(null);
      setIncorrectFor(null);
    }
  };

  const needsReply = alerts.filter(a => !a.owner_response);
  const replied = alerts.filter(a => a.owner_response);
  const sections = [
    ...(needsReply.length ? [{ title: 'Needs your reply', data: needsReply }] : []),
    ...(replied.length ? [{ title: 'Replied', data: replied }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Alerts</Text>
        <Text style={styles.subtitle}>Reports about your cars. You reply anonymously.</Text>
      </View>

      {loading ? (
        <View style={styles.list}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.brand} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title} · {section.data.length}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Bell size={26} color={colors.textSecondary} /></View>
              <Text style={styles.emptyTitle}>No alerts</Text>
              <Text style={styles.emptySub}>
                When someone reports one of your cars, it shows up here and on your lock screen.
              </Text>
              <Button
                label="Add a vehicle"
                icon={Plus}
                variant="secondary"
                onPress={() => router.push('/(tabs)/vehicles')}
                style={styles.emptyButton}
              />
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 60}>
              <AlertCard
                alert={item}
                onOpen={() => router.push(`/alert/${item.id}`)}
                onRespond={response => respond(item, response)}
                onIncorrect={() => setIncorrectFor(item)}
                responding={respondingId === item.id}
              />
            </FadeInView>
          )}
        />
      )}

      <ConfirmSheet
        visible={!!incorrectFor}
        icon={Flag}
        warn
        title="Mark this report as incorrect?"
        body="Only choose this if your car wasn't there or wasn't in the way. Incorrect reports count against the person who sent them."
        confirmLabel="Mark as incorrect"
        confirmingLabel="Marking"
        cancelLabel="Keep the report"
        busy={!!incorrectFor && respondingId === incorrectFor.id}
        onConfirm={() => incorrectFor && respond(incorrectFor, 'incorrect_report')}
        onCancel={() => setIncorrectFor(null)}
      />
      <ReportFab />
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  title: { fontSize: 30, lineHeight: 34, fontFamily: font.heading, color: c.text, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  sectionTitle: {
    fontFamily: font.mono, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
    color: c.textMuted, marginTop: 8, marginBottom: 10,
  },
  empty: {
    alignItems: 'center',
    marginTop: 24,
    padding: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.lineStrong,
    borderRadius: 14,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: c.text, marginBottom: 6 },
  emptySub: { fontSize: 14, lineHeight: 20, color: c.textSecondary, textAlign: 'center', maxWidth: 260 },
  emptyButton: { marginTop: 20 },
}));
