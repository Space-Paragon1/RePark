import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Check, type LucideIcon } from '@/components/icons';
import { useReducedMotion } from '@/lib/motion';
import { font, motion, themedStyles, useTheme, type Colors } from '@/lib/theme';

/**
 * done: brand fill + check. go: an owner reply (go fill + icon, label in go).
 * stop: incorrect report. neutral: closed with no reply. waiting: owner not on RePark yet.
 * pending: dashed ring, still to happen.
 */
export type TimelineState = 'done' | 'go' | 'stop' | 'neutral' | 'waiting' | 'pending';

export type TimelineStep = {
  title: string;
  /** Mono line under the title, e.g. "21:42:11 · delivered". */
  time?: string;
  /** Plain sentence under the title. */
  detail?: string;
  state: TimelineState;
  icon?: LucideIcon;
};

/**
 * Status timeline (components.md): 24 px rail, 20 px nodes, 2 px connectors.
 * Solid brand between done steps, go into a reply, dashed into anything pending.
 * With `relay`, a signal dot travels the first dashed segment once (1.2 s).
 */
export function Timeline({ steps, relay = false }: { steps: TimelineStep[]; relay?: boolean }) {
  const styles = useStyles();
  const firstDashed = steps.findIndex((s, i) => i > 0 && isDashed(s.state)) - 1;

  return (
    <View>
      {steps.map((step, i) => {
        const next = steps[i + 1];
        return (
          <View key={`${i}-${step.title}`} style={styles.row}>
            <View style={styles.rail}>
              <Node step={step} />
              {next && <Connector into={next.state} relay={relay && i === firstDashed} />}
            </View>
            <View style={[styles.content, !next && styles.contentLast]}>
              <Text style={[styles.title, step.state === 'go' && styles.titleGo, step.state === 'stop' && styles.titleStop]}>
                {step.title}
              </Text>
              {!!step.time && <Text style={styles.time}>{step.time}</Text>}
              {!!step.detail && <Text style={styles.detail}>{step.detail}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function isDashed(state: TimelineState) {
  return state === 'pending' || state === 'waiting';
}

function nodeColors(state: TimelineState, c: Colors) {
  switch (state) {
    case 'done':    return { bg: c.brand, fg: c.onBrand };
    case 'go':      return { bg: c.go, fg: c.onBrand };
    case 'stop':    return { bg: c.stop, fg: c.onStop };
    case 'neutral': return { bg: c.surfaceSunken, fg: c.textSecondary };
    case 'waiting': return { bg: c.brandTint, fg: c.brand };
    case 'pending': return { bg: 'transparent', fg: c.textMuted };
  }
}

function Node({ step }: { step: TimelineStep }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (step.state === 'pending') return <View style={styles.pendingNode} />;
  const { bg, fg } = nodeColors(step.state, colors);
  const Icon = step.icon ?? Check;
  return (
    <View style={[styles.node, { backgroundColor: bg }]}>
      <Icon size={12} strokeWidth={3} color={fg} />
    </View>
  );
}

function Connector({ into, relay }: { into: TimelineState; relay: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (isDashed(into)) return <DashedConnector relay={relay} />;
  const color = into === 'go' ? colors.go : into === 'done' ? colors.brand : colors.lineStrong;
  return <View style={[styles.connector, { backgroundColor: color }]} />;
}

function DashedConnector({ relay }: { relay: boolean }) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!relay || !height) return;
    if (reduced) { progress.setValue(1); return; }
    Animated.timing(progress, {
      toValue: 1, duration: motion.relayMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
    }).start();
  }, [relay, height, reduced, progress]);

  return (
    <View style={styles.dashedWrap} onLayout={e => setHeight(e.nativeEvent.layout.height)}>
      {Array.from({ length: Math.ceil(height / 8) }, (_, i) => <View key={i} style={styles.dash} />)}
      {relay && height > 0 && (
        <Animated.View
          style={[
            styles.relayDot,
            { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, height - 16)] }) }] },
          ]}
        />
      )}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  row: { flexDirection: 'row', gap: 14 },
  rail: { width: 24, alignItems: 'center' },
  node: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pendingNode: {
    width: 20, height: 20, borderRadius: 10, marginTop: 1,
    borderWidth: 2, borderStyle: 'dashed', borderColor: c.lineStrong,
  },
  connector: { width: 2, flex: 1, marginVertical: 3, borderRadius: 1 },
  dashedWrap: { width: 12, flex: 1, alignItems: 'center', overflow: 'hidden', marginVertical: 3 },
  dash: { width: 2, height: 4, marginBottom: 4, borderRadius: 1, backgroundColor: c.lineStrong },
  relayDot: {
    position: 'absolute', top: 2, width: 12, height: 12, borderRadius: 6,
    backgroundColor: c.signal, borderWidth: 3, borderColor: c.bg,
  },
  content: { flex: 1, paddingBottom: 22 },
  contentLast: { paddingBottom: 0 },
  title: { fontFamily: font.headingBold, fontSize: 16, color: c.text },
  titleGo: { color: c.go },
  titleStop: { color: c.stop },
  time: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 3 },
  detail: { fontSize: 14, lineHeight: 20, color: c.textSecondary, marginTop: 3 },
}));
