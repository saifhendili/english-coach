import { Sparkles, Volume2 } from 'lucide-react';
import SaveButton from '../SaveButton';

// "Sound more natural": a common expression that would improve what the learner said.
export default function PhraseUpgrade({ phrase, tts, sessionId }) {
  const id = `upgrade-${phrase.better}`;
  return (
    <div className="mt-2 rounded-2xl border border-violet-200/80 bg-violet-50/80 p-3.5 text-sm dark:border-violet-500/25 dark:bg-violet-500/[0.08]">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
        <Sparkles className="size-3.5" aria-hidden="true" /> Sound more natural
      </p>
      {phrase.said && (
        <p className="text-slate-500 line-through decoration-slate-400 dark:text-slate-400">{phrase.said}</p>
      )}
      <p className="text-base font-bold leading-snug text-slate-900 dark:text-white">{phrase.better}</p>
      <p className="mt-1 leading-snug text-slate-600 dark:text-slate-300">{phrase.why}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <SaveButton
          item={{ kind: 'phrase', text: phrase.better, meaning: phrase.why, example: '', source: 'chat', sessionId }}
        />
        {tts?.supported && (
          <button
            type="button"
            onClick={() => tts.speak(id, phrase.better)}
            aria-label={`Listen to “${phrase.better}”`}
            className={`grid size-9 place-items-center rounded-xl transition active:scale-95 ${
              tts.speakingId === id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Volume2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
