import { useCallback, useState } from 'react';
import { fetchReviewQueue, useAnswerCard, useReviewSummary } from '@/hooks/useReview';
import type { ReviewCardData, ReviewRating } from '@/types';

export type Phase = 'start' | 'session' | 'done';
export type Stats = Record<ReviewRating, number>;
const EMPTY: Stats = { 1: 0, 2: 0, 3: 0, 4: 0 };

export const answeredCount = (stats: Stats) => stats[1] + stats[2] + stats[3] + stats[4];

// One review session: load up to 20 due cards, show them one at a time, send each rating to the server.
// A card answered Again goes to the end once more as a "second try", which is practice only (it was already scheduled).
export function useReviewSession({ onFinish }: { onFinish?: () => void } = {}) {
  const summary = useReviewSummary();
  const answer = useAnswerCard();

  const [phase, setPhase] = useState<Phase>('start');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [queue, setQueue] = useState<ReviewCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [error, setError] = useState<Error | null>(null);

  const { refetch } = summary;

  const start = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { items } = await fetchReviewQueue(20);
      if (!items.length) {
        void refetch(); // someone else answered them: show the up-to-date start screen
        return;
      }
      setQueue(items);
      setTotal(items.length);
      setStats(EMPTY);
      setError(null);
      setPhase('session');
    } catch (e) {
      setLoadError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  const finish = useCallback(() => {
    onFinish?.();
    void refetch();
    setPhase('done');
  }, [onFinish, refetch]);

  // rating === null: moving on from a second try, which sends nothing.
  const rate = useCallback(
    async (rating: ReviewRating | null) => {
      const card = queue[0];
      if (!card) return;
      setError(null);
      if (rating !== null) {
        try {
          await answer.mutateAsync({ kind: card.kind, id: card.id, rating });
        } catch (e) {
          // NOT_DUE: already answered elsewhere, just move on. Anything else: stay on the card and say why.
          if ((e as { code?: string }).code !== 'NOT_DUE') {
            setError(e as Error);
            return;
          }
        }
        setStats((s) => ({ ...s, [rating]: s[rating] + 1 }));
      }
      const rest = queue.slice(1);
      const next = rating === 1 ? [...rest, { ...card, retry: true }] : rest;
      setQueue(next);
      if (next.length === 0) finish();
    },
    [queue, answer, finish],
  );

  // "Finish" / "Close" in the middle of a session.
  const stop = useCallback(() => {
    onFinish?.();
    void refetch();
    setPhase(answeredCount(stats) ? 'done' : 'start');
  }, [onFinish, refetch, stats]);

  return { summary, phase, loading, loadError, queue, card: queue[0] ?? null, total, stats, error, busy: answer.isPending, start, rate, stop };
}
