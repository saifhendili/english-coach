import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers, MessagesSquare, PartyPopper, RotateCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReviewCard from '../components/review/ReviewCard';
import { ErrorBanner, Spinner } from '../components/ui';
import { fetchReviewQueue, useAnswerCard, useReviewSummary } from '../hooks/useReview';
import { useTts } from '../hooks/useTts';
import { RATINGS } from '../lib/review';

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/75">{label}</p>
    </div>
  );
}

function Start({ summary, onStart, loading, error }) {
  const { due, reviewsDue, newToday, newWaiting, reviewedToday, totalCards } = summary;

  if (totalCards === 0) {
    return (
      <div className="card space-y-4 py-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand text-white shadow-glow">
          <Layers className="size-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold">Nothing to review yet</h1>
        <p className="mx-auto max-w-sm text-slate-600 dark:text-slate-300">
          Save words and phrases from your chats, or browse the phrasebank. Your mistakes from conversations are added automatically.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/chat" className="btn-primary"><MessagesSquare className="size-4" aria-hidden="true" /> Start a chat</Link>
          <Link to="/phrases" className="btn-ghost">Browse phrases</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white shadow-glow">
        <div className="absolute -right-14 -top-14 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-extrabold">{due > 0 ? 'Time to review' : 'All caught up'}</h1>
          <p className="mt-1 max-w-sm text-white/80">
            {due > 0
              ? 'A few minutes now, and what you saved stays in your head.'
              : reviewedToday > 0
                ? 'Nice work today. Your next cards come back when it is time.'
                : 'Nothing is due right now. Cards come back when it is time.'}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat value={reviewsDue} label="to review" />
            <Stat value={newToday} label="new today" />
            <Stat value={reviewedToday} label="done today" />
          </div>
          {due > 0 && (
            <button className="btn mt-5 w-full bg-white py-3.5 text-base text-violet-700 shadow-lg hover:bg-white/90 sm:w-auto" onClick={onStart} disabled={loading}>
              {loading ? <Spinner className="size-5" /> : <Sparkles className="size-5" aria-hidden="true" />}
              Start ({Math.min(due, 20)} cards) <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
      <ErrorBanner error={error} onRetry={onStart} />
      {newWaiting > 0 && (
        <p className="px-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {newWaiting} more new {newWaiting === 1 ? 'card is' : 'cards are'} waiting for tomorrow: {due > 0 ? 'ten new cards a day keeps it light' : 'you have done today’s ten'}.
        </p>
      )}
      <p className="px-1 text-center text-xs text-slate-400">{totalCards} cards in total</p>
    </div>
  );
}

function Done({ stats, total, summary }) {
  const answered = Object.values(stats).reduce((a, b) => a + b, 0);
  const remembered = stats[3] + stats[4];
  const pct = answered ? Math.round((remembered / answered) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-center text-white shadow-glow">
        <div className="absolute -left-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
        <PartyPopper className="relative mx-auto mb-3 size-10" aria-hidden="true" />
        <h1 className="relative text-2xl font-extrabold">Session complete</h1>
        <p className="relative mt-1 text-white/80">
          {answered} {answered === 1 ? 'card' : 'cards'} reviewed · {pct}% remembered
        </p>
      </section>
      <div className="card">
        <ul className="grid grid-cols-4 gap-2 text-center">
          {RATINGS.map((r) => (
            <li key={r.value} className="rounded-2xl bg-slate-100/80 py-3 dark:bg-slate-800/60">
              <p className="text-2xl font-extrabold">{stats[r.value]}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{r.label}</p>
            </li>
          ))}
        </ul>
        {total > answered && <p className="mt-3 text-center text-xs text-slate-400">Cards you got wrong come back on schedule.</p>}
      </div>
      {summary && summary.due > 0 && <p className="text-center text-sm text-slate-500">{summary.due} more {summary.due === 1 ? 'card is' : 'cards are'} due. You can keep going.</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        {summary?.due > 0 && <Link to="/review" reloadDocument className="btn-primary flex-1"><RotateCw className="size-4" aria-hidden="true" /> Keep going</Link>}
        <Link to="/chat" className="btn-ghost flex-1"><MessagesSquare className="size-4" aria-hidden="true" /> Practise in a chat</Link>
        <Link to="/progress" className="btn-ghost flex-1">See your progress</Link>
      </div>
    </motion.div>
  );
}

export default function Review() {
  const summary = useReviewSummary();
  const answer = useAnswerCard();
  const tts = useTts();

  const [phase, setPhase] = useState('start'); // start | session | done
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [queue, setQueue] = useState([]); // cards still to show; a card answered Again goes to the end for a second try
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [error, setError] = useState(null);

  const start = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { items } = await fetchReviewQueue(20);
      if (!items.length) {
        summary.refetch();
        return;
      }
      setQueue(items);
      setTotal(items.length);
      setStats({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setPhase('session');
    } catch (e) {
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  };

  const finish = (nextQueue) => {
    if (nextQueue.length === 0) {
      tts.stop();
      summary.refetch();
      setPhase('done');
    }
  };

  // rating === null: the "second try" of a card, which is practice only (it was already scheduled).
  const rate = async (rating) => {
    const card = queue[0];
    setError(null);
    if (rating !== null) {
      try {
        await answer.mutateAsync({ kind: card.kind, id: card.id, rating });
      } catch (e) {
        if (e.code !== 'NOT_DUE') return setError(e); // NOT_DUE: already answered elsewhere, just move on
      }
      setStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
    }
    const rest = queue.slice(1);
    const next = rating === 1 ? [...rest, { ...card, retry: true }] : rest;
    setQueue(next);
    finish(next);
  };

  if (summary.isLoading) {
    return <div className="grid place-items-center py-24 text-violet-500"><Spinner className="size-7" /></div>;
  }
  if (summary.error) return <ErrorBanner error={summary.error} onRetry={() => summary.refetch()} />;

  if (phase === 'done') return <Done stats={stats} total={total} summary={summary.data} />;

  if (phase === 'session' && queue.length > 0) {
    const card = queue[0];
    const answered = Object.values(stats).reduce((a, b) => a + b, 0);
    const pct = Math.round((Math.min(answered, total) / total) * 100);
    return (
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span>{Math.min(answered + 1, total)} of {total}</span>
            <button className="rounded-lg px-2 py-1 hover:text-slate-800 dark:hover:text-slate-200" onClick={() => { tts.stop(); summary.refetch(); setPhase(answered ? 'done' : 'start'); }}>
              {answered ? 'Finish' : 'Close'}
            </button>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total} aria-label="Review progress">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%` }} />
          </div>
        </div>
        <motion.div key={`${card.kind}-${card.id}-${card.retry ? 'r' : ''}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
          <ReviewCard card={card} onRate={rate} busy={answer.isPending} tts={tts} />
        </motion.div>
        <ErrorBanner error={error} />
      </div>
    );
  }

  return <Start summary={summary.data} onStart={start} loading={loading} error={loadError} />;
}
