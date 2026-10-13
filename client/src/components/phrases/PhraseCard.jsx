import { Dumbbell, Volume2 } from 'lucide-react';
import SaveButton from '../SaveButton';

const REGISTER_STYLE = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  formal: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  informal: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

// One phrase: what it means, an example, and the three things to do with it (save, listen, practise).
export default function PhraseCard({ phrase, categoryId, tts, onPractice, isNew = false }) {
  const speakId = `phrase-${phrase.text}`;
  return (
    <article className="card space-y-3 !p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="chip">{phrase.level}</span>
        <span className={`rounded-full px-2.5 py-1 capitalize ${REGISTER_STYLE[phrase.register] ?? REGISTER_STYLE.neutral}`}>
          {phrase.register}
        </span>
        {isNew && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">New</span>
        )}
      </div>

      <div>
        <h3 className="text-xl font-extrabold leading-snug tracking-tight">{phrase.text}</h3>
        {phrase.translation && <p className="mt-0.5 font-semibold text-violet-600 dark:text-violet-300">{phrase.translation}</p>}
        <p className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{phrase.usage}</p>
      </div>

      <p className="border-l-4 border-violet-300 pl-3 text-[15px] italic leading-relaxed text-slate-700 dark:border-violet-500/50 dark:text-slate-200">
        “{phrase.example}”
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <SaveButton
          item={{
            kind: 'phrase',
            text: phrase.text,
            meaning: phrase.usage,
            translation: phrase.translation ?? '',
            example: phrase.example,
            category: categoryId,
            source: 'phrasebank',
          }}
        />
        {tts.supported && (
          <button
            type="button"
            onClick={() => tts.speak(speakId, phrase.example)}
            aria-label={`Listen to the example for “${phrase.text}”`}
            aria-pressed={tts.speakingId === speakId}
            className={`grid size-10 place-items-center rounded-xl transition active:scale-95 ${
              tts.speakingId === speakId ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Volume2 className="size-[18px]" aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={() => onPractice(phrase)} className="btn-primary ml-auto !px-4 !py-2">
          <Dumbbell className="size-4" aria-hidden="true" /> Practise
        </button>
      </div>
    </article>
  );
}
