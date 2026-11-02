import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CircleAlert } from '@/components/icons';
import { useReducedMotion } from '@/lib/motion';
import { formatPlateInput, plateForSubmit } from '@/lib/plate';
import { font, motion, radius, themedStyles, useTheme } from '@/lib/theme';

type PlateSize = 'L' | 'M' | 'compact';

const SIZES = {
  L: { height: 80, strip: 20, fontSize: 40, radius: radius.plate },
  M: { height: 52, strip: 14, fontSize: 24, radius: 5 },
};

/**
 * A number plate. Every place a car appears leads with one (handoff components.md).
 * L: 80 high and fills the width, M: 52 high, compact: 28 high for list rows.
 */
export function Plate({ plate, size = 'compact', style }: {
  plate: string;
  size?: PlateSize;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const text = plate.toUpperCase();
  // Plate text never truncates: past 8 characters and a space, L steps down to M.
  const s = size === 'L' && text.length > 9 ? 'M' : size;

  if (s === 'compact') {
    return (
      <View style={[styles.compact, style]} accessible accessibilityLabel={`Plate ${text}`}>
        <Text style={styles.compactText}>{text}</Text>
      </View>
    );
  }

  const dims = SIZES[s];
  const letterSpacing = dims.fontSize * 0.12;
  return (
    <View
      style={[styles.plate, { height: dims.height, borderRadius: dims.radius }, s === 'L' && styles.plateL, style]}
      accessible
      accessibilityLabel={`Plate ${text}`}
    >
      <View style={[styles.ring, { borderRadius: dims.radius - 2 }]} />
      <View style={[styles.strip, { width: dims.strip }]} />
      <Text
        numberOfLines={1}
        style={[
          styles.plateText,
          // Letter spacing trails the last character; the extra left padding re-centres it.
          { fontSize: dims.fontSize, letterSpacing, paddingLeft: dims.strip + 12 + letterSpacing },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * Plate entry: blank dashed plate when empty, brand border and ring when focused.
 * Each new character stamps in with a light haptic. The real TextInput is invisible
 * on top, so the drawn letters can animate. Submit with plateForSubmit().
 */
export function PlateInput({
  value,
  onChangeText,
  error,
  disabled,
  autoFocus,
  onSubmitEditing,
  accessibilityLabel = 'Plate number',
}: {
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    const next = formatPlateInput(raw);
    if (plateForSubmit(next).length > plateForSubmit(value).length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onChangeText(next);
  };

  return (
    <View>
      <View style={[styles.ringWrap, focused && !error && { borderColor: colors.brandTint }]}>
        <View
          style={[
            styles.input,
            !value && !focused && styles.inputEmpty,
            focused && styles.inputFocused,
            !!error && styles.inputError,
            disabled && { opacity: 0.45 },
          ]}
        >
          <View style={styles.inputRow} pointerEvents="none">
            {value
              ? [...value].map((ch, i) => <StampChar key={`${i}-${ch}`} ch={ch} />)
              : !focused && <Text style={[styles.inputText, styles.placeholder]}>ABC 123</Text>}
            {focused && <Caret />}
          </View>
          <TextInput
            style={styles.hiddenInput}
            value={value}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmitEditing}
            editable={!disabled}
            autoFocus={autoFocus}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            caretHidden
            maxLength={11}
            returnKeyType="done"
            accessibilityLabel={accessibilityLabel}
          />
        </View>
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <CircleAlert size={16} color={colors.stop} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

/** One character that lands: up 3, scale 1.08 → 1, brand → text over 180 ms. */
function StampChar({ ch }: { ch: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: motion.stampMs, useNativeDriver: false }).start();
  }, [t]);

  const color = t.interpolate({ inputRange: [0, 1], outputRange: [colors.brand, colors.text] });
  const transform = reduced
    ? []
    : [
        { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-3, 0] }) },
        { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) },
      ];

  return <Animated.Text style={[styles.inputText, { color, transform }]}>{ch === ' ' ? ' ' : ch}</Animated.Text>;
}

function Caret() {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, delay: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);
  return <Animated.View style={[styles.caret, { opacity }]} />;
}

const INPUT_FONT = 34;

// StyleSheet.absoluteFill as a plain object, so it can be spread into a style.
const absoluteFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const useStyles = themedStyles((c) => ({
  compact: {
    height: 28,
    paddingHorizontal: 9,
    borderWidth: 1.5,
    borderColor: c.text,
    borderRadius: radius.plateSm,
    backgroundColor: c.surface,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  compactText: { fontFamily: font.mono, fontSize: 15, letterSpacing: 1.5, color: c.text },

  plate: {
    borderWidth: 2,
    borderColor: c.text,
    backgroundColor: c.surface,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  plateL: { alignSelf: 'stretch' },
  ring: {
    position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
    borderWidth: 1, borderColor: c.lineStrong,
  },
  strip: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: c.brand },
  plateText: { fontFamily: font.mono, color: c.text, textAlign: 'center', paddingRight: 12 },

  // Focus ring: a 4 px brand-tint border around the field, transparent until focused.
  ringWrap: { borderWidth: 4, borderColor: 'transparent', borderRadius: radius.control + 4, margin: -4 },
  input: {
    height: 88,
    borderWidth: 2,
    borderColor: c.text,
    borderRadius: radius.control,
    backgroundColor: c.surface,
    justifyContent: 'center',
  },
  inputEmpty: { borderStyle: 'dashed', borderColor: c.lineStrong },
  inputFocused: { borderColor: c.brand },
  inputError: { borderColor: c.stop },
  inputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  inputText: { fontFamily: font.mono, fontSize: INPUT_FONT, letterSpacing: INPUT_FONT * 0.12, color: c.text },
  placeholder: { color: c.textMuted },
  caret: { width: 2, height: INPUT_FONT + 6, backgroundColor: c.brand, marginLeft: 1 },
  hiddenInput: { ...absoluteFill, opacity: 0, color: 'transparent' },

  errorRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  errorIcon: { marginTop: 1 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500', color: c.stop },
}));
