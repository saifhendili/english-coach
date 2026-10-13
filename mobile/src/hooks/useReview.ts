import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReviewCardData, ReviewRating, ReviewSummary } from '@/types';

export function useReviewSummary() {
  return useQuery({ queryKey: ['review', 'summary'], queryFn: () => api<ReviewSummary>('/review/summary'), staleTime: 30_000 });
}

// The cards for one session.
export const fetchReviewQueue = (limit = 20) => api<{ items: ReviewCardData[]; remaining: number; newWaiting: number }>(`/review/queue?limit=${limit}`);

export function useAnswerCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, rating }: { kind: ReviewCardData['kind']; id: string; rating: ReviewRating }) => api('/review/answer', { method: 'POST', body: { kind, id, rating } }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['review', 'summary'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
