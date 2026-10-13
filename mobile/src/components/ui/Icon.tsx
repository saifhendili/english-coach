import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useTheme, type ColorName } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = 'text', style }: { name: IconName; size?: number; color?: ColorName | string; style?: ComponentProps<typeof Ionicons>['style'] }) {
  const { colors } = useTheme();
  const resolved = (color in colors ? colors[color as ColorName] : color) as string;
  return <Ionicons name={name} size={size} color={resolved} style={style} />;
}
