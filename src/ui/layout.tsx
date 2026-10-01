import { useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles, space } from '@/theme';

/** Readable measure on tablets and the web preview. */
export const CONTENT_MAX_WIDTH = 640;

/**
 * Room kept between the caret and the keyboard. The scroll view tracks the
 * caret, not the whole field, so this also reveals the empty lines of a
 * multiline note below its first line instead of leaving them under the keys.
 */
const KEYBOARD_CLEARANCE = space.xxxl * 2;

interface ScrollScreenProps {
  children: ReactNode;
  /** A pinned bottom action bar, usually a `Footer`. */
  footer?: ReactNode;
}

/**
 * Scrollable screen body. Content is full-bleed so ruled rows can run edge to
 * edge; wrap free-standing content in `Block` to sit on the gutter.
 *
 * The keyboard never hides what is being typed: the scroll view follows the
 * caret of the focused field, including a multiline note as it grows. While
 * typing, the footer stays behind the keyboard so the field gets that room;
 * it returns when the keyboard is dismissed.
 */
export function ScrollScreen({ children, footer }: ScrollScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);
  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={KEYBOARD_CLEARANCE}
        // The footer already sits under the keyboard, so only the rest of the
        // keyboard overlaps the scroll view.
        extraKeyboardSpace={-footerHeight}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footer ? space.xl : insets.bottom + space.xxl },
        ]}
      >
        {children}
      </KeyboardAwareScrollView>
      {footer && (
        <View
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
        >
          {footer}
        </View>
      )}
    </View>
  );
}

export function Block({
  children,
  gap = space.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  return <View style={[styles.block, { gap }, style]}>{children}</View>;
}

/** Bottom action bar that clears the home indicator. */
export function Footer({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        {
          // Android's nav-bar inset has no built-in breathing room, unlike the
          // iOS home indicator, so the action would sit flush against it.
          paddingBottom:
            Platform.OS === 'android'
              ? insets.bottom + space.lg
              : Math.max(insets.bottom, space.lg),
        },
      ]}
    >
      <View style={styles.footerInner}>{children}</View>
    </View>
  );
}

const useStyles = createStyles(({ colors }) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingTop: space.lg,
    gap: space.xl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  block: { paddingHorizontal: space.gutter },
  footer: {
    paddingTop: space.md,
    paddingHorizontal: space.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.rule,
    backgroundColor: colors.canvas,
  },
  footerInner: {
    gap: space.sm,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH - space.gutter * 2,
    alignSelf: 'center',
  },
}));
