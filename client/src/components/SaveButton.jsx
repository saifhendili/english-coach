import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSaved } from '../hooks/useSaved';

// Saves a word or phrase to the learner's collection. `item` = { kind, text, meaning, example, ... }.
// Every instance shares the same saved list, so the button reads "Saved" everywhere at once.
export default function SaveButton({ item, compact = false, className = '' }) {
  const saved = useSaved();
  const on = saved.isSaved(item.kind, item.text);
  const label = on ? 'Saved. Tap to remove' : `Save “${item.text}”`;

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => saved.toggle(item)}
      className={`inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold transition active:scale-95 ${
        compact ? 'size-9 justify-center' : 'px-3 py-2'
      } ${
        on
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-violet-500/15 dark:hover:text-violet-300'
      } ${className}`}
    >
      {on ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
      {!compact && (on ? 'Saved' : 'Save')}
    </button>
  );
}
