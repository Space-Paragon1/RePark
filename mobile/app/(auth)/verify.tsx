import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, shadow, radius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';

export default function VerifyScreen() {
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
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Verify & Sign In →</Text>}
        </PressableScale>

        <PressableScale style={styles.resend} onPress={handleResend} disabled={resending}>
          {resending
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={styles.resendText}>Didn't receive it? Resend code</Text>}
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },

  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    ...shadow.md,
  },
  back: { marginBottom: 20 },
  backText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },

  otpInput: {
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    color: colors.text,
    backgroundColor: colors.primaryLight,
    marginBottom: 24,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...shadow.sm,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resend: { alignItems: 'center', paddingVertical: 10 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
