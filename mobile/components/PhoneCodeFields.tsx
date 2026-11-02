import { useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, CircleAlert, X } from '@/components/icons';
import { COUNTRIES, formatNational, type Country } from '@/lib/phone';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';

/**
 * Phone field (components.md): a country button ("US +1", mono) that opens a searchable
 * sheet, then the number in mono, formatted as typed.
 */
export function PhoneField({ country, onCountryChange, value, onChangeText, autoFocus, onSubmitEditing }: {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChangeText: (value: string) => void;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [picking, setPicking] = useState(false);

  return (
    <View style={[s.ringWrap, focused && { borderColor: colors.brandTint }]}>
      <View style={[s.field, focused && s.fieldFocused]}>
        <Pressable
          style={s.country}
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          accessibilityLabel={`Country: ${country.name}, plus ${country.dial}. Change`}
        >
          <Text style={s.countryText}>{country.code} +{country.dial}</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          style={s.number}
          value={value}
          onChangeText={text => onChangeText(formatNational(text, country.dial))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={country.dial === '1' ? '415 555 0123' : 'Phone number'}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel="Phone number"
        />
      </View>
      <CountrySheet
        visible={picking}
        selected={country}
        onSelect={c => { onCountryChange(c); setPicking(false); }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

function CountrySheet({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q);
  }, [query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={[s.sheet, { paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }]}>
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Country</Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
            <X size={24} color={colors.text} />
          </Pressable>
        </View>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search countries or codes"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search countries"
        />
        <FlatList
          data={results}
          keyExtractor={c => c.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.countryRow, pressed && s.countryRowPressed]}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: item.code === selected.code }}
            >
              <Text style={s.countryName}>{item.name}</Text>
              <Text style={s.countryDial}>+{item.dial}</Text>
              <View style={s.check}>{item.code === selected.code && <Check size={18} color={colors.brand} />}</View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

/**
 * Code field: six boxes, mono 600 26. One real input sits on top, so one-time-code
 * autofill (iOS) and SMS autofill (Android) fill all six. The active box is brand with a ring.
 */
export function CodeField({ value, onChangeText, error, disabled }: {
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const caret = useRef(new Animated.Value(1)).current;

  return (
    <View>
      <View style={s.boxes}>
        {Array.from({ length: 6 }, (_, i) => {
          const active = focused && (i === value.length || (i === 5 && value.length === 6));
          return (
            <View key={i} style={[s.boxWrap, active && !error && { borderColor: colors.brandTint }]}>
              <View style={[s.box, active && s.boxActive, !!error && s.boxError]}>
                {value[i]
                  ? <Text style={s.digit}>{value[i]}</Text>
                  : active && <Animated.View style={[s.caret, { opacity: caret }]} />}
              </View>
            </View>
          );
        })}
        <TextInput
          style={s.codeInput}
          value={value}
          onChangeText={text => onChangeText(text.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          editable={!disabled}
          autoFocus
          caretHidden
          accessibilityLabel="6-digit code"
        />
      </View>
      {!!error && (
        <View style={s.errorRow} accessibilityRole="alert">
          <CircleAlert size={16} color={colors.stop} style={{ marginTop: 1 }} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  ringWrap: { borderWidth: 4, borderColor: 'transparent', borderRadius: radius.control + 4, margin: -4 },
  field: {
    height: 56, flexDirection: 'row', alignItems: 'stretch',
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control, backgroundColor: c.surface,
  },
  fieldFocused: { borderColor: c.brand },
  country: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 14, paddingRight: 10,
    borderRightWidth: 1, borderRightColor: c.line,
  },
  countryText: { fontFamily: font.mono, fontSize: 16, color: c.text },
  number: { flex: 1, paddingHorizontal: 14, fontFamily: font.monoMedium, fontSize: 18, color: c.text },

  sheet: { flex: 1, backgroundColor: c.surface },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  sheetTitle: { fontFamily: font.heading, fontSize: 22, color: c.text },
  search: {
    height: 44, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14,
    borderRadius: radius.control, backgroundColor: c.surfaceSunken, fontSize: 16, color: c.text,
  },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: c.line,
  },
  countryRowPressed: { backgroundColor: c.surfaceSunken },
  countryName: { flex: 1, fontSize: 16, color: c.text },
  countryDial: { fontFamily: font.monoMedium, fontSize: 14, color: c.textSecondary },
  check: { width: 20 },

  boxes: { flexDirection: 'row', gap: 8 },
  boxWrap: { flex: 1, borderWidth: 4, borderColor: 'transparent', borderRadius: radius.control + 4, margin: -4 },
  box: {
    height: 58, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control, backgroundColor: c.surface,
  },
  boxActive: { borderWidth: 2, borderColor: c.brand },
  boxError: { borderColor: c.stop },
  digit: { fontFamily: font.mono, fontSize: 26, color: c.text },
  caret: { width: 2, height: 28, backgroundColor: c.brand },
  codeInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: 'transparent' },
  errorRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '500', color: c.stop },
}));
