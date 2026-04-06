import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthGuard, GuestGuard } from 'src/routes/components';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';


// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const UserPage = lazy(() => import('src/pages/user'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const ManageMedia = lazy(() => import('src/pages/mange-media'));
export const ArticlePage = lazy(() => import('src/pages/article'));
export const UploadArticlePage = lazy(() => import('src/pages/upload-article'));
export const LiveConfigPage = lazy(() => import('src/pages/live-config'));
export const PodcastCommentsPage = lazy(() => import('src/pages/podcast-comments'));
export const TestEmailPage = lazy(() => import('src/pages/test-email'));



const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'manageMedia', element: < ManageMedia/> },
      { path: 'article', element: < ArticlePage/> },
      { path: 'upload-article', element: <UploadArticlePage /> },
      { path: 'live-config', element: <LiveConfigPage /> },
      { path: 'podcast-comments', element: <PodcastCommentsPage /> },
      { path: 'test-email', element: <TestEmailPage /> },
    ],
  },
  {
    path: 'sign-in',
    element: (
      <GuestGuard>
        <AuthLayout>
          <SignInPage />
        </AuthLayout>
      </GuestGuard>
    ),
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
