import { ArrowRight, Drama, MessageCircle, MessagesSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorBanner, Spinner } from '../components/ui';
import { useSessions, useStartChat } from '../hooks/useChat';
import { useInterests } from '../hooks/useInterests';
import { useTopics } from '../hooks/useTopics';

const MODE_LABEL = { talk: 'Conversation', roleplay: 'Role-play', free: 'Free chat' };
const when = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function SessionRow({ s }) {
  const active = s.status === 'active';
  return (
    <Link to={`/chat/${s.id}`} className="card flex items-center gap-3 !p-3.5 transition hover:-translate-y-0.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-xl dark:bg-violet-500/15" aria-hidden="true">{s.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold leading-tight">{s.title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {MODE_LABEL[s.mode]} · {s.turns} {s.turns === 1 ? 'message' : 'messages'} · {when(s.updatedAt)}
        </span>
      </span>
      {active ? (
        <span className="chip !bg-emerald-100 !text-emerald-700 dark:!bg-emerald-500/15 dark:!text-emerald-300">Continue</span>
      ) : s.score != null ? (
        <span className="grid size-10 place-items-center rounded-xl bg-brand text-sm font-extrabold text-white" title="Score">{s.score}</span>
      ) : (
        <ArrowRight className="size-4 text-slate-400" aria-hidden="true" />
      )}
    </Link>
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
  const starting = (topicId, mode) => start.isPending && start.variables?.topicId === topicId && start.variables?.mode === mode;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white shadow-glow">
        <div className="absolute -right-14 -top-14 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <MessagesSquare className="mb-3 size-9 text-white/90" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold">Let’s talk</h1>
          <p className="mt-1 max-w-sm text-white/80">
            Chat in English. The coach answers, fixes your mistakes kindly, and shows you more natural ways to say things.
          </p>
          <button className="btn mt-5 bg-white text-violet-700 shadow-lg hover:bg-white/90" disabled={start.isPending} onClick={() => start.mutate({})}>
            {start.isPending && !start.variables?.topicId ? <Spinner className="size-4" /> : <MessageCircle className="size-4" aria-hidden="true" />}
            Start a free chat
          </button>
        </div>
      </section>

      <ErrorBanner error={start.error} />

      {active.length > 0 && (
        <section aria-labelledby="continue">
          <h2 id="continue" className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Continue</h2>
          <div className="space-y-3">{active.map((s) => <SessionRow key={s.id} s={s} />)}</div>
        </section>
      )}

      <section aria-labelledby="topics-h">
        <h2 id="topics-h" className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Talk about your topics</h2>
        {latest.length > 0 ? (
          <div className="space-y-3">
            {latest.map((t) => (
              <div key={t.id} className="card !p-3.5">
                <p className="flex items-start gap-2.5 font-bold leading-snug">
                  <span aria-hidden="true">{t.emoji}</span> {t.title}
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary flex-1 !py-2" disabled={start.isPending} onClick={() => start.mutate({ topicId: t.id, mode: 'talk' })}>
                    {starting(t.id, 'talk') ? <Spinner className="size-4" /> : <MessageCircle className="size-4" aria-hidden="true" />} Talk
                  </button>
                  <button className="btn-ghost flex-1 !py-2" disabled={start.isPending} onClick={() => start.mutate({ topicId: t.id, mode: 'roleplay' })}>
                    {starting(t.id, 'roleplay') ? <Spinner className="size-4" /> : <Drama className="size-4" aria-hidden="true" />} Role-play
                  </button>
                </div>
              </div>
            ))}
            <Link to="/topics" className="block text-center text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300">See all topics</Link>
          </div>
        ) : (
          <div className="card space-y-3 py-8 text-center">
            <Sparkles className="mx-auto size-8 text-violet-400" aria-hidden="true" />
            <p className="text-slate-600 dark:text-slate-300">
              {interests.data?.saved ? 'Generate some topics, then talk about them here.' : 'Pick your interests and we will write topics for you to talk about.'}
            </p>
            <Link to={interests.data?.saved ? '/topics' : '/interests'} className="btn-primary mx-auto">
              {interests.data?.saved ? 'Open topics' : 'Pick interests'}
            </Link>
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section aria-labelledby="history">
          <h2 id="history" className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Finished</h2>
          <div className="space-y-3">{finished.map((s) => <SessionRow key={s.id} s={s} />)}</div>
        </section>
      )}
    </div>
  );
}
