import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ExerciseView } from '@/components/grammar/ExerciseView';
import { Thinking } from '@/components/placement/Thinking';
import { AppText, Button, Card, ErrorBanner, GradientCard, Icon, Screen } from '@/components/ui';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useTenses } from '@/hooks/useTenses';
import { useTts, type Tts } from '@/hooks/useTts';
import { completedSentence } from '@/lib/tenses';
import { useTheme } from '@/theme';
import type { Exercise } from '@/types';

// One question. It owns the chosen option, so a new question starts clean (the screen gives it a new key).
function Step({ session, tenseName, tts, hideTense }: { session: ReturnType<typeof usePracticeSession>; tenseName?: string; tts: Tts; hideTense: boolean }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const ex = session.exercise as Exercise;
  return (
    <ExerciseView
      exercise={ex}
      tenseName={hideTense ? undefined : tenseName}
      verdict={session.phase === 'feedback' ? session.last : null}
      chosen={chosen}
      onChoose={setChosen}
      onSubmit={session.submit}
      onNext={session.next}
      nextLabel={session.remaining <= 1 ? 'See results' : 'Next'}
      tts={tts}
    />
  );
}

const messageFor = (pct: number) => (pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good work.' : pct >= 50 ? 'Getting there.' : 'Keep practising: it gets easier.');

export default function Practice() {
  const { tense, source } = useLocalSearchParams<{ tense: string; source?: string }>();
  const ai = source === 'ai' ? 'ai' : undefined;
  const { colors } = useTheme();
  const tts = useTts();
  const tenses = useTenses();
  const session = usePracticeSession({ tense, source: ai });

  const lesson = tenses.data?.lessons.find((l) => l.id === tense);
  const title = tense === 'mixed' ? 'Mixed practice' : tense === 'irregular' ? 'Irregular verbs' : lesson?.name ?? 'Practice';
  const single = tense !== 'mixed' && tense !== 'irregular';
  const leave = () => {
    tts.stop();
    if (router.canGoBack()) router.back();
    else router.replace('/grammar');
  };

  if (session.phase === 'loading') {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <Thinking
          title={ai ? 'Writing exercises for you…' : 'Getting your questions…'}
          messages={ai ? ['Thinking of sentences about your interests…', 'Checking each one has a clear answer…', 'Almost ready…'] : ['Picking questions you need most…', 'Almost ready…']}
        />
      </Screen>
    );
  }

  if (session.phase === 'error') {
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <ErrorBanner error={session.error} onRetry={session.restart} />
        <Button title="Back" variant="ghost" onPress={leave} />
      </Screen>
    );
  }

  if (session.phase === 'done') {
    const { answered, correct, missed } = session;
    const pct = answered ? Math.round((correct / answered) * 100) : 0;
    return (
      <Screen>
        <Stack.Screen options={{ title }} />
        <GradientCard style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
          <AppText weight="800" style={{ color: '#fff', fontSize: 56, lineHeight: 62 }} accessibilityLabel={`${correct} out of ${answered}`}>{correct}/{answered}</AppText>
          <AppText variant="heading" style={{ color: '#fff' }}>{answered ? messageFor(pct) : 'No questions answered'}</AppText>
        </GradientCard>

        {session.saveError ? <ErrorBanner error={session.saveError} onRetry={session.retrySave} retryLabel="Save my progress" /> : null}

        {missed.length > 0 ? (
          <View style={{ gap: 10 }}>
            <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1, paddingHorizontal: 4 }}>TO REMEMBER</AppText>
            {missed.map((m) => (
              <Card key={m.id} style={{ gap: 6, padding: 14 }}>
                <AppText weight="700" style={{ color: colors.successText }}>
                  {m.type === 'irregular' ? `${m.base} – ${m.past.join(' / ')} – ${m.participle.join(' / ')}` : m.type === 'identify' || m.type === 'choose' ? `${completedSentence(m)} → ${m.options[m.correctIndex]}` : completedSentence(m)}
                </AppText>
                {m.type !== 'irregular' && m.why ? <AppText variant="small" color="text2">{m.why}</AppText> : null}
              </Card>
            ))}
          </View>
        ) : answered > 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="checkmark-circle" size={22} color="success" />
            <AppText style={{ flex: 1 }}>No mistakes. The ones you miss come back next time.</AppText>
          </Card>
        ) : null}

        <Button title={ai ? 'Write more with AI' : 'Practise again'} icon="refresh" full onPress={session.restart} />
        {single && !ai ? <Button title="New exercises with AI" icon="sparkles" variant="soft" full onPress={() => router.replace({ pathname: '/grammar/practice', params: { tense, source: 'ai' } })} /> : null}
        {single ? <Button title="Read the lesson again" variant="ghost" full onPress={() => router.replace({ pathname: '/grammar/[tense]', params: { tense } })} /> : null}
        <Button title="Back to Grammar" variant="ghost" full onPress={() => router.dismissTo('/grammar')} />
      </Screen>
    );
  }

  // question or feedback
  const ex = session.exercise as Exercise;
  const pct = session.total ? Math.round((Math.min(session.answered, session.total) / session.total) * 100) : 0;
  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="small" weight="700" color="text2">{ex.retry ? 'Second try' : `Question ${session.position} of ${session.total}`}</AppText>
          <Pressable onPress={() => { tts.stop(); session.stop(); }} accessibilityRole="button" accessibilityLabel={session.answered ? 'Finish' : 'Close'} hitSlop={10}>
            <AppText variant="small" weight="700" color="primaryText">{session.answered ? 'Finish' : 'Close'}</AppText>
          </Pressable>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Progress" accessibilityValue={{ min: 0, max: session.total, now: session.answered }} style={{ height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${Math.max(pct, 4)}%`, borderRadius: 5, backgroundColor: colors.primary }} />
        </View>
      </View>
      <Step key={`${ex.id}-${ex.retry ? 'r' : ''}`} session={session} tenseName={single ? lesson?.name : tenses.data?.lessons.find((l) => l.id === ex.tense)?.name} tts={tts} hideTense={tense === 'mixed'} />
    </Screen>
  );
}
