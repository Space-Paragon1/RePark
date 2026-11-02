import { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/lib/motion';
import { motion } from '@/lib/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;      // ms; stagger list items with index * 60
  duration?: number;
  fromY?: number;      // starting offset; slides up as it fades in
};

/**
 * Fade + slide-up entrance (motion.md: 220 ms, ui easing). With reduce motion it only fades.
 * Stagger list items with delay={index * 60}.
 */
export function FadeInView({ children, style, delay = 0, duration = motion.uiMs, fromY = 12 }: Props) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    const easing = Easing.bezier(0.2, 0.8, 0.2, 1);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, easing, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: reduced ? 0 : duration, delay, easing, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, duration, delay, reduced]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY: reduced ? 0 : translateY }] }]}>
      {children}
    </Animated.View>
  );
}
