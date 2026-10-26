/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  light: {
    text: '#172b25',
    background: '#f4f7f5',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e4f1e9',
    textSecondary: '#52655c',
    primary: '#176044',
    onPrimary: '#ffffff',
    border: '#d4dfd8',
    danger: '#a12635',
    dangerBackground: '#fcecef',
    success: '#176044',
    successBackground: '#e4f1e9',
  },
  dark: {
    text: '#eef5f0',
    background: '#111c17',
    backgroundElement: '#1b2a22',
    backgroundSelected: '#294637',
    textSecondary: '#b1c5b8',
    primary: '#85d3aa',
    onPrimary: '#10291c',
    border: '#3c5345',
    danger: '#ffb1bb',
    dangerBackground: '#40242c',
    success: '#85d3aa',
    successBackground: '#243d2e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Visual = StyleSheet.create({
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: 16, gap: 16 },
  card: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 8 },
  input: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderRadius: 8, fontSize: 16 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  message: { padding: 12, borderRadius: 8, fontSize: 15, lineHeight: 22 },
});
