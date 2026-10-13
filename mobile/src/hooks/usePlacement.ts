import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PlacementStatus } from '@/types';

export function usePlacementStatus() {
  // Always re-check on arrival: a test may have been finished or started elsewhere.
  return useQuery({ queryKey: ['placement', 'status'], queryFn: () => api<PlacementStatus>('/placement/status'), staleTime: 0 });
}
