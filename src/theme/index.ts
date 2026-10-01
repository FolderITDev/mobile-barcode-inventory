import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { palettes, type Palette } from './tokens';

export * from './tokens';

export type Scheme = 'light' | 'dark';

export interface Theme {
  scheme: Scheme;
  colors: Palette;
}

const themes: Record<Scheme, Theme> = {
  light: { scheme: 'light', colors: palettes.light },
  dark: { scheme: 'dark', colors: palettes.dark },
};

const SchemeOverride = createContext<Scheme | null>(null);

/**
 * Pins a subtree to one scheme. The scanner uses it: a camera feed is dark
 * whatever the system setting, so its controls must be too.
 */
export function ThemeScope({
  scheme,
  children,
}: {
  scheme: Scheme;
  children: ReactNode;
}) {
  return createElement(SchemeOverride.Provider, { value: scheme }, children);
}

export function useTheme(): Theme {
  const override = useContext(SchemeOverride);
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return themes[override ?? system];
}

/**
 * Declares themed styles once at module scope. Each scheme's sheet is created
 * lazily and cached, so components never rebuild style objects on render.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): () => T {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles() {
    const theme = useTheme();
    return (cache[theme.scheme] ??= StyleSheet.create(factory(theme)));
  };
}
