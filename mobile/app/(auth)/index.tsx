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
import { colors, shadow, radius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';

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
    if (error) { Alert.alert('Error', error.message); return; }
    router.push({ pathname: '/(auth)/verify', params: { phone: trimmed } });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>P</Text>
        </View>
        <Text style={styles.logoText}>RePark</Text>
        <Text style={styles.tagline}>Move vehicles. Protect privacy.</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <Text style={styles.cardSub}>We'll send a one-time code to your phone.</Text>

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 234 567 8900"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          autoFocus
          autoCorrect={false}
        />
        <Text style={styles.hint}>Include your country code — e.g. +44 or +1</Text>

        <PressableScale
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Send Code</Text>}
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
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoMarkText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  logoText: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 },

  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    ...shadow.md,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },

  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: 24 },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
