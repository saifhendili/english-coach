import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timeline } from '@/components/grammar/Timeline';
import { AppText, Button, Card, Chip, ErrorBanner, Icon, Loading, Screen } from '@/components/ui';
import { useTenses } from '@/hooks/useTenses';
import { useTts, type Tts } from '@/hooks/useTts';
import { masteryLabel } from '@/lib/tenses';
import { useTheme } from '@/theme';
import type { TenseLesson, TenseStat } from '@/types';

const TIME_LABEL = { past: 'Past', present: 'Present', future: 'Future' } as const;

function Heading({ children }: { children: string }) {
  return <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1 }}>{children.toUpperCase()}</AppText>;
}

// An example sentence with a button to hear it.
function Example({ text, id, tts }: { text: string; id: string; tts: Tts }) {
  const { colors } = useTheme();
  const on = tts.speakingId === id;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, borderLeftWidth: 4, borderLeftColor: colors.primary + '66', paddingLeft: 12 }}>
        <AppText style={{ fontStyle: 'italic' }}>“{text}”</AppText>
      </View>
      <Pressable onPress={() => tts.speak(id, text)} accessibilityRole="button" accessibilityLabel={`Listen: ${text}`} accessibilityState={{ selected: on }} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : colors.chipBg }}>
        <Icon name="volume-high" size={16} color={on ? '#fff' : colors.text2} />
      </Pressable>
    </View>
  );
}

function Lesson({ lesson, other, stat }: { lesson: TenseLesson; other?: TenseLesson; stat: TenseStat }) {
  const { colors } = useTheme();
  const tts = useTts();
  const forms = [['Affirmative', 'affirmative'], ['Negative', 'negative'], ['Question', 'question']] as const;

  return (
    <>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={TIME_LABEL[lesson.time]} />
          <Chip label={lesson.level} tone="neutral" />
          <Chip
            label={stat.attempts ? `${masteryLabel(stat.accuracy, stat.attempts)} right · ${stat.attempts} answers` : 'Not practised yet'}
            tone={!stat.attempts ? 'neutral' : (stat.accuracy ?? 0) >= 80 ? 'success' : (stat.accuracy ?? 0) >= 60 ? 'warn' : 'danger'}
            icon="stats-chart"
          />
        </View>
        <AppText variant="heading" style={{ lineHeight: 28 }}>{lesson.summary}</AppText>
      </View>

      <Card style={{ paddingVertical: 14 }}>
        <Timeline marks={lesson.timeline.marks} />
      </Card>

      <View style={{ gap: 10 }}>
        <Heading>How it is formed</Heading>
        {forms.map(([label, key]) => (
          <Card key={key} style={{ gap: 8, padding: 14 }}>
            <AppText variant="caption" weight="800" color="primaryText" style={{ letterSpacing: 0.8 }}>{label.toUpperCase()}</AppText>
            <AppText weight="700">{lesson.form[key]}</AppText>
            <Example text={lesson.formExamples[key]} id={`${lesson.id}-form-${key}`} tts={tts} />
          </Card>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Heading>When to use it</Heading>
        {lesson.uses.map((u, i) => (
          <Card key={u.rule} style={{ gap: 8, padding: 14 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginTop: 1 }}>
                <AppText variant="caption" weight="800" color="primaryText">{i + 1}</AppText>
              </View>
              <AppText weight="700" style={{ flex: 1 }}>{u.rule}</AppText>
            </View>
            <Example text={u.example} id={`${lesson.id}-use-${i}`} tts={tts} />
          </Card>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Heading>Words that give it away</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {lesson.signals.map((s) => (
            <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.chipBg }}>
              <AppText variant="small" weight="700" color="text2">{s}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Heading>Mistakes to avoid</Heading>
        {lesson.mistakes.map((m) => (
          <Card key={m.wrong} style={{ gap: 8, padding: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="close-circle" size={18} color="danger" />
              <AppText style={{ flex: 1, color: colors.dangerText, textDecorationLine: 'line-through' }}>{m.wrong}</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="checkmark-circle" size={18} color="success" />
              <AppText weight="700" style={{ flex: 1, color: colors.successText }}>{m.right}</AppText>
            </View>
            <AppText variant="small" color="text2">{m.why}</AppText>
          </Card>
        ))}
      </View>

      {other ? (
        <Card style={{ gap: 10, backgroundColor: colors.infoSoft, borderColor: colors.info + '33' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="git-compare" size={18} color="infoText" />
            <AppText weight="800" style={{ color: colors.infoText, flex: 1 }}>Do not mix it up with {other.name}</AppText>
          </View>
          <AppText variant="small" style={{ color: colors.infoText }}>{lesson.contrast.tip}</AppText>
          <Button title={`Read: ${other.name}`} variant="soft" size="sm" onPress={() => router.replace({ pathname: '/grammar/[tense]', params: { tense: other.id } })} />
        </Card>
      ) : null}
    </>
  );
}

export default function LessonScreen() {
  const { tense } = useLocalSearchParams<{ tense: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useTenses();
  const lesson = data?.lessons.find((l) => l.id === tense);

  if (isLoading || !data) return <Screen>{error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : <Loading />}</Screen>;
  if (!lesson) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <AppText color="text2">That lesson does not exist.</AppText>
          <Button title="Back to Grammar" onPress={() => router.back()} style={{ alignSelf: 'center' }} />
        </Card>
      </Screen>
    );
  }

  const stat = data.stats[lesson.id];
  const other = data.lessons.find((l) => l.id === lesson.contrast.with);
  const go = (source?: 'ai') => router.push({ pathname: '/grammar/practice', params: source ? { tense: lesson.id, source } : { tense: lesson.id } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: lesson.name }} />
      <Screen bottom={24}>
        <Lesson lesson={lesson} other={other} stat={stat} />
      </Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button title="Practise" icon="barbell" onPress={() => go()} style={{ flex: 1 }} />
        <Button title="New with AI" icon="sparkles" variant="soft" onPress={() => go('ai')} />
      </View>
    </View>
  );
}
