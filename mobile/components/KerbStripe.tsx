import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

/**
 * The kerb stripe: diagonal Curb Yellow and ink, 12 px each. Same in light and dark.
 * At most once per screen, 5–8 px tall (tokens.md).
 */
export function KerbStripe({ height = 6, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const id = `kerb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[{ height, overflow: 'hidden' }, style]} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern id={id} width={24} height={24} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width={12} height={24} fill="#F5B800" />
            <Rect x={12} width={12} height={24} fill="#0D1117" />
          </Pattern>
        </Defs>
        <Rect width="100%" height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
