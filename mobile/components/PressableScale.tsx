import { useRef } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp } from 'react-native';

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scale?: number;
};

/**
 * Drop-in replacement for TouchableOpacity that scales down on press
 * for a tactile, native-feeling response.
 */
export function PressableScale({ onPress, onLongPress, disabled, style, children, scale = 0.96 }: Props) {
  const anim = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(anim, { toValue: scale,  useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(anim, { toValue: 1,     useNativeDriver: true, speed: 60, bounciness: 4 }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: anim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
