import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Icon, LevelBadge, Logo } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import type { SectionId } from '@/guide/content';
import { useAuth } from '@/store/auth';

// The top of a tab screen: a title, and the level and settings on the right.
export function ScreenHeader({ title, subtitle, brand = false, help }: { title: string; subtitle?: string; brand?: boolean; /** The guide section this screen is explained in: shows a "?" button that opens it. */ help?: SectionId }) {
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
        {help ? (
          <Pressable onPress={() => router.push({ pathname: '/guide', params: { section: help } })} accessibilityRole="button" accessibilityLabel="Help: how this screen works" hitSlop={10}>
            <Icon name="help-circle-outline" size={25} color="text2" />
          </Pressable>
        ) : null}
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
