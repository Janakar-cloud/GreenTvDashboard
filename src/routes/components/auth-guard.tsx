import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { getAccessToken, setTokens, clearTokens } from 'src/api/client';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Expired if `exp` is in the past (with 5-second leeway)
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now() - 5000;
  } catch {
    return true; // malformed token → treat as expired
  }
}

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();

  // Handle token hand-off from public site (tokens passed as URL params)
  const searchParams = new URLSearchParams(location.search);
  const urlAccessToken = searchParams.get('access_token');
  const urlRefreshToken = searchParams.get('refresh_token');
  if (urlAccessToken) {
    setTokens(urlAccessToken, urlRefreshToken || undefined);
    searchParams.delete('access_token');
    searchParams.delete('refresh_token');
    const cleanSearch = searchParams.toString();
    return <Navigate to={location.pathname + (cleanSearch ? '?' + cleanSearch : '')} replace />;
  }

  const accessToken = getAccessToken();

  if (!accessToken || isTokenExpired(accessToken)) {
    // Clear stale tokens so we don't loop
    if (accessToken) clearTokens();
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
