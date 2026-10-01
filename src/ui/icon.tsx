import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { useTheme } from '@/theme';

type SymbolName = Extract<SymbolViewProps['name'], { ios?: unknown }>;

/**
 * One semantic name per meaning, mapped to SF Symbols on iOS and
 * Material Symbols on Android and web. Screens never reference raw glyphs.
 */
const glyphs = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  subtract: { ios: 'minus', android: 'remove', web: 'remove' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  chevron: {
    ios: 'chevron.right',
    android: 'chevron_right',
    web: 'chevron_right',
  },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  scan: {
    ios: 'barcode.viewfinder',
    android: 'barcode_scanner',
    web: 'barcode_scanner',
  },
  keyboard: { ios: 'keyboard', android: 'keyboard', web: 'keyboard' },
  torchOn: {
    ios: 'flashlight.on.fill',
    android: 'flashlight_on',
    web: 'flashlight_on',
  },
  torchOff: {
    ios: 'flashlight.off.fill',
    android: 'flashlight_off',
    web: 'flashlight_off',
  },
  matched: {
    ios: 'checkmark.circle.fill',
    android: 'check_circle',
    web: 'check_circle',
  },
  short: {
    ios: 'arrow.down.circle',
    android: 'arrow_circle_down',
    web: 'arrow_circle_down',
  },
  over: {
    ios: 'arrow.up.circle',
    android: 'arrow_circle_up',
    web: 'arrow_circle_up',
  },
  unexpected: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  uncounted: {
    ios: 'circle.dashed',
    android: 'radio_button_unchecked',
    web: 'radio_button_unchecked',
  },
  count: {
    ios: 'list.number',
    android: 'format_list_numbered',
    web: 'format_list_numbered',
  },
  closed: { ios: 'lock', android: 'lock', web: 'lock' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  alert: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  device: { ios: 'iphone', android: 'phone_iphone', web: 'phone_iphone' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof glyphs;

interface Props {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: 'regular' | 'medium' | 'semibold';
}

export function Icon({ name, size = 20, color, weight = 'regular' }: Props) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={glyphs[name]}
      size={size}
      tintColor={color ?? colors.ink}
      weight={weight}
      accessible={false}
      importantForAccessibility="no"
      style={{ width: size, height: size }}
    />
  );
}
