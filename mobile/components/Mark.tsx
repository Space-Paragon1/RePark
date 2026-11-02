import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

/** The RePark mark (assets/mark.svg): a plate outline with a P and a brand dot. */
export function Mark({ size = 40, color, ring }: { size?: number; color?: string; ring?: string }) {
  const { colors } = useTheme();
  const ink = color ?? colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={6} y={15} width={52} height={36} rx={6} fill="none" stroke={ink} strokeWidth={4.5} />
      <Path
        d="M24.5 44V24h7.2c4.4 0 7.3 2.4 7.3 6.3 0 3.9-2.9 6.3-7.3 6.3h-3.4V44z M28.3 33.4h3.2c2.2 0 3.6-1.1 3.6-3.1s-1.4-3.1-3.6-3.1h-3.2z"
        fill={ink}
      />
      <Circle cx={55} cy={16} r={7} fill={colors.brand} stroke={ring ?? colors.bg} strokeWidth={3} />
    </Svg>
  );
}
