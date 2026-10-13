import { useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Button, Card, GradientCard, Icon, LevelBadge, Loading, Screen, type IconName } from '@/components/ui';
import { useInterests } from '@/hooks/useInterests';
import { usePlacementStatus } from '@/hooks/usePlacement';
import { useReviewSummary } from '@/hooks/useReview';
import { useSettings } from '@/hooks/useSettings';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, LEVEL_STYLE, useTheme } from '@/theme';

type StepState = 'done' | 'current' | 'todo';

function Step({ icon, title, text, state, href }: { icon: IconName; title: string; text: string; state: StepState; href: Href }) {
  const { colors } = useTheme();
  const done = state === 'done';
  const current = state === 'current';
  return (
    <Pressable onPress={() => router.push(href)} accessibilityRole="button" accessibilityLabel={`${title}. ${text}`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: current ? 2 : 1, borderColor: current ? colors.primary + '88' : colors.cardBorder }}>
        {current ? (
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={24} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.successSoft : colors.chipBg }}>
            <Icon name={done ? 'checkmark' : icon} size={24} color={done ? colors.success : colors.muted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="subhead">{title}</AppText>
          <AppText variant="small" color="text2">{text}</AppText>
        </View>
        {current ? <Icon name="arrow-forward" size={20} color="primary" /> : null}
      </Card>
    </Pressable>
  );
}

export default function Home() {
  const qc = useQueryClient();
  const settings = useSettings();
  const placement = usePlacementStatus();
  const interests = useInterests();
  const review = useReviewSummary();

  const refresh = () => Promise.all([settings.refetch(), placement.refetch(), interests.refetch(), review.refetch(), qc.invalidateQueries({ queryKey: ['progress'] })]);

  if (settings.isLoading) {
    return (
      <Screen top>
        <ScreenHeader title="English Coach" brand />
        <Loading />
      </Screen>
    );
  }

  const data = settings.data;
  if (!data) {
    return (
      <Screen top onRefresh={refresh} refreshing={settings.isRefetching}>
        <ScreenHeader title="English Coach" brand />
        <Card><AppText color="dangerText">{settings.error?.message ?? 'Could not load your settings.'}</AppText></Card>
        <Button title="Try again" icon="refresh" onPress={() => settings.refetch()} />
      </Screen>
    );
  }

  const { hasKey, level, keyHint } = data;
  const resuming = placement.data?.inProgress;
  const hasInterests = Boolean(interests.data?.saved);
  const due = review.data?.due ?? 0;
  const totalCards = review.data?.totalCards ?? 0;
  const focusLabels = (interests.data?.focus ?? []).map((id) => interests.data?.focusOptions.find((o) => o.id === id)?.label).filter(Boolean) as string[];

  const hero = !hasKey
    ? { title: 'Let’s get you set up', text: 'Add your Gemini API key and the coach can start writing questions for you.', cta: 'Add your key', href: '/settings' as Href, icon: 'key-outline' as IconName }
    : !level
      ? {
          title: resuming ? 'Pick up where you left off' : 'Find your level',
          text: resuming ? `You’ve answered ${resuming.answered} questions so far.` : 'About 15 questions that adapt to you. It takes around 10 minutes.',
          cta: resuming ? 'Resume the test' : 'Start the level test',
          href: '/placement' as Href,
          icon: 'trophy-outline' as IconName,
        }
      : !hasInterests && interests.isSuccess
        ? { title: 'Make it yours', text: 'Tell us what you like talking about and what you want to improve: speaking, grammar and more.', cta: 'Pick your interests', href: '/interests' as Href, icon: 'sparkles-outline' as IconName }
        : null;

  return (
    <Screen top onRefresh={refresh} refreshing={settings.isRefetching}>
      <ScreenHeader title="English Coach" brand />

      <GradientCard>
        {hero ? (
          <View style={{ gap: 8 }}>
            <Icon name={hero.icon} size={34} color="#ffffffe6" />
            <AppText variant="title" style={{ color: '#fff' }}>{hero.title}</AppText>
            <AppText style={{ color: 'rgba(255,255,255,0.85)' }}>{hero.text}</AppText>
            <View style={{ marginTop: 10 }}>
              <Button title={hero.cta} variant="white" trailingIcon="arrow-forward" onPress={() => router.push(hero.href)} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <LevelBadge level={level} size="xl" />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="small" weight="600" style={{ color: 'rgba(255,255,255,0.75)' }}>Your level</AppText>
              <AppText variant="heading" style={{ color: '#fff' }}>{level ? LEVEL_STYLE[level]?.name : ''}</AppText>
              <View style={{ marginTop: 6, gap: 8 }}>
                {due > 0 ? (
                  <Button title={`Review ${due} ${due === 1 ? 'card' : 'cards'}`} variant="white" size="sm" trailingIcon="arrow-forward" onPress={() => router.navigate('/review')} />
                ) : (
                  <Button title="Explore topics" variant="white" size="sm" trailingIcon="arrow-forward" onPress={() => router.navigate('/topics')} />
                )}
                <Pressable onPress={() => router.push('/placement')} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="small" weight="700" style={{ color: 'rgba(255,255,255,0.9)' }}>Results or retake</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </GradientCard>

      <AppText variant="caption" color="muted" style={{ letterSpacing: 1, paddingHorizontal: 4, marginTop: 4 }} accessibilityRole="header">
        YOUR JOURNEY
      </AppText>
      <View style={{ gap: 12 }}>
        <Step icon="key-outline" title="Connect Gemini" text={hasKey ? `Key ${keyHint} saved` : 'Add your free API key'} state={hasKey ? 'done' : 'current'} href="/settings" />
        <Step icon="trophy-outline" title="Find your level" text={level ? `You’re at ${level}. Retake any time.` : 'An adaptive test, five skills'} state={level ? 'done' : hasKey ? 'current' : 'todo'} href="/placement" />
        <Step
          icon="sparkles-outline"
          title="Pick your interests"
          text={hasInterests ? `${interests.data?.fields.length} interests · improving ${focusLabels.join(', ').toLowerCase()}` : 'What you like, and what to improve'}
          state={hasInterests ? 'done' : hasKey && level ? 'current' : 'todo'}
          href="/interests"
        />
        <Step icon="compass-outline" title="Explore topics" text="Endless conversation ideas, made for you" state={hasInterests ? 'current' : 'todo'} href={hasInterests ? '/topics' : '/interests'} />
        <Step icon="chatbubbles-outline" title="Practise talking" text="Chat with the coach and get corrections" state={hasInterests ? 'current' : 'todo'} href="/chat" />
        <Step icon="chatbox-ellipses-outline" title="Power phrases" text="Natural expressions to save and practise" state="current" href="/phrases" />
        <Step
          icon="layers-outline"
          title="Review & remember"
          text={due > 0 ? `${due} ${due === 1 ? 'card is' : 'cards are'} waiting` : totalCards ? 'All caught up. Cards return when it is time.' : 'Your saved words and mistakes, back at the right time'}
          state={due > 0 ? 'current' : totalCards ? 'done' : 'todo'}
          href="/review"
        />
        <Step icon="trending-up" title="Your progress" text="Streak, activity, scores and weak spots" state="todo" href="/progress" />
      </View>
    </Screen>
  );
}
