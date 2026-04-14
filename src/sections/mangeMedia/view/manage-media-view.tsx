import React, { useState, useEffect, useCallback } from "react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Button,
  Dialog,
  Select,
  Checkbox,
  MenuItem,
  TextField,
  CardMedia,
  Typography,
  IconButton,
  InputLabel,
  CardContent,
  DialogTitle,
  FormControl,
  OutlinedInput,
  DialogActions,
  DialogContent,
  ListItemText,
  FormHelperText,
  CircularProgress,
} from "@mui/material";

import { type CategoryOption, getMedia, updateMedia, deleteMedia, type MediaItem, getMediaCategories } from "src/api/media";

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [menu, setMenu] = useState("");
  const [status, setStatus] = useState("");

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: MediaItem | null }>({ open: false, item: null });
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMediaCategories();
        setCategoryOptions(list);
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
        category: categoryFilter || undefined,
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
  }, [categoryFilter, menu, search, status]);

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

  const handleEditOpen = (item: MediaItem) => {
    // Map category names back to IDs using categoryOptions
    const ids = (item.categories ?? (item.category ? [item.category] : [])).map((name) =>
      categoryOptions.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id ?? ""
    ).filter(Boolean);

    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditCategoryIds(ids);
    setEditError(null);
    setEditDialog({ open: true, item });
  };

  const handleEditSave = async () => {
    if (!editDialog.item) return;
    if (editCategoryIds.length < 2) {
      setEditError("Select at least 2 categories");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateMedia(editDialog.item.id, {
        title: editTitle,
        description: editDescription || undefined,
        categories: editCategoryIds,
      });
      setEditDialog({ open: false, item: null });
      fetchMedia();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditSaving(false);
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
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categoryOptions.map((cat) => (
              <MenuItem key={cat.id} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Menu</InputLabel>
          <Select value={menu} label="Menu" onChange={(e) => setMenu(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="LiveTv">Videos</MenuItem>
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
                  <Chip label={video.menu === "LiveTv" ? "Videos" : video.menu} size="small" />
                  <Chip
                    label={video.mediaType === "video" ? "Video 🎬" : "Audio 🎵"}
                    size="small"
                    color={video.mediaType === "video" ? "primary" : "secondary"}
                  />
                  <Chip label={video.status} size="small" color="info" />
                  {/* Multiple category chips */}
                  {(video.categories?.length
                    ? video.categories
                    : video.category
                    ? [video.category]
                    : []
                  ).map((cat) => (
                    <Chip key={cat} label={cat} size="small" variant="outlined" color="success" />
                  ))}
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
                    onClick={() => handleEditOpen(video)}
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

      {/* ✏️ Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Media</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={editSaving}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={editSaving}
          />

          {/* Multi-select categories */}
          <FormControl fullWidth error={editCategoryIds.length > 0 && editCategoryIds.length < 2}>
            <InputLabel>Categories (select at least 2)</InputLabel>
            <Select
              multiple
              value={editCategoryIds}
              onChange={(e) => {
                const val = e.target.value;
                setEditCategoryIds(typeof val === "string" ? [val] : val as string[]);
              }}
              input={<OutlinedInput label="Categories (select at least 2)" />}
              renderValue={(selected) =>
                (selected as string[])
                  .map((id) => categoryOptions.find((c) => c.id === id)?.name || id)
                  .join(", ")
              }
              disabled={editSaving}
            >
              {categoryOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  <Checkbox checked={editCategoryIds.includes(opt.id)} />
                  <ListItemText primary={opt.name} />
                </MenuItem>
              ))}
            </Select>
            {editCategoryIds.length > 0 && editCategoryIds.length < 2 && (
              <FormHelperText>Select at least 2 categories</FormHelperText>
            )}
            {editCategoryIds.length >= 2 && (
              <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                {editCategoryIds.map((id) => (
                  <Chip
                    key={id}
                    size="small"
                    label={categoryOptions.find((c) => c.id === id)?.name || id}
                    onDelete={() => setEditCategoryIds((prev) => prev.filter((v) => v !== id))}
                  />
                ))}
              </Box>
            )}
          </FormControl>

          {editError && <Alert severity="error">{editError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, item: null })} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving || editCategoryIds.length < 2}>
            {editSaving ? <CircularProgress size={18} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}