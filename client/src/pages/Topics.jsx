import { AnimatePresence } from 'framer-motion';
import { Heart, Sliders, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TopicCard from '../components/topics/TopicCard';
import { ErrorBanner, Spinner } from '../components/ui';
import { useStartChat } from '../hooks/useChat';
import { useInterests } from '../hooks/useInterests';
import { useSettings } from '../hooks/useSettings';
import { useGenerateTopics, useToggleFavorite, useTopics } from '../hooks/useTopics';

function SkeletonCard() {
  return (
    <div className="card space-y-4" aria-hidden="true">
      <div className="flex gap-2">
        {[20, 24, 14].map((w, i) => (
          <div key={i} className="skeleton h-6 rounded-full bg-slate-200/80 dark:bg-slate-800" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="skeleton h-6 w-4/5 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
      <div className="skeleton h-4 w-full rounded-lg bg-slate-200/80 dark:bg-slate-800" />
      <div className="skeleton h-4 w-2/3 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-white text-violet-700 shadow dark:bg-slate-800 dark:text-violet-300'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export default function Topics() {
  const interests = useInterests();
  const settings = useSettings();

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [field, setField] = useState(null);
  const view = { favorite: favoritesOnly, field: favoritesOnly ? null : field };

  const topics = useTopics(view);
  const generate = useGenerateTopics(view);
  const toggle = useToggleFavorite();
  const startChat = useStartChat();

  const saved = interests.data?.saved;
  const list = topics.data ?? [];
  const canGenerate = Boolean(saved) && !favoritesOnly;
  const busy = generate.isPending;

  // Safety net for the free quota: the feed only auto-generates after the learner has
  // scrolled, so a tall screen cannot trigger a chain of generations on its own.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const mark = () => setScrolled(true);
    window.addEventListener('scroll', mark, { once: true, passive: true });
    return () => window.removeEventListener('scroll', mark);
  }, []);

  const more = () => {
    if (canGenerate && !busy && !generate.isError && topics.isSuccess) generate.mutate({});
  };

  // First visit (nothing stored yet): generate the first batch. Only for "All": a filtered
  // view that happens to be empty gets a button instead, so switching chips never spends quota.
  const startedRef = useRef(false);
  useEffect(() => {
    if (canGenerate && !view.field && topics.isSuccess && list.length === 0 && !startedRef.current) {
      startedRef.current = true;
      generate.mutate({});
    }
  });

  // Infinite scroll: near the bottom, ask for another batch.
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !scrolled) return undefined;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && more(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  });

  if (interests.isLoading || settings.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-violet-500">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (!saved) {
    return (
      <div className="card space-y-4 py-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand text-white shadow-glow">
          <Sparkles className="size-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold">Pick your interests first</h1>
        <p className="mx-auto max-w-sm text-slate-600 dark:text-slate-300">
          Tell us what you like and what you want to improve, and we’ll write endless topics just for you.
        </p>
        <Link to="/interests" className="btn-primary mx-auto">
          Choose interests
        </Link>
      </div>
    );
  }

  const noLevel = !settings.data?.level;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Topics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fresh conversation ideas, made for you.</p>
        </div>
        <Link to="/interests" className="btn-ghost !px-3.5 !py-2">
          <Sliders className="size-4" aria-hidden="true" /> Interests
        </Link>
      </div>

      {noLevel && (
        <p className="rounded-2xl bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          These topics are written for level B1. <Link to="/placement" className="font-bold underline">Take the level test</Link>{' '}
          and they will match you exactly.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Topic lists" className="inline-flex rounded-2xl bg-slate-200/60 p-1 dark:bg-slate-800/60">
          <Tab active={!favoritesOnly} onClick={() => setFavoritesOnly(false)} icon={Sparkles}>
            Discover
          </Tab>
          <Tab active={favoritesOnly} onClick={() => setFavoritesOnly(true)} icon={Heart}>
            Favourites
          </Tab>
        </div>
        {canGenerate && (
          <button className="btn-primary !py-2.5" disabled={busy} onClick={() => generate.mutate({ surprise: true })}>
            {busy ? <Spinner className="size-4" /> : <Wand2 className="size-4" aria-hidden="true" />}
            Surprise me
          </button>
        )}
      </div>

      {!favoritesOnly && interests.data.fields.length > 1 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by interest">
          <div className="flex gap-2">
            {[{ name: null, emoji: '🌈', label: 'All' }, ...interests.data.fields.map((f) => ({ ...f, label: f.name }))].map((f) => (
              <button
                key={f.label}
                aria-pressed={field === f.name}
                onClick={() => setField(f.name)}
                className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
                  field === f.name
                    ? 'border-transparent bg-brand text-white'
                    : 'border-slate-200/80 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
                }`}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ErrorBanner error={topics.error} onRetry={() => topics.refetch()} />
      <ErrorBanner error={startChat.error} />

      <div className="space-y-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {list.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              onToggleFavorite={(x) => toggle.mutate({ id: x.id, favorite: !x.favorite })}
              onStart={(x, mode) => startChat.mutate({ topicId: x.id, mode })}
              starting={startChat.isPending && startChat.variables?.topicId === t.id ? startChat.variables.mode : null}
            />
          ))}
        </AnimatePresence>

        {(topics.isLoading || busy) && (
          <>
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300">
              <Spinner className="size-4" /> {list.length ? 'Writing more topics…' : 'Writing your first topics…'}
            </p>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {canGenerate && view.field && topics.isSuccess && list.length === 0 && !busy && !generate.isError && (
          <div className="card space-y-3 py-8 text-center">
            <p className="text-slate-600 dark:text-slate-300">No topics about {view.field} yet.</p>
            <button className="btn-primary mx-auto" onClick={() => generate.mutate({})}>
              <Wand2 className="size-4" aria-hidden="true" /> Write some
            </button>
          </div>
        )}

        {favoritesOnly && topics.isSuccess && list.length === 0 && (
          <div className="card py-10 text-center text-slate-500 dark:text-slate-400">
            <Heart className="mx-auto mb-3 size-8 text-rose-300" aria-hidden="true" />
            No favourites yet. Tap the heart on a topic you like.
          </div>
        )}
      </div>

      <ErrorBanner error={generate.error} onRetry={() => generate.mutate({})} retryLabel="Try again" />

      {canGenerate && list.length > 0 && !busy && !generate.isError && (
        <div className="flex flex-col items-center gap-3 pb-2">
          <div ref={sentinel} aria-hidden="true" className="h-px w-full" />
          <button className="btn-ghost" onClick={() => generate.mutate({})}>
            <Sparkles className="size-4 text-violet-500" aria-hidden="true" /> More topics
          </button>
        </div>
      )}
    </div>
  );
}
