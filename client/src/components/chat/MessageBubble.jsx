import { Eye, Volume2 } from 'lucide-react';
import { useState } from 'react';
import SaveButton from '../SaveButton';
import CorrectionCard from './CorrectionCard';
import PhraseUpgrade from './PhraseUpgrade';

// Every word is a button: tap one to see what it means. The word being read aloud is highlighted.
function Words({ text, activeIndex, onWord }) {
  let n = -1;
  return text.split(/(\s+)/).map((token, i) => {
    if (!token || /^\s+$/.test(token)) return token;
    n += 1;
    const word = token.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');
    if (!word) return token;
    return (
      <button
        key={i}
        type="button"
        onClick={() => onWord(word)}
        className={`-mx-0.5 rounded px-0.5 text-left transition hover:bg-violet-200/70 dark:hover:bg-violet-500/30 ${
          n === activeIndex ? 'bg-violet-300/70 dark:bg-violet-500/50' : ''
        }`}
      >
        {token}
      </button>
    );
  });
}

export function CoachBubble({ id, text, newWords = [], streaming = false, tts, slow, hideText, onWord, sessionId }) {
  const [revealed, setRevealed] = useState(false);
  const hidden = hideText && !revealed && !streaming;
  const speaking = tts.speakingId === id;

  return (
    <div className="flex max-w-[90%] flex-col items-start">
      <div className="flex items-end gap-2">
        <div
          className={`relative rounded-3xl rounded-bl-lg border border-white/70 bg-white/90 px-4 py-3 text-[15px] leading-relaxed shadow-sm dark:border-white/[0.07] dark:bg-slate-800/90 ${
            hidden ? 'cursor-pointer select-none' : ''
          }`}
          onClick={hidden ? () => setRevealed(true) : undefined}
        >
          <span className={hidden ? 'blur-md' : ''} aria-hidden={hidden}>
            <Words text={text} activeIndex={speaking ? tts.wordIndex : -1} onWord={onWord} />
            {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-violet-500" />}
          </span>
          {hidden && (
            <span className="absolute inset-0 grid place-items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/80">
                <Eye className="size-3.5" aria-hidden="true" /> Listen first, tap to read
              </span>
            </span>
          )}
        </div>
        {tts.supported && !streaming && (
          <button
            type="button"
            onClick={() => tts.speak(id, text, { slow })}
            aria-label={speaking ? 'Stop' : 'Listen'}
            aria-pressed={speaking}
            className={`mb-1 grid size-9 shrink-0 place-items-center rounded-xl transition active:scale-95 ${
              speaking
                ? 'bg-violet-600 text-white'
                : 'bg-white/80 text-slate-500 hover:text-violet-600 dark:bg-slate-800/80 dark:text-slate-400'
            }`}
          >
            <Volume2 className="size-[18px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {newWords.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="New words">
          {newWords.map((w) => (
            <li
              key={w.word}
              className="flex items-center gap-2 rounded-2xl bg-slate-100/90 py-1 pl-3 pr-1 text-sm dark:bg-slate-800/80"
            >
              <span>
                <strong>{w.word}</strong>
                <span className="ml-1.5 text-slate-500 dark:text-slate-400">{w.translation ?? w.meaning}</span>
              </span>
              <SaveButton
                compact
                item={{ kind: 'word', text: w.word, meaning: w.meaning, translation: w.translation ?? '', example: text.slice(0, 400), source: 'chat', sessionId }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LearnerBubble({ text, correction, phrases = [], showFeedback, pending = false, tts, sessionId }) {
  return (
    <div className="ml-auto flex max-w-[92%] flex-col items-end">
      <div
        className={`rounded-3xl rounded-br-lg bg-brand px-4 py-3 text-[15px] leading-relaxed text-white shadow-md ${
          pending ? 'opacity-70' : ''
        }`}
      >
        {text}
      </div>
      {showFeedback && correction && (
        <div className="w-full">
          <CorrectionCard original={text} correction={correction} />
          {phrases.map((p) => (
            <PhraseUpgrade key={p.better} phrase={p} tts={tts} sessionId={sessionId} />
          ))}
        </div>
      )}
    </div>
  );
}
