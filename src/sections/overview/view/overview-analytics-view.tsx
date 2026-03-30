import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { getDashboardSummary } from 'src/api/dashboard';
import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDashboardSummary>> | null>(
    null
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getDashboardSummary();
        if (active) setSummary(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load dashboard data';
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const metrics = summary?.metrics ?? {
    numberOfVideo: 0,
    totalUsers: 0,
    onlineUsers: 0,
    totalPodcasts: 0,
  };

  const podcastCategory = summary?.trendingPodcastCategory ?? {
    categories: ['-'],
    series: [{ name: 'podcasts', data: [0] }],
  };

  const articleCategory = summary?.trendingArticleCategory ?? {
    categories: ['-'],
    series: [{ name: 'articles', data: [0] }],
  };

  const userStatus = summary?.usersStatus ?? [];
  const recentActivity = summary?.recentActivity ?? [];

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 }, display: 'flex', gap: 1 }}>
        Hi, Welcome back 👋
        {loading && <CircularProgress size={20} />}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Number of Video"
            percent={0}
            total={metrics.numberOfVideo}
            icon={<img alt="Videos" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: ['Total'],
              series: [metrics.numberOfVideo],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total users"
            percent={0}
            total={metrics.totalUsers}
            color="secondary"
            icon={<img alt="Users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Total'],
              series: [metrics.totalUsers],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Online Users"
            percent={0}
            total={metrics.onlineUsers}
            color="warning"
            icon={<img alt="Online users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Online'],
              series: [metrics.onlineUsers],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Podcasts"
            percent={0}
            total={metrics.totalPodcasts}
            color="error"
            icon={<img alt="Podcasts" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Total'],
              series: [metrics.totalPodcasts],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Users Status"
            chart={{
              series: userStatus.map((item) => ({ label: item.label, value: item.value })),
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsWebsiteVisits
            title="Trending Podcast Category"
            subheader="Last period"
            chart={{
              categories: podcastCategory.categories,
              series: podcastCategory.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 12 }}>
          <AnalyticsConversionRates
            title="Trending Articles Category"
            subheader="Last period"
            chart={{
              categories: articleCategory.categories,
              series: articleCategory.series,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 12 }}>
          <AnalyticsNews title="Recent Activity" list={recentActivity} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
