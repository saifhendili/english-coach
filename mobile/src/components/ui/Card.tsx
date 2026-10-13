import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, RADIUS, useTheme } from '@/theme';

type CardProps = ViewProps & { padded?: boolean; style?: StyleProp<ViewStyle> };

export function Card({ padded = true, style, ...rest }: CardProps) {
  const { colors, dark } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: padded ? 18 : 0,
          shadowColor: colors.shadow,
          shadowOpacity: dark ? 0 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
        style,
      ]}
    />
  );
}

// A card filled with the brand gradient: the big banners at the top of screens.
export function GradientCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={BRAND}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 32, padding: 22, overflow: 'hidden', shadowColor: '#6366f1', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }, style]}
    >
      {/* soft light blobs, as on the web banners */}
      <View style={{ position: 'absolute', right: -50, top: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <View style={{ position: 'absolute', left: -40, bottom: -70, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(125,211,252,0.18)' }} />
      {children}
    </LinearGradient>
  );
}
