import React, { useMemo, useState, useEffect, useCallback } from "react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  CardContent,
  LinearProgress,
  TableContainer,
} from "@mui/material";

import { getCaseStories, type CaseStory, createCaseStory, deleteCaseStory, updateCaseStory, type CaseStoryPayload } from "src/api/caseStories";

import NewCaseStoryModal from "../NewCaseStory.js";

export default function CaseStoriesDashboard() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<CaseStory[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<CaseStory | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCaseStories({ search: search || undefined, tag: tagFilter || undefined });
      const items = Array.isArray(response) ? response : response.items || [];
      setStories(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load case stories";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, tagFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadStories();
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [loadStories, search, tagFilter]);

  const tags = useMemo(() => Array.from(new Set(stories.flatMap((s) => s.tags || []))), [stories]);

  const filtered = useMemo(
    () =>
      stories.filter((s) => {
        const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !tagFilter || (s.tags || []).includes(tagFilter);
        return matchesSearch && matchesTag;
      }),
    [stories, search, tagFilter]
  );

  const handleSave = async (payload: CaseStoryPayload) => {
    try {
      if (editing) {
        await updateCaseStory(editing.id, payload);
      } else {
        await createCaseStory(payload);
      }
      setOpenModal(false);
      setEditing(null);
      loadStories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save case story";
      setError(message);
    }
  };

  const handleDelete = async (story: CaseStory) => {
    if (!window.confirm("Delete this case story?")) return;
    try {
      await deleteCaseStory(story.id);
      loadStories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete case story";
      setError(message);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Case Stories
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={2}
        mb={2}
      >
        <Card>
          <CardContent>
            <Typography>Total Stories</Typography>
            <Typography variant="h4">{stories.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography>With Metrics</Typography>
            <Typography variant="h4" color="primary">
              {stories.filter((s) => (s.metrics || []).length > 0).length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography>Tagged</Typography>
            <Typography variant="h4" color="secondary">
              {stories.filter((s) => (s.tags || []).length > 0).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          placeholder="Search case stories"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All tags</MenuItem>
          {tags.map((tag) => (
            <MenuItem key={tag} value={tag}>
              {tag}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setOpenModal(true);
          }}
        >
          New Case Story
        </Button>
      </Box>

      {error && (
        <Box mb={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {loading && (
        <Box mb={2}>
          <LinearProgress />
        </Box>
      )}

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Title</b></TableCell>
              <TableCell><b>Impact</b></TableCell>
              <TableCell><b>Duration</b></TableCell>
              <TableCell><b>Tags</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>Loading case stories...</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>No case stories found.</Typography>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((story) => (
              <TableRow key={story.id}>
                <TableCell>{story.title}</TableCell>
                <TableCell>{story.impact || "--"}</TableCell>
                <TableCell>{story.duration || "--"}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {(story.tags || []).map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      onClick={() => {
                        setEditing(story);
                        setOpenModal(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(story)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <NewCaseStoryModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        initialData={editing || undefined}
        onSave={handleSave}
      />
    </Box>
  );
}
