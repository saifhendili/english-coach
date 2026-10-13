import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// Definitions, phonetics and audio from a free dictionary, through our server (the dictionary
// does not allow requests straight from a web page). No key and no Gemini quota. `null` = no such word.
export function useDictionary(word) {
  return useQuery({
    queryKey: ['dictionary', word],
    queryFn: async () => (await api(`/dictionary/${encodeURIComponent(word)}`)).entry,
    enabled: Boolean(word),
    staleTime: Infinity,
    retry: false,
  });
}

// In-context meaning (and translation) from Gemini, when the dictionary is slow, has no entry, or a translation is wanted.
export function useExplainWord() {
  return useMutation({
    mutationFn: ({ word, sentence }) => api('/dictionary/explain', { method: 'POST', body: { word, sentence } }),
  });
}
