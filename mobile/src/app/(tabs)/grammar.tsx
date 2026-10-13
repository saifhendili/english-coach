import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Button, Card, Chip, ErrorBanner, GradientCard, Icon, Loading, Screen } from '@/components/ui';
import { useTenses } from '@/hooks/useTenses';
import { masteryLabel } from '@/lib/tenses';
import { BRAND, useTheme } from '@/theme';
import type { TenseLesson, TenseStat, TenseTime } from '@/types';

const TIMES: { id: TenseTime; label: string; icon: 'arrow-back-circle' | 'ellipse' | 'arrow-forward-circle' }[] = [
  { id: 'present', label: 'Present', icon: 'ellipse' },
  { id: 'past', label: 'Past', icon: 'arrow-back-circle' },
  { id: 'future', label: 'Future', icon: 'arrow-forward-circle' },
];

const practice = (tense: string, source?: 'ai') => router.push({ pathname: '/grammar/practice', params: source ? { tense, source } : { tense } });

function MasteryBar({ stat }: { stat: TenseStat }) {
  const { colors } = useTheme();
  const pct = stat.accuracy ?? 0;
  const tone = stat.attempts === 0 ? colors.border : pct >= 80 ? colors.success : pct >= 60 ? colors.warn : colors.danger;
  return (
    <View style={{ gap: 4, alignItems: 'flex-end', minWidth: 56 }} accessible accessibilityLabel={stat.attempts ? `${pct}% right, ${stat.attempts} answers` : 'Not practised yet'}>
      <AppText variant="small" weight="800" style={{ color: stat.attempts ? colors.text : colors.muted }}>{masteryLabel(stat.accuracy, stat.attempts)}</AppText>
      <View style={{ width: 56, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
        <View style={{ width: `${stat.attempts ? Math.max(pct, 6) : 0}%`, height: '100%', backgroundColor: tone, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function LessonRow({ lesson, stat }: { lesson: TenseLesson; stat: TenseStat }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/grammar/[tense]', params: { tense: lesson.id } })} accessibilityRole="button" accessibilityLabel={`${lesson.name}. ${lesson.summary}`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText weight="700" style={{ flexShrink: 1 }}>{lesson.name}</AppText>
            <Chip label={lesson.level} tone="neutral" />
          </View>
          <AppText variant="small" color="text2" numberOfLines={2}>{lesson.formExamples.affirmative}</AppText>
        </View>
        <MasteryBar stat={stat} />
        <Icon name="chevron-forward" size={18} color="muted" />
      </Card>
    </Pressable>
  );
}

export default function Grammar() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useTenses();

  if (isLoading || !data) {
    return (
      <Screen top>
        <ScreenHeader title="Grammar" />
        {error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : <Loading />}
      </Screen>
    );
  }

  const { lessons, stats, recommended, chatTenseMistakes, irregular } = data;
  const rec = lessons.find((l) => l.id === recommended.tense);
  const recStat = rec ? stats[rec.id] : undefined;

  return (
    <Screen top refreshing={isRefetching} onRefresh={() => void refetch()}>
      <ScreenHeader title="Grammar" subtitle="Learn each verb tense, then practise it until it sticks." />

      <GradientCard>
        {rec ? (
          <View style={{ gap: 6 }}>
            <AppText variant="caption" weight="800" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 1 }}>
              {recommended.reason === 'weakest' ? 'YOUR WEAKEST TENSE' : 'START HERE'}
            </AppText>
            <AppText variant="title" style={{ color: '#fff' }}>{rec.name}</AppText>
            <AppText style={{ color: 'rgba(255,255,255,0.85)' }}>
              {recommended.reason === 'weakest' && recStat ? `You get ${recStat.accuracy}% of these right. A few minutes will help.` : rec.summary}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              <Button title="Practise 10" icon="barbell" variant="white" onPress={() => practice(rec.id)} />
              <Button title="Read the lesson" variant="ghost" onPress={() => router.push({ pathname: '/grammar/[tense]', params: { tense: rec.id } })} />
            </View>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <Icon name="ribbon" size={34} color="#fff" />
            <AppText variant="title" style={{ color: '#fff' }}>Your tenses are in good shape</AppText>
            <AppText style={{ color: 'rgba(255,255,255,0.85)' }}>Keep them sharp with a mixed round: every tense, the trickier ones first.</AppText>
            <View style={{ marginTop: 10 }}>
              <Button title="Mixed practice" icon="shuffle" variant="white" onPress={() => practice('mixed')} />
            </View>
          </View>
        )}
      </GradientCard>

      {chatTenseMistakes > 0 ? (
        <Card style={{ gap: 10, borderColor: colors.warn + '55' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="chatbubbles" size={20} color="warn" />
            <AppText weight="700" style={{ flex: 1 }}>
              The coach corrected {chatTenseMistakes} tense {chatTenseMistakes === 1 ? 'mistake' : 'mistakes'} in your chats.
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Mixed practice" icon="shuffle" size="sm" onPress={() => practice('mixed')} />
            <Button title="Review them" variant="ghost" size="sm" onPress={() => router.navigate('/review')} />
          </View>
        </Card>
      ) : null}

      <Pressable onPress={() => practice('mixed')} accessibilityRole="button" accessibilityLabel="Mixed practice. Every tense, the weaker ones first." style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shuffle" size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <AppText weight="700">Mixed practice</AppText>
            <AppText variant="small" color="text2">Every tense together, the weaker ones first. You choose the tense yourself.</AppText>
          </View>
          <Icon name="chevron-forward" size={18} color="muted" />
        </Card>
      </Pressable>

      {TIMES.map((time) => (
        <View key={time.id} style={{ gap: 10 }}>
          <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1, paddingHorizontal: 4 }}>{time.label.toUpperCase()}</AppText>
          {lessons
            .filter((l) => l.time === time.id)
            .map((l) => (
              <LessonRow key={l.id} lesson={l} stat={stats[l.id]} />
            ))}
        </View>
      ))}

      <View style={{ gap: 10 }}>
        <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1, paddingHorizontal: 4 }}>VERBS</AppText>
        <Pressable onPress={() => router.push('/grammar/irregular')} accessibilityRole="button" accessibilityLabel={`Irregular verbs. ${irregular.count} common verbs.`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText weight="700">Irregular verbs</AppText>
              <AppText variant="small" color="text2">go → went → gone. {irregular.count} common verbs to learn and practise.</AppText>
            </View>
            <MasteryBar stat={stats.irregular} />
            <Icon name="chevron-forward" size={18} color="muted" />
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}
