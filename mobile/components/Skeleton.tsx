import { useEffect, useRef } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/lib/motion';
import { radius, themedStyles, useTheme } from '@/lib/theme';

/** A pulsing placeholder block (1.4 s loop; still under reduce motion). */
export function SkeletonBox({
  width, height, borderRadius = 4, style,
}: {
  width?: ViewStyle['width']; height: number; borderRadius?: number; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) { opacity.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, opacity]);

  return (
    <Animated.View
      style={[{ width: width ?? '100%', height, borderRadius, backgroundColor: colors.surfaceSunken, opacity }, style]}
    />
  );
}

/** A loading row that copies the real one: a plate-shaped bone first, then two text bones. */
export function SkeletonCard() {
  const s = useStyles();
  return (
    <View style={s.card} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <SkeletonBox width={92} height={28} borderRadius={radius.plateSm} style={s.plate} />
      <View style={s.body}>
        <SkeletonBox width="70%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={10} />
      </View>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: c.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: c.line,
    marginBottom: 10,
  },
  plate: { borderWidth: 1.5, borderColor: c.line },
  body: { flex: 1 },
}));
