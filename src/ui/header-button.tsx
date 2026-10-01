import { ActivityIndicator, Pressable } from 'react-native';
import { createStyles, fonts, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  busy?: boolean;
} & (
  | { icon: IconName; label?: never; prominent?: never }
  /** `prominent` marks the confirming action (Create, Done) in accent. */
  | { label: string; icon?: never; prominent?: boolean }
);

/**
 * Native-header action. Icon buttons carry an explicit accessible name;
 * text buttons (Cancel, Create) follow the platform convention for modals.
 */
export function HeaderButton({
  onPress,
  accessibilityLabel,
  disabled = false,
  busy = false,
  icon,
  label,
  prominent = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.base,
        { opacity: pressed ? 0.5 : inactive && !busy ? 0.4 : 1 },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : icon ? (
        <Icon name={icon} size={22} color={colors.ink} weight="medium" />
      ) : (
        <Text
          variant="label"
          tone={prominent ? 'accent' : 'ink'}
          style={prominent && styles.prominent}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const useStyles = createStyles(() => ({
  base: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  prominent: { fontFamily: fonts.semibold },
}));
