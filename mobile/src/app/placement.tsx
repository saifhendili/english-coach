import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Thinking } from '@/components/placement/Thinking';
import { QuestionView } from '@/components/placement/QuestionView';
import { Result } from '@/components/placement/Result';
import { AppText, Button, Card, Chip, ErrorBanner, Icon, LevelBadge, Loading, Screen } from '@/components/ui';
import { usePlacementFlow } from '@/hooks/usePlacementFlow';
import { usePlacementStatus } from '@/hooks/usePlacement';
import { confirmAsync } from '@/lib/confirm';
import { SKILLS } from '@/lib/skills';
import { BRAND, LEVEL_STYLE, useTheme } from '@/theme';

function Intro({ error, onStart, onShowLast }: { error: Error | null; onStart: () => void; onShowLast: (attemptId: string) => void }) {
  const { colors } = useTheme();
  const status = usePlacementStatus();
  const resuming = status.data?.inProgress;
  const last = status.data?.last;

  if (status.isLoading) return <Loading />;

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 20, padding: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={28} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <AppText variant="title" accessibilityRole="header">Find your English level</AppText>
            <AppText variant="small" color="text2">An adaptive test that fits you.</AppText>
          </View>
        </View>

        <AppText color="text2">Every question is written fresh by AI. It gets harder when you do well and easier when you struggle, so a few minutes are enough to place you from A1 to C2.</AppText>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([['list', 'Up to 15 questions'], ['time', 'About 10 minutes'], ['sparkles', 'No repeats, ever']] as const).map(([icon, text]) => (
            <View key={text} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 18, backgroundColor: colors.chipBg }}>
              <Icon name={icon} size={20} color="primary" />
              <AppText variant="caption" weight="700" style={{ textAlign: 'center' }}>{text}</AppText>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.values(SKILLS).map((s) => (
            <Chip key={s.label} label={s.label} icon={s.icon} />
          ))}
        </View>

        <View style={{ padding: 14, borderRadius: 18, backgroundColor: colors.warnSoft }}>
          <AppText variant="small" style={{ color: colors.warnText }}>
            <AppText variant="small" weight="800" style={{ color: colors.warnText }}>Tip: </AppText>
            don’t guess. If you really don’t know, choose “I don’t know”. It gives a more accurate result. Speaking questions use your microphone, and you can edit what it hears before sending.
          </AppText>
        </View>

        <Pressable onPress={() => router.push({ pathname: '/guide', params: { section: 'level' } })} accessibilityRole="button" accessibilityLabel="How the level test works, in English, French and Arabic" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="help-circle-outline" size={20} color="primaryText" />
          <AppText variant="small" weight="700" color="primaryText">How the test works · Comment ça marche ? · كيف يعمل الاختبار؟</AppText>
        </Pressable>

        <ErrorBanner error={error ?? status.error} onRetry={onStart} />

        <Button title={resuming ? `Resume the test (${resuming.answered} answered)` : last ? 'Retake the test' : 'Start the test'} trailingIcon="arrow-forward" size="lg" full onPress={onStart} />
      </Card>

      {last && !resuming ? (
        <Pressable onPress={() => onShowLast(last.attemptId)} accessibilityRole="button" accessibilityLabel={`Your last result: ${LEVEL_STYLE[last.level]?.name}`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
            <LevelBadge level={last.level} />
            <View style={{ flex: 1 }}>
              <AppText weight="700">Your last result: {LEVEL_STYLE[last.level]?.name}</AppText>
              <AppText variant="small" color="text2">{new Date(last.finishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</AppText>
            </View>
            <Icon name="arrow-forward" size={20} color="primary" />
          </Card>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function Placement() {
  const flow = usePlacementFlow();
  const { phase, view } = flow;

  if (phase === 'intro') {
    return (
      <Screen>
        <Intro error={flow.error} onStart={() => void flow.begin()} onShowLast={(id) => void flow.showResult(id)} />
      </Screen>
    );
  }

  if (phase === 'question' && view) {
    return (
      <Screen>
        <QuestionView
          key={view.question?.index}
          view={view}
          answer={flow.answer}
          setAnswer={flow.setAnswer as never}
          error={flow.error}
          onSubmit={(payload) => void flow.submit(payload)}
          onSkip={() => void flow.skip()}
          onFinishEarly={async () => {
            if (await confirmAsync('Finish now?', 'Your level will be estimated from the questions answered so far.', 'Finish now')) void flow.finishEarly();
          }}
        />
      </Screen>
    );
  }

  if (phase === 'finishing') {
    return (
      <Screen>
        <Thinking title="Working out your level…" messages={['Adding up your answers…', 'Grading your writing and speaking…', 'Writing your personal report…']} />
        <ErrorBanner error={flow.error} onRetry={() => view && void flow.finish(view.attemptId)} />
      </Screen>
    );
  }

  if (phase === 'stuck') {
    return (
      <Screen>
        <ErrorBanner error={flow.error} onRetry={() => void flow.retryResync()} />
        {!flow.error ? <AppText color="text2" style={{ textAlign: 'center' }}>Something went wrong.</AppText> : null}
      </Screen>
    );
  }

  if (phase === 'result' && flow.result) {
    return (
      <Screen>
        <Result result={flow.result} onRetake={() => void flow.begin()} />
      </Screen>
    );
  }

  // working
  return (
    <Screen>
      <Thinking title={view ? 'Thinking about your next question…' : 'Preparing your test…'} messages={['Writing a fresh question…', 'Matching the difficulty to your answers…', 'Almost ready…']} />
    </Screen>
  );
}
