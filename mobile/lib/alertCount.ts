import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { alertsApi } from './api';
import { supabase } from './supabase';

const listeners = new Set<() => void>();

/** Call after replying to an alert, so the tab badge updates straight away. */
export function notifyAlertsChanged() {
  listeners.forEach(listener => listener());
}

/** Alerts waiting on a reply, for the Alerts tab badge. */
export function usePendingAlertCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    alertsApi.list()
      .then(alerts => setCount(alerts.filter(a => !a.owner_response).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    listeners.add(load);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') load(); });
    const channel = supabase
      .channel('alert-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, load)
      .subscribe();
    return () => {
      listeners.delete(load);
      appState.remove();
      supabase.removeChannel(channel);
    };
  }, [enabled, load]);

  return count;
}
