import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi } from '@/lib/api';
import { colors, shadow, radius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const phone = session?.user.phone ?? '';
  const initials = phone.slice(-2).toUpperCase() || 'ME';

  const handleSignOut = () =>
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await accountApi.export();
      await Share.share({ title: 'My RePark Data', message: JSON.stringify(data, null, 2) });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () =>
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, vehicles, reports, and alerts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try { await accountApi.delete(); await signOut(); }
            catch (e: any) { Alert.alert('Error', e.message); setDeleting(false); }
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroPhone}>{phone}</Text>
        <Text style={styles.heroLabel}>Your account</Text>
        <PressableScale style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </PressableScale>
      </View>

      {/* Actions */}
      <FadeInView delay={100}>
        <View style={styles.section}>
          <MenuItem
            icon="📤"
            label="Export my data"
            sublabel="Download everything RePark holds about you"
            onPress={handleExport}
            loading={exporting}
            color={colors.primary}
          />
        </View>
      </FadeInView>

      <FadeInView delay={160}>
        <View style={styles.section}>
          <MenuItem
            icon="🚪"
            label="Sign out"
            sublabel="You can sign back in anytime"
            onPress={handleSignOut}
            color={colors.textSecondary}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="🗑️"
            label="Delete account"
            sublabel="Permanently remove all your data"
            onPress={handleDelete}
            loading={deleting}
            color={colors.danger}
          />
        </View>
      </FadeInView>

      <Text style={styles.footer}>RePark · Privacy first</Text>
    </View>
  );
}

function MenuItem({
  icon, label, sublabel, onPress, loading, color,
}: {
  icon: string; label: string; sublabel: string;
  onPress: () => void; loading?: boolean; color: string;
}) {
  return (
    <PressableScale style={styles.menuItem} onPress={onPress} disabled={loading}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <Text style={styles.menuSub}>{sublabel}</Text>
      </View>
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <Text style={[styles.menuChevron, { color: `${color}80` }]}>›</Text>}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  hero: {
    backgroundColor: colors.primary,
    paddingTop: 72,
    paddingBottom: 36,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroPhone: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 62 },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIconText: { fontSize: 18 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  menuSub: { fontSize: 12, color: colors.textMuted },
  menuChevron: { fontSize: 22, marginLeft: 8 },

  signOutBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  signOutBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 32,
  },
});
