import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PhraseCard } from '@/components/phrases/PhraseCard';
import { usePracticeSheet } from '@/components/phrases/usePracticeSheet';
import { AppText, Button, Card, ErrorBanner, Loading, Screen } from '@/components/ui';
import { useMorePhrases, usePhrasebank } from '@/hooks/usePhrases';
import { useTts } from '@/hooks/useTts';
import type { Phrase } from '@/types';

export default function PhraseCategoryScreen() {
  const { category: id } = useLocalSearchParams<{ category: string }>();
  const book = usePhrasebank();
  const tts = useTts();
  const more = useMorePhrases();
  const practice = usePracticeSheet(book.data, tts);
  const [extra, setExtra] = useState<Phrase[]>([]); // generated phrases, kept while this page is open

  if (book.isLoading) {
    return <Screen><Loading /></Screen>;
  }
  if (book.error) {
    return <Screen><ErrorBanner error={book.error} onRetry={() => void book.refetch()} /></Screen>;
  }

  const category = book.data?.find((c) => c.id === id);
  if (!category) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <AppText color="text2">That category does not exist.</AppText>
          <Button title="All categories" onPress={() => router.back()} style={{ alignSelf: 'center' }} />
        </Card>
      </Screen>
    );
  }

  const loadMore = () => more.mutate({ categoryId: category.id, exclude: extra.map((p) => p.text) }, { onSuccess: ({ phrases }) => setExtra((prev) => [...prev, ...phrases]) });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText style={{ fontSize: 34, lineHeight: 42 }}>{category.emoji}</AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">{category.label}</AppText>
          <AppText variant="small" color="text2">{category.blurb}</AppText>
        </View>
      </View>

      {category.phrases.map((p) => (
        <PhraseCard key={p.text} phrase={p} categoryId={category.id} tts={tts} onPractice={(x) => practice.open(x, category.id)} />
      ))}
      {extra.map((p) => (
        <PhraseCard key={p.text} phrase={p} categoryId={category.id} tts={tts} onPractice={(x) => practice.open(x, category.id)} isNew />
      ))}

      <ErrorBanner error={more.error} onRetry={loadMore} />
      <Button title={more.isPending ? 'Finding more…' : 'More like these'} icon="color-wand" variant="ghost" full loading={more.isPending} onPress={loadMore} />

      {practice.sheet}
    </Screen>
  );
}
