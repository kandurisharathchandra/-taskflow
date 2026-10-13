import { useCallback, useEffect, useState } from 'react';

interface ApiState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Runs `fetcher` on mount and whenever it changes (wrap it in useCallback), and on reload().
 * Previous data is kept while a new request is in flight so lists don't flash empty when
 * filters change. Responses from stale requests are ignored.
 */
export function useApi<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: undefined, loading: true });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, error: undefined, loading: true }));

    fetcher().then(
      (data) => {
        if (active) setState({ data, error: undefined, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error : new Error('Something went wrong'),
            loading: false,
          }));
        }
      },
    );

    return () => {
      active = false;
    };
  }, [fetcher, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const setData = useCallback((update: (prev: T | undefined) => T | undefined) => {
    setState((prev) => ({ ...prev, data: update(prev.data) }));
  }, []);

  return { ...state, reload, setData };
}
