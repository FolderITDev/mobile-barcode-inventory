import { useCallback, useRef, useState } from 'react';
import { haptics } from '../lib/haptics';
import { message } from '../domain/validation';

/**
 * Runs one async user action at a time. A ref lock (not state) blocks a
 * second tap that lands before React re-renders. Failures become a message
 * for the screen and an error haptic; the caller's form state is untouched.
 */
export function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError(message(e));
      haptics.error();
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, []);
  const clearError = useCallback(() => setError(null), []);
  return { run, busy, error, clearError };
}
