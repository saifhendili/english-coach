import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api('/settings') });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => api('/settings', { method: 'PUT', body: patch }),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data);
    },
  });
}

export function useTestKey() {
  // apiKey omitted => tests the saved key.
  return useMutation({
    mutationFn: (apiKey) => api('/settings/test-key', { method: 'POST', body: apiKey ? { apiKey } : {} }),
  });
}
