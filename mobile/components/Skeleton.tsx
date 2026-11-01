import { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { radius, themedStyles, useTheme } from '@/lib/theme';

/** Single pulsing placeholder block. */
export function SkeletonBox({
  width, height, borderRadius = radius.control, style,
}: {
  width?: ViewStyle['width']; height: number; borderRadius?: number; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9,  duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius, backgroundColor: colors.lineStrong },
        { opacity },
        style,
      ]}
    />
  );
}

/** Skeleton that looks like a vehicle / alert card. */
export function SkeletonCard() {
  const s = useStyles();
  return (
    <View style={s.card}>
      <View style={s.accent} />
      <View style={s.avatar}>
        <SkeletonBox width={44} height={44} borderRadius={radius.control} />
      </View>
      <View style={s.body}>
        <SkeletonBox width={120} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width={180} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={80}  height={10} borderRadius={4} />
      </View>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.card,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.line,
  },
  accent: { width: 4, alignSelf: 'stretch', backgroundColor: c.line },
  avatar: { marginHorizontal: 14, paddingVertical: 16 },
  body: { flex: 1, paddingVertical: 16, paddingRight: 16 },
}));
