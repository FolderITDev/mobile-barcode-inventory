import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Barcode Inventory design tokens: the precision instrument. Dark is the primary
 * identity; light is a full alternative. All colors are documented in DESIGN.md;
 * the extra roles were contrast-checked (control borders ≥ 3:1 on surface,
 * tertiary text ≥ 4:1 on canvas). Every status color is paired with a word
 * and a signed quantity.
 */
const dark = {
  canvas: '#0F1722',
  surface: '#1A2632',
  /** Elevated control on a `fill` track, such as a segmented thumb. */
  raised: '#2E3F4E',
  fill: '#1F2D3A',
  ink: '#EAF2F3',
  muted: '#A9BDC2',
  tertiary: '#7F939B',
  accent: '#D4F45B',
  accentSubtle: '#28331A',
  onAccent: '#0F1722',
  /** Matched lines and scan guidance. */
  info: '#67D6D6',
  infoSubtle: '#163236',
  /** Short, over and unexpected lines. */
  caution: '#F2B35A',
  cautionSubtle: '#33281A',
  rule: '#34444F',
  control: '#667B87',
  imageOutline: 'rgba(255, 255, 255, 0.1)',
};

export type Palette = typeof dark;

const light: Palette = {
  canvas: '#F2F7F6',
  surface: '#FFFFFF',
  raised: '#FFFFFF',
  fill: '#E3ECEB',
  ink: '#10232B',
  muted: '#50626A',
  tertiary: '#687A82',
  accent: '#155E64',
  accentSubtle: '#DCEBEA',
  onAccent: '#FFFFFF',
  info: '#0E6B6B',
  infoSubtle: '#DCF0EF',
  caution: '#8A4B00',
  cautionSubtle: '#FBEBD6',
  rule: '#C7D8D9',
  control: '#7C9096',
  imageOutline: 'rgba(0, 0, 0, 0.1)',
};

export const palettes = { light, dark } as const;

export const fonts = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  condensed: 'BarlowCondensed_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
} as const;

/** Dense but not cramped: 4-point grid, 16–20 pt gutters. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  gutter: 18,
} as const;

/** Narrow 6–8 pt corners. */
export const radius = {
  sm: 4,
  md: 8,
  lg: 10,
  pill: 999,
} as const;

/**
 * Barlow Condensed carries the instrument numerals, IBM Plex Mono the codes,
 * Barlow everything a person reads or acts on. Numbers are always tabular.
 */
export const type = {
  meter: {
    fontFamily: fonts.condensed,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -0.5,
    maxScale: 1.3,
  },
  display: {
    fontFamily: fonts.condensed,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.2,
    maxScale: 1.4,
  },
  title: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0,
    maxScale: 1.6,
  },
  number: {
    fontFamily: fonts.condensed,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0,
    maxScale: 1.5,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    maxScale: 2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
    maxScale: 2,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
    maxScale: 1.6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    maxScale: 2,
  },
  subhead: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    maxScale: 2,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    maxScale: 2,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    maxScale: 1.8,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    maxScale: 2,
  },
} as const;

export type TypeVariant = keyof typeof type;

/**
 * Motion vocabulary. Counters never animate: the value must always be the
 * value. Only state changes move, and UI motion stays under 300 ms.
 */
export const motion = {
  duration: { press: 120, quick: 160, base: 220, enter: 260 },
  /** For Reanimated CSS transitions (`transitionTimingFunction`). */
  css: {
    easeOut: cubicBezier(0.23, 1, 0.32, 1),
    easeInOut: cubicBezier(0.77, 0, 0.175, 1),
  },
  /** For layout animations and `withTiming`. */
  easing: {
    easeOut: Easing.bezier(0.23, 1, 0.32, 1),
    easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  },
  pressScale: 0.97,
} as const;

/** Minimum comfortable touch target (iOS 44 pt, Android 48 dp). */
export const hitTarget = 48;
