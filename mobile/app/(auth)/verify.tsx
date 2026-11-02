import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { sendCodeErrorMessage, verifyCodeErrorMessage } from '@/lib/authErrors';
import { COUNTRIES, maskPhone } from '@/lib/phone';
import { font, themedStyles, useTheme } from '@/lib/theme';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CodeField } from '@/components/PhoneCodeFields';
import { BackIcon } from '@/components/icons';

// Supabase allows one code per number every 60 seconds.
const RESEND_WAIT_SECONDS = 60;

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Sign-in, step 2: the 6-digit code. Autofill or paste fills all six and submits. */
export default function VerifyScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, country } = useLocalSearchParams<{ phone: string; country?: string }>();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const verify = async (token: string) => {
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    setVerifying(false);
    if (error) setError(verifyCodeErrorMessage(error));
    // On success the auth layout moves on to the app.
  };

  const changeCode = (value: string) => {
    setCode(value);
    setError(null);
    if (value.length === 6 && !verifying) verify(value);
  };

  const resend = async () => {
    setNotice(null);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(sendCodeErrorMessage(error));
      return;
    }
    setCode('');
    setResendIn(RESEND_WAIT_SECONDS);
    setNotice('We sent a new code.');
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={s.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to phone number">
          <BackIcon size={20} color={colors.brand} />
          <Text style={s.backText}>Phone</Text>
        </Pressable>
        <Text style={s.title} accessibilityRole="header">Enter the code</Text>
        <Text style={s.body}>Sent to {maskPhone(phone ?? '', COUNTRIES.find(c => c.code === country))}.</Text>

        <View style={s.field}>
          <CodeField value={code} onChangeText={changeCode} error={error} disabled={verifying} />
        </View>
        {!!notice && <Banner tone="notice" message={notice} style={s.banner} />}
        {verifying && <Button label="Signing in" loading loadingLabel="Signing in" size="main" style={s.banner} />}

        <View style={s.links}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
            <Text style={s.link}>Wrong number?</Text>
          </Pressable>
          {resendIn > 0 ? (
            <Text style={s.countdown}>Resend in {formatCountdown(resendIn)}</Text>
          ) : (
            <Pressable onPress={resend} hitSlop={8} accessibilityRole="button">
              <Text style={s.link}>Resend code</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginLeft: -4 },
  backText: { fontSize: 16, fontWeight: '600', color: c.brand },
  title: { fontFamily: font.heading, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: c.text, marginTop: 16 },
  body: { fontSize: 16, lineHeight: 23, color: c.textSecondary, marginTop: 8 },
  field: { marginTop: 24 },
  banner: { marginTop: 16 },
  links: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  link: { fontSize: 15, fontWeight: '600', color: c.brand },
  countdown: { fontFamily: font.monoMedium, fontSize: 13, color: c.textMuted },
}));
