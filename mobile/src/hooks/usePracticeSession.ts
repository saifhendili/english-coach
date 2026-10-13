import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchExercises, useRecordPractice } from '@/hooks/useTenses';
import { checkAnswer } from '@/lib/tenses';
import type { Exercise, TenseAnswer, Response, Verdict } from '@/types';

export type SessionPhase = 'loading' | 'question' | 'feedback' | 'done' | 'error';

/**
 * One practice session: load the exercises, show them one at a time, check each answer on the phone (so feedback is
 * instant), and send the results to the server when it ends. A question answered wrong comes back once at the end as a
 * "second try": it is practice only and is not counted again.
 */
export function usePracticeSession({ tense, source, count = 10 }: { tense: string; source?: 'ai'; count?: number }) {
  const record = useRecordPractice();
  const [phase, setPhase] = useState<SessionPhase>('loading');
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<TenseAnswer[]>([]);
  const [missed, setMissed] = useState<Exercise[]>([]); // first attempts that were wrong, for the results screen
  const [last, setLast] = useState<Verdict | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [run, setRun] = useState(0); // bumped to start again
  const sent = useRef(false);

  useEffect(() => {
    let cancelled = false;
    sent.current = false;
    // Reset in the same tick as the request, so a restart shows the loading state at once.
    void (async () => {
      setPhase('loading');
      setError(null);
      setSaveError(null);
      setResults([]);
      setMissed([]);
      setLast(null);
      try {
        const exercises = await fetchExercises({ tense, source, count });
        if (cancelled) return;
        if (!exercises.length) throw new Error('There are no exercises to practise yet.');
        setQueue(exercises);
        setTotal(exercises.length);
        setPhase('question');
      } catch (e) {
        if (cancelled) return;
        setError(e as Error);
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tense, source, count, run]);

  const save = useCallback(
    async (items: TenseAnswer[]) => {
      if (sent.current || items.length === 0) return;
      sent.current = true;
      setSaveError(null);
      try {
        await record.mutateAsync(items);
      } catch (e) {
        sent.current = false; // allow "try again"
        setSaveError(e as Error);
      }
    },
    [record],
  );

  const submit = useCallback(
    (response: Response) => {
      const ex = queue[0];
      if (!ex || phase !== 'question') return;
      const verdict = checkAnswer(ex, response);
      setLast(verdict);
      setPhase('feedback');
      if (ex.retry) return; // a second try is practice only
      setResults((r) => [...r, { id: ex.id, tense: ex.tense, correct: verdict.correct }]);
      if (!verdict.correct) {
        setMissed((m) => [...m, ex]);
        setQueue((q) => [...q, { ...ex, retry: true }]);
      }
    },
    [queue, phase],
  );

  const next = useCallback(() => {
    const rest = queue.slice(1);
    setQueue(rest);
    setLast(null);
    if (rest.length === 0) {
      setPhase('done');
      void save(results);
    } else {
      setPhase('question');
    }
  }, [queue, results, save]);

  // "Finish" part-way: what was answered still counts.
  const stop = useCallback(() => {
    setPhase('done');
    void save(results);
  }, [results, save]);

  const answered = results.length;
  return {
    phase,
    exercise: queue[0] ?? null,
    // "Question N of total": while the verdict of question N is showing, `answered` already counts it, so it is not added again.
    position: Math.max(1, Math.min(phase === 'feedback' && !queue[0]?.retry ? answered : answered + 1, total)),
    total,
    answered,
    correct: results.filter((r) => r.correct).length,
    results,
    missed,
    remaining: queue.length,
    last,
    error,
    saveError,
    saving: record.isPending,
    submit,
    next,
    stop,
    retrySave: () => void save(results),
    restart: () => setRun((n) => n + 1),
  };
}
