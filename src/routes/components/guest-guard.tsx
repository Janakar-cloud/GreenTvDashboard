import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { getAccessToken } from 'src/api/client';

type GuestGuardProps = {
  children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const accessToken = getAccessToken();

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
