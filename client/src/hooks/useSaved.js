import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { savedKey } from '../lib/saved';

export function useSavedItems() {
  return useQuery({ queryKey: ['saved'], queryFn: async () => (await api('/saved')).items });
}

// One place that knows what is saved, so every Save button in the app stays in sync.
//   saved.isSaved(kind, text)  saved.toggle({ kind, text, meaning, example, ... })
export function useSaved() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useSavedItems();

  const index = useMemo(() => new Map(data.map((i) => [`${i.kind}:${savedKey(i.text)}`, i])), [data]);
  const isSaved = useCallback((kind, text) => index.has(`${kind}:${savedKey(text)}`), [index]);

  const save = useMutation({
    mutationFn: (item) => api('/saved', { method: 'POST', body: item }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ['saved'] });
      const previous = qc.getQueryData(['saved']);
      // Optimistic: show it as saved right away; the real item replaces this one on success.
      qc.setQueryData(['saved'], (old = []) => [{ id: `tmp-${Date.now()}`, ...item }, ...old]);
      return { previous };
    },
    onError: (_e, _item, ctx) => qc.setQueryData(['saved'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => api(`/saved/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['saved'] });
      const previous = qc.getQueryData(['saved']);
      qc.setQueryData(['saved'], (old = []) => old.filter((i) => i.id !== id));
      return { previous };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(['saved'], ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });

  const toggle = useCallback(
    (item) => {
      const existing = index.get(`${item.kind}:${savedKey(item.text)}`);
      if (!existing) save.mutate(item);
      else if (!String(existing.id).startsWith('tmp-')) remove.mutate(existing.id);
    },
    [index, save, remove],
  );

  return { items: data, isLoading, isSaved, toggle, remove: remove.mutate };
}
