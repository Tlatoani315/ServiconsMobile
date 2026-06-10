import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/** Refresca datos cada N ms mientras la pantalla esta visible */
export function useAutoRefresh(load: () => void | Promise<void>, intervalMs = 15_000) {
  const loadRef = useRef(load);
  loadRef.current = load;

  const safeLoad = useCallback(async () => {
    try {
      await loadRef.current();
    } catch (e) {
      console.warn('[useAutoRefresh] load failed', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void safeLoad();
      const id = setInterval(() => {
        void safeLoad();
      }, intervalMs);
      return () => clearInterval(id);
    }, [intervalMs, safeLoad]),
  );
}
