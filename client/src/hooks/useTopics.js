import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// The feed is one query per view: all topics, one interest field, or favourites only.
export const topicsKey = ({ favorite = false, field = null } = {}) => ['topics', { favorite, field }];

export function useTopics(view) {
  const params = new URLSearchParams();
  if (view.favorite) params.set('favorite', '1');
  if (view.field) params.set('field', view.field);
  params.set('limit', view.favorite ? '50' : '20');
  return useQuery({
    queryKey: topicsKey(view),
    queryFn: async () => (await api(`/topics?${params}`)).topics,
  });
}

// Generates a batch and puts it in the visible feed: appended for infinite scroll,
// at the top for "Surprise me". Other feeds are only marked stale, never refetched
// under the learner's eyes (a refetch would re-sort the list).
export function useGenerateTopics(view) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surprise = false, count = 6 } = {}) =>
      api('/topics/generate', {
        method: 'POST',
        body: { count, surprise, ...(view.field && !surprise && { fields: [view.field] }) },
      }),
    onSuccess: ({ topics }, { surprise = false } = {}) => {
      qc.invalidateQueries({ queryKey: ['topics'], refetchType: 'none' });
      qc.setQueryData(topicsKey(view), (old = []) => (surprise ? [...topics, ...old] : [...old, ...topics]));
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const patch = (id, favorite) => {
    for (const q of qc.getQueryCache().findAll({ queryKey: ['topics'] })) {
      const { favorite: onlyFavorites } = q.queryKey[1];
      qc.setQueryData(q.queryKey, (old) => {
        if (!old) return old;
        // Un-starring inside Favorites removes the card; elsewhere only the heart changes.
        if (onlyFavorites && !favorite) return old.filter((t) => t.id !== id);
        return old.map((t) => (t.id === id ? { ...t, favorite } : t));
      });
    }
  };
  return useMutation({
    mutationFn: ({ id, favorite }) => api(`/topics/${id}/favorite`, { method: 'POST', body: { favorite } }),
    onMutate: ({ id, favorite }) => patch(id, favorite), // optimistic
    onError: (_e, { id, favorite }) => {
      patch(id, !favorite); // undo the optimistic change
      qc.invalidateQueries({ queryKey: ['topics'] }); // and resync (restores a card removed from Favorites)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'], refetchType: 'none' }),
  });
}
