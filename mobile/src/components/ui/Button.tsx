import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BRAND, RADIUS, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './Text';

type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'white';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const HEIGHT: Record<Size, number> = { sm: 38, md: 48, lg: 56 };

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, trailingIcon, loading, disabled, full, style, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const text = variant === 'primary' ? colors.onBrand : variant === 'danger' ? colors.dangerText : variant === 'white' ? '#6d28d9' : variant === 'soft' ? colors.primaryText : colors.text;
  const bg = variant === 'soft' ? colors.primarySoft : variant === 'danger' ? colors.dangerSoft : variant === 'white' ? '#ffffff' : variant === 'ghost' ? colors.card : undefined;

  const content = (
    <View style={[styles.row, { height: HEIGHT[size], paddingHorizontal: size === 'sm' ? 14 : 20 }]}>
      {loading ? <ActivityIndicator color={text} size="small" /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={text} /> : null}
      <AppText variant={size === 'sm' ? 'small' : 'body'} weight="700" style={{ color: text }}>
        {title}
      </AppText>
      {trailingIcon && !loading ? <Icon name={trailingIcon} size={size === 'sm' ? 16 : 19} color={text} /> : null}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={() => {
        if (Platform.OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        { borderRadius: RADIUS.lg, opacity: inactive ? 0.55 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }], alignSelf: full ? 'stretch' : 'flex-start' },
        variant === 'primary' && styles.glow,
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: RADIUS.lg }}>
          {content}
        </LinearGradient>
      ) : (
        <View style={{ borderRadius: RADIUS.lg, backgroundColor: bg }}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  glow: { shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
});
