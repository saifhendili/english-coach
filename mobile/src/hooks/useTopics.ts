import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Topic } from '@/types';

// The feed is one query per view: all topics, one interest field, or favourites only.
type View = { favorite?: boolean; field?: string | null };
export const topicsKey = ({ favorite = false, field = null }: View = {}) => ['topics', { favorite, field }] as const;

export function useTopics(view: View) {
  const params = new URLSearchParams();
  if (view.favorite) params.set('favorite', '1');
  if (view.field) params.set('field', view.field);
  params.set('limit', view.favorite ? '50' : '20');
  return useQuery({ queryKey: topicsKey(view), queryFn: async () => (await api<{ topics: Topic[] }>(`/topics?${params}`)).topics });
}

// Generates a batch and puts it in the visible feed: appended for scrolling, at the top for "Surprise me". Other feeds
// are only marked stale, never refetched under the learner's eyes (a refetch would re-sort the list).
export function useGenerateTopics(view: View) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surprise = false, count = 6 }: { surprise?: boolean; count?: number } = {}) =>
      api<{ topics: Topic[] }>('/topics/generate', { method: 'POST', body: { count, surprise, ...(view.field && !surprise && { fields: [view.field] }) } }),
    onSuccess: ({ topics }, vars) => {
      void qc.invalidateQueries({ queryKey: ['topics'], refetchType: 'none' });
      qc.setQueryData<Topic[]>(topicsKey(view), (old = []) => (vars?.surprise ? [...topics, ...old] : [...old, ...topics]));
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const patch = (id: string, favorite: boolean) => {
    for (const q of qc.getQueryCache().findAll({ queryKey: ['topics'] })) {
      const onlyFavorites = (q.queryKey[1] as { favorite: boolean }).favorite;
      qc.setQueryData<Topic[] | undefined>(q.queryKey, (old) => {
        if (!old) return old;
        // Un-starring inside Favourites removes the card; elsewhere only the heart changes.
        if (onlyFavorites && !favorite) return old.filter((t) => t.id !== id);
        return old.map((t) => (t.id === id ? { ...t, favorite } : t));
      });
    }
  };
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) => api(`/topics/${id}/favorite`, { method: 'POST', body: { favorite } }),
    onMutate: ({ id, favorite }) => patch(id, favorite),
    onError: (_e, { id, favorite }) => {
      patch(id, !favorite);
      void qc.invalidateQueries({ queryKey: ['topics'] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'], refetchType: 'none' }),
  });
}
