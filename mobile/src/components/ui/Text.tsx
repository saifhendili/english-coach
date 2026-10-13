import { StyleSheet, Text, type TextProps } from 'react-native';
import { FONT, FONT_ITALIC, useTheme, type ColorName, type Weight } from '@/theme';

const VARIANTS = {
  display: { fontSize: 34, lineHeight: 40, weight: '800' },
  title: { fontSize: 26, lineHeight: 32, weight: '800' },
  heading: { fontSize: 20, lineHeight: 26, weight: '700' },
  subhead: { fontSize: 17, lineHeight: 24, weight: '700' },
  body: { fontSize: 16, lineHeight: 24, weight: '500' },
  small: { fontSize: 14, lineHeight: 20, weight: '500' },
  caption: { fontSize: 12, lineHeight: 16, weight: '600' },
} as const satisfies Record<string, { fontSize: number; lineHeight: number; weight: Weight }>;

export type TextVariant = keyof typeof VARIANTS;

type Props = TextProps & { variant?: TextVariant; weight?: Weight; color?: ColorName };

// All text goes through this, so the font, size scale and colours stay consistent (and follow dark mode).
export function AppText({ variant = 'body', weight, color = 'text', style, ...rest }: Props) {
  const { colors } = useTheme();
  const v = VARIANTS[variant];
  const w = weight ?? v.weight;
  // Italic text uses the italic font file when there is one (and then must not be slanted a second time).
  const italicFace = StyleSheet.flatten(style)?.fontStyle === 'italic' ? FONT_ITALIC[w] : undefined;
  return (
    <Text
      {...rest}
      style={[{ fontFamily: italicFace ?? FONT[w], fontSize: v.fontSize, lineHeight: v.lineHeight, color: colors[color] }, style, italicFace ? { fontStyle: 'normal' } : null]}
    />
  );
}
