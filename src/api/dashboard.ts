import { apiFetch } from './client';

export type HomeFeedItem = {
  id: string;
  title: string;
  type: 'media' | 'article' | 'post' | 'caseStory';
  coverUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
};

export type HomeFeed = {
  media?: HomeFeedItem[];
  articles?: HomeFeedItem[];
  posts?: HomeFeedItem[];
  caseStories?: HomeFeedItem[];
};

export async function getHomeFeed() {
  return apiFetch<HomeFeed>('/home', { auth: false });
}

export type DashboardMetric = {
  numberOfVideo: number;
  totalUsers: number;
  onlineUsers: number;
  totalPodcasts: number;
  totalArticles: number;
};

export type DashboardSummary = {
  metrics: DashboardMetric;
  trendingPodcastCategory?: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
  trendingArticleCategory?: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
  usersStatus?: { label: string; value: number }[];
  recentActivity?: {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    postedAt: string;
  }[];
};

export type SummaryQuery = {
  from?: string | Date;
  to?: string | Date;
  interval?: 'day' | 'week' | 'month';
};

function toIso(value?: string | Date) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

export async function getDashboardSummary(params: SummaryQuery = {}) {
  const query = new URLSearchParams();
  const from = toIso(params.from);
  const to = toIso(params.to);

  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (params.interval) query.set('interval', params.interval);

  const qs = query.toString();
  return apiFetch<DashboardSummary>(qs ? `/admin/summary?${qs}` : '/admin/summary');
}
