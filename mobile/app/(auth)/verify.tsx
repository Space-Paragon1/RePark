import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';

export default function VerifyScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code sent to your phone.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) Alert.alert('Verification failed', error.message);
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setResending(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Code sent', 'A new verification code has been sent.'); setOtp(''); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>💬</Text>
        </View>
        <Text style={styles.heroTitle}>Check your messages</Text>
        <Text style={styles.heroSub}>Code sent to {phone}</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Change number</Text>
        </TouchableOpacity>

        <Text style={styles.cardTitle}>Enter the 6-digit code</Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          textAlign="center"
        />

        <PressableScale
          style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
        >
          {loading
            ? <ActivityIndicator color={colors.onBrand} />
            : <Text style={styles.buttonText}>Verify & Sign In</Text>}
        </PressableScale>

        <PressableScale style={styles.resend} onPress={handleResend} disabled={resending}>
          {resending
            ? <ActivityIndicator color={colors.brand} size="small" />
            : <Text style={styles.resendText}>Didn't receive it? Resend code</Text>}
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = themedStyles((c, sh) => ({
  root: { flex: 1, backgroundColor: c.field },

  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  heroTitle: { fontSize: 22, fontFamily: font.headingBold, color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  card: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: 28,
    paddingBottom: 48,
    ...sh.e2,
  },
  back: { marginBottom: 20 },
  backText: { fontSize: 14, color: c.brand, fontWeight: '500' },
  cardTitle: { fontSize: 20, fontFamily: font.headingBold, color: c.text, marginBottom: 20 },

  otpInput: {
    borderWidth: 2,
    borderColor: c.brand,
    borderRadius: radius.control,
    paddingVertical: 18,
    fontSize: 32,
    fontFamily: font.mono,
    letterSpacing: 12,
    color: c.text,
    backgroundColor: c.brandTint,
    marginBottom: 24,
  },

  button: {
    backgroundColor: c.brand,
    borderRadius: radius.control,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },

  resend: { alignItems: 'center', paddingVertical: 10 },
  resendText: { color: c.brand, fontSize: 14, fontWeight: '500' },
}));
