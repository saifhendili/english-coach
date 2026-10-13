import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// { due, reviewsDue, newToday, newWaiting, reviewedToday, totalCards }
export function useReviewSummary() {
  return useQuery({ queryKey: ['review', 'summary'], queryFn: () => api('/review/summary'), staleTime: 30_000 });
}

// The cards for one session.
export const fetchReviewQueue = (limit = 20) => api(`/review/queue?limit=${limit}`);

export function useAnswerCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, rating }) => api('/review/answer', { method: 'POST', body: { kind, id, rating } }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['review', 'summary'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
