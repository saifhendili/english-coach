import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// { saved, fields: [{name, emoji}], focus: [id], suggestedFocus: [id], focusOptions: [{id, label, description}] }
export function useInterests() {
  return useQuery({ queryKey: ['interests'], queryFn: () => api('/interests') });
}

export function useSaveInterests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fields, focus }) => api('/interests', { method: 'PUT', body: { fields, focus } }),
    onSuccess: (data) => qc.setQueryData(['interests'], data),
  });
}

// "More fields": Gemini proposes interest areas close to the selection.
export function useSuggestFields() {
  return useMutation({
    mutationFn: ({ selected, exclude }) => api('/interests/suggest', { method: 'POST', body: { selected, exclude } }),
  });
}
