import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Spinner } from '@/components/ui';
import { useWaking } from '@/lib/slow';
import { useTheme } from '@/theme';

// "The server is waking up": shown over every screen while a sleeping free host starts again (about a minute).
export function ServerWaking() {
  const waking = useWaking((s) => s.waking > 0);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  if (!waking) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 100, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.warnSoft, borderWidth: 1, borderColor: colors.warn + '66' }}
    >
      <Spinner />
      <AppText variant="small" weight="700" style={{ flex: 1, color: colors.warnText }}>
        The server is waking up. This can take up to a minute the first time. Please wait, nothing is wrong.
      </AppText>
    </View>
  );
}
