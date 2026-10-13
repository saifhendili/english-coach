import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InterestField, InterestsData } from '@/types';

export function useInterests() {
  return useQuery({ queryKey: ['interests'], queryFn: () => api<InterestsData>('/interests') });
}

export function useSaveInterests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fields: InterestField[]; focus: string[] }) => api<InterestsData>('/interests', { method: 'PUT', body }),
    onSuccess: (data) => qc.setQueryData(['interests'], data),
  });
}

// "More fields": Gemini proposes interest areas close to the selection.
export function useSuggestFields() {
  return useMutation({
    mutationFn: (body: { selected: string[]; exclude: string[] }) => api<{ suggestions: InterestField[] }>('/interests/suggest', { method: 'POST', body }),
  });
}
