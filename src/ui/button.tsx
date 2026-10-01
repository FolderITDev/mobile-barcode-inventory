import { ActivityIndicator, View } from 'react-native';
import { createStyles, radius, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text, type Tone } from './text';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * The single button shape for the app. Busy keeps the label in place and
 * swaps the icon for a spinner, so the layout never jumps mid-save.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  disabled = false,
  compact = false,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const inactive = disabled || busy;
  const tone: Tone =
    variant === 'primary'
      ? disabled
        ? 'tertiary'
        : 'onAccent'
      : variant === 'destructive'
        ? 'caution'
        : 'ink';
  const color = colors[tone];
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      style={[
        styles.base,
        compact && styles.compact,
        styles[variant],
        variant === 'primary' && disabled && styles.primaryDisabled,
        variant !== 'primary' && disabled && styles.faded,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : icon ? (
        <Icon name={icon} size={18} color={color} weight="semibold" />
      ) : null}
      <View style={styles.label}>
        <Text variant="button" tone={tone} numberOfLines={2} align="center">
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles(({ colors }) => ({
  base: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  label: { flexShrink: 1 },
  primary: { backgroundColor: colors.accent },
  primaryDisabled: { backgroundColor: colors.fill },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  plain: { backgroundColor: 'transparent', paddingHorizontal: space.sm },
  destructive: { backgroundColor: 'transparent', paddingHorizontal: space.sm },
  faded: { opacity: 0.45 },
}));
