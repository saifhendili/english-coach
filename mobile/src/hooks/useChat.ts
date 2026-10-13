import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import type { ChatSession, SessionListItem } from '@/types';

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: async () => (await api<{ sessions: SessionListItem[] }>('/sessions?limit=20')).sessions, staleTime: 0 });
}

export function useSession(id: string) {
  // The conversation screen keeps this up to date itself while chatting.
  return useQuery({ queryKey: ['session', id], queryFn: async () => (await api<{ session: ChatSession }>(`/sessions/${id}`)).session, staleTime: Infinity });
}

// Starts a conversation (free, about a topic, a role-play, or about a plain title) and opens it.
export function useStartChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { topicId?: string; mode?: 'talk' | 'roleplay'; title?: string } = {}) => api<{ session: ChatSession }>('/sessions', { method: 'POST', body: input }),
    onSuccess: ({ session }) => {
      qc.setQueryData(['session', session.id], session);
      void qc.invalidateQueries({ queryKey: ['sessions'] });
      router.push({ pathname: '/chat/[id]', params: { id: session.id } });
    },
  });
}
