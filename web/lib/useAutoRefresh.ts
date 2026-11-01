'use client';

import { useEffect, useRef } from 'react';

/**
 * Keep a list fresh without Realtime: reload when the person comes back to the
 * tab, and every `everyMs` while `polling` is true and the tab is visible.
 *
 * `reload` should be stable, such as the one from `useLoad`.
 */
export function useAutoRefresh(reload: () => void, { polling, everyMs }: { polling: boolean; everyMs: number }) {
  const lastRun = useRef(0);

  useEffect(() => {
    // Switching back to the tab fires both events; reload once.
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastRun.current < 2000) return;
      lastRun.current = Date.now();
      reload();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = polling ? setInterval(refresh, everyMs) : undefined;
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      clearInterval(timer);
    };
  }, [reload, polling, everyMs]);
}
