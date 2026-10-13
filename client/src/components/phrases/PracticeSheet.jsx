import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCw, Shuffle, Volume2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePracticePhrase } from '../../hooks/usePhrases';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import SaveButton from '../SaveButton';
import { ErrorBanner, Spinner } from '../ui';
import VoiceButton, { VoiceStatus } from '../VoiceButton';

function Verdict({ ok, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
        ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
      }`}
    >
      {ok ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
      {children}
    </span>
  );
}

// A short drill: here is a situation, answer using the phrase, get checked by the coach.
export default function PracticeSheet({ phrase, situations, categoryId, tts, onClose }) {
  const practice = usePracticePhrase();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * situations.length));
  const [answer, setAnswer] = useState('');
  const closeRef = useRef(null);

  const append = useCallback((t) => setAnswer((prev) => `${prev ? `${prev} ` : ''}${t}`), []);
  const voice = useVoiceInput({ onText: append });
  const shown = voice.listening && voice.live ? `${answer}${answer ? ' ' : ''}${voice.live}` : answer;

  const situation = situations[index % situations.length];
  const result = practice.data?.result;

  useEffect(() => {
    if (!phrase) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phrase, onClose]);

  const check = () => {
    if (voice.listening) voice.stop();
    practice.mutate({ phrase: phrase.text, usage: phrase.usage ?? '', situation, answer: answer.trim() });
  };
  const another = () => {
    practice.reset();
    setAnswer('');
    setIndex((i) => i + 1);
  };

  return (
    <AnimatePresence>
      {phrase && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Practise ${phrase.text}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-6 pb-8 shadow-2xl sm:rounded-[2rem] dark:bg-slate-900"
          >
            <button ref={closeRef} onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="size-5" aria-hidden="true" />
            </button>

            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">Practise this phrase</p>
            <h2 className="mt-1 pr-10 text-2xl font-extrabold leading-snug">{phrase.text}</h2>
            {phrase.usage && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{phrase.usage}</p>}

            <div className="mt-4 rounded-2xl bg-brand p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/75">Your situation</p>
                  <p className="leading-relaxed">{situation}</p>
                </div>
                {situations.length > 1 && !result && (
                  <button onClick={another} aria-label="Another situation" title="Another situation" className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 hover:bg-white/25">
                    <Shuffle className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {!result && (
              <div className="mt-4 space-y-3">
                <label className="label" htmlFor="practice-answer">
                  Answer using “{phrase.text.replace(/[…]+$/, '').trim()}”
                </label>
                <textarea
                  id="practice-answer"
                  className="input min-h-28 resize-y leading-relaxed"
                  placeholder={voice.listening ? 'Speak now…' : 'Type or speak your answer…'}
                  maxLength={600}
                  value={shown}
                  readOnly={voice.busy}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <VoiceStatus voice={voice} />
                <div className="flex gap-2">
                  <VoiceButton voice={voice} variant="pill" />
                  <button className="btn-primary flex-1" onClick={check} disabled={!answer.trim() || voice.busy || practice.isPending}>
                    {practice.isPending ? <Spinner className="size-4" /> : <Check className="size-4" aria-hidden="true" />}
                    {practice.isPending ? 'Checking…' : 'Check my answer'}
                  </button>
                </div>
                <ErrorBanner error={practice.error} onRetry={check} />
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4" aria-live="polite">
                <div className="flex flex-wrap items-center gap-2">
                  <Verdict ok={result.usedPhrase}>{result.usedPhrase ? 'You used the phrase' : 'Phrase not used'}</Verdict>
                  {result.usedPhrase && <Verdict ok={result.natural}>{result.natural ? 'Natural' : 'Sounds forced'}</Verdict>}
                  <span className="ml-auto rounded-full bg-violet-100 px-3 py-1 text-sm font-extrabold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    {result.score}/10
                  </span>
                </div>
                <p className="leading-relaxed">{result.feedback}</p>

                <div className="space-y-3 rounded-2xl bg-slate-100/80 p-4 text-[15px] leading-relaxed dark:bg-slate-800/60">
                  <div>
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">You said</p>
                    <p className="text-slate-600 dark:text-slate-300">{answer}</p>
                  </div>
                  {result.corrected.trim() !== answer.trim() && (
                    <div>
                      <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Corrected</p>
                      <p className="font-medium">{result.corrected}</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-0.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                      Model answer
                      {tts.supported && (
                        <button onClick={() => tts.speak('model-answer', result.modelAnswer)} aria-label="Listen to the model answer" className="grid size-6 place-items-center rounded-md bg-violet-100 dark:bg-violet-500/15">
                          <Volume2 className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </p>
                    <p className="font-medium">{result.modelAnswer}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <SaveButton item={{ kind: 'phrase', text: phrase.text, meaning: phrase.usage ?? '', example: result.modelAnswer, category: categoryId ?? '', source: 'practice' }} className="!px-4 !py-2.5" />
                  <button className="btn-ghost" onClick={() => { practice.reset(); setAnswer(''); }}>
                    <RotateCw className="size-4" aria-hidden="true" /> Try again
                  </button>
                  {situations.length > 1 && (
                    <button className="btn-primary ml-auto" onClick={another}>
                      <Shuffle className="size-4" aria-hidden="true" /> New situation
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
