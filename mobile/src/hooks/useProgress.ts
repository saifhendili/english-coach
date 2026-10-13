import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProgressData } from '@/types';

export function useProgress() {
  return useQuery({ queryKey: ['progress'], queryFn: () => api<ProgressData>('/progress'), staleTime: 30_000 });
}
