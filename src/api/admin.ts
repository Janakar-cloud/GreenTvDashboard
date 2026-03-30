import { apiFetch } from './client';

export async function sendTestEmail(to: string) {
  return apiFetch<{ success: boolean; to: string }>('/admin/test-email', {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
}
