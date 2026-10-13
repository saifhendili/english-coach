import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// { inProgress: {attemptId, answered} | null, last: {attemptId, level, finishedAt} | null }
export function usePlacementStatus() {
  return useQuery({
    queryKey: ['placement', 'status'],
    queryFn: () => api('/placement/status'),
    // Always re-check on arrival: a test may have been finished or started elsewhere.
    staleTime: 0,
  });
}
