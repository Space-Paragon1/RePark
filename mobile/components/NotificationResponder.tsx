import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi } from '@/lib/api';
import { REPLY_SENT } from '@/lib/labels';
import { registerNotificationCategories, shouldShowPrimer } from '@/lib/notifications';
import { useToast } from '@/components/Toast';
import { notifyAlertsChanged } from '@/lib/alertCount';

type PushData = { type?: string; alert_id?: string; report_id?: string };

/**
 * Acts on notification taps. Moving now / Already moved on an owner alert send the
 * reply straight away; tapping the alert itself opens it. Renders nothing.
 */
export function NotificationResponder() {
  const router = useRouter();
  const toast = useToast();
  const { session, loading } = useAuth();
  const handled = useRef(new Set<string>());
  // Signed in at the last check; null until auth has loaded.
  const wasSignedIn = useRef<boolean | null>(null);

  useEffect(() => {
    registerNotificationCategories().catch(() => {});
  }, []);

  // The notification primer comes right after signing in, never on launch.
  useEffect(() => {
    if (loading) return;
    const signedIn = !!session;
    if (wasSignedIn.current === false && signedIn) {
      shouldShowPrimer().then(show => { if (show) router.push('/primer'); });
    }
    wasSignedIn.current = signedIn;
  }, [loading, session, router]);

  useEffect(() => {
    if (!session) return;

    const handle = async (response: Notifications.NotificationResponse) => {
      // The same response can arrive from the listener and from "last response" on launch.
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);

      const data = (response.notification.request.content.data ?? {}) as PushData;
      if (data.type === 'alert' && data.alert_id) {
        const action = response.actionIdentifier;
        if (action === 'moving_now' || action === 'already_moved') {
          try {
            await alertsApi.respond(data.alert_id, action);
            toast(REPLY_SENT);
            notifyAlertsChanged();
          } catch {
            router.push(`/alert/${data.alert_id}`); // let them retry from the alert
          }
        } else {
          router.push(`/alert/${data.alert_id}`);
        }
      } else if (data.type === 'report_update') {
        router.push('/(tabs)/report');
      }
    };

    // Opened the app from a notification while it wasn't running.
    Notifications.getLastNotificationResponseAsync().then(r => r && handle(r)).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(r => { handle(r); });
    return () => sub.remove();
  }, [session, router, toast]);

  return null;
}
