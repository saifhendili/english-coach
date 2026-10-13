import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Exercise, TenseAnswer, TenseLesson, TensesData } from '@/types';

// The lessons never change; how the learner is doing does, so the whole thing is refreshed after each practice.
export function useTenses() {
  return useQuery({ queryKey: ['tenses'], queryFn: () => api<TensesData>('/tenses'), staleTime: 30_000 });
}

export function useLesson(id: string): TenseLesson | undefined {
  return useTenses().data?.lessons.find((l) => l.id === id);
}

// A practice set from the hand-written bank (free), or `source: 'ai'` for exercises Gemini writes about the learner's interests.
export async function fetchExercises({ tense, source, count }: { tense: string; source?: 'ai'; count: number }): Promise<Exercise[]> {
  if (source === 'ai') return (await api<{ exercises: Exercise[] }>('/tenses/generate', { method: 'POST', body: { tense, count: 6 } })).exercises;
  return (await api<{ exercises: Exercise[] }>(`/tenses/practice?tense=${encodeURIComponent(tense)}&count=${count}`)).exercises;
}

export function useRecordPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (results: TenseAnswer[]) => api<Pick<TensesData, 'stats' | 'recommended'>>('/tenses/practice', { method: 'POST', body: { results } }),
    onSuccess: (fresh) => qc.setQueryData<TensesData>(['tenses'], (old) => old && { ...old, ...fresh }),
  });
}
