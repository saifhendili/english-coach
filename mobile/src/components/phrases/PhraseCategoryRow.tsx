import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, Icon } from '@/components/ui';
import { useTheme } from '@/theme';
import type { PhraseCategory } from '@/types';

export function PhraseCategoryRow({ category: c, kept }: { category: PhraseCategory; kept: number }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/phrases/[category]', params: { category: c.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${c.label}. ${c.blurb}. ${c.phrases.length} phrases${kept ? `, ${kept} saved` : ''}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <AppText style={{ fontSize: 26, lineHeight: 32 }}>{c.emoji}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="700">{c.label}</AppText>
          <AppText variant="small" color="text2">{c.blurb}</AppText>
          <AppText variant="caption" color="primaryText">{c.phrases.length} phrases{kept > 0 ? ` · ${kept} saved` : ''}</AppText>
        </View>
        <Icon name="chevron-forward" size={18} color="muted" />
      </Card>
    </Pressable>
  );
}
