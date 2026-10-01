import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  type CSSTransitionProperties,
} from 'react-native-reanimated';
import { createStyles, fonts, motion, radius, space, useTheme } from '@/theme';
import { Text } from './text';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Marked in words next to the label, never by color or asterisk alone. */
  requirement?: 'required' | 'optional';
  hint?: string;
  error?: string | null;
  mono?: boolean;
  ref?: Ref<TextInput>;
}

const borderTransition: CSSTransitionProperties = {
  transitionProperty: ['borderColor'],
  transitionDuration: motion.duration.quick,
  transitionTimingFunction: motion.css.easeOut,
};

export function TextField({
  label,
  requirement,
  hint,
  error,
  mono = false,
  multiline,
  onFocus,
  onBlur,
  editable = true,
  ref,
  ...props
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const description = [
    requirement === 'required' ? 'Required' : null,
    error ?? hint,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text variant="label">{label}</Text>
        {requirement && (
          <Text variant="footnote" tone="muted">
            {requirement === 'required' ? 'Required' : 'Optional'}
          </Text>
        )}
      </View>
      <Animated.View
        style={[
          styles.frame,
          borderTransition,
          {
            borderColor: error
              ? colors.caution
              : focused
                ? colors.ink
                : colors.control,
          },
          !editable && styles.readOnly,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={description || undefined}
          placeholderTextColor={colors.tertiary}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          editable={editable}
          multiline={multiline}
          maxFontSizeMultiplier={2}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            mono && styles.mono,
            multiline && styles.multiline,
          ]}
        />
      </Animated.View>
      {error ? (
        <Text
          variant="footnote"
          tone="caution"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text variant="footnote" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles(({ colors }) => ({
  root: { gap: space.sm },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.md,
  },
  frame: {
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  readOnly: { backgroundColor: colors.fill },
  input: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 22,
  },
  mono: { fontFamily: fonts.mono, letterSpacing: 0.4 },
  multiline: { minHeight: 112, textAlignVertical: 'top', paddingTop: 14 },
}));
