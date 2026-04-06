import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { getDashboardSummary } from 'src/api/dashboard';
import { DashboardContent } from 'src/layouts/dashboard';
import { getTrending, type TrendingItem } from 'src/api/engage';

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
  const [trending, setTrending] = useState<TrendingItem[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [data, trendingData] = await Promise.all([
          getDashboardSummary(),
          getTrending({ type: 'all', limit: 8, days: 30 }),
        ]);
        if (active) {
          setSummary(data);
          setTrending(trendingData.items ?? []);
        }
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
    totalArticles: 0,
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

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Articles"
            percent={0}
            total={metrics.totalArticles}
            color="info"
            icon={<img alt="Articles" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Total'],
              series: [metrics.totalArticles],
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

        {trending.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <TrendingTable rows={trending} />
          </Grid>
        )}
      </Grid>
    </DashboardContent>
  );
}

// ─── Trending Table ───────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, 'primary' | 'secondary' | 'warning'> = {
  video: 'primary',
  podcast: 'secondary',
  article: 'warning',
};

function TrendingTable({ rows }: { rows: TrendingItem[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Trending (last 30 days)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell align="right">Likes</TableCell>
                <TableCell align="right">Comments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ color: 'text.secondary', width: 36 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {(row.thumbnailUrl || row.imageUrl || row.coverImage) && (
                        <Box
                          component="img"
                          src={row.thumbnailUrl ?? row.imageUrl ?? row.coverImage}
                          alt={row.title}
                          sx={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 0.5 }}
                        />
                      )}
                      <Typography variant="body2" noWrap sx={{ maxWidth: 320 }}>
                        {row.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row._type}
                      size="small"
                      color={TYPE_COLOR[row._type] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{(row.views ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{(row.likes ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{(row.commentsCount ?? 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
