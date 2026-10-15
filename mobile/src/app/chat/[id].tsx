import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatInput } from '@/components/chat/ChatInput';
import { CoachBubble, LearnerBubble } from '@/components/chat/MessageBubbles';
import { Summary } from '@/components/chat/Summary';
import { WordSheet } from '@/components/chat/WordSheet';
import { AppText, Button, ErrorBanner, GradientCard, Icon, Spinner, type IconName } from '@/components/ui';
import { useStartChat, useSession } from '@/hooks/useChat';
import { useChatTurn } from '@/hooks/useChatTurn';
import { useSettings } from '@/hooks/useSettings';
import { useTts } from '@/hooks/useTts';
import { api } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { useTheme } from '@/theme';
import type { ChatSession } from '@/types';

const MODE_LABEL = { talk: 'Conversation', roleplay: 'Role-play', free: 'Free chat' } as const;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/chat');
}

function Toggle({ on, onPress, icon, label }: { on: boolean; onPress: () => void; icon: IconName; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : 'transparent' }}
    >
      <Icon name={icon} size={20} color={on ? '#fff' : colors.text2} />
    </Pressable>
  );
}

// With the keyboard open, the home-indicator space below the input is already covered.
function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setShown(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return shown;
}

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const settings = useSettings();
  const tts = useTts();
  const startNext = useStartChat();
  const session = useSession(id);
  const keyboard = useKeyboardShown();

  const [input, setInput] = useState('');
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<Error | null>(null);
  const [slow, setSlow] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [word, setWord] = useState<{ word: string; sentence: string } | null>(null);

  const scroller = useRef<ScrollView>(null);
  const stick = useRef(true); // follow new text, unless the learner scrolled up to read

  // In listening practice the coach's reply is read out loud as soon as it arrives.
  const turn = useChatTurn(id, { onReply: (reply, turns) => hideText && tts.speak(`msg-${turns * 2}`, reply.text, { slow }) });

  const data: ChatSession | undefined = session.data;
  const ended = data?.status === 'ended';

  // A finished conversation opens on its report, not at the end of the transcript.
  useEffect(() => {
    if (!ended) return;
    stick.current = false;
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [ended]);

  // Follow the new text, unless the learner scrolled up to read. Whether they are "at the bottom" is judged only when their
  // finger lifts (or the fling ends): scroll events also fire when the content merely grows, and on Android one of those
  // arrives before the scroll-to-end and would wrongly detach the view from the bottom.
  const atBottom = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    stick.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || turn.sending) return;
    setInput('');
    stick.current = true;
    // Nothing was saved when a turn fails, so give the text back to be sent again.
    if ((await turn.send(text)) === 'failed') setInput((current) => current || text);
  };

  const end = async () => {
    if (!data) return;
    const message = data.turns
      ? 'The coach will write your report.'
      : 'You have not written anything yet, so there will be no report.';
    if (!(await confirmAsync('End this conversation?', message, data.turns ? 'End and see report' : 'End', !data.turns))) return;
    tts.stop();
    setEnding(true);
    setEndError(null);
    try {
      const { session: finished } = await api<{ session: ChatSession }>(`/sessions/${id}/end`, { method: 'POST' });
      qc.setQueryData(['session', id], finished);
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setEndError(err as Error);
    } finally {
      setEnding(false);
    }
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: insets.top + 6, paddingBottom: 8, paddingHorizontal: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable onPress={() => { tts.stop(); leave(); }} accessibilityRole="button" accessibilityLabel="Back to chat" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-back" size={26} color="text" />
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: 4 }}>
        {data ? (
          <>
            <AppText weight="800" numberOfLines={1} accessibilityRole="header">{data.emoji} {data.title}</AppText>
            <AppText variant="caption" color="text2">{MODE_LABEL[data.mode]} · {data.level}{ended ? ' · finished' : ''}</AppText>
          </>
        ) : null}
      </View>
      {data ? (
        <>
          <Toggle on={slow} onPress={() => setSlow((v) => !v)} icon="speedometer-outline" label="Read aloud slowly" />
          <Toggle on={hideText} onPress={() => setHideText((v) => !v)} icon="eye-off-outline" label="Hide the coach's text (listening practice)" />
          {!ended ? (
            <Button title="End" icon="flag-outline" variant="ghost" size="sm" loading={ending} disabled={turn.sending} onPress={end} style={{ marginLeft: 4, marginRight: 4 }} />
          ) : null}
        </>
      ) : null}
    </View>
  );

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          {session.error ? (
            <>
              <ErrorBanner error={session.error} onRetry={() => void session.refetch()} />
              <Button title="Back to chat" variant="ghost" onPress={leave} />
            </>
          ) : (
            <Spinner size="large" />
          )}
        </View>
      </View>
    );
  }

  const showFeedback = ended || settings.data?.settings.correctionMode === 'every';
  const failed = turn.error;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      {header}

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScrollBeginDrag={() => {
          stick.current = false; // the learner took hold of the page
        }}
        onScrollEndDrag={atBottom}
        onMomentumScrollEnd={atBottom}
        onContentSizeChange={() => stick.current && scroller.current?.scrollToEnd({ animated: false })}
      >
        {data.scenario ? (
          <GradientCard style={{ padding: 16, borderRadius: 22 }}>
            <AppText variant="small" style={{ color: '#fff' }}>
              <AppText variant="small" weight="800" style={{ color: '#fff' }}>Scene:  </AppText>
              {data.scenario}
            </AppText>
          </GradientCard>
        ) : null}

        {ended ? (
          <>
            <Summary session={data} starting={startNext.isPending} onStartNext={(title) => startNext.mutate({ title })} />
            <ErrorBanner error={startNext.error} />
            <AppText variant="caption" weight="800" color="muted" style={{ letterSpacing: 1, paddingHorizontal: 4, paddingTop: 6 }}>YOUR CONVERSATION</AppText>
          </>
        ) : null}

        <View style={{ gap: 16 }} accessibilityLabel="Conversation">
          {data.messages.map((m, i) =>
            m.role === 'assistant' ? (
              <CoachBubble
                key={i}
                id={`msg-${i}`}
                text={m.text}
                newWords={m.newWords}
                tts={tts}
                slow={slow}
                hideText={hideText && !ended}
                onWord={(w) => setWord({ word: w, sentence: m.text })}
                sessionId={data.id}
              />
            ) : (
              <LearnerBubble key={i} text={m.text} correction={m.correction} phrases={m.phrases} showFeedback={showFeedback} tts={tts} sessionId={data.id} />
            ),
          )}
          {turn.pending ? (
            <>
              <LearnerBubble text={turn.pending.user} pending tts={tts} />
              {turn.pending.bot ? (
                <CoachBubble id="streaming" text={turn.pending.bot} streaming tts={tts} slow={slow} hideText={false} onWord={() => {}} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="progressbar" accessibilityLabel="Coach is typing">
                  <Spinner />
                  <AppText variant="small" color="text2">Coach is typing…</AppText>
                </View>
              )}
            </>
          ) : null}
        </View>

        {ending ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 }} accessibilityRole="progressbar" accessibilityLabel="Writing your report">
            <Spinner />
            <AppText variant="small" weight="700" color="primaryText">Writing your report…</AppText>
          </View>
        ) : null}
        <ErrorBanner error={endError} onRetry={end} />
        <ErrorBanner error={failed} onRetry={failed && input.trim() ? send : undefined} retryLabel="Send again" />
      </ScrollView>

      {!ended ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: keyboard ? 10 : Math.max(insets.bottom, 12), backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          <ChatInput value={input} onChange={setInput} onSend={send} disabled={turn.sending || ending} onVoiceStart={tts.stop} />
        </View>
      ) : null}

      <WordSheet word={word?.word ?? null} sentence={word?.sentence} tts={tts} sessionId={data.id} onClose={() => setWord(null)} />
    </KeyboardAvoidingView>
  );
}
