import React, { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Card,
    Chip,
    Button,
    Dialog,
    Select,
    MenuItem,
    TextField,
    Typography,
    IconButton,
    InputLabel,
    CardContent,
    FormControl,
    DialogTitle,
    DialogContent,
} from "@mui/material";

import { type ArticleItem, type ArticlePayload } from "src/api/articles";

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: (data: ArticlePayload) => void;
    initialData?: ArticleItem;
};

export default function NewArticleModal({ open, onClose, onSave, initialData }: Props) {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [bodyMd, setBodyMd] = useState("");
    const [readTime, setReadTime] = useState("");
    const [publishDate, setPublishDate] = useState("");
    const [status, setStatus] = useState<'published' | 'draft'>('draft');
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
    };

    const handleDeleteTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const reset = () => {
        setTitle("");
        setSubtitle("");
        setCoverImage("");
        setBodyMd("");
        setReadTime("");
        setPublishDate("");
        setStatus('draft');
        setTags([]);
        setTagInput("");
    };

    React.useEffect(() => {
        if (initialData && open) {
            setTitle(initialData.title || "");
            setSubtitle(initialData.subtitle || "");
            setCoverImage(initialData.coverImage || "");
            setBodyMd(initialData.bodyMd || "");
            setReadTime(initialData.readTime || "");
            setPublishDate(initialData.publishDate || "");
            setStatus(initialData.status || 'draft');
            setTags(initialData.tags || []);
        } else if (open) {
            reset();
        }
    }, [initialData, open]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSave({
            title,
            subtitle: subtitle || undefined,
            coverImage: coverImage || undefined,
            bodyMd: bodyMd || undefined,
            readTime: readTime || undefined,
            publishDate: publishDate || undefined,
            status,
            tags,
        });
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
                {initialData ? "Edit Article" : "Create New Article"} 📝
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Card sx={{ borderRadius: 3, boxShadow: 0 }}>
                    <CardContent>
                        <TextField
                            fullWidth
                            label="Article Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Cover Image URL"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Publish Date (ISO)"
                            placeholder="2026-03-26T10:00:00.000Z"
                            value={publishDate}
                            onChange={(e) => setPublishDate(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Read Time"
                            placeholder="5 min read"
                            value={readTime}
                            onChange={(e) => setReadTime(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={status}
                                label="Status"
                                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                            >
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Content (Markdown)"
                            multiline
                            rows={6}
                            value={bodyMd}
                            onChange={(e) => setBodyMd(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Box mb={3}>
                            <Typography mb={1}>Tags</Typography>

                            <Box display="flex" gap={1}>
                                <TextField
                                    fullWidth
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                />
                                <Button variant="contained" onClick={handleAddTag}>
                                    Add
                                </Button>
                            </Box>

                            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                    />
                                ))}
                            </Box>
                        </Box>

                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={!title.trim()}
                            >
                                {initialData ? "Update" : "Save"}
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </Box>

                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}