import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingAlertCount } from '@/lib/alertCount';
import { useTheme } from '@/lib/theme';

const android = Platform.OS === 'android';

/**
 * Native tabs (components.md, Navigation).
 * iOS: the system tab bar (Liquid Glass) with five tabs and SF Symbols.
 * Android: a Material 3 nav bar with four; Report becomes the floating button (ReportFab).
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const { session, loading } = useAuth();
  const pending = usePendingAlertCount(!!session);

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)" />;

  return (
    <NativeTabs
      tintColor={colors.brand}
      iconColor={colors.textMuted}
      // Android M3: surface bar with a brand-tint pill on the active item.
      backgroundColor={android ? colors.surface : undefined}
      indicatorColor={colors.brandTint}
      // iOS keeps the system badge (its text colour can't be set); Android uses signal with ink.
      badgeBackgroundColor={android ? colors.signal : undefined}
      badgeTextColor={android ? colors.onSignal : undefined}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="report" hidden={android}>
        <NativeTabs.Trigger.Icon sf="paperplane" md="send" />
        <NativeTabs.Trigger.Label>Report</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vehicles">
        <NativeTabs.Trigger.Icon sf="car" md="directions_car" />
        <NativeTabs.Trigger.Label>Vehicles</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <NativeTabs.Trigger.Icon sf="bell" md="notifications" />
        <NativeTabs.Trigger.Label>Alerts</NativeTabs.Trigger.Label>
        {pending > 0 && <NativeTabs.Trigger.Badge>{pending > 9 ? '9+' : String(pending)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
        <NativeTabs.Trigger.Label>{android ? 'Profile' : 'Account'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
