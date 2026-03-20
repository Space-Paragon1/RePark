import { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;      // ms — stagger list items by passing index * 60
  duration?: number;
  fromY?: number;      // starting Y offset (slides up as it fades in)
};

/**
 * Wraps children in a fade + slide-up entrance animation.
 * Use `delay` to stagger list items: delay={index * 60}
 */
export function FadeInView({ children, style, delay = 0, duration = 280, fromY = 14 }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
