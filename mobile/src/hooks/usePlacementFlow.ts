import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { PlacementAnswer, PlacementResult, PlacementView } from '@/types';

// intro | working (waiting for the server) | question | stuck (could not carry on) | finishing (scoring) | result
export type PlacementPhase = 'intro' | 'working' | 'question' | 'stuck' | 'finishing' | 'result';

const post = <T,>(path: string, body: unknown) => api<T>(path, { method: 'POST', body });

// The adaptive level test as a small state machine. The server decides every question; this keeps track of what is on
// screen and, after a failed request, asks the server what really happened (an answer may or may not have been saved).
export function usePlacementFlow() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<PlacementPhase>('intro');
  const [view, setView] = useState<PlacementView | null>(null);
  const [answer, setAnswer] = useState<number | string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);

  const finish = useCallback(
    async (attemptId: string) => {
      setError(null);
      setPhase('finishing');
      try {
        setResult(await post<PlacementResult>('/placement/finish', { attemptId }));
        setPhase('result');
        void qc.invalidateQueries({ queryKey: ['settings'] }); // the learner's level changed
        void qc.invalidateQueries({ queryKey: ['placement'] });
      } catch (e) {
        setError(e as Error); // stays on the finishing screen, with a retry button
      }
    },
    [qc],
  );

  // Show what the server returned: the next question, or hand over to scoring.
  const enter = useCallback(
    (v: PlacementView) => {
      setView(v);
      setError(null);
      if (v.question) {
        setAnswer(null);
        setPhase('question');
      } else if (v.readyToFinish) {
        void finish(v.attemptId);
      } else {
        setPhase('stuck');
      }
    },
    [finish],
  );

  // Starts a test, or resumes the one in progress.
  const begin = useCallback(async () => {
    setError(null);
    setView(null);
    setResult(null);
    setPhase('working');
    try {
      enter(await post<PlacementView>('/placement/start', {}));
    } catch (e) {
      setError(e as Error);
      setPhase('intro');
    }
  }, [enter]);

  // After a failed request we cannot know whether the server saved the answer, so ask it.
  const resync = useCallback(
    async (current: PlacementView | null, cause?: Error) => {
      setPhase('working');
      try {
        const v = await post<PlacementView>('/placement/start', {});
        if (v.question && v.question.index === current?.question?.index) {
          // Not saved: the learner presses Continue again; their answer is still in the form.
          setView(v);
          setError(cause ?? null);
          setPhase('question');
        } else {
          enter(v); // saved: carry on with the next question
        }
      } catch (e) {
        setError(e as Error);
        setPhase('stuck');
      }
    },
    [enter],
  );

  const submit = useCallback(
    async (payload: PlacementAnswer) => {
      if (!view) return;
      setError(null);
      setPhase('working');
      try {
        enter(await post<PlacementView>('/placement/next', { attemptId: view.attemptId, answer: payload }));
      } catch (e) {
        if ((e as { code?: string }).code === 'BUSY') return setPhase('question'); // a double tap: the first one is being handled
        setError(e as Error);
        await resync(view, e as Error);
      }
    },
    [view, enter, resync],
  );

  const showResult = useCallback(async (attemptId: string) => {
    setError(null);
    try {
      setResult(await api<PlacementResult>(`/placement/${attemptId}/result`));
      setPhase('result');
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  return { phase, view, answer, setAnswer, error, result, begin, submit, skip: () => submit({ skip: true }), finish, finishEarly: () => view && finish(view.attemptId), retryResync: () => resync(view), showResult };
}
