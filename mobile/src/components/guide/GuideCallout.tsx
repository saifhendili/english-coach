import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Icon } from '@/components/ui';
import { HOME_CARD } from '@/guide/strings';
import { storage } from '@/lib/storage';
import { BRAND } from '@/theme';

const KEY = 'guide:home-dismissed';

// A card at the top of Home for new learners. The title is written in all three languages at once, because a beginner may not
// be able to read the English one.
export function GuideCallout() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void storage.get(KEY).then((v) => alive && setDismissed(v === '1'));
    return () => {
      alive = false;
    };
  }, []);

  if (dismissed !== false) return null;

  return (
    <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="book" size={26} color="#fff" />
        <View style={{ flex: 1, gap: 1 }}>
          <AppText weight="800" style={{ color: '#fff' }}>{HOME_CARD.title.en}</AppText>
          <AppText variant="small" weight="700" style={{ color: 'rgba(255,255,255,0.9)' }}>{HOME_CARD.title.fr}</AppText>
          <AppText variant="small" weight="700" style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'left', writingDirection: 'rtl' }}>{HOME_CARD.title.ar}</AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Button title="Guide · دليل" icon="book-outline" variant="white" size="sm" accessibilityLabel={`${HOME_CARD.open.en}. ${HOME_CARD.open.fr}. ${HOME_CARD.open.ar}`} onPress={() => router.push('/guide')} />
        <Pressable
          onPress={() => {
            setDismissed(true);
            void storage.set(KEY, '1');
          }}
          accessibilityRole="button"
          accessibilityLabel={`${HOME_CARD.later.en}. ${HOME_CARD.later.fr}. ${HOME_CARD.later.ar}`}
          hitSlop={10}
        >
          <AppText variant="small" weight="700" style={{ color: 'rgba(255,255,255,0.85)' }}>{HOME_CARD.later.en} · {HOME_CARD.later.fr}</AppText>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
