import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SaveButton } from '@/components/SaveButton';
import { AppText, Button, Card, GradientCard, Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme';
import type { ChatSession } from '@/types';

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`Score ${score} out of 100`}>
      <Svg width={128} height={128} viewBox="0 0 120 120" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={10} />
        <Circle cx="60" cy="60" r={radius} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
      </Svg>
      <AppText weight="800" style={{ color: '#fff', fontSize: 38, lineHeight: 42 }}>{score}</AppText>
      <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>of 100</AppText>
    </View>
  );
}

function Section({ icon, title, tone, children }: { icon: IconName; title: string; tone: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: tone + '2a' }}>
          <Icon name={icon} size={16} color={tone} />
        </View>
        <AppText variant="subhead">{title}</AppText>
      </View>
      {children}
    </Card>
  );
}

// The report shown when a conversation is over.
export function Summary({ session, onStartNext, starting }: { session: ChatSession; onStartNext: (title: string) => void; starting: boolean }) {
  const { colors } = useTheme();
  const { report, stats } = session;

  // Things worth keeping from this chat, once each.
  const phrases = [...new Map(session.messages.flatMap((m) => m.phrases).map((p) => [p.better.toLowerCase(), p])).values()];
  const words = [...new Map(session.messages.flatMap((m) => m.newWords).map((w) => [w.word.toLowerCase(), w])).values()];

  return (
    <View style={{ gap: 14 }}>
      <GradientCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          {report ? <ScoreRing score={report.score} /> : <Icon name="chatbubbles" size={56} color="#fff" />}
          <View style={{ flex: 1, gap: 3 }}>
            <AppText variant="small" weight="600" style={{ color: 'rgba(255,255,255,0.75)' }}>Conversation finished</AppText>
            <AppText variant="heading" style={{ color: '#fff' }}>{session.title}</AppText>
            {stats ? (
              <AppText variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {stats.turns} {stats.turns === 1 ? 'message' : 'messages'} · {stats.mistakes} {stats.mistakes === 1 ? 'correction' : 'corrections'} · {stats.minutes} min
              </AppText>
            ) : null}
          </View>
        </View>
      </GradientCard>

      {!report ? (
        <Card><AppText color="text2" style={{ textAlign: 'center' }}>{session.turns === 0 ? 'You did not write anything, so there is no report.' : 'The report could not be written this time.'}</AppText></Card>
      ) : (
        <>
          <Card><AppText>{report.summary}</AppText></Card>

          {report.strengths.length > 0 ? (
            <Section icon="checkmark-circle" title="What went well" tone={colors.success}>
              {report.strengths.map((s) => (
                <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 9, backgroundColor: colors.success }} />
                  <AppText variant="small" style={{ flex: 1 }}>{s}</AppText>
                </View>
              ))}
            </Section>
          ) : null}

          {report.topMistakes.length > 0 ? (
            <Section icon="trending-up" title="Work on these" tone={colors.warn}>
              {report.topMistakes.map((m) => (
                <View key={m.pattern} style={{ gap: 2 }}>
                  <AppText weight="700">{m.pattern}</AppText>
                  <AppText variant="small" color="text2">{m.example}</AppText>
                  <AppText variant="small">{m.tip}</AppText>
                </View>
              ))}
            </Section>
          ) : null}
        </>
      )}

      {phrases.length > 0 || words.length > 0 ? (
        <Section icon="bookmarks" title="Worth keeping" tone={colors.primary}>
          {phrases.map((p) => (
            <View key={p.better} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: colors.chipBg }}>
              <View style={{ flex: 1 }}>
                <AppText weight="700">{p.better}</AppText>
                <AppText variant="caption" color="text2">{p.why}</AppText>
              </View>
              <SaveButton compact item={{ kind: 'phrase', text: p.better, meaning: p.why, source: 'chat', sessionId: session.id }} />
            </View>
          ))}
          {words.map((w) => (
            <View key={w.word} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: colors.chipBg }}>
              <AppText style={{ flex: 1 }}>
                <AppText weight="800">{w.word}</AppText>
                <AppText color="text2">  {w.translation ?? w.meaning}</AppText>
              </AppText>
              <SaveButton compact item={{ kind: 'word', text: w.word, meaning: w.meaning, translation: w.translation ?? '', source: 'chat', sessionId: session.id }} />
            </View>
          ))}
        </Section>
      ) : null}

      {report?.nextTopic ? (
        <Section icon="flag" title="Try next" tone={colors.info}>
          <View>
            <AppText weight="700">{report.nextTopic.title}</AppText>
            <AppText variant="small" color="text2">{report.nextTopic.why}</AppText>
          </View>
          <Button title="Start this conversation" icon="bulb-outline" trailingIcon="arrow-forward" full loading={starting} onPress={() => onStartNext(report.nextTopic.title)} />
        </Section>
      ) : null}
    </View>
  );
}
