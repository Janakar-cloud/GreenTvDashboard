import { it, vi, expect, describe, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import { sendTestEmail } from 'src/api/admin';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('sendTestEmail', () => {
  it('sends POST to /admin/test-email with to field', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ success: true, to: 'test@test.com' });

    const result = await sendTestEmail('test@test.com');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/admin/test-email',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ to: 'test@test.com' }),
      })
    );
    expect(result).toMatchObject({ success: true });
  });

  it('throws when API call fails', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockRejectedValueOnce(new Error('SMTP not configured'));

    await expect(sendTestEmail('user@test.com')).rejects.toThrow('SMTP not configured');
  });
});
