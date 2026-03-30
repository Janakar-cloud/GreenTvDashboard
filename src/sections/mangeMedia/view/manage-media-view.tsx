import React, { useCallback, useEffect, useState } from "react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  Alert,
  Select,
  MenuItem,
  TextField,
  CardMedia,
  Typography,
  IconButton,
  InputLabel,
  CardContent,
  FormControl,
  CircularProgress,
} from "@mui/material";

import { getCategories } from "src/api/reference";
import { deleteMedia, getMedia, type MediaItem } from "src/api/media";

function extractList(response: MediaItem[] | { data?: MediaItem[] }) {
  if (Array.isArray(response)) return response;
  if (response && "data" in response && Array.isArray(response.data)) return response.data;
  return [] as MediaItem[];
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ManageVideos() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [menu, setMenu] = useState("");
  const [status, setStatus] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await getCategories("media");
        const list = Array.isArray(response) ? response : response?.data || [];
        setCategories(list);
      } catch (err) {
        console.warn("Failed to load categories", err);
      }
    })();
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMedia({
        search: search || undefined,
        category: category || undefined,
        menu: (menu as MediaItem["menu"]) || undefined,
        status: (status as MediaItem["status"]) || undefined,
      });

      setMediaItems(extractList(response));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load media";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [category, menu, search, status]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this media item?")) return;
    setDeletingId(id);
    try {
      await deleteMedia(id);
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = mediaItems.filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Manage Media 🎬🎵
      </Typography>

      {/* 🔍 Search + Filter */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          fullWidth
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Menu</InputLabel>
          <Select value={menu} label="Menu" onChange={(e) => setMenu(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="LiveTv">LiveTv</MenuItem>
            <MenuItem value="Podcast">Podcast</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={fetchMedia} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {loading && (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading media...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 📦 Grid */}
      <Grid container spacing={3}>
        {filteredVideos.map((video) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.id}>
            <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
              
              {/* 🎬 VIDEO */}
              {video.mediaType === "video" ? (
                <CardMedia component="img" height="180" image={video.thumbnailUrl || video.fileUrl} />
              ) : (
                /* 🎵 AUDIO */
                <Box
                  sx={{
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f3f4f6",
                  }}
                >
                  <audio controls style={{ width: "90%" }}>
                    <source src={video.fileUrl} />
                  </audio>
                </Box>
              )}

              <CardContent>
                <Typography fontWeight="bold">
                  {video.title}
                </Typography>

                {/* 🏷 Chips */}
                <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                  {video.category && <Chip label={video.category} size="small" />}
                  <Chip label={video.menu} size="small" />
                  <Chip
                    label={video.mediaType === "video" ? "Video 🎬" : "Audio 🎵"}
                    size="small"
                    color={video.mediaType === "video" ? "primary" : "secondary"}
                  />
                  <Chip label={video.status} size="small" color="info" />
                </Box>

                <Typography variant="caption" display="block" mt={1}>
                  Duration: {formatDuration(video.duration)}
                </Typography>

                {/* Actions */}
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    startIcon={<EditIcon />}
                    size="small"
                    variant="outlined"
                  >
                    Edit
                  </Button>

                  <IconButton color="error" onClick={() => handleDelete(video.id)}>
                    {deletingId === video.id ? <CircularProgress size={16} /> : <DeleteIcon />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}