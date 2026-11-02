import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi, pushTokensApi, vehiclesApi } from '@/lib/api';
import { markPrimerShown, registerForPushNotifications } from '@/lib/notifications';
import { openSitePage } from '@/lib/site';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import {
  Bell, ChevronRight, Download, FileText, LogOut, Trash2, User, type LucideIcon,
} from '@/components/icons';

type NotificationState = 'on' | 'off' | 'ask';

/** Account (screens.md): phone, notifications, download my data, privacy and terms, sign out, delete. */
export default function ProfileScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationState | null>(null);

  const phone = session?.user.phone ? `+${session.user.phone.replace(/^\+/, '')}` : '';

  const refreshNotifications = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then(({ status, canAskAgain }) => setNotifications(status === 'granted' ? 'on' : canAskAgain ? 'ask' : 'off'))
      .catch(() => setNotifications(null));
  }, []);

  useFocusEffect(useCallback(() => {
    refreshNotifications();
    vehiclesApi.list().then(v => setVehicleCount(v.length)).catch(() => {});
  }, [refreshNotifications]));

  const handleNotifications = async () => {
    if (notifications === 'ask') {
      await markPrimerShown();
      const token = await registerForPushNotifications().catch(() => null);
      if (token) await pushTokensApi.register(token).catch(() => {});
      refreshNotifications();
    } else {
      Linking.openSettings();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await accountApi.export();
      await Share.share({ title: 'My RePark data', message: JSON.stringify(data, null, 2) });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await accountApi.delete();
      await signOut();
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const vehiclesPhrase =
    vehicleCount === null ? 'your vehicles' : vehicleCount === 1 ? 'your 1 vehicle' : `your ${vehicleCount} vehicles`;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}>
        <Text style={s.largeTitle} accessibilityRole="header">{Platform.OS === 'android' ? 'Profile' : 'Account'}</Text>

        <View style={s.group}>
          <Row icon={User} title="Phone number" detail="Used to sign in and for texts" value={phone} mono />
          <Row
            icon={Bell}
            title="Notifications"
            value={notifications === 'on' ? 'On' : notifications === null ? '' : 'Off'}
            onPress={notifications && notifications !== 'on' ? handleNotifications : notifications === 'on' ? () => Linking.openSettings() : undefined}
            divider
          />
          <Row
            icon={Download}
            title="Download my data"
            detail="A copy of your vehicles, reports and alerts."
            onPress={handleExport}
            busy={exporting}
            divider
          />
          <Row icon={FileText} title="Privacy and terms" onPress={() => openSitePage('/privacy')} divider />
        </View>

        <View style={s.group}>
          {/* Sign out is immediate: no confirmation (components.md). */}
          <Row icon={LogOut} title="Sign out" onPress={() => { signOut(); }} />
          <Row
            icon={Trash2}
            title="Delete account"
            tone="stop"
            onPress={() => { setConfirmText(''); setDeleteOpen(true); }}
            divider
          />
        </View>

        <Text style={s.footnote}>RePark doesn't use a name, photo or password. Your phone number is the account.</Text>
      </ScrollView>

      <ConfirmSheet
        visible={deleteOpen}
        icon={Trash2}
        title="Delete your account?"
        body={`This removes your phone number, ${vehiclesPhrase} and your report history. People who report your cars will be told the owner isn't on RePark. This can't be undone.`}
        confirmLabel="Delete account"
        confirmingLabel="Deleting"
        cancelLabel="Keep my account"
        busy={deleting}
        // Case-sensitive, as the design asks.
        confirmDisabled={confirmText !== 'DELETE'}
        onConfirm={deleteAccount}
        onCancel={() => setDeleteOpen(false)}
      >
        <Text style={s.confirmLabel}>Type DELETE to confirm</Text>
        <TextInput
          style={s.confirmInput}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          accessibilityLabel="Type DELETE to confirm"
          placeholderTextColor={colors.textMuted}
        />
      </ConfirmSheet>
    </View>
  );
}

function Row({ icon: Icon, title, detail, value, mono, onPress, busy, tone, divider }: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  value?: string;
  mono?: boolean;
  onPress?: () => void;
  busy?: boolean;
  tone?: 'stop';
  divider?: boolean;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const fg = tone === 'stop' ? colors.stop : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || busy}
      style={({ pressed }) => [s.row, divider && s.divider, pressed && s.pressed]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={[title, value, detail].filter(Boolean).join(', ')}
    >
      <Icon size={20} color={tone === 'stop' ? colors.stop : colors.textSecondary} />
      <View style={s.rowText}>
        <Text style={[s.rowTitle, { color: fg }]}>{title}</Text>
        {!!detail && <Text style={s.rowDetail}>{detail}</Text>}
      </View>
      {!!value && <Text style={[s.rowValue, mono && s.mono]}>{value}</Text>}
      {busy ? <ActivityIndicator size="small" color={colors.brand} /> : onPress && <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  largeTitle: { fontFamily: font.heading, fontSize: 34, lineHeight: 40, letterSpacing: -0.7, color: c.text, marginBottom: 16 },
  group: {
    borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface,
    overflow: 'hidden', marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 16, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: c.line },
  pressed: { backgroundColor: c.surfaceSunken },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowDetail: { fontSize: 13, lineHeight: 18, color: c.textSecondary, marginTop: 2 },
  rowValue: { fontSize: 15, color: c.textSecondary },
  mono: { fontFamily: font.mono, color: c.text },
  footnote: { fontSize: 13, lineHeight: 19, color: c.textMuted, paddingHorizontal: 4 },
  confirmLabel: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 6 },
  confirmInput: {
    height: 48, borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    paddingHorizontal: 14, fontFamily: font.mono, fontSize: 16, color: c.text, backgroundColor: c.surface,
  },
}));
