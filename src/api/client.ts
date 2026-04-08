const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiError = Error & {
  status?: number;
  payload?: unknown;
};

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  skipRefresh?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

type MaybeWrapped<T> = T | { data?: T };

function unwrapData<T>(value: MaybeWrapped<T> | null | undefined): T | undefined {
  if (!value || typeof value !== "object") {
    return value as T | undefined;
  }

  if ("data" in value) {
    const nested = (value as { data?: T }).data;
    if (nested !== undefined) return nested;
  }

  return value as T;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

export function getRefreshToken() {
  return typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
}

export function setTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
}

async function buildError(response: Response): Promise<ApiError> {
  let payload: unknown;
  let message = `Request failed (${response.status})`;

  try {
    payload = await response.clone().json();
    if (payload && typeof payload === "object") {
      const maybeMessage = (payload as any).error || (payload as any).message;
      if (typeof maybeMessage === "string") {
        message = maybeMessage;
      }
    }
  } catch (_err) {
    // ignore JSON parse errors
  }

  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.payload = payload;
  return error;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const token = getRefreshToken();
  if (!token) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        throw await buildError(response);
      }

      const payload = await response.json();
      const data = unwrapData<{ accessToken?: string; refreshToken?: string }>(payload);
      if (data?.accessToken) {
        setTokens(data.accessToken, data.refreshToken || token);
        return data.accessToken;
      }

      return null;
    } catch (_error) {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const includeAuth = options.auth !== false;

  // If access token is missing but refresh token exists, try refreshing first.
  if (includeAuth && !headers.has("Authorization") && !getAccessToken() && !options.skipRefresh) {
    await refreshAccessToken();
  }

  if (includeAuth && !headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && includeAuth && !options.skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRefresh: true });
    }
    // Refresh failed — session is dead. Clear stale tokens and bounce to sign-in.
    clearTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      window.location.href = "/sign-in";
    }
    // Throw so callers don't receive undefined silently
    const sessionErr = new Error("Session expired. Please sign in again.") as ApiError;
    sessionErr.status = 401;
    throw sessionErr;
  }

  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export function uploadToSignedUrlWithProgress(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

export { API_BASE_URL };
