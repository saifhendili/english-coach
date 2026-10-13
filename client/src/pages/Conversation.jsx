import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, EyeOff, Flag, Snail } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChatInput from '../components/chat/ChatInput';
import { CoachBubble, LearnerBubble } from '../components/chat/MessageBubble';
import Summary from '../components/chat/Summary';
import WordSheet from '../components/chat/WordSheet';
import { ErrorBanner, Spinner } from '../components/ui';
import { useStartChat } from '../hooks/useChat';
import { useSettings } from '../hooks/useSettings';
import { useTts } from '../hooks/useTts';
import { api } from '../lib/api';
import { streamPost } from '../lib/stream';

const MODE_LABEL = { talk: 'Conversation', roleplay: 'Role-play', free: 'Free chat' };

function Toggle({ on, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-xl transition active:scale-95 ${
        on ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </button>
  );
}

export default function Conversation() {
  const { id } = useParams();
  const qc = useQueryClient();
  const settings = useSettings();
  const tts = useTts();
  const startNext = useStartChat();

  const { data: session, isLoading, error: loadError } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => (await api(`/sessions/${id}`)).session,
    staleTime: Infinity, // the page keeps it up to date itself
  });

  const [input, setInput] = useState('');
  const [pending, setPending] = useState(null); // { user, bot }: the turn being streamed
  const [error, setError] = useState(null);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState(null);
  const [slow, setSlow] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [word, setWord] = useState(null); // { word, sentence }

  const scroller = useRef(null);
  const stick = useRef(true); // follow new text, unless the learner scrolled up to read
  const controller = useRef(null);

  const patch = useCallback((fn) => qc.setQueryData(['session', id], (old) => old && fn(old)), [qc, id]);

  useEffect(() => () => controller.current?.abort(), []); // leaving the page stops an unfinished reply

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [session?.messages.length, pending?.bot, pending?.user, error, ending]);

  // A finished conversation opens on its report, not at the end of the transcript.
  const isEnded = session?.status === 'ended';
  useEffect(() => {
    if (!isEnded) return;
    stick.current = false;
    scroller.current?.scrollTo({ top: 0 });
  }, [isEnded]);

  const send = async (text) => {
    setError(null);
    setInput('');
    setPending({ user: text, bot: '' });
    stick.current = true;

    const ac = new AbortController();
    controller.current = ac;
    let failure = null;
    let finished = false;
    try {
      await streamPost('/chat/turn', { sessionId: id, text }, {
        signal: ac.signal,
        onEvent: (name, data) => {
          if (name === 'delta') setPending((p) => p && { ...p, bot: p.bot + data.text });
          if (name === 'error') failure = data;
          if (name === 'done') {
            finished = true;
            patch((s) => ({ ...s, turns: data.turns, messages: [...s.messages, data.userMessage, data.assistantMessage] }));
            setPending(null);
            if (hideText) tts.speak(`msg-${data.turns * 2}`, data.assistantMessage.text, { slow });
          }
        },
      });
      if (!finished && !failure) failure = { message: 'The connection was lost. Your message was not sent.' };
    } catch (err) {
      if (err.name === 'AbortError') return;
      failure = { code: err.code, message: err.message };
    }
    if (failure) {
      // Nothing was saved, so the learner can simply send it again: give the text back.
      setPending(null);
      setInput(text);
      setError(failure);
    }
  };

  const end = async () => {
    const msg = session.turns
      ? 'End this conversation and see your report?'
      : 'End this conversation? You have not written anything yet, so there will be no report.';
    if (!window.confirm(msg)) return;
    tts.stop();
    setEnding(true);
    setEndError(null);
    try {
      const { session: ended } = await api(`/sessions/${id}/end`, { method: 'POST' });
      qc.setQueryData(['session', id], ended);
      qc.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setEndError(err);
    } finally {
      setEnding(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-slate-50 dark:bg-slate-950">
        {loadError ? (
          <div className="space-y-3 text-center">
            <p className="text-rose-600">{loadError.message}</p>
            <Link to="/chat" className="btn-ghost">Back to chat</Link>
          </div>
        ) : (
          <Spinner className="size-7 text-violet-500" />
        )}
      </div>
    );
  }

  const ended = session.status === 'ended';
  const showFeedback = ended || settings.data?.settings.correctionMode === 'every';
  const sending = Boolean(pending);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center gap-2 border-b border-slate-200/70 bg-white/80 px-3 py-2.5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-slate-900/80">
        <Link
          to="/chat"
          aria-label="Back to chat"
          onClick={() => tts.stop()}
          className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold leading-tight">
            <span aria-hidden="true">{session.emoji}</span> {session.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {MODE_LABEL[session.mode]} · {session.level}
            {ended && ' · finished'}
          </p>
        </div>
        {tts.supported && <Toggle on={slow} onClick={() => setSlow((v) => !v)} icon={Snail} label="Read aloud slowly" />}
        <Toggle on={hideText} onClick={() => setHideText((v) => !v)} icon={EyeOff} label="Hide the coach's text (listening practice)" />
        {!ended && (
          <button className="btn-ghost !px-3 !py-2" onClick={end} disabled={ending || sending}>
            {ending ? <Spinner className="size-4" /> : <Flag className="size-4" aria-hidden="true" />}
            End
          </button>
        )}
      </header>

      <div
        ref={scroller}
        className="flex-1 overflow-y-auto px-4 py-5"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
      >
        <div className="mx-auto max-w-2xl space-y-4">
          {session.scenario && (
            <p className="rounded-2xl bg-brand p-3.5 text-sm leading-relaxed text-white">
              <strong className="mr-1">Scene:</strong>
              {session.scenario}
            </p>
          )}

          {ended && (
            <Summary
              session={session}
              starting={startNext.isPending}
              onStartNext={(title) => startNext.mutate({ title })}
            />
          )}
          {ended && <ErrorBanner error={startNext.error} />}
          {ended && <h2 className="px-1 pt-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your conversation</h2>}

          <div className="space-y-4" aria-live="polite" aria-label="Conversation">
            {session.messages.map((m, i) =>
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
                  sessionId={session.id}
                />
              ) : (
                <LearnerBubble key={i} text={m.text} correction={m.correction} phrases={m.phrases} showFeedback={showFeedback} tts={tts} sessionId={session.id} />
              ),
            )}
            {pending && (
              <>
                <LearnerBubble text={pending.user} pending tts={tts} />
                {pending.bot ? (
                  <CoachBubble id="streaming" text={pending.bot} streaming tts={tts} slow={slow} onWord={() => {}} />
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
                    <Spinner className="size-4" /> Coach is typing…
                  </p>
                )}
              </>
            )}
          </div>

          {ending && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-violet-600" role="status">
              <Spinner className="size-4" /> Writing your report…
            </p>
          )}
          <ErrorBanner error={endError} onRetry={end} />
          <ErrorBanner error={error} onRetry={error && input.trim() ? () => send(input.trim()) : undefined} retryLabel="Send again" />
        </div>
      </div>

      {!ended && (
        <footer className="border-t border-slate-200/70 bg-white/80 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/[0.07] dark:bg-slate-900/80">
          <div className="mx-auto max-w-2xl">
            <ChatInput value={input} onChange={setInput} onSend={() => send(input.trim())} disabled={sending || ending} />
          </div>
        </footer>
      )}

      <WordSheet word={word?.word} sentence={word?.sentence} tts={tts} sessionId={session.id} onClose={() => setWord(null)} />
    </div>
  );
}
