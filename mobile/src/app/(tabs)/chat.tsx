import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppText, Button, Card, Chip, ErrorBanner, GradientCard, Icon, Screen } from '@/components/ui';
import { useSessions, useStartChat } from '@/hooks/useChat';
import { useInterests } from '@/hooks/useInterests';
import { useTopics } from '@/hooks/useTopics';
import { useTheme } from '@/theme';
import type { SessionListItem } from '@/types';

const MODE_LABEL = { talk: 'Conversation', roleplay: 'Role-play', free: 'Free chat' } as const;
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1, paddingHorizontal: 4 }}>
      {children.toUpperCase()}
    </AppText>
  );
}

function SessionRow({ s }: { s: SessionListItem }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: s.id } })} accessibilityRole="button" accessibilityLabel={`${s.title}, ${s.status === 'active' ? 'continue' : 'finished'}`} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <AppText style={{ fontSize: 22 }}>{s.emoji}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="700" numberOfLines={1}>{s.title}</AppText>
          <AppText variant="caption" color="text2">
            {MODE_LABEL[s.mode]} · {s.turns} {s.turns === 1 ? 'message' : 'messages'} · {when(s.updatedAt)}
          </AppText>
        </View>
        {s.status === 'active' ? (
          <Chip label="Continue" tone="success" />
        ) : s.score != null ? (
          <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }} accessibilityLabel={`Score ${s.score}`}>
            <AppText weight="800" style={{ color: '#fff' }}>{s.score}</AppText>
          </View>
        ) : (
          <Icon name="chevron-forward" size={18} color="muted" />
        )}
      </Card>
    </Pressable>
  );
}

export default function Chat() {
  const sessions = useSessions();
  const interests = useInterests();
  const topics = useTopics({});
  const start = useStartChat();

  const list = sessions.data ?? [];
  const active = list.filter((s) => s.status === 'active');
  const finished = list.filter((s) => s.status === 'ended');
  const latest = (topics.data ?? []).slice(0, 4);
  const starting = (topicId: string, mode: string) => start.isPending && start.variables?.topicId === topicId && start.variables?.mode === mode;

  const refresh = () => Promise.all([sessions.refetch(), topics.refetch()]);

  return (
    <Screen top refreshing={sessions.isRefetching} onRefresh={refresh}>
      <ScreenHeader title="Chat" />

      <GradientCard>
        <Icon name="chatbubbles" size={34} color="#fff" />
        <AppText variant="title" style={{ color: '#fff', marginTop: 10 }}>Let’s talk</AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          Chat in English. The coach answers, fixes your mistakes kindly, and shows you more natural ways to say things.
        </AppText>
        <View style={{ marginTop: 16 }}>
          <Button title="Start a free chat" icon="chatbubble-ellipses" variant="white" loading={start.isPending && !start.variables?.topicId && !start.variables?.title} disabled={start.isPending} onPress={() => start.mutate({})} />
        </View>
      </GradientCard>

      <ErrorBanner error={start.error} />

      {active.length > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionTitle>Continue</SectionTitle>
          {active.map((s) => <SessionRow key={s.id} s={s} />)}
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <SectionTitle>Talk about your topics</SectionTitle>
        {latest.length > 0 ? (
          <>
            {latest.map((t) => (
              <Card key={t.id} style={{ padding: 14, gap: 12 }}>
                <AppText weight="700">{t.emoji}  {t.title}</AppText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button title="Talk" icon="chatbubble-ellipses" size="sm" loading={starting(t.id, 'talk')} disabled={start.isPending} onPress={() => start.mutate({ topicId: t.id, mode: 'talk' })} style={{ flex: 1 }} />
                  <Button title="Role-play" icon="people" variant="soft" size="sm" loading={starting(t.id, 'roleplay')} disabled={start.isPending} onPress={() => start.mutate({ topicId: t.id, mode: 'roleplay' })} style={{ flex: 1 }} />
                </View>
              </Card>
            ))}
            <Button title="See all topics" variant="ghost" size="sm" full onPress={() => router.push('/topics')} />
          </>
        ) : (
          <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 26 }}>
            <Icon name="sparkles" size={30} color="primary" />
            <AppText color="text2" style={{ textAlign: 'center' }}>
              {interests.data?.saved ? 'Generate some topics, then talk about them here.' : 'Pick your interests and we will write topics for you to talk about.'}
            </AppText>
            <Button title={interests.data?.saved ? 'Open topics' : 'Pick interests'} onPress={() => router.push(interests.data?.saved ? '/topics' : '/interests')} style={{ alignSelf: 'center' }} />
          </Card>
        )}
      </View>

      {finished.length > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionTitle>Finished</SectionTitle>
          {finished.map((s) => <SessionRow key={s.id} s={s} />)}
        </View>
      ) : null}
    </Screen>
  );
}
