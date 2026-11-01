'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Load data on mount, with a `reload` for after changes. Keeps showing the
 * previous data while reloading so lists don't flash.
 *
 * `loader` must be stable (defined outside the component), or it reloads every render.
 */
export function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await loader());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    // Initial load; state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}
