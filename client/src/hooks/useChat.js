import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: async () => (await api('/sessions?limit=20')).sessions, staleTime: 0 });
}

// Starts a conversation (free, about a topic, or a role-play) and opens it.
export function useStartChat() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, mode } = {}) => api('/sessions', { method: 'POST', body: { topicId, mode } }),
    onSuccess: ({ session }) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      navigate(`/chat/${session.id}`);
    },
  });
}
