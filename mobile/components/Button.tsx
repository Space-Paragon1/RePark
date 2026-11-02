import { ActivityIndicator, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import type { LucideIcon } from '@/components/icons';
import { font, radius, themedStyles, useTheme, type Colors } from '@/lib/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'quietStop' | 'destructive';

/**
 * Handoff buttons: radius 10, label Overpass 700 17. Height 48, or 56 for a screen's
 * main action (`size="main"`). Pressed scales to 0.97. Disabled is 45%. Loading keeps
 * the button, shows a 16 px spinner and swaps the label to `loadingLabel` ("Sending").
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading = false,
  loadingLabel,
  disabled = false,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'default' | 'main' | 'compact';
  icon?: LucideIcon;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fg = foreground(variant, colors);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ busy: loading }}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading
          ? <ActivityIndicator size="small" color={fg} style={styles.spinner} />
          : Icon && <Icon size={18} color={fg} />}
        <Text style={[styles.label, size === 'compact' && styles.labelCompact, { color: fg }]} numberOfLines={1}>
          {loading && loadingLabel ? loadingLabel : label}
        </Text>
      </View>
    </PressableScale>
  );
}

function foreground(variant: ButtonVariant, c: Colors): string {
  switch (variant) {
    case 'primary':     return c.onBrand;
    case 'destructive': return c.onStop;
    case 'secondary':   return c.text;
    case 'quiet':       return c.brand;
    case 'quietStop':   return c.stop;
  }
}

const useStyles = themedStyles((c) => ({
  base: { borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  default: { height: 48 },
  main: { height: 56 },
  compact: { height: 40, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spinner: { transform: [{ scale: 0.8 }] },
  label: { fontFamily: font.headingBold, fontSize: 17 },
  labelCompact: { fontSize: 15 },
  primary: { backgroundColor: c.brand },
  secondary: { borderWidth: 1.5, borderColor: c.text },
  quiet: {},
  quietStop: {},
  destructive: { backgroundColor: c.stop },
  disabled: { opacity: 0.45 },
}));
