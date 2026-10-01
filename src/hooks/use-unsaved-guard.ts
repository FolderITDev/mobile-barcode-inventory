import { useCallback, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';

/**
 * Asks before discarding unsaved input (back gesture, swipe-down, Cancel).
 * Call the returned `allowLeave` right before navigating away after a
 * successful save, so the guard does not interrupt its own success path.
 * SDK 57 uses the bundled React Navigation API; the SDK 58 hook differs.
 */
export function useUnsavedGuard(unsaved: boolean, message: string) {
  const navigation = useNavigation();
  const bypass = useRef(false);
  usePreventRemove(unsaved, ({ data }) => {
    if (bypass.current) {
      navigation.dispatch(data.action);
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`Discard changes?\n\n${message}`))
        navigation.dispatch(data.action);
      return;
    }
    Alert.alert('Discard changes?', message, [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !unsaved) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [unsaved]);
  return useCallback(() => {
    bypass.current = true;
  }, []);
}
