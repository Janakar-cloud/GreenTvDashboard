import { apiFetch } from "./client";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  avatarUrl?: string | null;
  type: string;
  postedAt: string;
  isUnread: boolean;
};

export type NotificationsResponse = {
  data: NotificationItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function getNotifications(params: {
  page?: number;
  limit?: number;
  isUnread?: boolean;
} = {}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  const qs = query.toString();
  return apiFetch<NotificationsResponse | NotificationItem[]>(
    qs ? `/notifications?${qs}` : "/notifications"
  );
}

export async function markNotificationRead(id: string, isUnread = false) {
  return apiFetch<NotificationItem>(`/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isUnread }),
  });
}

export async function markAllNotificationsRead() {
  await apiFetch<void>("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function deleteNotification(id: string) {
  await apiFetch<void>(`/notifications/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllNotifications() {
  await apiFetch<void>("/notifications", {
    method: "DELETE",
  });
}
