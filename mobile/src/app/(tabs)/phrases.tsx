import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { PhraseCategoryRow } from '@/components/phrases/PhraseCategoryRow';
import { usePracticeSheet } from '@/components/phrases/usePracticeSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Button, Card, Chip, ErrorBanner, Icon, Loading, Screen, Segmented } from '@/components/ui';
import { usePhrasebank } from '@/hooks/usePhrases';
import { useSaved } from '@/hooks/useSaved';
import { useTts, type Tts } from '@/hooks/useTts';
import { FONT, useTheme } from '@/theme';
import type { SavedItemData } from '@/types';

type Tab = 'browse' | 'saved';
type Kind = 'all' | 'phrase' | 'word';

function SavedView({ items, tts, onPractice, onRemove }: { items: SavedItemData[]; tts: Tts; onPractice: (item: SavedItemData) => void; onRemove: (id: string) => void }) {
  const { colors } = useTheme();
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => ({ all: items.length, phrase: items.filter((i) => i.kind === 'phrase').length, word: items.filter((i) => i.kind === 'word').length }), [items]);
  const shown = items.filter((i) => {
    if (kind !== 'all' && i.kind !== kind) return false;
    const needle = q.trim().toLowerCase();
    return !needle || [i.text, i.meaning, i.translation].some((s) => s?.toLowerCase().includes(needle));
  });

  return (
    <View style={{ gap: 14 }}>
      <Segmented<Kind>
        label="Show"
        value={kind}
        onChange={setKind}
        options={[{ value: 'all', label: `All ${counts.all}` }, { value: 'phrase', label: `Phrases ${counts.phrase}` }, { value: 'word', label: `Words ${counts.word}` }]}
      />
      <View style={{ justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
          <Icon name="search" size={18} color="muted" />
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Search saved items"
          clearButtonMode="while-editing"
          autoCorrect={false}
          style={{ minHeight: 46, borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, paddingLeft: 42, paddingRight: 14 }}
        />
      </View>

      {shown.length === 0 ? (
        <Card><AppText color="text2" style={{ textAlign: 'center' }}>Nothing matches.</AppText></Card>
      ) : (
        shown.map((i) => (
          <Card key={i.id} style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Chip label={i.kind} tone={i.kind === 'phrase' ? 'primary' : 'info'} />
              <AppText variant="subhead" style={{ marginTop: 4 }}>{i.text}</AppText>
              {i.translation ? <AppText weight="700" color="primaryText">{i.translation}</AppText> : null}
              {i.meaning ? <AppText variant="small" color="text2">{i.meaning}</AppText> : null}
              {i.example ? (
                <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primary + '66', paddingLeft: 10, marginTop: 4 }}>
                  <AppText variant="small" color="text2" style={{ fontStyle: 'italic' }}>“{i.example}”</AppText>
                </View>
              ) : null}
            </View>
            <View style={{ gap: 6 }}>
              <Pressable onPress={() => tts.speak(`saved-${i.id}`, i.example || i.text)} accessibilityRole="button" accessibilityLabel={`Listen to ${i.text}`} accessibilityState={{ selected: tts.speakingId === `saved-${i.id}` }} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tts.speakingId === `saved-${i.id}` ? colors.primary : colors.chipBg }}>
                <Icon name="volume-high" size={17} color={tts.speakingId === `saved-${i.id}` ? '#fff' : colors.text2} />
              </Pressable>
              {i.kind === 'phrase' ? (
                <Pressable onPress={() => onPractice(i)} accessibilityRole="button" accessibilityLabel={`Practise ${i.text}`} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
                  <Icon name="barbell" size={17} color="primaryText" />
                </Pressable>
              ) : null}
              <Pressable onPress={() => onRemove(i.id)} accessibilityRole="button" accessibilityLabel={`Remove ${i.text}`} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trash-outline" size={17} color="muted" />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

export default function Phrases() {
  const book = usePhrasebank();
  const saved = useSaved();
  const tts = useTts();
  const practice = usePracticeSheet(book.data, tts);
  const [tab, setTab] = useState<Tab>('browse');

  return (
    <Screen top>
      <ScreenHeader title="Power phrases" subtitle="Natural expressions to use again and again. Save them, say them, practise them." />
      <Segmented<Tab>
        label="Phrases"
        value={tab}
        onChange={setTab}
        options={[{ value: 'browse', label: 'Browse' }, { value: 'saved', label: saved.items.length > 0 ? `Saved (${saved.items.length})` : 'Saved' }]}
      />

      {tab === 'browse' ? (
        book.isLoading ? (
          <Loading />
        ) : book.error ? (
          <ErrorBanner error={book.error} onRetry={() => void book.refetch()} />
        ) : (
          <View style={{ gap: 12 }}>
            {book.data?.map((c) => (
              <PhraseCategoryRow key={c.id} category={c} kept={c.phrases.filter((p) => saved.isSaved('phrase', p.text)).length} />
            ))}
          </View>
        )
      ) : saved.isLoading ? (
        <Loading />
      ) : saved.items.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 32 }}>
          <Icon name="bookmark-outline" size={36} color="primary" />
          <AppText variant="heading">Nothing saved yet</AppText>
          <AppText color="text2" style={{ textAlign: 'center' }}>Tap Save on a phrase, or on a word or phrase the coach suggests in a conversation, and it will be kept here.</AppText>
          <Button title="Browse phrases" onPress={() => setTab('browse')} style={{ alignSelf: 'center' }} />
        </Card>
      ) : (
        <SavedView items={saved.items} tts={tts} onPractice={(i) => practice.open({ text: i.text, usage: i.meaning, category: i.category })} onRemove={saved.remove} />
      )}

      {practice.sheet}
    </Screen>
  );
}
