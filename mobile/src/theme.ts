import { useColorScheme } from 'react-native';

// The same look as the web app: a violet-to-fuchsia brand gradient, soft rounded cards, light and dark.
export const BRAND = ['#6366f1', '#8b5cf6', '#d946ef'] as const;

const light = {
  bg: '#f6f5ff',
  card: '#ffffff',
  cardBorder: 'rgba(15, 23, 42, 0.07)',
  border: '#e2e8f0',
  text: '#0f172a',
  text2: '#475569',
  muted: '#94a3b8',
  onBrand: '#ffffff',
  primary: '#7c3aed',
  primarySoft: '#ede9fe',
  primaryText: '#6d28d9',
  success: '#059669',
  successSoft: '#d1fae5',
  successText: '#047857',
  danger: '#e11d48',
  dangerSoft: '#ffe4e6',
  dangerText: '#be123c',
  warn: '#d97706',
  warnSoft: '#fef3c7',
  warnText: '#b45309',
  info: '#0284c7',
  infoSoft: '#e0f2fe',
  infoText: '#0369a1',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  chipBg: '#f1f5f9',
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: '#6366f1',
};

const dark: typeof light = {
  bg: '#090917',
  card: '#12132b',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#f1f5f9',
  text2: '#cbd5e1',
  muted: '#7c8aa0',
  onBrand: '#ffffff',
  primary: '#a78bfa',
  primarySoft: 'rgba(139, 92, 246, 0.2)',
  primaryText: '#c4b5fd',
  success: '#34d399',
  successSoft: 'rgba(16, 185, 129, 0.16)',
  successText: '#6ee7b7',
  danger: '#fb7185',
  dangerSoft: 'rgba(244, 63, 94, 0.16)',
  dangerText: '#fda4af',
  warn: '#fbbf24',
  warnSoft: 'rgba(245, 158, 11, 0.16)',
  warnText: '#fcd34d',
  info: '#38bdf8',
  infoSoft: 'rgba(14, 165, 233, 0.16)',
  infoText: '#7dd3fc',
  inputBg: '#0b0c1f',
  inputBorder: 'rgba(255, 255, 255, 0.16)',
  chipBg: 'rgba(255, 255, 255, 0.07)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export type Colors = typeof light;
export type ColorName = keyof Colors;

export type Theme = { dark: boolean; colors: Colors };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? { dark: true, colors: dark } : { dark: false, colors: light };
}

// Plus Jakarta Sans has one font file per weight: React Native cannot pick a weight from one family.
export const FONT = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
} as const;
export type Weight = keyof typeof FONT;

// True italic faces, for the two weights that are ever italic. iOS does not slant a custom font that has no italic face
// (the text would silently stay upright), so AppText switches to these when a style asks for fontStyle: 'italic'.
export const FONT_ITALIC: Partial<Record<Weight, string>> = {
  '500': 'PlusJakartaSans_500Medium_Italic',
  '700': 'PlusJakartaSans_700Bold_Italic',
};

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

// How each level is coloured (same as the web app).
export const LEVEL_STYLE: Record<string, { name: string; gradient: readonly [string, string] }> = {
  A1: { name: 'Beginner', gradient: ['#94a3b8', '#0ea5e9'] },
  A2: { name: 'Elementary', gradient: ['#38bdf8', '#06b6d4'] },
  B1: { name: 'Intermediate', gradient: ['#34d399', '#14b8a6'] },
  B2: { name: 'Upper-intermediate', gradient: ['#6366f1', '#8b5cf6'] },
  C1: { name: 'Advanced', gradient: ['#8b5cf6', '#d946ef'] },
  C2: { name: 'Proficient', gradient: ['#d946ef', '#f43f5e'] },
};

// Colours for charts: the validated data-viz palette (series 1 blue and 2 orange, checked in both modes for
// colour-blind separation and contrast). Text never wears a series colour.
const vizLight = { surface: '#fcfcfb', text: '#0b0b0b', text2: '#52514e', muted: '#898781', grid: '#e1e0d9', axis: '#c3c2b7', border: 'rgba(11, 11, 11, 0.1)', s1: '#2a78d6', s2: '#eb6834', good: '#006300' };
const vizDark: typeof vizLight = { surface: '#1a1a19', text: '#f0efec', text2: '#c3c2b7', muted: '#898781', grid: '#2c2c2a', axis: '#383835', border: 'rgba(255, 255, 255, 0.1)', s1: '#3987e5', s2: '#d95926', good: '#0ca30c' };
export type Viz = typeof vizLight;

export function useViz(): Viz {
  return useColorScheme() === 'dark' ? vizDark : vizLight;
}
