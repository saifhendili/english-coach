import { Check, Eye, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { segments } from '../../lib/markup';
import { RATINGS, cardMode, clozeParts, matchesAnswer, suggestedRating } from '../../lib/review';

const TONES = {
  rose: 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25',
  amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25',
  emerald: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25',
  sky: 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:hover:bg-sky-500/25',
};

const KIND_LABEL = { word: 'Word', phrase: 'Phrase', mistake: 'Mistake' };

function Blank({ children, revealed }) {
  return revealed ? (
    <mark className="rounded bg-emerald-100 px-1 font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">{children}</mark>
  ) : (
    <span className="mx-1 inline-block h-6 w-24 translate-y-1.5 rounded-lg border-b-4 border-violet-400 bg-violet-100/80 dark:border-violet-500 dark:bg-violet-500/15" aria-label="blank" />
  );
}

function Typed({ value, onChange, onEnter, placeholder }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <>
      <label className="sr-only" htmlFor="review-answer">
        Your answer
      </label>
      <input
        id="review-answer"
        ref={ref}
        className="input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      />
    </>
  );
}

function Verdict({ correct, typed, target }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-sm ${
        correct ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'
      }`}
      role="status"
    >
      {correct ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <p>
        {correct ? (
          <strong>Right.</strong>
        ) : (
          <>
            <strong>Not quite.</strong> You wrote “{typed}”. The answer is “{target}”.
          </>
        )}
      </p>
    </div>
  );
}

// One card: question, answer, then the four rating buttons.
export default function ReviewCard({ card, onRate, busy, tts }) {
  const mode = cardMode(card);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);

  const target = mode === 'mistake' ? card.right : card.text;
  const typedAnswer = mode !== 'recall' && typed.trim() ? typed.trim() : null;
  const correct = typedAnswer ? matchesAnswer(typedAnswer, target) : null;
  const suggested = correct === null ? null : suggestedRating(correct);
  const cloze = mode === 'cloze' ? clozeParts(card.example, card.text) : null;

  const reveal = () => setRevealed(true);
  // A "second try" card was already scheduled: moving on sends nothing (rating null).
  const rate = (value) => onRate(card.retry ? null : value);

  // Keyboard: space/enter shows the answer, 1-4 rate it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || busy) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
      } else if (revealed && card.retry && e.key === 'Enter') {
        onRate(null);
      } else if (revealed && !card.retry && /^[1-4]$/.test(e.key)) {
        onRate(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const speak = (id, text) =>
    tts.supported && (
      <button
        type="button"
        onClick={() => tts.speak(id, text)}
        aria-label="Listen"
        aria-pressed={tts.speakingId === id}
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition active:scale-95 ${
          tts.speakingId === id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-300'
        }`}
      >
        <Volume2 className="size-[18px]" aria-hidden="true" />
      </button>
    );

  return (
    <div className="card space-y-5 !p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="chip">{KIND_LABEL[card.type]}</span>
        {card.isNew && !card.retry && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">New</span>}
        {card.retry && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Second try</span>}
        {mode === 'mistake' && card.errorType && <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{card.errorType}</span>}
      </div>

      {/* ---- the question ---- */}
      {mode === 'cloze' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">What is missing?</p>
          <p className="text-xl font-bold leading-relaxed">
            {cloze.before}
            <Blank revealed={revealed}>{cloze.match}</Blank>
            {cloze.after}
          </p>
          {(card.translation || card.meaning) && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-violet-600 dark:text-violet-300">Hint:</span> {card.translation || card.meaning}
            </p>
          )}
        </div>
      )}

      {mode === 'recall' && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">What does this mean?</p>
          <div className="flex items-center gap-3">
            <p className="flex-1 text-3xl font-extrabold leading-tight tracking-tight">{card.text}</p>
            {speak(`card-${card.id}`, card.text)}
          </div>
        </div>
      )}

      {mode === 'mistake' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">You wrote this. Fix the marked part.</p>
          <p className="text-xl font-bold leading-relaxed">
            {card.sentence
              ? segments(card.sentence, [card.wrong]).map((s, i) =>
                  s.hit ? (
                    <mark key={i} className={`rounded bg-rose-100 px-1 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ${revealed ? 'line-through decoration-2' : ''}`}>
                      {s.text}
                    </mark>
                  ) : (
                    <span key={i}>{s.text}</span>
                  ),
                )
              : card.wrong}
          </p>
        </div>
      )}

      {!revealed && mode !== 'recall' && (
        <Typed value={typed} onChange={setTyped} onEnter={reveal} placeholder={mode === 'mistake' ? 'Type the corrected version…' : 'Type the missing words (optional)…'} />
      )}

      {!revealed && (
        <button className="btn-primary w-full py-3.5 text-base" onClick={reveal}>
          <Eye className="size-5" aria-hidden="true" /> Show answer
        </button>
      )}

      {/* ---- the answer ---- */}
      {revealed && (
        <div className="space-y-4" aria-live="polite">
          {correct !== null && <Verdict correct={correct} typed={typedAnswer} target={target} />}

          {mode === 'cloze' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-xl font-extrabold">{card.text}</p>
                {speak(`card-${card.id}`, card.example)}
              </div>
              {card.meaning && <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{card.meaning}</p>}
              {card.translation && <p className="font-semibold text-violet-600 dark:text-violet-300">{card.translation}</p>}
            </div>
          )}

          {mode === 'recall' && (
            <div className="space-y-2">
              {card.translation && <p className="text-xl font-extrabold text-violet-600 dark:text-violet-300">{card.translation}</p>}
              {card.meaning && <p className="text-[15px] leading-relaxed">{card.meaning}</p>}
              {card.example && <p className="border-l-4 border-violet-300 pl-3 text-[15px] italic text-slate-600 dark:border-violet-500/50 dark:text-slate-300">“{card.example}”</p>}
            </div>
          )}

          {mode === 'mistake' && (
            <div className="space-y-3 rounded-2xl bg-slate-100/80 p-4 dark:bg-slate-800/60">
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{card.right}</p>
              {card.corrected && <p className="text-[15px] leading-relaxed">{card.corrected}</p>}
              {card.explanation && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{card.explanation}</p>}
            </div>
          )}

          {card.retry ? (
            <button className="btn-primary w-full py-3.5" disabled={busy} onClick={() => rate()}>
              Next
            </button>
          ) : (
            <div>
              <p className="mb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">How well did you remember it?</p>
              <div className="grid grid-cols-4 gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    disabled={busy}
                    onClick={() => rate(r.value)}
                    className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-3 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${TONES[r.tone]} ${
                      suggested === r.value ? 'ring-4 ring-violet-500/40' : ''
                    }`}
                    aria-label={`${r.label}, back in ${card.preview[r.value]}`}
                  >
                    {r.label}
                    <span className="text-xs font-medium opacity-70">{card.preview[r.value]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 hidden text-center text-xs text-slate-400 md:block">Keys 1 to 4</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
