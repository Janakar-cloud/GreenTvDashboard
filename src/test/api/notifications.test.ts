import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as client from 'src/api/client';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from 'src/api/notifications';

// ----------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(client, 'apiFetch');
});

// ----------------------------------------------------------------------

describe('getNotifications', () => {
  it('calls /notifications without params by default', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getNotifications();

    expect(client.apiFetch).toHaveBeenCalledWith('/notifications');
  });

  it('appends query params when provided', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({ data: [] });

    await getNotifications({ page: 1, limit: 5, isUnread: true });

    const called = (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(called).toContain('page=1');
    expect(called).toContain('limit=5');
    expect(called).toContain('isUnread=true');
  });
});

// ----------------------------------------------------------------------

describe('markNotificationRead', () => {
  it('sends PATCH to /notifications/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({});

    await markNotificationRead('notif-1');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/notifications/notif-1',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('sends isUnread:false by default', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce({});

    await markNotificationRead('notif-1');

    const body = JSON.parse(
      (client.apiFetch as ReturnType<typeof vi.spyOn>).mock.calls[0][1].body as string
    );
    expect(body.isUnread).toBe(false);
  });
});

// ----------------------------------------------------------------------

describe('markAllNotificationsRead', () => {
  it('sends PATCH to /notifications/read-all', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await markAllNotificationsRead();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteNotification', () => {
  it('sends DELETE to /notifications/:id', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteNotification('notif-abc');

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/notifications/notif-abc',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ----------------------------------------------------------------------

describe('deleteAllNotifications', () => {
  it('sends DELETE to /notifications', async () => {
    (client.apiFetch as ReturnType<typeof vi.spyOn>).mockResolvedValueOnce(undefined);

    await deleteAllNotifications();

    expect(client.apiFetch).toHaveBeenCalledWith(
      '/notifications',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
