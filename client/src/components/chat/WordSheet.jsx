import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Volume2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useDictionary, useExplainWord } from '../../hooks/useDictionary';
import SaveButton from '../SaveButton';
import { ErrorBanner, Spinner } from '../ui';

// Bottom sheet with the dictionary entry for a tapped word, and a Save button.
export default function WordSheet({ word, sentence, tts, sessionId, onClose }) {
  const dict = useDictionary(word);
  const explain = useExplainWord();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!word) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, onClose]);

  const entry = dict.data;
  const first = entry?.definitions[0];
  const ai = explain.data?.explanation;

  // A new word: forget the previous one's explanation.
  useEffect(() => {
    explain.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);
  const playAudio = () => {
    if (entry?.audio) new Audio(entry.audio).play().catch(() => tts.speak(`word-${word}`, word));
    else tts.speak(`word-${word}`, word);
  };

  return (
    <AnimatePresence>
      {word && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Meaning of ${word}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white p-6 pb-8 shadow-2xl sm:rounded-[2rem] dark:bg-slate-900"
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <h2 className="pr-10 text-3xl font-extrabold tracking-tight">{entry?.word ?? word}</h2>
            <div className="mt-1 flex items-center gap-3 text-slate-500 dark:text-slate-400">
              {entry?.phonetic && <span className="font-mono text-sm">{entry.phonetic}</span>}
              <button
                onClick={playAudio}
                aria-label={`Hear “${word}”`}
                className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300"
              >
                <Volume2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 min-h-12" aria-live="polite">
              {dict.isLoading && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner className="size-4" /> Looking it up…
                </p>
              )}
              {dict.isError && <p className="text-sm text-rose-600">{dict.error.message}</p>}
              {dict.isSuccess && !entry && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No dictionary entry for “{word}”. You can still save it.
                </p>
              )}
              {entry && (
                <ol className="space-y-3">
                  {entry.definitions.map((d, i) => (
                    <li key={i} className="text-[15px] leading-relaxed">
                      <span className="mr-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold italic text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {d.partOfSpeech}
                      </span>
                      {d.text}
                      {d.example && <p className="mt-0.5 text-sm italic text-slate-500 dark:text-slate-400">“{d.example}”</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {ai && (
              <div className="mt-2 rounded-2xl bg-violet-50 p-4 text-[15px] leading-relaxed dark:bg-violet-500/10" aria-live="polite">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  <Sparkles className="size-3.5" aria-hidden="true" /> In this sentence
                </p>
                {ai.translation && <p className="text-lg font-extrabold text-violet-700 dark:text-violet-300">{ai.translation}</p>}
                <p>{ai.meaning}</p>
                <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">“{ai.example}”</p>
              </div>
            )}
            <ErrorBanner error={explain.error} onRetry={() => explain.mutate({ word, sentence })} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {/* Saving waits for the dictionary (or the explanation); asking Gemini does not, so a slow dictionary never blocks help. */}
              {(dict.isSuccess || dict.isError || ai) && (
                <SaveButton
                  item={{
                    kind: 'word',
                    text: entry?.word ?? word,
                    meaning: first?.text ?? ai?.meaning ?? '',
                    translation: ai?.translation ?? '',
                    example: entry?.definitions.find((d) => d.example)?.example ?? ai?.example ?? sentence?.slice(0, 400) ?? '',
                    source: 'dictionary',
                    sessionId,
                  }}
                  className="!px-4 !py-2.5"
                />
              )}
              {!ai && (
                <button
                  type="button"
                  className="btn-ghost !px-4 !py-2.5"
                  disabled={explain.isPending}
                  onClick={() => explain.mutate({ word, sentence })}
                >
                  {explain.isPending ? <Spinner className="size-4" /> : <Sparkles className="size-4 text-violet-500" aria-hidden="true" />}
                  {explain.isPending ? 'Explaining…' : 'Explain in context'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
