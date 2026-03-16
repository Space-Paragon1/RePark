import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { IssueType, Report, reportsApi } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'blocking_driveway',    label: 'Blocking driveway / access' },
  { value: 'construction_access', label: 'Construction access blocked' },
  { value: 'garbage_pickup',      label: 'Garbage pickup obstruction' },
  { value: 'restricted_zone',     label: 'Restricted parking zone' },
  { value: 'emergency_access',    label: 'Emergency access blocked' },
];

// ─── Success Card ─────────────────────────────────────────────────────────────

function SuccessCard({ report, onReset }: { report: Report; onReset: () => void }) {
  const issueLabel = ISSUE_TYPES.find(i => i.value === report.issue_type)?.label ?? report.issue_type;

  return (
    <View style={styles.successContainer}>
      <View style={styles.successCard}>
        <Text style={styles.successIcon}>{report.owner_notified ? '✅' : '📋'}</Text>
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
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>Report Another Vehicle</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const [plate, setPlate] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Report | null>(null);

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
    if (!plate.trim()) {
      Alert.alert('Missing plate', 'Please enter a plate number.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please confirm your location before submitting.');
      return;
    }
    if (!issueType) {
      Alert.alert('Issue required', 'Please select an issue type.');
      return;
    }

    setSubmitting(true);
    try {
      const report = await reportsApi.create({
        plate_number: plate.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        issue_type: issueType,
        message: message.trim() || undefined,
      });
      setResult(report);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPlate('');
    setLocation(null);
    setIssueType(null);
    setMessage('');
    setResult(null);
  };

  if (result) {
    return <SuccessCard report={result} onReset={handleReset} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Report a Vehicle</Text>
        <Text style={styles.subtitle}>The owner will be notified anonymously.</Text>

        {/* Plate Number */}
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

        {/* Location */}
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

        {/* Issue Type */}
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

        {/* Optional Message */}
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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Send Alert</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          Your identity will never be shared with the vehicle owner.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  locationBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  locationBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  locationBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  locationBtnTextActive: { color: '#2563EB' },
  issueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  issueOptionActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  radioActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  issueLabel: { fontSize: 14, color: '#374151', flex: 1 },
  issueLabelActive: { color: '#1D4ED8', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
  // Success
  successContainer: { flex: 1, backgroundColor: '#F9FAFB', padding: 24, justifyContent: 'center' },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successDetails: { width: '100%', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 15 },
});
