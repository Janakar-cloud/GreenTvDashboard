import type { IPostItem } from 'src/sections/blog/post-item';

import { useMemo, useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getPosts, createPost, deletePost, updatePost, type PostItem } from 'src/api/posts';

import { BlogView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export default function Page() {
  const [posts, setPosts] = useState<IPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PostItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    authorName: '',
    authorAvatarUrl: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPosts({ page: 1, limit: 12, sort: 'latest' });
        const list = Array.isArray(response) ? response : response.data;

        if (!active) return;
        setPosts(
          list.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            coverUrl: item.coverUrl,
            totalViews: item.totalViews ?? 0,
            totalComments: item.totalComments ?? 0,
            totalShares: item.totalShares ?? 0,
            totalFavorites: item.totalFavorites ?? 0,
            postedAt: item.postedAt,
            author: {
              name: item.author?.name ?? 'Unknown',
              avatarUrl: item.author?.avatarUrl ?? '/assets/images/avatar/avatar_1.jpg',
            },
          }))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load posts';
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

  const resetForm = () => {
    setForm({ title: '', description: '', coverUrl: '', authorName: '', authorAvatarUrl: '' });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (post: IPostItem) => {
    setEditing(post as PostItem);
    setForm({
      title: post.title,
      description: post.description,
      coverUrl: post.coverUrl,
      authorName: post.author.name,
      authorAvatarUrl: post.author.avatarUrl,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (post: IPostItem) => {
    if (!window.confirm('Delete this post?')) return;
    setMutating(true);
    setError(null);
    try {
      await deletePost(post.id);
      const response = await getPosts({ page: 1, limit: 12, sort: 'latest' });
      const list = Array.isArray(response) ? response : response.data;
      setPosts(list as IPostItem[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete post';
      setError(message);
    } finally {
      setMutating(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.coverUrl.trim()) {
      setError('Title, description, and cover URL are required');
      return;
    }

    setMutating(true);
    setError(null);

    try {
      if (editing) {
        await updatePost(editing.id, {
          title: form.title,
          description: form.description,
          coverUrl: form.coverUrl,
          author: { name: form.authorName, avatarUrl: form.authorAvatarUrl },
        } as Partial<PostItem>);
      } else {
        await createPost({
          title: form.title,
          description: form.description,
          coverUrl: form.coverUrl,
          totalViews: 0,
          totalComments: 0,
          totalShares: 0,
          totalFavorites: 0,
          author: { name: form.authorName || 'Unknown', avatarUrl: form.authorAvatarUrl || '' },
          postedAt: new Date().toISOString(),
        } as PostItem);
      }

      const response = await getPosts({ page: 1, limit: 12, sort: 'latest' });
      const list = Array.isArray(response) ? response : response.data;
      setPosts(list as IPostItem[]);
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save post';
      setError(message);
    } finally {
      setMutating(false);
    }
  };

  const dialogTitle = useMemo(() => (editing ? 'Edit Post' : 'New Post'), [editing]);

  const renderDialog = (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <TextField
            label="Cover URL"
            fullWidth
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
          />
          <TextField
            label="Author Name"
            fullWidth
            value={form.authorName}
            onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
          />
          <TextField
            label="Author Avatar URL"
            fullWidth
            value={form.authorAvatarUrl}
            onChange={(e) => setForm((f) => ({ ...f, authorAvatarUrl: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDialogOpen(false)} disabled={mutating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={mutating}>
          {editing ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <title>{`Blog - ${CONFIG.appName}`}</title>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <BlogView
          posts={posts}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}
      {renderDialog}
    </>
  );
}
