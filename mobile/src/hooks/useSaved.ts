import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { savedKey } from '@/lib/saved';
import type { SaveInput, SavedItemData } from '@/types';

export function useSavedItems() {
  return useQuery({ queryKey: ['saved'], queryFn: async () => (await api<{ items: SavedItemData[] }>('/saved')).items });
}

// One place that knows what is saved, so every Save button in the app stays in sync.
export function useSaved() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useSavedItems();

  const index = useMemo(() => new Map(data.map((i) => [`${i.kind}:${savedKey(i.text)}`, i])), [data]);
  const isSaved = useCallback((kind: string, text: string) => index.has(`${kind}:${savedKey(text)}`), [index]);

  const save = useMutation({
    mutationFn: (item: SaveInput) => api('/saved', { method: 'POST', body: item }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ['saved'] });
      const previous = qc.getQueryData<SavedItemData[]>(['saved']);
      // Optimistic: it shows as saved at once; the real item replaces this one when the server answers.
      const temp = { id: `tmp-${Date.now()}`, meaning: '', translation: '', example: '', category: '', source: 'manual', createdAt: new Date().toISOString(), ...item } as SavedItemData;
      qc.setQueryData<SavedItemData[]>(['saved'], (old = []) => [temp, ...old]);
      return { previous };
    },
    onError: (_e, _item, ctx) => qc.setQueryData(['saved'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/saved/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['saved'] });
      const previous = qc.getQueryData<SavedItemData[]>(['saved']);
      qc.setQueryData<SavedItemData[]>(['saved'], (old = []) => old.filter((i) => i.id !== id));
      return { previous };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(['saved'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  const toggle = useCallback(
    (item: SaveInput) => {
      const existing = index.get(`${item.kind}:${savedKey(item.text)}`);
      if (!existing) save.mutate(item);
      else if (!existing.id.startsWith('tmp-')) remove.mutate(existing.id);
    },
    [index, save, remove],
  );

  return { items: data, isLoading, isSaved, toggle, remove: remove.mutate };
}
