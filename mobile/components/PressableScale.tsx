import { useRef } from 'react';
import { Animated, Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/lib/motion';
import { motion } from '@/lib/theme';

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scale?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean; selected?: boolean; checked?: boolean };
};

/**
 * Scales to 0.97 on the press spring (motion.md: stiffness 600, damping 38).
 * With reduce motion on, it doesn't scale.
 */
export function PressableScale({
  onPress, onLongPress, disabled, style, children, scale = 0.97,
  accessibilityRole = 'button', accessibilityLabel, accessibilityState,
}: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  const springTo = (toValue: number) =>
    Animated.spring(anim, { toValue, useNativeDriver: true, ...motion.press }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => !reduced && springTo(scale)}
      onPressOut={() => !reduced && springTo(1)}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
    >
      <Animated.View style={[style, { transform: [{ scale: anim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
