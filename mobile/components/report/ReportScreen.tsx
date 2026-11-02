import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { reportsApi, type IssueType, type Report } from '@/lib/api';
import { formatTime, isReportOpen, issueFor, issueLabel, reportStatus } from '@/lib/labels';
import { useCurrentLocation, type CurrentLocation } from '@/lib/location';
import { isPlateValid, plateForSubmit } from '@/lib/plate';
import {
  NOTE_MAX, REPORTS_PER_HOUR, nextReportAt, noteError, reportErrorMessage, reportOutcome, reportTimeline,
  reportsThisHour,
} from '@/lib/report';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IssuePicker } from '@/components/IssuePicker';
import { LocationBlock } from '@/components/LocationBlock';
import { Plate, PlateInput } from '@/components/Plate';
import { RelayGraphic } from '@/components/RelayGraphic';
import { ReportRow } from '@/components/ReportRow';
import { Segmented } from '@/components/Segmented';
import { SkeletonCard } from '@/components/Skeleton';
import { Timeline } from '@/components/Timeline';
import { BackIcon, MapPin, Send, ShieldCheck, TriangleAlert, X } from '@/components/icons';

type Tab = 'new' | 'history';

function newestFirst(reports: Report[]): Report[] {
  return reports.slice().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

/**
 * Report: a three-step flow (plate, where and what, check and send), then the sent screen.
 * Used by the Report tab (iOS) and the full-screen flow from Android's Report button,
 * which passes `onClose` to show an X.
 */
export function ReportScreen({ onClose }: { onClose?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('new');
  const [viewing, setViewing] = useState<{ report: Report; justSent: boolean } | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Bumped to start a fresh report.
  const [flowKey, setFlowKey] = useState(0);
  // ?view=<id> opens that report's status, e.g. from Home.
  const { view } = useLocalSearchParams<{ view?: string }>();
  const router = useRouter();

  const loadHistory = useCallback(async () => {
    try {
      setReports(newestFirst(await reportsApi.list()));
      setHistoryError(false);
    } catch {
      setHistoryError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // The flow needs recent reports for the hourly limit, so load on every visit.
  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  useEffect(() => {
    if (!view || !reports) return;
    const report = reports.find(r => r.id === view);
    if (report) setViewing({ report, justSent: false });
    router.setParams({ view: undefined });
  }, [view, reports, router]);

  const startNew = () => {
    setViewing(null);
    setTab('new');
    setFlowKey(k => k + 1);
  };

  if (viewing) {
    return (
      <SentView
        report={viewing.report}
        justSent={viewing.justSent}
        onDone={startNew}
        onSeeAll={() => { setViewing(null); setTab('history'); loadHistory(); }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.segment}>
        {onClose && (
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <X size={24} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.flex}>
          <Segmented
            options={[{ value: 'new', label: 'New' }, { value: 'history', label: 'History' }]}
            value={tab}
            onChange={setTab}
          />
        </View>
      </View>
      {tab === 'new' ? (
        <ReportFlow
          key={flowKey}
          history={reports ?? []}
          onSent={report => {
            setReports(prev => [report, ...(prev ?? [])]);
            setViewing({ report, justSent: true });
          }}
        />
      ) : (
        <HistoryList
          reports={reports}
          error={historyError}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadHistory(); }}
          onOpen={report => setViewing({ report, justSent: false })}
          onReport={startNew}
        />
      )}
    </View>
  );
}

// ─── The flow ─────────────────────────────────────────────────────────────────

function ReportFlow({ history, onSent }: { history: Report[]; onSent: (report: Report) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [plate, setPlate] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const { location, refresh } = useCurrentLocation(step >= 2);
  const [issue, setIssue] = useState<IssueType | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const noteProblem = noteError(note);
  const limitAt = nextReportAt(history);
  const usedThisHour = reportsThisHour(history).length;

  const continueFromPlate = () => {
    if (!isPlateValid(plate)) {
      setPlateError('Enter 2 to 10 letters and numbers.');
      return;
    }
    setPlateError(null);
    setStep(2);
  };

  const send = async () => {
    if (location.status !== 'ready' || !issue || noteProblem) return;
    setSending(true);
    setSendError(null);
    try {
      const report = await reportsApi.create({
        plate_number: plateForSubmit(plate),
        latitude: location.latitude,
        longitude: location.longitude,
        issue_type: issue,
        message: note.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSent(report);
    } catch (e) {
      setSendError(reportErrorMessage(e, history, plateForSubmit(plate)));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.flowContent} keyboardShouldPersistTaps="handled">
        <Progress step={step} />
        <Text style={styles.kicker}>Step {step} of 3</Text>

        {step === 1 && (
          <>
            <Text style={styles.title} accessibilityRole="header">Which car is blocking you?</Text>
            <View style={styles.section}>
              <PlateInput
                value={plate}
                onChangeText={value => { setPlate(value); setPlateError(null); }}
                error={plateError}
                autoFocus
                onSubmitEditing={continueFromPlate}
              />
            </View>
            {!plateError && <Text style={styles.helper}>Letters and numbers only. Spaces don't matter.</Text>}
          </>
        )}

        {step === 2 && (
          <>
            <BackLink label="Plate" onPress={() => setStep(1)} />
            <Text style={styles.title} accessibilityRole="header">Where and what?</Text>
            <View style={styles.plateRow}>
              <Plate plate={plateForSubmit(plate)} />
              <Button label="Change" variant="quiet" size="compact" onPress={() => setStep(1)} />
            </View>
            <View style={styles.section}>
              <LocationBlock location={location} onRefresh={refresh} />
            </View>
            <Text style={styles.label}>What's the problem?</Text>
            <IssuePicker value={issue} onChange={setIssue} />
          </>
        )}

        {step === 3 && issue && (
          <>
            <BackLink label="Where and what" onPress={() => setStep(2)} />
            <Text style={styles.title} accessibilityRole="header">Check and send</Text>
            <SummaryCard plate={plateForSubmit(plate)} issue={issue} location={location} />

            <Text style={styles.label}>
              Note <Text style={styles.optional}>optional</Text>
            </Text>
            <TextInput
              style={[styles.note, !!noteProblem && styles.noteError]}
              value={note}
              onChangeText={setNote}
              placeholder="For example, which gate is blocked"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={NOTE_MAX}
              textAlignVertical="top"
              accessibilityLabel="Note, optional"
            />
            <View style={styles.noteMeta}>
              <Text style={[styles.noteHint, !!noteProblem && styles.noteHintError]}>
                {noteProblem ?? 'Kept with your report. No names or numbers.'}
              </Text>
              <Text style={styles.counter}>{note.length}/{NOTE_MAX}</Text>
            </View>

            <View style={styles.privacy}>
              <ShieldCheck size={18} color={colors.textSecondary} />
              <Text style={styles.privacyText}>
                The owner sees the plate, the car and the problem. Never you, your number, your note or where you are.
              </Text>
            </View>
            {!!sendError && <Banner tone="error" message={sendError} style={styles.section} />}
          </>
        )}
      </ScrollView>

      {/* The main action sits in the lower third, above the keyboard. */}
      <View style={styles.actionBar}>
        {step === 1 && <Button label="Continue" size="main" onPress={continueFromPlate} />}
        {step === 2 && (
          <Button
            label="Continue"
            size="main"
            disabled={location.status !== 'ready' || !issue}
            onPress={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <>
            <Button
              label="Send alert"
              icon={Send}
              size="main"
              loading={sending}
              loadingLabel="Sending"
              disabled={!!noteProblem || !!limitAt}
              onPress={send}
            />
            <Text style={styles.limit}>
              {limitAt
                ? `You can send another report at ${formatTime(limitAt.toISOString())}.`
                : `${Math.min(usedThisHour + 1, REPORTS_PER_HOUR)} of ${REPORTS_PER_HOUR} reports this hour`}
            </Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Progress({ step }: { step: number }) {
  const styles = useStyles();
  return (
    <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step }}>
      {[1, 2, 3].map(i => <View key={i} style={[styles.progressPart, i <= step && styles.progressDone]} />)}
    </View>
  );
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.back} accessibilityRole="button" accessibilityLabel={`Back to ${label}`} hitSlop={8}>
      <BackIcon size={18} color={colors.brand} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

function SummaryCard({ plate, issue, location }: { plate: string; issue: IssueType; location: CurrentLocation }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const IssueIcon = issueFor(issue)?.Icon ?? TriangleAlert;
  const place = location.status === 'ready' && location.place ? `Near ${location.place}` : 'Near your current location';
  return (
    <View style={styles.summary}>
      <Plate plate={plate} size="M" />
      <View style={styles.summaryRow}>
        <IssueIcon size={20} color={colors.textSecondary} />
        <Text style={styles.summaryText}>{issueLabel(issue)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <MapPin size={20} color={colors.textSecondary} />
        <Text style={styles.summaryText}>{place}</Text>
      </View>
    </View>
  );
}

// ─── Sent and status ──────────────────────────────────────────────────────────

const POLL_MS = 15_000;

/** After sending, or opened from history: where the report stands, updating until it closes. */
function SentView({ report: initial, justSent, onDone, onSeeAll }: {
  report: Report;
  justSent: boolean;
  onDone: () => void;
  onSeeAll: () => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState(initial);

  // Keep checking while the report is open, so a reply shows up here.
  useEffect(() => {
    if (!isReportOpen(report)) return;
    const timer = setInterval(async () => {
      try {
        const latest = await reportsApi.get(report.id);
        if (latest.status === 'responded') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        setReport(latest);
      } catch {
        // Try again on the next tick.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [report]);

  const outcome = reportOutcome(report);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.sentContent}>
        {justSent && report.owner_notified && (
          <View style={styles.relay}><RelayGraphic plate={report.plate_number} /></View>
        )}
        <Chip status={reportStatus(report)} />
        <Text style={styles.title} accessibilityRole="header">{outcome.title}</Text>
        <Text style={styles.body}>{outcome.body}</Text>

        <View style={styles.summary}>
          <Plate plate={report.plate_number} size="M" />
          <Text style={styles.summaryText}>{issueLabel(report.issue_type)}</Text>
        </View>
        <View style={styles.timelineCard}>
          <Timeline steps={reportTimeline(report)} relay={justSent} />
        </View>
      </ScrollView>
      <View style={styles.actionBar}>
        <Button label="Done" variant="secondary" size="main" onPress={onDone} />
        <Button label="See all reports" variant="quiet" onPress={onSeeAll} />
      </View>
    </View>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

function HistoryList({ reports, error, refreshing, onRefresh, onOpen, onReport }: {
  reports: Report[] | null;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (report: Report) => void;
  onReport: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.historyContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {reports === null && !error && (<><SkeletonCard /><SkeletonCard /><SkeletonCard /></>)}
      {error && reports === null && (
        <Banner tone="error" message="We couldn't load your reports. Check your connection. Nothing you've sent is lost." />
      )}
      {reports?.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Send size={26} color={colors.textSecondary} /></View>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySub}>If a car's blocking you, enter its plate and we'll let the owner know.</Text>
          <Button label="Report a car" variant="secondary" onPress={onReport} style={styles.emptyButton} />
        </View>
      )}
      {!!reports?.length && (
        <View style={styles.historyCard}>
          {reports.map((report, i) => (
            <ReportRow key={report.id} report={report} divider={i > 0} onPress={() => onOpen(report)} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  segment: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },

  flowContent: { padding: 16, paddingTop: 12, paddingBottom: 24 },
  progress: { flexDirection: 'row', gap: 4 },
  progressPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.surfaceSunken },
  progressDone: { backgroundColor: c.brand },
  kicker: {
    fontFamily: font.mono, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase',
    color: c.textMuted, marginTop: 18,
  },
  title: { fontFamily: font.heading, fontSize: 28, lineHeight: 33, letterSpacing: -0.5, color: c.text, marginTop: 8 },
  body: { fontSize: 16, lineHeight: 23, color: c.textSecondary, marginTop: 8 },
  section: { marginTop: 20 },
  helper: { fontSize: 14, color: c.textMuted, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 24, marginBottom: 8 },
  optional: { fontWeight: '400', color: c.textMuted },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginTop: 14 },
  backText: { fontSize: 15, fontWeight: '600', color: c.brand },
  plateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },

  summary: {
    marginTop: 20, padding: 16, gap: 12,
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
  note: {
    minHeight: 96, borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    padding: 14, fontSize: 16, color: c.text, backgroundColor: c.surface,
  },
  noteError: { borderColor: c.stop },
  noteMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  noteHint: { flex: 1, fontSize: 13, color: c.textMuted },
  noteHintError: { color: c.stop, fontWeight: '500' },
  counter: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted },
  privacy: { flexDirection: 'row', gap: 10, marginTop: 20 },
  privacyText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.textSecondary },

  actionBar: {
    gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg,
  },
  limit: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, textAlign: 'center' },

  sentContent: { padding: 20, paddingBottom: 24 },
  relay: { marginBottom: 24 },
  timelineCard: {
    marginTop: 16, padding: 16,
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
  },

  historyContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  historyCard: { borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' },
  empty: {
    alignItems: 'center', padding: 28, marginTop: 8,
    borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.card,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.line,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: c.text, marginBottom: 6 },
  emptySub: { fontSize: 14, lineHeight: 20, color: c.textSecondary, textAlign: 'center', maxWidth: 260 },
  emptyButton: { marginTop: 20 },
}));
