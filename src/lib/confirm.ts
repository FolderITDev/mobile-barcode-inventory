import { Alert, Platform } from 'react-native';

interface DestructiveRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
}

/**
 * Asks before an irreversible action using the platform dialog.
 * Resolves `true` only when the person picks the destructive option.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
}: DestructiveRequest): Promise<boolean> {
  if (Platform.OS === 'web')
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
