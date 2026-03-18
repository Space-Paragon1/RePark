import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi } from '@/lib/api';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await accountApi.export();
      await Share.share({
        title: 'My RePark Data',
        message: JSON.stringify(data, null, 2),
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () =>
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data — vehicles, reports, and alerts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await accountApi.delete();
              await signOut();
            } catch (e: any) {
              Alert.alert('Error', e.message);
              setDeleting(false);
            }
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Phone number</Text>
        <Text style={styles.phone}>{session?.user.phone}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          {exporting
            ? <ActivityIndicator color="#2563EB" size="small" />
            : <Text style={styles.exportText}>Export my data</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
          {deleting
            ? <ActivityIndicator color="#EF4444" size="small" />
            : <Text style={styles.deleteText}>Delete account</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 32,
  },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  phone: { fontSize: 17, fontWeight: '600', color: '#111827' },
  actions: { gap: 12 },
  exportBtn: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  exportText: { color: '#2563EB', fontWeight: '600', fontSize: 15 },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#6B7280',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
