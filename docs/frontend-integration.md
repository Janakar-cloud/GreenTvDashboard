# Frontend Integration Guide

This guide helps the dashboard frontend integrate with the ZthOrbit backend API using the unified `/media` endpoint and related dashboard features.

## Base configuration

Create `src/config/api.ts`.

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.zthorbit.com/api";

export const apiClient = {
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for CORS with credentials
};

export function setAuthToken(token: string) {
  if (token) {
    apiClient.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.headers["Authorization"];
  }
}
```

## CORS and credentials

All API requests must include `credentials: "include"`.

Backend CORS config:

```typescript
cors({
  origin: env.corsOrigins,
  credentials: true,
});
```

Required settings:

1) Backend `.env`:

```bash
# Development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
CORS_ORIGINS=https://www.thegreentv.com,http://13.205.72.30
```

2) Frontend fetch requests:

```typescript
// Correct: always include credentials
fetch(url, {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

// Wrong: missing credentials
fetch(url, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
```

3) Backend must be restarted after `.env` changes:

```bash
cd server
npm run build
npm start
# Or: pm2 restart zthorbit-backend
```

Common CORS errors: see `CORS-TROUBLESHOOTING.md` for debugging steps. Typical causes include missing `credentials`, frontend origin not in `CORS_ORIGINS`, backend not restarted, or protocol/port mismatches.

## Authentication flow

### Register new user

```typescript
async function register(email: string, password: string, name?: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}
```

### Verify email

```typescript
async function verifyEmail(email: string, code: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  setAuthToken(data.accessToken);

  return data;
}
```

### Login

```typescript
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 403) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  const data = await response.json();

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  setAuthToken(data.accessToken);

  return data;
}
```

### Refresh token

```typescript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  localStorage.setItem("accessToken", data.accessToken);
  setAuthToken(data.accessToken);

  return data.accessToken;
}
```

## Unified Media API

```typescript
interface MediaItem {
  id: string;
  title: string;
  description: string;
  mediaType: "video" | "audio";
  menu: "LiveTv" | "Podcast";
  category?: string;
  tags?: string[];
  duration: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

async function getMedia(params: {
  page?: number;
  limit?: number;
  search?: string;
  menu?: "LiveTv" | "Podcast";
  mediaType?: "video" | "audio";
  category?: string;
  status?: "processing" | "ready" | "failed";
}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );

  const response = await fetch(`${API_BASE_URL}/media?${query}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  return await response.json();
}
```

Examples:

```typescript
const videos = await getMedia({ menu: "LiveTv", mediaType: "video" });
const podcasts = await getMedia({ menu: "Podcast", mediaType: "audio" });
const searchResults = await getMedia({ search: "climate" });
const processingMedia = await getMedia({ status: "processing" });
```

## S3 file upload flow

### Complete upload

```typescript
async function uploadMediaFile(
  file: File,
  prefix: "videos" | "podcasts" | "images" | "thumbnails"
): Promise<string> {
  const presignResponse = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({
      prefix,
      contentType: file.type,
    }),
  });

  if (!presignResponse.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { url, fileUrl } = await presignResponse.json();

  const uploadResponse = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to S3");
  }

  return fileUrl;
}
```

### Upload with progress tracking

```typescript
async function uploadWithProgress(
  file: File,
  prefix: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const presignResponse = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ prefix, contentType: file.type }),
  });

  const { url, fileUrl } = await presignResponse.json();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(Math.round(percent));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        resolve(fileUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
```

### React hook example

```typescript
import { useState } from "react";

function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, prefix: string): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileUrl = await uploadWithProgress(file, prefix, setProgress);
      setUploading(false);
      return fileUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      return null;
    }
  };

  return { upload, uploading, progress, error };
}
```

Usage example:

```typescript
function UploadVideoForm() {
  const { upload, uploading, progress } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    const videoUrl = await upload(file, "videos");

    if (videoUrl) {
      await createMedia({
        title: "My Video",
        mediaType: "video",
        menu: "LiveTv",
        fileUrl: videoUrl,
        status: "ready",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="video/*" disabled={uploading} />
      {uploading && <progress value={progress} max="100">{progress}%</progress>}
      <button type="submit" disabled={uploading}>Upload</button>
    </form>
  );
}
```

## Create media item

```typescript
async function createMedia(data: {
  title: string;
  description?: string;
  mediaType: "video" | "audio";
  menu: "LiveTv" | "Podcast";
  category?: string;
  tags?: string[];
  duration?: number;
  fileUrl: string;
  thumbnailUrl?: string;
  status?: "processing" | "ready" | "failed";
}) {
  const response = await fetch(`${API_BASE_URL}/media`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}
```

## Update media status

```typescript
async function updateMediaStatus(
  id: string,
  status: "processing" | "ready" | "failed",
  updates?: { fileUrl?: string; thumbnailUrl?: string; duration?: number }
) {
  const response = await fetch(`${API_BASE_URL}/media/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ status, ...updates }),
  });

  return await response.json();
}
```

## Dashboard analytics

```typescript
interface DashboardSummary {
  metrics: {
    numberOfVideo: number;
    totalUsers: number;
    onlineUsers: number;
    totalPodcasts: number;
  };
  trendingPodcastCategory: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
  trendingArticleCategory: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
  usersStatus: { label: string; value: number }[];
  recentActivity: Post[];
}

