import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Icon, LevelBadge, Logo } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/store/auth';

// The top of a tab screen: a title, and the level and settings on the right.
export function ScreenHeader({ title, subtitle, brand = false }: { title: string; subtitle?: string; brand?: boolean }) {
  const level = useSettings().data?.level;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        {brand ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Logo size={34} />
            <AppText variant="heading" weight="800">{title}</AppText>
          </View>
        ) : (
          <AppText variant="title" accessibilityRole="header">{title}</AppText>
        )}
        {subtitle ? <AppText variant="small" color="text2">{subtitle}</AppText> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LevelBadge level={level} size="sm" />
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings" hitSlop={10}>
          <Icon name="settings-outline" size={24} color="text2" />
        </Pressable>
      </View>
    </View>
  );
}

export function useSignOut() {
  return () => void useAuth.getState().logout();
}

export { useSafeAreaInsets };
