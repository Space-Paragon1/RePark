import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pushTokensApi } from '@/lib/api';
import { markPrimerShown, registerForPushNotifications } from '@/lib/notifications';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { Button } from '@/components/Button';
import { Mark } from '@/components/Mark';

/**
 * Notification primer (screens.md): shown once after the first sign-in, before the system
 * prompt. "Not now" is always there; Profile can turn notifications on later.
 */
export default function PrimerScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [asking, setAsking] = useState(false);

  const close = async () => {
    await markPrimerShown();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const turnOn = async () => {
    setAsking(true);
    try {
      const token = await registerForPushNotifications();
      if (token) await pushTokensApi.register(token).catch(() => {});
    } catch {
      // Permission prompts can fail in Expo Go; the app works without notifications.
    } finally {
      setAsking(false);
      close();
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Stack.Screen options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <ScrollView contentContainerStyle={s.content}>
        {/* A sample of what an alert looks like on the lock screen */}
        <View style={s.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={s.notification}>
            <View style={s.notificationHead}>
              <Mark size={22} color={colors.text} ring={colors.surface} />
              <Text style={s.notificationTitle}>Someone's blocked in by your car.</Text>
            </View>
            <Text style={s.notificationBody}>8KTR 214 is blocking a driveway or access.</Text>
            <View style={s.pills}>
              <Text style={[s.pill, s.pillPrimary]}>Moving now</Text>
              <Text style={s.pill}>Already moved</Text>
            </View>
          </View>
        </View>
        <Text style={s.title} accessibilityRole="header">Hear about your car the moment it matters.</Text>
        <Text style={s.body}>
          If someone's blocked in by one of your cars, we'll let you know straight away, and you can reply from the lock
          screen. We only send notifications about your reports and your cars.
        </Text>
      </ScrollView>
      <View style={s.actions}>
        <Button label="Turn on notifications" size="main" loading={asking} loadingLabel="Turning on" onPress={turnOn} />
        <Button label="Not now" variant="quiet" disabled={asking} onPress={close} />
      </View>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 20 },
  content: { paddingBottom: 24 },
  preview: { backgroundColor: c.field, borderRadius: radius.card, padding: 16 },
  notification: { backgroundColor: c.surface, borderRadius: 14, padding: 14 },
  notificationHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
  notificationBody: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: {
    fontSize: 12, fontWeight: '600', color: c.brand, overflow: 'hidden',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: c.lineStrong,
  },
  pillPrimary: { backgroundColor: c.brand, color: c.onBrand, borderColor: c.brand },
  title: { fontFamily: font.heading, fontSize: 28, lineHeight: 33, letterSpacing: -0.5, color: c.text, marginTop: 28 },
  body: { fontSize: 16, lineHeight: 24, color: c.textSecondary, marginTop: 12 },
  actions: { gap: 8 },
}));
