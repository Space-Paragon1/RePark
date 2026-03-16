import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  const handleSignOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.phone}>{session?.user.phone}</Text>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  phone: { fontSize: 15, color: '#6B7280', marginBottom: 32 },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  signOutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
