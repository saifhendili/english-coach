import { ArrowLeft, Bookmark, Dumbbell, Library, Search, Trash2, Volume2, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PhraseCard from '../components/phrases/PhraseCard';
import PracticeSheet from '../components/phrases/PracticeSheet';
import { ErrorBanner, Spinner } from '../components/ui';
import { useMorePhrases, usePhrasebank } from '../hooks/usePhrases';
import { useSaved } from '../hooks/useSaved';
import { useTts } from '../hooks/useTts';
import { GENERIC_SITUATIONS } from '../lib/saved';

function Tab({ active, to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      role="tab"
      aria-selected={active}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-violet-700 shadow dark:bg-slate-800 dark:text-violet-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

function Categories({ categories, saved }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((c) => {
        const kept = c.phrases.filter((p) => saved.isSaved('phrase', p.text)).length;
        return (
          <Link key={c.id} to={`/phrases/${c.id}`} className="card flex items-start gap-4 !p-4 transition hover:-translate-y-0.5 hover:shadow-2xl">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-2xl dark:bg-violet-500/15" aria-hidden="true">
              {c.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-bold leading-tight">{c.label}</span>
              <span className="mt-0.5 block text-sm leading-snug text-slate-500 dark:text-slate-400">{c.blurb}</span>
              <span className="mt-2 block text-xs font-semibold text-violet-600 dark:text-violet-300">
                {c.phrases.length} phrases{kept > 0 && ` · ${kept} saved`}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CategoryView({ category, tts, onPractice }) {
  const more = useMorePhrases();
  const [extra, setExtra] = useState([]); // generated phrases, kept while this page is open

  const loadMore = () =>
    more.mutate(
      { categoryId: category.id, exclude: extra.map((p) => p.text) },
      { onSuccess: ({ phrases }) => setExtra((prev) => [...prev, ...phrases]) },
    );

  return (
    <div className="space-y-4">
      <div>
        <Link to="/phrases" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300">
          <ArrowLeft className="size-4" aria-hidden="true" /> All categories
        </Link>
        <div className="flex items-center gap-3 px-1">
          <span className="text-3xl" aria-hidden="true">{category.emoji}</span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{category.label}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{category.blurb}</p>
          </div>
        </div>
      </div>

      {category.phrases.map((p) => (
        <PhraseCard key={p.text} phrase={p} categoryId={category.id} tts={tts} onPractice={onPractice} />
      ))}
      {extra.map((p) => (
        <PhraseCard key={p.text} phrase={p} categoryId={category.id} tts={tts} onPractice={onPractice} isNew />
      ))}

      <ErrorBanner error={more.error} onRetry={loadMore} />
      <button className="btn-ghost w-full" onClick={loadMore} disabled={more.isPending}>
        {more.isPending ? <Spinner className="size-4" /> : <Wand2 className="size-4 text-violet-500" aria-hidden="true" />}
        {more.isPending ? 'Finding more…' : 'More like these'}
      </button>
    </div>
  );
}

const KINDS = [
  ['all', 'All'],
  ['phrase', 'Phrases'],
  ['word', 'Words'],
];

function SavedView({ saved, tts, onPractice }) {
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');

  const counts = useMemo(
    () => ({ all: saved.items.length, phrase: saved.items.filter((i) => i.kind === 'phrase').length, word: saved.items.filter((i) => i.kind === 'word').length }),
    [saved.items],
  );
  const items = saved.items.filter((i) => {
    if (kind !== 'all' && i.kind !== kind) return false;
    const needle = q.trim().toLowerCase();
    return !needle || [i.text, i.meaning, i.translation].some((s) => s?.toLowerCase().includes(needle));
  });

  if (saved.isLoading) {
    return <div className="grid place-items-center py-16 text-violet-500"><Spinner className="size-6" /></div>;
  }
  if (!saved.items.length) {
    return (
      <div className="card space-y-3 py-10 text-center">
        <Bookmark className="mx-auto size-9 text-violet-400" aria-hidden="true" />
        <h2 className="text-lg font-bold">Nothing saved yet</h2>
        <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Tap <strong>Save</strong> on a phrase, or on a word or phrase the coach suggests in a conversation, and it will be kept here.
        </p>
        <Link to="/phrases" className="btn-primary mx-auto">Browse phrases</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Show" className="inline-flex rounded-2xl bg-slate-200/60 p-1 dark:bg-slate-800/60">
          {KINDS.map(([id, label]) => (
            <button
              key={id}
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${kind === id ? 'bg-white text-violet-700 shadow dark:bg-slate-800 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {label} <span className="opacity-60">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label className="sr-only" htmlFor="saved-search">Search saved items</label>
          <input id="saved-search" className="input !py-2.5 !pl-10" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {items.length === 0 && <p className="card text-center text-slate-500">Nothing matches.</p>}

      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="card !p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2">
                  <span className="chip !px-2 !py-0.5 !text-[11px] capitalize">{i.kind}</span>
                </p>
                <h3 className="text-lg font-extrabold leading-snug">{i.text}</h3>
                {i.translation && <p className="font-semibold text-violet-600 dark:text-violet-300">{i.translation}</p>}
                {i.meaning && <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{i.meaning}</p>}
                {i.example && <p className="mt-1.5 border-l-4 border-violet-300 pl-3 text-sm italic text-slate-600 dark:border-violet-500/50 dark:text-slate-300">“{i.example}”</p>}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {tts.supported && (
                  <button onClick={() => tts.speak(`saved-${i.id}`, i.example || i.text)} aria-label={`Listen to ${i.text}`} aria-pressed={tts.speakingId === `saved-${i.id}`} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-300">
                    <Volume2 className="size-4" aria-hidden="true" />
                  </button>
                )}
                {i.kind === 'phrase' && (
                  <button onClick={() => onPractice({ text: i.text, usage: i.meaning, category: i.category })} aria-label={`Practise ${i.text}`} className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300">
                    <Dumbbell className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button onClick={() => saved.remove(i.id)} aria-label={`Remove ${i.text}`} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Phrases() {
  const { categoryId } = useParams();
  const [params] = useSearchParams();
  const tab = params.get('tab') === 'saved' ? 'saved' : 'browse';

  const book = usePhrasebank();
  const saved = useSaved();
  const tts = useTts();
  const [practicing, setPracticing] = useState(null); // { phrase, categoryId }

  if (book.isLoading) {
    return <div className="grid place-items-center py-24 text-violet-500"><Spinner className="size-7" /></div>;
  }
  if (book.error) return <ErrorBanner error={book.error} onRetry={() => book.refetch()} />;

  const category = categoryId && book.data.find((c) => c.id === categoryId);
  const situationsFor = (id) => book.data.find((c) => c.id === id)?.situations ?? GENERIC_SITUATIONS;

  const openPractice = (phrase, fallbackCategory) => setPracticing({ phrase, categoryId: phrase.category || fallbackCategory || '' });

  return (
    <div className="space-y-5">
      {!category && (
        <>
          <div className="px-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Power phrases</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Natural expressions to use again and again. Save them, say them, practise them.</p>
          </div>
          <div role="tablist" aria-label="Phrases" className="inline-flex rounded-2xl bg-slate-200/60 p-1 dark:bg-slate-800/60">
            <Tab active={tab === 'browse'} to="/phrases" icon={Library}>Browse</Tab>
            <Tab active={tab === 'saved'} to="/phrases?tab=saved" icon={Bookmark}>Saved{saved.items.length > 0 && ` (${saved.items.length})`}</Tab>
          </div>
        </>
      )}

      {categoryId && !category && (
        <div className="card text-center">
          <p className="mb-3 text-slate-600">That category does not exist.</p>
          <Link to="/phrases" className="btn-primary mx-auto">All categories</Link>
        </div>
      )}
      {!categoryId && tab === 'browse' && <Categories categories={book.data} saved={saved} />}
      {!categoryId && tab === 'saved' && <SavedView saved={saved} tts={tts} onPractice={(p) => openPractice(p)} />}
      {category && <CategoryView category={category} tts={tts} onPractice={(p) => openPractice(p, category.id)} />}

      <PracticeSheet
        key={practicing?.phrase.text}
        phrase={practicing?.phrase}
        categoryId={practicing?.categoryId}
        situations={situationsFor(practicing?.categoryId)}
        tts={tts}
        onClose={() => setPracticing(null)}
      />
    </div>
  );
}
