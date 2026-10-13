import { ArrowRight, BookOpen } from 'lucide-react';
import { useCallback } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { SKILLS } from '../../lib/skills';
import { ErrorBanner } from '../ui';
import VoiceButton, { VoiceStatus } from '../VoiceButton';

const LETTERS = ['A', 'B', 'C', 'D'];

// Turns "She ____ to school" into text with a visible gap.
function Prompt({ text }) {
  return text.split(/(_{2,})/).map((part, i) =>
    /^_{2,}$/.test(part) ? <span key={i} className="blank" aria-label="blank" /> : part,
  );
}

const countWords = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function Writing({ answer, setAnswer }) {
  const text = answer ?? '';
  return (
    <div>
      <label className="sr-only" htmlFor="written-answer">
        Your answer
      </label>
      <textarea
        id="written-answer"
        className="input min-h-44 resize-y leading-relaxed"
        placeholder="Write your answer here…"
        maxLength={1500}
        value={text}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <p className="hint text-right">{countWords(text)} words</p>
    </div>
  );
}

function Speaking({ answer, setAnswer }) {
  const text = answer ?? '';
  // What is said is appended to the box, so it can be edited before sending.
  const append = useCallback((phrase) => setAnswer((prev) => `${prev ? `${prev} ` : ''}${phrase}`), [setAnswer]);
  const voice = useVoiceInput({ onText: append });
  const shown = voice.listening && voice.live ? `${text}${text ? ' ' : ''}${voice.live}` : text;

  return (
    <div className="flex flex-col items-center gap-3">
      <VoiceButton voice={voice} variant="big" />
      <VoiceStatus voice={voice} className="text-center !text-sm" />
      {!voice.visible && (
        <p className="w-full rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          Voice input isn’t available in this browser. Type what you would say instead.
        </p>
      )}
      <div className="w-full">
        <label className="sr-only" htmlFor="spoken-answer">
          What you said
        </label>
        <textarea
          id="spoken-answer"
          className="input min-h-32 resize-y leading-relaxed"
          placeholder={voice.visible ? 'Tap the mic and speak, or type your answer. You can edit it before sending.' : 'Type your answer…'}
          maxLength={1500}
          value={shown}
          readOnly={voice.busy}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
    </div>
  );
}

function Choices({ options, answer, setAnswer }) {
  return (
    <div role="radiogroup" aria-label="Answer options" className="space-y-3">
      {options.map((option, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={answer === i}
          className="option"
          onClick={() => setAnswer(i)}
        >
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold transition ${
              answer === i
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {LETTERS[i]}
          </span>
          <span className="leading-snug">{option}</span>
        </button>
      ))}
    </div>
  );
}

export default function QuestionView({ view, answer, setAnswer, onSubmit, onSkip, onFinishEarly, error }) {
  const q = view.question;
  const skill = SKILLS[q.type];
  const productive = !q.options;
  const ready = productive ? Boolean(answer?.trim()) : typeof answer === 'number';
  const pct = Math.round((view.answered / view.maxQuestions) * 100);

  const submit = () => onSubmit(productive ? { text: answer.trim() } : { choiceIndex: answer });

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span className="chip">
            <skill.icon className="size-3.5" aria-hidden="true" />
            {skill.label}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Question {view.answered + 1} <span className="font-medium opacity-70">of up to {view.maxQuestions}</span>
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={view.answered}
          aria-valuemin={0}
          aria-valuemax={view.maxQuestions}
          aria-label="Test progress"
        >
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
      </div>

      {q.passage && (
        <div className="card border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <BookOpen className="size-4" aria-hidden="true" /> Read the text
          </p>
          <p className="whitespace-pre-line leading-relaxed">{q.passage}</p>
        </div>
      )}

      <h2 className="text-xl font-bold leading-snug sm:text-2xl">
        <Prompt text={q.prompt} />
      </h2>

      {q.options ? (
        <Choices options={q.options} answer={answer} setAnswer={setAnswer} />
      ) : q.type === 'speaking' ? (
        <Speaking answer={answer} setAnswer={setAnswer} />
      ) : (
        <Writing answer={answer} setAnswer={setAnswer} />
      )}

      <ErrorBanner error={error} />

      <div className="flex flex-col gap-3 pt-1">
        <button className="btn-primary w-full py-3.5 text-base" disabled={!ready} onClick={submit}>
          Continue <ArrowRight className="size-5" aria-hidden="true" />
        </button>
        <div className="flex items-center justify-between text-sm font-semibold">
          <button
            className="rounded-lg px-2 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={onSkip}
          >
            I don’t know
          </button>
          {view.canFinishEarly && (
            <button
              className="rounded-lg px-2 py-1 text-violet-600 hover:underline dark:text-violet-400"
              onClick={onFinishEarly}
            >
              Finish now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
