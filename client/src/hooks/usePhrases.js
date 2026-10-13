import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// The curated phrasebank never changes while the app runs.
export function usePhrasebank() {
  return useQuery({ queryKey: ['phrasebank'], queryFn: async () => (await api('/phrases')).categories, staleTime: Infinity });
}

export function useMorePhrases() {
  return useMutation({
    mutationFn: ({ categoryId, exclude }) => api('/phrases/generate', { method: 'POST', body: { categoryId, count: 6, exclude } }),
  });
}

export function usePracticePhrase() {
  return useMutation({
    mutationFn: (body) => api('/phrases/practice', { method: 'POST', body }),
  });
}
