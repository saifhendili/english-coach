import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { BarList } from '@/components/charts/BarList';
import { ChartSurface } from '@/components/charts/ChartCard';
import { ScoreChart } from '@/components/charts/ScoreChart';
import { StatTile } from '@/components/charts/StatTile';
import { AppText, Button, Card, ErrorBanner, Icon, Loading, Screen } from '@/components/ui';
import { useProgress } from '@/hooks/useProgress';
import { shortDate } from '@/lib/chart';
import { MISTAKE_LABEL } from '@/lib/mistakes';
import { focusLook } from '@/lib/skills';
import { BRAND, LEVEL_STYLE, useViz } from '@/theme';

export default function Progress() {
  const viz = useViz();
  const { data: p, isLoading, error, refetch, isRefetching } = useProgress();

  if (isLoading) {
    return <Screen><Loading /></Screen>;
  }
  if (error || !p) {
    return <Screen><ErrorBanner error={error} onRetry={() => void refetch()} /></Screen>;
  }

  const { streak, activity, totals, sessions, mistakeTypes, levels, skills } = p;
  const level = levels.at(-1);
  const previous = levels.at(-2);
  const kept = totals.words + totals.phrases;
  const hasData = totals.messages + totals.reviews + totals.corrections + kept + sessions.length > 0 || levels.length > 0;
  const last14 = (key: 'messages' | 'reviews') => activity.slice(-14).map((d) => d[key]);

  const mistakeRows = mistakeTypes.map((m) => ({ label: MISTAKE_LABEL[m.type] ?? m.type, value: m.count }));
  const skillRows = [...skills].sort((a, b) => a.score - b.score).map((s) => ({ label: focusLook(s.skill).label, value: s.score, detail: `${s.count} ${s.count === 1 ? 'question' : 'questions'}` }));

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <AppText variant="small" color="text2">What you have done, and where to focus next.</AppText>

      {/* The one number this page leads with. */}
      <ChartSurface label="Day streak" padding={20}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }} accessible accessibilityLabel={`${streak.current} day streak${streak.best > streak.current ? `, best ${streak.best}` : ''}`}>
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flame" size={32} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <AppText weight="600" style={{ color: viz.text, fontSize: 56, lineHeight: 60 }}>{streak.current}</AppText>
            <AppText variant="small" weight="700" style={{ color: viz.text2 }}>
              day streak{streak.best > streak.current ? ` · best ${streak.best}` : ''}
            </AppText>
          </View>
        </View>
        <AppText variant="small" style={{ color: viz.text2 }}>{streak.current > 0 ? 'Keep it going: chat or review today.' : 'Chat or review today to start a streak.'}</AppText>
      </ChartSurface>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 12 }}>
          <StatTile label="Level" value={level?.level ?? '—'} note={level ? `${LEVEL_STYLE[level.level]?.name ?? ''}${previous ? `, up from ${previous.level}` : ''}` : 'Take the level test'} />
          <StatTile label="Reviews, 30 days" value={totals.reviews} delta={totals.reviewsBefore > 0 || totals.reviews > 0 ? totals.reviews - totals.reviewsBefore : null} deltaLabel="vs prior 30" trend={last14('reviews')} />
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <StatTile label="Messages, 30 days" value={totals.messages} delta={totals.messagesBefore > 0 || totals.messages > 0 ? totals.messages - totals.messagesBefore : null} deltaLabel="vs prior 30" trend={last14('messages')} />
          <StatTile label="Remembered" value={totals.remembered == null ? '—' : `${totals.remembered}%`} note={totals.remembered == null ? 'Review some cards first' : 'of answers were Good or Easy'} />
        </View>
      </View>

      {!hasData ? (
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 30 }}>
          <Icon name="trending-up" size={36} color="primary" />
          <AppText variant="heading">Nothing to chart yet</AppText>
          <AppText color="text2" style={{ textAlign: 'center' }}>Have a conversation or review a few cards and your progress will appear here.</AppText>
          <Button title="Start a chat" icon="chatbubble-ellipses" onPress={() => router.dismissTo('/chat')} style={{ alignSelf: 'center' }} />
          <Button title="Review" variant="ghost" onPress={() => router.dismissTo('/review')} style={{ alignSelf: 'center' }} />
        </Card>
      ) : (
        <>
          <ActivityChart days={activity} />

          {sessions.length >= 2 ? (
            <ScoreChart sessions={sessions} />
          ) : sessions.length === 1 ? (
            <StatTile label="Score of your first finished conversation" value={sessions[0].score} note="Finish a second one to see a trend." />
          ) : null}

          {mistakeRows.length > 0 ? (
            <BarList title="Your mistakes by type" subtitle={`Most common: ${mistakeRows[0].label.toLowerCase()} (${totals.corrections} corrections in all)`} rows={mistakeRows} valueLabel="Mistakes" caption="Mistakes the coach corrected, by type" />
          ) : null}

          {skillRows.length > 0 && level ? (
            <BarList title="Skills from your level test" subtitle={`Weakest first. Taken ${shortDate(level.at)}.`} rows={skillRows} max={100} unit="%" valueLabel="Score" caption="Score per skill in the latest level test" />
          ) : null}

          <AppText variant="small" color="text2" style={{ textAlign: 'center' }}>
            {totals.words} {totals.words === 1 ? 'word' : 'words'} and {totals.phrases} {totals.phrases === 1 ? 'phrase' : 'phrases'} saved
          </AppText>
        </>
      )}
    </Screen>
  );
}
