import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DictionaryEntry, WordExplanation } from '@/types';

// Definitions, phonetics and audio from a free dictionary, through our server (no key, no Gemini quota).
// `null` means there is no such word.
export function useDictionary(word: string | null) {
  return useQuery({
    queryKey: ['dictionary', word],
    queryFn: async () => (await api<{ entry: DictionaryEntry | null }>(`/dictionary/${encodeURIComponent(word as string)}`)).entry,
    enabled: Boolean(word),
    staleTime: Infinity,
    retry: false,
  });
}

// The meaning in the sentence the word was tapped in, plus a translation, from Gemini. Only when asked for.
export function useExplainWord() {
  return useMutation({
    mutationFn: ({ word, sentence }: { word: string; sentence?: string }) =>
      api<{ explanation: WordExplanation }>('/dictionary/explain', { method: 'POST', body: { word, sentence } }),
  });
}
