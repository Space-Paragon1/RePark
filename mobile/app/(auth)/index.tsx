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
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    const trimmed = phone.trim();
    if (!trimmed || !trimmed.startsWith('+')) {
      Alert.alert('Invalid number', 'Enter your phone number in international format, e.g. +1234567890');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: trimmed });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.push({ pathname: '/(auth)/verify', params: { phone: trimmed } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>RePark</Text>
        <Text style={styles.tagline}>Move vehicles. Protect privacy.</Text>

        <Text style={styles.label}>Enter your phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 234 567 8900"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          autoFocus
          autoCorrect={false}
        />
        <Text style={styles.hint}>Include your country code, e.g. +44 or +1</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Code</Text>
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
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 48,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
