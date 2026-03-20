import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { IssueType, Report, reportsApi } from '@/lib/api';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'blocking_driveway',    label: 'Blocking driveway / access' },
  { value: 'construction_access', label: 'Construction access blocked' },
  { value: 'garbage_pickup',      label: 'Garbage pickup obstruction' },
  { value: 'restricted_zone',     label: 'Restricted parking zone' },
  { value: 'emergency_access',    label: 'Emergency access blocked' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: 'Submitted',        color: '#6B7280', bg: '#F3F4F6' },
  notified:   { label: 'Owner Notified',   color: '#2563EB', bg: '#EFF6FF' },
  responded:  { label: 'Owner Responded',  color: '#16A34A', bg: '#F0FDF4' },
  rejected:   { label: 'Incorrect Report', color: '#DC2626', bg: '#FEF2F2' },
  closed:     { label: 'Closed',           color: '#6B7280', bg: '#F3F4F6' },
};

// ─── Success Card ─────────────────────────────────────────────────────────────

function SuccessCard({ report, onReset }: { report: Report; onReset: () => void }) {
  const issueLabel = ISSUE_TYPES.find(i => i.value === report.issue_type)?.label ?? report.issue_type;
  const iconScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Card slides up
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
    // Icon bounces in after card
    Animated.spring(iconScale, {
      toValue: 1, tension: 40, friction: 5, delay: 200, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.successContainer}>
      <Animated.View style={[styles.successCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <Animated.Text style={[styles.successIcon, { transform: [{ scale: iconScale }] }]}>
          {report.owner_notified ? '✅' : '📋'}
        </Animated.Text>
        <Text style={styles.successTitle}>
          {report.owner_notified ? 'Owner Notified' : 'Report Saved'}
        </Text>
        <Text style={styles.successSub}>
          {report.owner_notified
            ? 'The vehicle owner has been sent an anonymous alert.'
            : 'This plate is not registered. Your report has been saved.'}
        </Text>
        <View style={styles.successDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plate</Text>
            <Text style={styles.detailValue}>{report.plate_number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue</Text>
            <Text style={styles.detailValue}>{issueLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: report.owner_notified ? '#16A34A' : '#6B7280' }]}>
              {report.owner_notified ? 'Owner notified' : 'Submitted'}
            </Text>
          </View>
        </View>
      </Animated.View>
      <PressableScale onPress={onReset} style={styles.resetBtn}>
        <Text style={styles.resetBtnText}>Report Another Vehicle</Text>
      </PressableScale>
    </View>
  );
}

// ─── Report History Item ───────────────────────────────────────────────────────

function ReportHistoryItem({ report }: { report: Report }) {
  const issueLabel = ISSUE_TYPES.find(i => i.value === report.issue_type)?.label ?? report.issue_type;
  const status = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.submitted;
  const date = new Date(report.created_at).toLocaleString();

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyPlate}>{report.plate_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.historyIssue}>{issueLabel}</Text>
      <Text style={styles.historyDate}>{date}</Text>
    </View>
  );
}

// ─── New Report Form ──────────────────────────────────────────────────────────

function NewReportForm({ onSuccess }: { onSuccess: (r: Report) => void }) {
  const [plate, setPlate] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location access is required to submit a report.');
      return;
    }
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!plate.trim()) { Alert.alert('Missing plate', 'Please enter a plate number.'); return; }
    if (!location)     { Alert.alert('Location required', 'Please confirm your location before submitting.'); return; }
    if (!issueType)    { Alert.alert('Issue required', 'Please select an issue type.'); return; }

    setSubmitting(true);
    try {
      const report = await reportsApi.create({
        plate_number: plate.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        issue_type: issueType,
        message: message.trim() || undefined,
      });
      onSuccess(report);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Report a Vehicle</Text>
        <Text style={styles.subtitle}>The owner will be notified anonymously.</Text>

        <Text style={styles.label}>Plate Number *</Text>
        <TextInput
          style={styles.input}
          value={plate}
          onChangeText={setPlate}
          placeholder="e.g. ABC 123"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.label}>Your Location *</Text>
        <TouchableOpacity
          style={[styles.locationBtn, location && styles.locationBtnActive]}
          onPress={handleGetLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#2563EB" size="small" />
          ) : (
            <Text style={[styles.locationBtnText, location && styles.locationBtnTextActive]}>
              {location
                ? `📍 Location confirmed (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
                : '📍 Confirm My Location'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Issue Type *</Text>
        {ISSUE_TYPES.map(item => (
          <TouchableOpacity
            key={item.value}
            style={[styles.issueOption, issueType === item.value && styles.issueOptionActive]}
            onPress={() => setIssueType(item.value)}
          >
            <View style={[styles.radio, issueType === item.value && styles.radioActive]} />
            <Text style={[styles.issueLabel, issueType === item.value && styles.issueLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Additional Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Any extra details..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />

        <PressableScale
          style={[styles.submitBtn, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Alert</Text>}
        </PressableScale>

        <Text style={styles.privacyNote}>
          Your identity will never be shared with the vehicle owner.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [result, setResult] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await reportsApi.list();
      setReports(data.slice().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (tab === 'history') loadHistory(true);
  }, [tab, loadHistory]));

  const handleTabChange = (t: 'new' | 'history') => {
    setTab(t);
    if (t === 'history') loadHistory();
  };

  const handleSuccess = (report: Report) => {
    setResult(report);
  };

  const handleReset = () => {
    setResult(null);
    setTab('new');
  };

  if (result) {
    return <SuccessCard report={result} onReset={handleReset} />;
  }

  return (
    <View style={styles.container}>
      {/* Tab toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'new' && styles.tabBtnActive]}
          onPress={() => handleTabChange('new')}
        >
          <Text style={[styles.tabBtnText, tab === 'new' && styles.tabBtnTextActive]}>New Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => handleTabChange('history')}
        >
          <Text style={[styles.tabBtnText, tab === 'history' && styles.tabBtnTextActive]}>My Reports</Text>
        </TouchableOpacity>
      </View>

      {tab === 'new' ? (
        <NewReportForm onSuccess={handleSuccess} />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2563EB" size="large" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadHistory(true); }}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptySub}>Reports you file will appear here with live status updates.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 60}>
              <ReportHistoryItem report={item} />
            </FadeInView>
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingBottom: 48 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#2563EB' },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabBtnTextActive: { color: '#2563EB' },

  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827', backgroundColor: '#fff',
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  locationBtn: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#fff', alignItems: 'center',
  },
  locationBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  locationBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  locationBtnTextActive: { color: '#2563EB' },
  issueOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  issueOptionActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12 },
  radioActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  issueLabel: { fontSize: 14, color: '#374151', flex: 1 },
  issueLabelActive: { color: '#1D4ED8', fontWeight: '600' },
  submitBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },

  historyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyPlate: { fontSize: 17, fontWeight: '700', color: '#111827', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  historyIssue: { fontSize: 13, color: '#374151', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#9CA3AF' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  successContainer: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'center' },
  successCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successDetails: { width: '100%', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  resetBtn: { borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  resetBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 15 },
});
