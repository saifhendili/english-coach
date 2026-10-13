import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Button, Card, ErrorBanner, GradientCard, Icon, Loading, Screen } from '@/components/ui';
import { answeredCount, useReviewSession, type Stats } from '@/hooks/useReviewSession';
import { useTts } from '@/hooks/useTts';
import { RATINGS } from '@/lib/review';
import { useTheme } from '@/theme';
import type { ReviewSummary } from '@/types';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)' }} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText variant="title" style={{ color: '#fff', lineHeight: 30 }}>{value}</AppText>
      <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.78)' }}>{label}</AppText>
    </View>
  );
}

function Start({ summary, onStart, loading, error }: { summary: ReviewSummary; onStart: () => void; loading: boolean; error: Error | null }) {
  const { due, reviewsDue, newToday, newWaiting, reviewedToday, totalCards } = summary;

  if (totalCards === 0) {
    return (
      <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 30 }}>
        <Icon name="layers" size={40} color="primary" />
        <AppText variant="title" style={{ textAlign: 'center' }}>Nothing to review yet</AppText>
        <AppText color="text2" style={{ textAlign: 'center' }}>Save words and phrases from your chats, or browse the phrasebank. Your mistakes from conversations are added automatically.</AppText>
        <Button title="Start a chat" icon="chatbubble-ellipses" onPress={() => router.navigate('/chat')} style={{ alignSelf: 'center' }} />
        <Button title="Browse phrases" variant="ghost" onPress={() => router.navigate('/phrases')} style={{ alignSelf: 'center' }} />
      </Card>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <GradientCard>
        <AppText variant="title" style={{ color: '#fff' }}>{due > 0 ? 'Time to review' : 'All caught up'}</AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          {due > 0 ? 'A few minutes now, and what you saved stays in your head.' : reviewedToday > 0 ? 'Nice work today. Your next cards come back when it is time.' : 'Nothing is due right now. Cards come back when it is time.'}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Stat value={reviewsDue} label="to review" />
          <Stat value={newToday} label="new today" />
          <Stat value={reviewedToday} label="done today" />
        </View>
        {due > 0 ? (
          <View style={{ marginTop: 18 }}>
            <Button title={`Start (${Math.min(due, 20)} cards)`} icon="sparkles" trailingIcon="arrow-forward" variant="white" size="lg" full loading={loading} onPress={onStart} />
          </View>
        ) : null}
      </GradientCard>
      <ErrorBanner error={error} onRetry={onStart} />
      {newWaiting > 0 ? (
        <AppText variant="small" color="text2" style={{ textAlign: 'center' }}>
          {newWaiting} more new {newWaiting === 1 ? 'card is' : 'cards are'} waiting for tomorrow: {due > 0 ? 'ten new cards a day keeps it light' : 'you have done today’s ten'}.
        </AppText>
      ) : null}
      <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>{totalCards} cards in total</AppText>
    </View>
  );
}

function Done({ stats, summary, onKeepGoing }: { stats: Stats; summary?: ReviewSummary; onKeepGoing: () => void }) {
  const { colors } = useTheme();
  const answered = answeredCount(stats);
  const pct = answered ? Math.round(((stats[3] + stats[4]) / answered) * 100) : 0;
  return (
    <View style={{ gap: 16 }}>
      <GradientCard style={{ alignItems: 'center', paddingVertical: 30 }}>
        <Icon name="trophy" size={42} color="#fff" />
        <AppText variant="title" style={{ color: '#fff', marginTop: 8 }}>Session complete</AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
          {answered} {answered === 1 ? 'card' : 'cards'} reviewed · {pct}% remembered
        </AppText>
      </GradientCard>
      <Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {RATINGS.map((r) => (
            <View key={r.value} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: colors.chipBg }} accessible accessibilityLabel={`${r.label}: ${stats[r.value]}`}>
              <AppText variant="title" style={{ lineHeight: 30 }}>{stats[r.value]}</AppText>
              <AppText variant="caption" color="text2">{r.label}</AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" color="muted" style={{ textAlign: 'center', marginTop: 12 }}>Cards you got wrong come back on schedule.</AppText>
      </Card>
      {summary && summary.due > 0 ? <AppText variant="small" color="text2" style={{ textAlign: 'center' }}>{summary.due} more {summary.due === 1 ? 'card is' : 'cards are'} due. You can keep going.</AppText> : null}
      {summary && summary.due > 0 ? <Button title="Keep going" icon="refresh" full onPress={onKeepGoing} /> : null}
      <Button title="Practise in a chat" icon="chatbubble-ellipses" variant="ghost" full onPress={() => router.navigate('/chat')} />
      <Button title="See your progress" variant="ghost" full onPress={() => router.push('/progress')} />
    </View>
  );
}

export default function Review() {
  const { colors } = useTheme();
  const tts = useTts();
  const s = useReviewSession({ onFinish: tts.stop });

  if (s.summary.isLoading) {
    return (
      <Screen top>
        <ScreenHeader title="Review" />
        <Loading />
      </Screen>
    );
  }
  if (s.summary.error || !s.summary.data) {
    return (
      <Screen top>
        <ScreenHeader title="Review" />
        <ErrorBanner error={s.summary.error} onRetry={() => void s.summary.refetch()} />
      </Screen>
    );
  }

  if (s.phase === 'done') {
    return (
      <Screen top>
        <ScreenHeader title="Review" />
        <Done stats={s.stats} summary={s.summary.data} onKeepGoing={() => void s.start()} />
      </Screen>
    );
  }

  if (s.phase === 'session' && s.card) {
    const answered = answeredCount(s.stats);
    const pct = Math.round((Math.min(answered, s.total) / s.total) * 100);
    return (
      <Screen top>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="small" weight="700" color="text2">{Math.min(answered + 1, s.total)} of {s.total}</AppText>
            <Pressable onPress={s.stop} accessibilityRole="button" accessibilityLabel={answered ? 'Finish' : 'Close'} hitSlop={10}>
              <AppText variant="small" weight="700" color="primaryText">{answered ? 'Finish' : 'Close'}</AppText>
            </Pressable>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="Review progress" accessibilityValue={{ min: 0, max: s.total, now: answered }} style={{ height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.max(pct, 3)}%`, borderRadius: 5, backgroundColor: colors.primary }} />
          </View>
        </View>
        <ReviewCard key={`${s.card.kind}-${s.card.id}-${s.card.retry ? 'r' : ''}`} card={s.card} onRate={(r) => void s.rate(r)} busy={s.busy} tts={tts} />
        <ErrorBanner error={s.error} />
      </Screen>
    );
  }

  return (
    <Screen top refreshing={s.summary.isRefetching} onRefresh={() => void s.summary.refetch()}>
      <ScreenHeader title="Review" subtitle="Spaced repetition for what you saved and got wrong." />
      <Start summary={s.summary.data} onStart={() => void s.start()} loading={s.loading} error={s.loadError} />
    </Screen>
  );
}
