import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Phrase, PhraseCategory, PracticeResult } from '@/types';

// The curated phrasebank never changes while the app runs.
export function usePhrasebank() {
  return useQuery({ queryKey: ['phrasebank'], queryFn: async () => (await api<{ categories: PhraseCategory[] }>('/phrases')).categories, staleTime: Infinity });
}

export function useMorePhrases() {
  return useMutation({
    mutationFn: ({ categoryId, exclude }: { categoryId: string; exclude: string[] }) =>
      api<{ phrases: Phrase[] }>('/phrases/generate', { method: 'POST', body: { categoryId, count: 6, exclude } }),
  });
}

export function usePracticePhrase() {
  return useMutation({
    mutationFn: (body: { phrase: string; usage: string; situation: string; answer: string }) => api<{ result: PracticeResult }>('/phrases/practice', { method: 'POST', body }),
  });
}
