import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, ListChecks, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import QuestionView from '../components/placement/QuestionView';
import Result from '../components/placement/Result';
import { ErrorBanner, LevelBadge, Spinner } from '../components/ui';
import { usePlacementStatus } from '../hooks/usePlacement';
import { api } from '../lib/api';
import { LEVELS, SKILLS } from '../lib/skills';

const post = (path, body) => api(path, { method: 'POST', body });

function Thinking({ title, messages }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 2400);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="card space-y-6 py-10 text-center" role="status" aria-live="polite">
      <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand text-white shadow-glow">
        <Spinner className="size-7" />
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-sm text-slate-500 dark:text-slate-400"
          >
            {messages[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mx-auto max-w-xs space-y-2.5" aria-hidden="true">
        {[100, 82, 64].map((w) => (
          <div key={w} className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800" style={{ width: `${w}%` }}>
            <div className="skeleton h-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Intro({ status, error, onStart, onShowLast }) {
  const resuming = status.data?.inProgress;
  const last = status.data?.last;

  return (
    <div className="space-y-6">
      <section className="card space-y-6 !p-6 sm:!p-8">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-glow">
            <Trophy className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Find your English level</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">An adaptive test that fits you.</p>
          </div>
        </div>

        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
          Every question is written fresh by AI. It gets harder when you do well and easier when you struggle, so a
          few minutes are enough to place you from A1 to C2.
        </p>

        <ul className="grid grid-cols-3 gap-2.5">
          {[
            { icon: ListChecks, text: 'Up to 15 questions' },
            { icon: Clock, text: 'About 10 minutes' },
            { icon: Sparkles, text: 'No repeats, ever' },
          ].map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-100/80 px-2 py-3 text-center text-xs font-semibold leading-tight sm:flex-row sm:justify-center sm:gap-2.5 sm:px-3.5 sm:text-sm dark:bg-slate-800/60"
            >
              <Icon className="size-5 shrink-0 text-violet-500 sm:size-4" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          {Object.values(SKILLS).map((s) => (
            <span key={s.label} className="chip">
              <s.icon className="size-3.5" aria-hidden="true" /> {s.label}
            </span>
          ))}
        </div>

        <p className="rounded-2xl bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <strong>Tip:</strong> don’t guess. If you really don’t know, choose “I don’t know”. It gives a more accurate
          result. Speaking questions use your microphone (Chrome works best).
        </p>

        <ErrorBanner error={error} onRetry={onStart} />

        <button className="btn-primary w-full py-3.5 text-base" onClick={onStart}>
          {resuming ? `Resume the test (${resuming.answered} answered)` : last ? 'Retake the test' : 'Start the test'}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </section>

      {last && !resuming && (
        <button
          onClick={onShowLast}
          className="card flex w-full items-center gap-4 !p-4 text-left transition hover:brightness-[1.02]"
        >
          <LevelBadge level={last.level} />
          <span className="flex-1">
            <span className="block font-bold">Your last result: {LEVELS[last.level].name}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(last.finishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </span>
          <ArrowRight className="size-5 text-violet-500" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function Placement() {
  const qc = useQueryClient();
  const status = usePlacementStatus();

  // intro | question | working | stuck | finishing | result
  const [phase, setPhase] = useState('intro');
  const [view, setView] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const finish = async (attemptId) => {
    setError(null);
    setPhase('finishing');
    try {
      setResult(await post('/placement/finish', { attemptId }));
      setPhase('result');
      qc.invalidateQueries({ queryKey: ['settings'] }); // the user's level changed
      qc.invalidateQueries({ queryKey: ['placement'] });
    } catch (e) {
      setError(e); // stays on the finishing screen, with a retry button
    }
  };

  // Show what the server returned: the next question, or hand over to scoring.
  const enter = (v) => {
    setView(v);
    setError(null);
    if (v.question) {
      setAnswer(null);
      setPhase('question');
    } else if (v.readyToFinish) {
      finish(v.attemptId);
    } else {
      setPhase('stuck');
    }
  };

  // Starts a test, or resumes the one in progress.
  const begin = async () => {
    setError(null);
    setView(null);
    setResult(null);
    setPhase('working');
    try {
      enter(await post('/placement/start', {}));
    } catch (e) {
      setError(e);
      setPhase('intro');
    }
  };

  // After a failed request we can't know whether the server saved the answer, so ask it.
  const resync = async (cause) => {
    setPhase('working');
    try {
      const v = await post('/placement/start', {});
      if (v.question && v.question.index === view.question?.index) {
        // Not saved: the learner presses Continue again; their answer is still in the form.
        setView(v);
        setError(cause ?? null);
        setPhase('question');
      } else {
        enter(v); // saved: carry on with the next question
      }
    } catch (e) {
      setError(e);
      setPhase('stuck');
    }
  };

  const submit = async (payload) => {
    setError(null);
    setPhase('working');
    try {
      enter(await post('/placement/next', { attemptId: view.attemptId, answer: payload }));
    } catch (e) {
      if (e.code === 'BUSY') return setPhase('question');
      setError(e);
      await resync(e);
    }
  };

  const showLast = async () => {
    setError(null);
    try {
      setResult(await api(`/placement/${status.data.last.attemptId}/result`));
      setPhase('result');
    } catch (e) {
      setError(e);
    }
  };

  if (phase === 'intro') {
    if (status.isLoading) {
      return (
        <div className="grid place-items-center py-24 text-violet-500">
          <Spinner className="size-7" />
        </div>
      );
    }
    return <Intro status={status} error={error ?? status.error} onStart={begin} onShowLast={showLast} />;
  }

  if (phase === 'question') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view.question.index}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <QuestionView
            view={view}
            answer={answer}
            setAnswer={setAnswer}
            error={error}
            onSubmit={submit}
            onSkip={() => submit({ skip: true })}
            onFinishEarly={() => {
              if (window.confirm('Finish now? Your level will be estimated from the questions answered so far.')) {
                finish(view.attemptId);
              }
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (phase === 'finishing') {
    return (
      <div className="space-y-4">
        <Thinking
          title="Working out your level…"
          messages={['Adding up your answers…', 'Grading your writing and speaking…', 'Writing your personal report…']}
        />
        <ErrorBanner error={error} onRetry={() => finish(view.attemptId)} />
      </div>
    );
  }

  if (phase === 'stuck') {
    return (
      <div className="space-y-4">
        <ErrorBanner error={error} onRetry={() => resync()} />
        {!error && <p className="text-center text-sm text-slate-500">Something went wrong.</p>}
      </div>
    );
  }

  if (phase === 'result') return <Result result={result} onRetake={begin} />;

  // working
  return (
    <Thinking
      title={view ? 'Thinking about your next question…' : 'Preparing your test…'}
      messages={['Writing a fresh question…', 'Matching the difficulty to your answers…', 'Almost ready…']}
    />
  );
}
