import React, { useMemo, useState, useEffect, useCallback } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Card,
  Chip,
  Table,
  Button,
  Switch,
  Tooltip,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  LinearProgress,
  TableContainer,
  FormControlLabel,
} from "@mui/material";

import { getMedia, type MediaItem } from "src/api/media";
import {
  getPodcastComments,
  type PodcastComment,
  deletePodcastComment,
  patchPodcastCommentStatus,
} from "src/api/podcasts";

export default function PodcastCommentsDashboard() {
  const [podcasts, setPodcasts] = useState<MediaItem[]>([]);
  const [podcastsLoading, setPodcastsLoading] = useState(true);
  const [podcastId, setPodcastId] = useState("");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [comments, setComments] = useState<PodcastComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all podcasts on mount for the dropdown
  useEffect(() => {
    getMedia({ menu: "Podcast", limit: 200 })
      .then((res) => {
        const items = Array.isArray(res) ? res : (res as any).data ?? [];
        setPodcasts(items);
        // Auto-select the first podcast that has comments
        const first = items.find((p: MediaItem) => (p.commentsCount ?? 0) > 0) ?? items[0];
        if (first) setPodcastId(first.id);
      })
      .catch(() => {})
      .finally(() => setPodcastsLoading(false));
  }, []);

  const loadComments = useCallback(async () => {
    if (!podcastId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPodcastComments(podcastId, includeHidden);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load comments");
    } finally {
      setLoading(false);
    }
  }, [podcastId, includeHidden]);

  // Auto-load whenever selection changes
  useEffect(() => {
    if (podcastId) loadComments();
  }, [loadComments, podcastId]);

  const handleToggleStatus = async (comment: PodcastComment) => {
    const nextStatus = comment.status === "hidden" ? "visible" : "hidden";
    try {
      await patchPodcastCommentStatus(comment.podcastId, comment.id, nextStatus);
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status: nextStatus } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    }
  };

  const handleDelete = async (comment: PodcastComment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deletePodcastComment(comment.podcastId, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete comment");
    }
  };

  const selectedPodcast = podcasts.find((p) => p.id === podcastId);
  const visibleCount = useMemo(() => comments.filter((c) => c.status !== "hidden").length, [comments]);
  const hiddenCount = comments.length - visibleCount;

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Podcast Comments Moderation
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              select
              label="Select Podcast"
              value={podcastId}
              onChange={(e) => setPodcastId(e.target.value)}
              sx={{ minWidth: 320 }}
              disabled={podcastsLoading}
              helperText={podcastsLoading ? "Loading podcasts…" : `${podcasts.length} podcasts`}
            >
              {podcasts.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                  {(p.commentsCount ?? 0) > 0 && (
                    <Chip
                      label={p.commentsCount}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Switch checked={includeHidden} onChange={(e) => setIncludeHidden(e.target.checked)} />}
              label="Include hidden"
            />
            <Button variant="contained" onClick={loadComments} disabled={!podcastId || loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
            <Chip label={`Visible: ${visibleCount}`} color="success" variant="outlined" />
            <Chip label={`Hidden: ${hiddenCount}`} color="warning" variant="outlined" />
          </Box>
          {selectedPodcast && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              ID: {selectedPodcast.id}
            </Typography>
          )}
          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>

      {loading && <Box mb={2}><LinearProgress /></Box>}

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Author</b></TableCell>
              <TableCell><b>Message</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Created</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    {podcastId ? "No comments for this podcast." : "Select a podcast above."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>{comment.author}</TableCell>
                <TableCell>{comment.message}</TableCell>
                <TableCell>
                  <Chip
                    label={comment.status === "hidden" ? "Hidden" : "Visible"}
                    color={comment.status === "hidden" ? "warning" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "--"}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title={comment.status === "hidden" ? "Mark visible" : "Hide"}>
                      <IconButton color="primary" onClick={() => handleToggleStatus(comment)}>
                        {comment.status === "hidden" ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(comment)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
