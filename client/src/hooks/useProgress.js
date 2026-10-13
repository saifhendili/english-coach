import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useProgress() {
  return useQuery({ queryKey: ['progress'], queryFn: () => api('/progress'), staleTime: 30_000 });
}
