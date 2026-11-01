import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { font, radius, themedStyles, useTheme, type Colors } from '@/lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'blocking_driveway',    label: 'Blocking driveway / access' },
  { value: 'construction_access', label: 'Construction access blocked' },
  { value: 'garbage_pickup',      label: 'Garbage pickup obstruction' },
  { value: 'restricted_zone',     label: 'Restricted parking zone' },
  { value: 'emergency_access',    label: 'Emergency access blocked' },
];

type StatusTone = { label: string; color: keyof Colors; bg: keyof Colors };

const STATUS_CONFIG: Record<string, StatusTone> = {
  submitted:  { label: 'Submitted',        color: 'textSecondary', bg: 'surfaceSunken' },
  notified:   { label: 'Owner Notified',   color: 'brand',         bg: 'brandTint' },
  responded:  { label: 'Owner Responded',  color: 'go',            bg: 'goTint' },
  rejected:   { label: 'Incorrect Report', color: 'stop',          bg: 'stopTint' },
  closed:     { label: 'No Response',      color: 'textSecondary', bg: 'surfaceSunken' },
};

// Plate wasn't registered, so no alert went out. The backend waits 2 hours for
// the owner to join, then closes the report.
const NOT_REGISTERED: Record<'waiting' | 'closed', StatusTone> = {
  waiting: { label: 'Owner Not on RePark Yet', color: 'brand',         bg: 'brandTint' },
  closed:  { label: 'Owner Not on RePark',     color: 'textSecondary', bg: 'surfaceSunken' },
};

function statusFor(report: Report) {
  if (!report.owner_notified) {
    return report.status === 'closed' ? NOT_REGISTERED.closed : NOT_REGISTERED.waiting;
  }
  return STATUS_CONFIG[report.status] ?? STATUS_CONFIG.submitted;
}

// ─── Success Card ─────────────────────────────────────────────────────────────

function SuccessCard({ report, onReset }: { report: Report; onReset: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
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
            : "This plate isn't on RePark yet. If the owner registers it in the next 2 hours, we'll alert them."}
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
            <Text style={[styles.detailValue, { color: report.owner_notified ? colors.go : colors.textMuted }]}>
              {report.owner_notified ? 'Owner notified' : 'Waiting for owner to join'}
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
  const styles = useStyles();
  const { colors } = useTheme();
  const issueLabel = ISSUE_TYPES.find(i => i.value === report.issue_type)?.label ?? report.issue_type;
  const status = statusFor(report);
  const date = new Date(report.created_at).toLocaleString();

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyPlate}>{report.plate_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors[status.bg] }]}>
          <Text style={[styles.statusText, { color: colors[status.color] }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.historyIssue}>{issueLabel}</Text>
      <Text style={styles.historyDate}>{date}</Text>
    </View>
  );
}

// ─── New Report Form ──────────────────────────────────────────────────────────

function NewReportForm({ onSuccess }: { onSuccess: (r: Report) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
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
          placeholderTextColor={colors.textMuted}
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
            <ActivityIndicator color={colors.brand} size="small" />
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
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <PressableScale
          style={[styles.submitBtn, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={colors.onBrand} /> : <Text style={styles.submitBtnText}>Send Alert</Text>}
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
  const styles = useStyles();
  const { colors } = useTheme();
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
          <ActivityIndicator color={colors.brand} size="large" />
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
              tintColor={colors.brand}
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

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingBottom: 48 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
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
  tabBtnActive: { borderBottomColor: c.brand },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  tabBtnTextActive: { color: c.brand },

  title: { fontSize: 24, fontFamily: font.heading, color: c.text, marginTop: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, color: c.textSecondary, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: c.text, backgroundColor: c.surface,
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  locationBtn: {
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: c.surface, alignItems: 'center',
  },
  locationBtnActive: { borderColor: c.brand, backgroundColor: c.brandTint },
  locationBtnText: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
  locationBtnTextActive: { color: c.brand },
  issueOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface,
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control, padding: 14, marginBottom: 8,
  },
  issueOptionActive: { borderColor: c.brand, backgroundColor: c.brandTint },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.lineStrong, marginRight: 12 },
  radioActive: { borderColor: c.brand, backgroundColor: c.brand },
  issueLabel: { fontSize: 14, color: c.textSecondary, flex: 1 },
  issueLabelActive: { color: c.brand, fontWeight: '600' },
  submitBtn: { backgroundColor: c.brand, borderRadius: radius.control, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  submitBtnText: { color: c.onBrand, fontSize: 16, fontWeight: '600' },
  privacyNote: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 12 },

  historyCard: {
    backgroundColor: c.surface, borderRadius: radius.card, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: c.line,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyPlate: { fontSize: 17, fontFamily: font.mono, color: c.text, letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: 12, fontWeight: '600' },
  historyIssue: { fontSize: 13, color: c.textSecondary, marginBottom: 4 },
  historyDate: { fontSize: 12, fontFamily: font.monoMedium, color: c.textMuted },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: font.headingBold, color: c.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },

  successContainer: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'center' },
  successCard: {
    backgroundColor: c.surface, borderRadius: radius.card, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: c.line, marginBottom: 20,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontFamily: font.headingBold, color: c.text, marginBottom: 8 },
  successSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successDetails: { width: '100%', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: c.textMuted },
  detailValue: { fontSize: 13, fontWeight: '600', color: c.text },
  resetBtn: { borderWidth: 1.5, borderColor: c.brand, borderRadius: radius.control, paddingVertical: 14, alignItems: 'center' },
  resetBtnText: { color: c.brand, fontWeight: '600', fontSize: 15 },
}));
