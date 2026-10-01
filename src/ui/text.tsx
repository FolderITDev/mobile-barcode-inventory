import { Text as NativeText, type TextProps } from 'react-native';
import { type, useTheme, type Palette, type TypeVariant } from '@/theme';

/** Text colors are a subset of the palette, so a tone is also a palette key. */
export type Tone = Extract<
  keyof Palette,
  'ink' | 'muted' | 'tertiary' | 'accent' | 'onAccent' | 'info' | 'caution'
>;

interface Props extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
  /** Uppercase eyebrow treatment; screen readers still get sentence case. */
  caps?: boolean;
  tabular?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'ink',
  align,
  caps = false,
  tabular = false,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();
  const { maxScale, ...font } = type[variant];
  return (
    <NativeText
      maxFontSizeMultiplier={maxScale}
      {...props}
      style={[
        font,
        { color: colors[tone] },
        align && { textAlign: align },
        caps && { textTransform: 'uppercase' },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
