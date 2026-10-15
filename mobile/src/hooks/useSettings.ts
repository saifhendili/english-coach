import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SettingsData, SettingsPatch } from '@/types';

// `enabled: false` for screens that can be open before sign-in (the guide).
export function useSettings(enabled = true) {
  return useQuery({ queryKey: ['settings'], queryFn: () => api<SettingsData>('/settings'), enabled });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api<SettingsData>('/settings', { method: 'PUT', body: patch }),
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  });
}

// apiKey omitted: tests the saved key.
export function useTestKey() {
  return useMutation({
    mutationFn: (apiKey?: string) => api<{ valid: boolean; model: string }>('/settings/test-key', { method: 'POST', body: apiKey ? { apiKey } : {} }),
  });
}
