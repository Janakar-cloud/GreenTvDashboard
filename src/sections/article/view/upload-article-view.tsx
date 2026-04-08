import type { DragEvent, ChangeEvent } from "react";

import React, { useRef, useState } from "react";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Card,
  Chip,
  Alert,
  Button,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Typography,
  InputLabel,
  CardContent,
  FormControl,
  LinearProgress,
  FormControlLabel,
} from "@mui/material";

import { createArticle } from "src/api/articles";
import { requestUploadUrl, uploadFileWithProgress } from "src/api/media";

export default function UploadArticleView() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [readTime, setReadTime] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const coverRef = useRef<HTMLInputElement | null>(null);

  const handleCoverFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image for the cover.");
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCoverDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleCoverFile(e.dataTransfer.files[0]);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setBodyMd("");
    setReadTime("");
    setPublishDate("");
    setStatus("draft");
    setFeatured(false);
    setTags([]);
    setTagInput("");
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setUploading(true);
    setProgress(5);

    try {
      let coverImageUrl: string | undefined;

      if (coverFile) {
        const { url: presignedUrl, fileUrl } = await requestUploadUrl("articles/covers", coverFile.type);
        await uploadFileWithProgress(presignedUrl, coverFile, setProgress);
        coverImageUrl = fileUrl;
      }

      setProgress(80);

      await createArticle({
        title,
        subtitle: subtitle || undefined,
        bodyMd: bodyMd || undefined,
        readTime: readTime || undefined,
        coverImage: coverImageUrl,
        publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
        status,
        featured,
        tags,
      });

      setProgress(100);
      setSuccess(`Article "${title}" saved successfully as ${status}.`);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save article.";
      setError(message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
      }}
    >
      <Card sx={{ width: 720, borderRadius: 4, boxShadow: 6 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Upload Article 📝
          </Typography>

          {/* Cover Image */}
          <Box>
            <Typography fontWeight="bold" mb={1}>
              Cover Image
            </Typography>
            <Box
              onDrop={handleCoverDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => coverRef.current?.click()}
              sx={{
                border: "2px dashed #6366f1",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: coverPreview ? "transparent" : "#f8f9ff",
              }}
            >
              {coverPreview ? (
                <Box
                  component="img"
                  src={coverPreview}
                  alt="cover preview"
                  sx={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 2 }}
                />
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 40, color: "#6366f1" }} />
                  <Typography color="text.secondary">
                    Drag & drop or click to upload cover image
                  </Typography>
                </>
              )}
              <input
                ref={coverRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCoverFile(e.target.files?.[0])}
              />
            </Box>
            {coverFile && (
              <Button
                size="small"
                color="error"
                sx={{ mt: 1 }}
                onClick={() => {
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  setCoverFile(null);
                  setCoverPreview(null);
                }}
              >
                Remove cover
              </Button>
            )}
          </Box>

          {/* Title */}
          <TextField
            fullWidth
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Subtitle */}
          <TextField
            fullWidth
            label="Subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          {/* Body / Content */}
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Body (Markdown)"
            placeholder="Write your article content here..."
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
          />

          {/* Read Time + Publish Date */}
          <Box display="flex" gap={2}>
            <TextField
              sx={{ flex: 1 }}
              label="Read Time (e.g. 5 min)"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
            />
            <TextField
              sx={{ flex: 1 }}
              label="Publish Date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {/* Status + Featured */}
          <Box display="flex" gap={2} alignItems="center">
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
              }
              label="Featured"
            />
          </Box>

          {/* Tags */}
          <Box>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                label="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type tag and press Enter"
              />
              <Button variant="outlined" onClick={handleAddTag}>
                Add
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => setTags(tags.filter((t) => t !== tag))}
                />
              ))}
            </Box>
          </Box>

          {/* Progress */}
          {uploading && (
            <Box>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="text.secondary">
                {progress < 80 ? "Uploading cover image..." : "Saving article..."}
              </Typography>
            </Box>
          )}

          {/* Feedback */}
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {/* Submit */}
          <Button
            variant="contained"
            size="large"
            disabled={uploading}
            onClick={handleSubmit}
            sx={{ borderRadius: 3 }}
          >
            {uploading ? "Saving..." : status === "published" ? "Publish Article" : "Save as Draft"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
