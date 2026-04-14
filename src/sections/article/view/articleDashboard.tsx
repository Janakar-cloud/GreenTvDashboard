import React, { useMemo, useState, useEffect, useCallback } from "react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Card,
  Grid,
  Chip,
  Table,
  Stack,
  Button,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  CardContent,
  FormControl,
  TableContainer,
  LinearProgress,
} from "@mui/material";

import { getArticles, createArticle, deleteArticle, updateArticle, type ArticleItem, patchArticleStatus } from "src/api/articles";

import NewArticleModal from "../NewArticle";

export default function ArticleDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [newArticle, setNewArticle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [editing, setEditing] = useState<ArticleItem | null>(null);

  const filtered = useMemo(() =>
    articles.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) &&
      (!status || a.status === status)
    )
  , [articles, search, status]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getArticles({ status: (status as string) || 'all', search: search || undefined });
      const raw = Array.isArray(response) ? response : response.items || [];
      // Backend returns _id; normalise to id so all actions (delete/edit/patch) work
      const items = raw.map((a: any) => ({ ...a, id: a.id || a._id }));
      setArticles(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load articles";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadArticles, search, status]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Article Dashboard 📰
      </Typography>

      {/* 📊 STATS */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography>Total Articles</Typography>
              <Typography variant="h4">{articles.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography>Published</Typography>
              <Typography variant="h4" color="green">
                {articles.filter((a) => a.status === "published").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography>Drafts</Typography>
              <Typography variant="h4" color="orange">
                {articles.filter((a) => a.status === "draft").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🔍 FILTERS */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={() => {setEditing(null); setNewArticle(true);} }> New Article</Button>
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

      {/* 📄 TABLE */}
      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Title</b></TableCell>
              <TableCell><b>Tags</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Date</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>Loading articles...</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>No articles found.</Typography>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((article) => (
              <TableRow key={article.id}>
                <TableCell>{article.title}</TableCell>

                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {article.tags?.map((t, i) => {
                      const label = typeof t === 'string' ? t : t.name;
                      const key = typeof t === 'string' ? t : t._id ?? i;
                      return <Chip key={String(key)} label={label} size="small" />;
                    })}
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={article.status}
                    color={
                      article.status === "published"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                  />
                </TableCell>

                <TableCell>{article.publishDate || "--"}</TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={() => { setEditing(article); setNewArticle(true); }}>
                      <EditIcon />
                    </IconButton>

                    <Button size="small" variant="outlined" onClick={async () => {
                      const next = article.status === "published" ? "draft" : "published";
                      try {
                        await patchArticleStatus(article.id, next as 'published' | 'draft');
                        loadArticles();
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Failed to update status";
                        setError(message);
                      }
                    }}>
                      {article.status === "published" ? "Mark Draft" : "Publish"}
                    </Button>

                    <IconButton color="error" onClick={async () => {
                      if (!window.confirm("Delete this article?")) return;
                      try {
                        await deleteArticle(article.id);
                        loadArticles();
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Failed to delete";
                        setError(message);
                      }
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <NewArticleModal
        open={newArticle}
        onClose={() => setNewArticle(false)}
        initialData={editing || undefined}
        onSave={async (data) => {
          try {
            if (editing) {
              await updateArticle(editing.id, data);
            } else {
              await createArticle(data);
            }
            setNewArticle(false);
            setEditing(null);
            loadArticles();
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to save article";
            setError(message);
          }
        }}
      />
    </Box>
  );
}