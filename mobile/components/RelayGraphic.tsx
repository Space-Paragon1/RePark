import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Plate } from '@/components/Plate';
import { User } from '@/components/icons';
import { useReducedMotion } from '@/lib/motion';
import { font, motion, themedStyles, useTheme } from '@/lib/theme';

/**
 * Sent screen relay: you → RePark → the plate, joined by dashes. A signal dot travels
 * the path once (1.2 s, ease-in-out); with reduce motion it's shown at the destination.
 */
export function RelayGraphic({ plate }: { plate: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!width) return;
    if (reduced) { progress.setValue(1); return; }
    Animated.timing(progress, {
      toValue: 1, duration: motion.relayMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
    }).start();
  }, [width, reduced, progress]);

  return (
    <View style={styles.row} accessible accessibilityLabel={`Sent from you, through RePark, to ${plate}`}>
      <View style={styles.node}>
        <View style={styles.disc}><User size={20} color={colors.textSecondary} /></View>
        <Text style={styles.caption}>You</Text>
      </View>
      <View style={styles.path} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        <Dashes />
        <View style={[styles.disc, styles.brandDisc]}><Text style={styles.mark}>P</Text></View>
        <Dashes />
        {width > 0 && (
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width - 12] }) }] },
            ]}
          />
        )}
      </View>
      <View style={styles.node}>
        <Plate plate={plate} />
        <Text style={styles.caption}>Owner</Text>
      </View>
    </View>
  );
}

function Dashes() {
  const styles = useStyles();
  return (
    <View style={styles.dashes}>
      {Array.from({ length: 6 }, (_, i) => <View key={i} style={styles.dash} />)}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  node: { alignItems: 'center', gap: 6 },
  disc: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.line,
    backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
  },
  brandDisc: { backgroundColor: c.brand, borderColor: c.brand },
  mark: { fontFamily: font.heading, fontSize: 20, color: c.onBrand },
  caption: { fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.textMuted },
  path: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center' },
  dashes: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', overflow: 'hidden' },
  dash: { width: 6, height: 2, borderRadius: 1, backgroundColor: c.lineStrong },
  dot: {
    position: 'absolute', left: 0, top: 16, width: 12, height: 12, borderRadius: 6,
    backgroundColor: c.signal, borderWidth: 3, borderColor: c.bg,
  },
}));
