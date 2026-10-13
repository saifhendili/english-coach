import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText, Button, Card, ErrorBanner, Icon, Loading, Screen, Segmented } from '@/components/ui';
import { useTenses } from '@/hooks/useTenses';
import { useTts } from '@/hooks/useTts';
import { masteryLabel } from '@/lib/tenses';
import { FONT, useTheme } from '@/theme';

type View_ = 'practise' | 'list';

export default function Irregular() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useTenses();
  const tts = useTts();
  const [view, setView] = useState<View_>('practise');
  const [q, setQ] = useState('');

  if (isLoading || !data) return <Screen>{error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : <Loading />}</Screen>;

  const stat = data.stats.irregular;
  const needle = q.trim().toLowerCase();
  const verbs = data.irregular.verbs.filter((v) => !needle || [v.base, ...v.past, ...v.participle, v.meaning].some((f) => f.toLowerCase().includes(needle)));

  return (
    <Screen>
      <Segmented<View_> label="Irregular verbs" value={view} onChange={setView} options={[{ value: 'practise', label: 'Practise' }, { value: 'list', label: `All ${data.irregular.count} verbs` }]} />

      {view === 'practise' ? (
        <>
          <Card style={{ gap: 12, padding: 20 }}>
            <AppText variant="title">Irregular verbs</AppText>
            <AppText color="text2">Regular verbs add -ed in the past (walk → walked). These do not, so you have to know them: go → went → gone.</AppText>
            <AppText variant="small" color="text2">
              Each question gives you the base verb, and you type the past simple and the past participle. The ones you miss come back first next time.
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText variant="small" weight="700">{stat.attempts ? `${masteryLabel(stat.accuracy, stat.attempts)} right · ${stat.attempts} answers` : 'Not practised yet'}</AppText>
            </View>
            <Button title="Practise 10 verbs" icon="barbell" size="lg" full onPress={() => router.push({ pathname: '/grammar/practice', params: { tense: 'irregular' } })} />
          </Card>
          <Button title="See all the verbs" variant="ghost" full onPress={() => setView('list')} />
        </>
      ) : (
        <>
          <View style={{ justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
              <Icon name="search" size={18} color="muted" />
            </View>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search a verb…"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search verbs"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ minHeight: 46, borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, paddingLeft: 42, paddingRight: 14 }}
            />
          </View>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
            {['Base', 'Past simple', 'Past participle'].map((h) => (
              <AppText key={h} variant="caption" weight="800" color="muted" style={{ flex: 1, letterSpacing: 0.5 }}>{h.toUpperCase()}</AppText>
            ))}
            <View style={{ width: 36 }} />
          </View>
          {verbs.length === 0 ? <Card><AppText color="text2" style={{ textAlign: 'center' }}>No verb matches.</AppText></Card> : null}
          {verbs.map((v) => {
            const id = `verb-${v.base}`;
            const on = tts.speakingId === id;
            return (
              <Card key={v.base} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
                <View style={{ flex: 1 }}>
                  <AppText weight="800">{v.base}</AppText>
                  <AppText variant="caption" color="muted" numberOfLines={1} style={{ fontWeight: '500' }}>{v.meaning}</AppText>
                </View>
                <AppText weight="700" style={{ flex: 1 }}>{v.past.join(' / ')}</AppText>
                <AppText weight="700" style={{ flex: 1 }}>{v.participle.join(' / ')}</AppText>
                <Pressable onPress={() => tts.speak(id, `${v.base}, ${v.past[0]}, ${v.participle[0]}`)} accessibilityRole="button" accessibilityLabel={`Listen to ${v.base}`} accessibilityState={{ selected: on }} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : colors.chipBg }}>
                  <Icon name="volume-high" size={16} color={on ? '#fff' : colors.text2} />
                </Pressable>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
