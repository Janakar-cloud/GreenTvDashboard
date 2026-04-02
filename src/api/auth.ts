import { apiFetch, setTokens, clearTokens } from "./client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  isVerified?: boolean;
  avatarUrl?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthTokens & {
  user?: UserProfile;
};

const USER_STORAGE_KEY = "currentUser";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);
    return value ? (JSON.parse(value) as UserProfile) : null;
  } catch (error) {
    return null;
  }
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });

  if (data?.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
  }

  if (data?.user && typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }

  return data;
}

export async function register(email: string, password: string, name?: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    auth: false,
  });
}

export async function verifyEmail(email: string, code: string) {
  const data = await apiFetch<AuthTokens>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    auth: false,
  });

  if (data?.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
  }

  return data;
}

export async function resendVerification(email: string) {
  return apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch("/auth/request-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    auth: false,
  });
}

export async function logoutApi(refreshToken: string) {
  return apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logout() {
  clearTokens();
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}
