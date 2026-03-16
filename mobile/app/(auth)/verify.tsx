import { useState, useRef } from 'react';
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
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification failed', error.message);
      return;
    }

    // Auth state change in AuthContext will redirect to (tabs)
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setResending(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Code sent', 'A new verification code has been sent.');
      setOtp('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resend} onPress={handleResend} disabled={resending}>
          {resending ? (
            <ActivityIndicator color="#2563EB" size="small" />
          ) : (
            <Text style={styles.resendText}>Resend code</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  back: {
    position: 'absolute',
    top: 60,
    left: 28,
  },
  backText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 36,
  },
  phone: {
    color: '#111827',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 10,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resend: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
});
