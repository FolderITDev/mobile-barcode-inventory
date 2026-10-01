import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * One haptic per user action, fired on the same frame as the visual change.
 * Haptics are never the only feedback: many users disable them and most
 * Android hardware is silent, so every call site also changes the screen.
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function fire(effect: () => Promise<void>) {
  if (enabled) effect().catch(() => undefined);
}

export const haptics = {
  /** A value ticked to a new option: segmented control, toggle. */
  selection: () => fire(Haptics.selectionAsync),
  /** A small physical commit: a stepper, a photo attached. */
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A durable write the user was waiting for succeeded. */
  success: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  /** An action failed and the screen now shows why. */
  error: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};
