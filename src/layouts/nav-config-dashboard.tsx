import React from 'react';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Upload Media',
    path: '/products',
    icon: icon('ic-cart'),
  },
  {
    title: 'Manage Media',
    path: '/manageMedia',
    icon: icon('ic-user'),
  },
  {
    title: 'Article',
    path: '/article',
    icon: icon('ic-user'),
  },
  {
    title: 'Blog Posts',
    path: '/blog',
    icon: icon('ic-blog'),
  },
  {
    title: 'Case Stories',
    path: '/case-stories',
    icon: icon('ic-analytics'),
  },
  {
    title: 'About Blocks',
    path: '/about',
    icon: icon('ic-blog'),
  },
  {
    title: 'Live Config',
    path: '/live-config',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Podcast Comments',
    path: '/podcast-comments',
    icon: icon('ic-blog'),
  },
  {
    title: 'Users',
    path: '/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Test Email',
    path: '/test-email',
    icon: icon('ic-analytics'),
  },
];
