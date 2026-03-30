import React, { useCallback, useEffect, useMemo, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  deletePodcastComment,
  getPodcastComments,
  patchPodcastCommentStatus,
  type PodcastComment,
} from "src/api/podcasts";

export default function PodcastCommentsDashboard() {
  const [podcastId, setPodcastId] = useState("");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [comments, setComments] = useState<PodcastComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoad = podcastId.trim().length > 0;

  const loadComments = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPodcastComments(podcastId.trim(), includeHidden);
      setComments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load comments";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [podcastId, includeHidden, canLoad]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (canLoad) loadComments();
    }, 200);
    return () => clearTimeout(t);
  }, [loadComments, canLoad]);

  const handleToggleStatus = async (comment: PodcastComment) => {
    const nextStatus = comment.status === "hidden" ? "visible" : "hidden";
    try {
      await patchPodcastCommentStatus(comment.podcastId, comment.id, nextStatus);
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status: nextStatus } : c)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update status";
      setError(message);
    }
  };

  const handleDelete = async (comment: PodcastComment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deletePodcastComment(comment.podcastId, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete comment";
      setError(message);
    }
  };

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
              label="Podcast ID"
              value={podcastId}
              onChange={(e) => setPodcastId(e.target.value)}
              placeholder="Enter podcast ID"
              sx={{ minWidth: 240 }}
            />
            <FormControlLabel
              control={<Switch checked={includeHidden} onChange={(e) => setIncludeHidden(e.target.checked)} />}
              label="Include hidden"
            />
            <Button variant="contained" onClick={loadComments} disabled={!canLoad || loading}>
              {loading ? "Loading..." : "Load comments"}
            </Button>
            <Chip label={`Visible: ${visibleCount}`} color="success" variant="outlined" />
            <Chip label={`Hidden: ${hiddenCount}`} color="warning" variant="outlined" />
          </Box>
          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Box mb={2}>
          <LinearProgress />
        </Box>
      )}

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
                  <Typography>No comments loaded.</Typography>
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
