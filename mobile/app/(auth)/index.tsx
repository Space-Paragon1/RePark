import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { sendCodeErrorMessage } from '@/lib/authErrors';
import { defaultCountry, toE164, type Country } from '@/lib/phone';
import { openSitePage } from '@/lib/site';
import { font, themedStyles } from '@/lib/theme';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Mark } from '@/components/Mark';
import { PhoneField } from '@/components/PhoneCodeFields';

/** Sign-in, step 1: the phone number. Send code enables at a valid length. */
export default function PhoneScreen() {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<Country>(() => defaultCountry(Intl.DateTimeFormat().resolvedOptions().locale));
  const [national, setNational] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e164 = toE164(country, national);

  const send = async () => {
    if (!e164) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setSending(false);
    if (error) {
      setError(sendCodeErrorMessage(error));
      return;
    }
    router.push({ pathname: '/(auth)/verify', params: { phone: e164, country: country.code } });
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 24 }]} keyboardShouldPersistTaps="handled">
        <Mark size={44} />
        <Text style={s.title} accessibilityRole="header">What's your phone number?</Text>
        <Text style={s.body}>We'll text you a 6-digit code. That's the whole sign-in.</Text>

        <View style={s.field}>
          <PhoneField
            country={country}
            onCountryChange={c => { setCountry(c); setError(null); }}
            value={national}
            onChangeText={value => { setNational(value); setError(null); }}
            autoFocus
            onSubmitEditing={send}
          />
        </View>
        {!!error && <Banner tone="error" message={error} style={s.banner} />}

        <Button label="Send code" size="main" disabled={!e164} loading={sending} loadingLabel="Sending" onPress={send} style={s.button} />
        <Text style={s.terms}>
          By continuing you agree to the{' '}
          <Text style={s.link} onPress={() => openSitePage('/terms')} accessibilityRole="link">Terms</Text>
          {' '}and{' '}
          <Text style={s.link} onPress={() => openSitePage('/privacy')} accessibilityRole="link">Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontFamily: font.heading, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: c.text, marginTop: 20 },
  body: { fontSize: 16, lineHeight: 23, color: c.textSecondary, marginTop: 8 },
  field: { marginTop: 24 },
  banner: { marginTop: 16 },
  button: { marginTop: 16 },
  terms: { fontSize: 13, lineHeight: 19, color: c.textMuted, marginTop: 16 },
  link: { color: c.brand, fontWeight: '600' },
}));
