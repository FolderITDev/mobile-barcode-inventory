import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { createStyles, motion, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

interface SectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

/** A titled group of rows between two rules: the ruled label, not a card. */
export function Section({ title, footer, children }: SectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      {title && (
        <Text
          variant="eyebrow"
          tone="muted"
          caps
          accessibilityRole="header"
          style={styles.gutter}
        >
          {title}
        </Text>
      )}
      <View style={styles.sectionBody}>{children}</View>
      {footer && (
        <Text variant="footnote" tone="muted" style={styles.gutter}>
          {footer}
        </Text>
      )}
    </View>
  );
}

export function Separator({ inset = 0 }: { inset?: number }) {
  const styles = useStyles();
  return <View style={[styles.separator, { marginLeft: inset }]} />;
}

interface RowProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Shows a chevron when the row opens another screen. */
  navigates?: boolean;
}

/**
 * Full-width list row. Press feedback is a background highlight, the
 * platform convention for rows; scaling a full-bleed row looks broken.
 */
export function Row({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  navigates = false,
}: RowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [pressed, setPressed] = useState(false);
  const content = (
    <Animated.View
      style={[
        styles.row,
        {
          backgroundColor: pressed ? colors.fill : 'transparent',
          transitionProperty: 'backgroundColor',
          transitionDuration: pressed ? 0 : motion.duration.base,
          transitionTimingFunction: motion.css.easeOut,
        },
      ]}
    >
      <View style={styles.rowContent}>{children}</View>
      {navigates && (
        <Icon
          name="chevron"
          size={14}
          color={colors.tertiary}
          weight="semibold"
        />
      )}
    </Animated.View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </Pressable>
  );
}

interface ActionRowProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

/** A settings-style row that performs an action in place. */
export function ActionRow({
  label,
  icon,
  onPress,
  destructive = false,
  disabled = false,
}: ActionRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const color = destructive ? colors.caution : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && { backgroundColor: colors.fill },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Icon name={icon} size={20} color={color} />
      <Text variant="label" tone={destructive ? 'caution' : 'ink'}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = createStyles(({ colors }) => ({
  section: { gap: space.md },
  gutter: { paddingHorizontal: space.gutter },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.rule,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.gutter,
  },
  rowContent: { flex: 1, minWidth: 0 },
  actionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
  },
}));