async function getDashboardSummary(params?: {
  from?: string;
  to?: string;
}) {
  const query = params ? `?${new URLSearchParams(params as any)}` : "";

  const response = await fetch(`${API_BASE_URL}/admin/summary${query}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  return (await response.json()) as DashboardSummary;
}
```

## Notifications

```typescript
interface Notification {
  id: string;
  title: string;
  description: string;
  avatarUrl?: string;
  type: string;
  postedAt: string;
  isUnread: boolean;
}

async function getNotifications(params?: {
  page?: number;
  limit?: number;
  isUnread?: boolean;
}) {
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );

  const response = await fetch(`${API_BASE_URL}/notifications?${query}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  return await response.json();
}
```

Mark as read helpers:

```typescript
async function markNotificationRead(id: string, isUnread: boolean = false) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ isUnread }),
  });

  return await response.json();
}

async function markAllRead() {
  await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });
}
```

## Reference data (dropdowns and filters)

```typescript
async function getCategories(type?: "media" | "article" | "post") {
  const query = type ? `?type=${type}` : "";
  const response = await fetch(`${API_BASE_URL}/api/categories${query}`);
  return await response.json();
}

async function getMenus() {
  const response = await fetch(`${API_BASE_URL}/api/menus`);
  return await response.json();
}

async function getTags(type?: "article" | "media") {
  const query = type ? `?type=${type}` : "";
  const response = await fetch(`${API_BASE_URL}/api/tags${query}`);
  return await response.json();
}
```

## Blog posts

```typescript
interface Post {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  totalFavorites: number;
  postedAt: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
}

async function getPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: "latest" | "popular" | "oldest";
}) {
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );

  const response = await fetch(`${API_BASE_URL}/posts?${query}`);
  return await response.json();
}
```

## User management

```typescript
async function getUsers(page = 1, pageSize = 20) {
  const response = await fetch(
    `${API_BASE_URL}/users?page=${page}&pageSize=${pageSize}`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    }
  );

  return await response.json();
}

async function updateUserStatus(userId: string, status: "active" | "inactive") {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ status }),
  });

  return await response.json();
}
```

## Error handling helper

```typescript
async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      try {
        await refreshAccessToken();

        return await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            ...options.headers,
          },
        });
      } catch {
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
```

## Environment variables

Create `.env.local` in the frontend project:

```env
VITE_API_URL=https://api.zthorbit.com/api
```

For development:

```env
VITE_API_URL=http://localhost:4000/api
```

## Migration from legacy endpoints

```typescript
// Old (deprecated)
const videos = await fetch("/api/videos?tag=climate");

// New (recommended)
const videos = await getMedia({
  menu: "LiveTv",
  mediaType: "video",
  category: "climate",
});
```

```typescript
// Old (deprecated)
const podcasts = await fetch("/api/podcasts");

// New (recommended)
const podcasts = await getMedia({
  menu: "Podcast",
  mediaType: "audio",
});
```
