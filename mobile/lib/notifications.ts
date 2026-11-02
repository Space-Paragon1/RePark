import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Show alerts even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Returns the Expo push token, or null without permission. With `ask` (the default) it asks
 * for permission first; without, it only proceeds if permission was already given.
 */
export async function registerForPushNotifications({ ask = true }: { ask?: boolean } = {}): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted' && ask) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return tokenData.data;
}

/** Notification category for owner alerts; the backend sends it as `categoryId`. */
export const ALERT_CATEGORY = 'alert';

/**
 * Lock-screen actions on owner alerts: Moving now and Already moved.
 * Incorrect report is deliberately not offered from a notification (copy.md).
 */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(ALERT_CATEGORY, [
    { identifier: 'moving_now', buttonTitle: 'Moving now', options: { opensAppToForeground: true } },
    { identifier: 'already_moved', buttonTitle: 'Already moved', options: { opensAppToForeground: true } },
  ]);
}

const PRIMER_SHOWN_KEY = 'repark.notificationPrimerShown';

/** True if the notification primer should show: permission never asked, primer not seen. */
export async function shouldShowPrimer(): Promise<boolean> {
  try {
    const [{ status, canAskAgain }, shown] = await Promise.all([
      Notifications.getPermissionsAsync(),
      AsyncStorage.getItem(PRIMER_SHOWN_KEY),
    ]);
    return status === 'undetermined' && canAskAgain && !shown;
  } catch {
    return false;
  }
}

export async function markPrimerShown(): Promise<void> {
  await AsyncStorage.setItem(PRIMER_SHOWN_KEY, '1').catch(() => {});
}
