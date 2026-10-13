import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TopicCard } from '@/components/topics/TopicCard';
import { AppText, Button, Card, ErrorBanner, Icon, Loading, Screen, Segmented, SkeletonCard, Spinner } from '@/components/ui';
import { useStartChat } from '@/hooks/useChat';
import { useInterests } from '@/hooks/useInterests';
import { useSettings } from '@/hooks/useSettings';
import { useGenerateTopics, useToggleFavorite, useTopics } from '@/hooks/useTopics';
import { BRAND, useTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

type Mode = 'discover' | 'favourites';

export default function Topics() {
  const { colors } = useTheme();
  const interests = useInterests();
  const settings = useSettings();

  const [mode, setMode] = useState<Mode>('discover');
  const [field, setField] = useState<string | null>(null);
  const favoritesOnly = mode === 'favourites';
  const view = { favorite: favoritesOnly, field: favoritesOnly ? null : field };

  const topics = useTopics(view);
  const generate = useGenerateTopics(view);
  const toggle = useToggleFavorite();
  const startChat = useStartChat();

  const saved = interests.data?.saved;
  const list = topics.data ?? [];
  const canGenerate = Boolean(saved) && !favoritesOnly;
  const busy = generate.isPending;

  const more = useCallback(() => {
    if (canGenerate && !busy && !generate.isError && topics.isSuccess) generate.mutate({});
  }, [canGenerate, busy, generate, topics.isSuccess]);

  // First visit (nothing stored yet): write the first batch. Only for "All": a filtered view that happens to be empty
  // gets a button instead, so switching chips never spends the free quota.
  const started = useRef(false);
  useEffect(() => {
    if (canGenerate && !view.field && topics.isSuccess && list.length === 0 && !started.current) {
      started.current = true;
      generate.mutate({});
    }
  });

  // Near the bottom of a list the learner has scrolled: write another batch. (Scroll events only come from the learner's
  // finger, so a tall screen can never start a chain of batches on its own.)
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      if (contentSize.height - contentOffset.y - layoutMeasurement.height < 500) more();
    },
    [more],
  );

  if (interests.isLoading || settings.isLoading) {
    return (
      <Screen top>
        <ScreenHeader title="Topics" />
        <Loading />
      </Screen>
    );
  }

  if (!saved) {
    return (
      <Screen top>
        <ScreenHeader title="Topics" />
        <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 30 }}>
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={32} color="#fff" />
          </LinearGradient>
          <AppText variant="title" style={{ textAlign: 'center' }}>Pick your interests first</AppText>
          <AppText color="text2" style={{ textAlign: 'center' }}>Tell us what you like and what you want to improve, and we’ll write endless topics just for you.</AppText>
          <Button title="Choose interests" onPress={() => router.push('/interests')} style={{ alignSelf: 'center' }} />
        </Card>
      </Screen>
    );
  }

  const noLevel = !settings.data?.level;
  const fields = interests.data?.fields ?? [];
  const chips = [{ name: null as string | null, emoji: '🌈', label: 'All' }, ...fields.map((f) => ({ ...f, label: f.name }))];

  return (
    <Screen top onScroll={onScroll} refreshing={topics.isRefetching && !busy} onRefresh={() => void topics.refetch()}>
      <ScreenHeader title="Topics" subtitle="Fresh conversation ideas, made for you." />

      {noLevel ? (
        <Pressable onPress={() => router.push('/placement')} accessibilityRole="button" style={{ padding: 14, borderRadius: 18, backgroundColor: colors.warnSoft }}>
          <AppText variant="small" style={{ color: colors.warnText }}>
            These topics are written for level B1. <AppText variant="small" weight="800" style={{ color: colors.warnText, textDecorationLine: 'underline' }}>Take the level test</AppText> and they will match you exactly.
          </AppText>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Segmented<Mode> label="Topic lists" value={mode} onChange={setMode} options={[{ value: 'discover', label: 'Discover' }, { value: 'favourites', label: 'Favourites' }]} />
        {canGenerate ? <Button title="Surprise me" icon="color-wand" size="sm" loading={busy} onPress={() => generate.mutate({ surprise: true })} /> : null}
      </View>

      {!favoritesOnly && fields.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Filter by interest" contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }} style={{ flexGrow: 0, marginHorizontal: -18 }}>
          {chips.map((f) => {
            const on = field === f.name;
            return (
              <Pressable
                key={f.label}
                onPress={() => setField(f.name)}
                accessibilityRole="button"
                accessibilityLabel={f.label}
                accessibilityState={{ selected: on }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }}
              >
                <AppText variant="small" weight="700" color={on ? 'primaryText' : 'text2'}>{f.emoji} {f.label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ErrorBanner error={topics.error} onRetry={() => void topics.refetch()} />
      <ErrorBanner error={startChat.error} />

      <View style={{ gap: 16 }}>
        {list.map((t) => (
          <TopicCard
            key={t.id}
            topic={t}
            onToggleFavorite={(x) => toggle.mutate({ id: x.id, favorite: !x.favorite })}
            onStart={(x, m) => startChat.mutate({ topicId: x.id, mode: m })}
            starting={startChat.isPending && startChat.variables?.topicId === t.id ? (startChat.variables.mode ?? 'talk') : null}
          />
        ))}

        {topics.isLoading || busy ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }} accessibilityRole="progressbar" accessibilityLabel="Writing topics">
              <Spinner />
              <AppText variant="small" weight="700" color="primaryText">{list.length ? 'Writing more topics…' : 'Writing your first topics…'}</AppText>
            </View>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}

        {canGenerate && view.field && topics.isSuccess && list.length === 0 && !busy && !generate.isError ? (
          <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
            <AppText color="text2">No topics about {view.field} yet.</AppText>
            <Button title="Write some" icon="color-wand" onPress={() => generate.mutate({})} style={{ alignSelf: 'center' }} />
          </Card>
        ) : null}

        {favoritesOnly && topics.isSuccess && list.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 32 }}>
            <Icon name="heart-outline" size={32} color="#fda4af" />
            <AppText color="text2" style={{ textAlign: 'center' }}>No favourites yet. Tap the heart on a topic you like.</AppText>
          </Card>
        ) : null}
      </View>

      <ErrorBanner error={generate.error} onRetry={() => generate.mutate({})} />

      {canGenerate && list.length > 0 && !busy && !generate.isError ? (
        <Button title="More topics" icon="sparkles" variant="ghost" onPress={() => generate.mutate({})} style={{ alignSelf: 'center' }} />
      ) : null}
    </Screen>
  );
}
