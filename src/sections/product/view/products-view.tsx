import type { DragEvent, ChangeEvent } from "react";

import React, { useEffect, useRef, useState } from "react";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Card,
  Button,
  TextField,
  Typography,
  CardContent,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";

import { getCategories, getMenus } from "src/api/reference";
import { createMedia, requestUploadUrl, uploadFileWithProgress } from "src/api/media";

export function ProductsView() {
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const [menu, setMenu] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [menuOptions, setMenuOptions] = useState<string[]>(["LiveTv", "Podcast"]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const thumbRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const menusResponse = await getMenus();
        const menusList = Array.isArray(menusResponse)
          ? menusResponse
          : menusResponse?.data || [];
        if (menusList.length) {
          setMenuOptions(menusList);
        }

        const categoryResponse = await getCategories("media");
        const categoryList = Array.isArray(categoryResponse)
          ? categoryResponse
          : categoryResponse?.data || [];
        setCategoryOptions(categoryList);
      } catch (err) {
        console.warn("Unable to load reference data", err);
      }
    })();
  }, []);

  // 🎯 Handle Media
  const handleMedia = (selectedFile?: File | null) => {
    if (!selectedFile) return;

    if (mediaType === "video" && !selectedFile.type.startsWith("video/")) {
      alert("Upload valid video");
      return;
    }

    if (mediaType === "audio" && !selectedFile.type.startsWith("audio/")) {
      alert("Upload valid audio");
      return;
    }

    // 🧹 cleanup old preview (important)
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreview(previewUrl);
  };

  const handleThumbnail = (selectedFile?: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Upload valid image");
      return;
    }

    if (thumbPreview) {
      URL.revokeObjectURL(thumbPreview);
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setThumbnail(selectedFile);
    setThumbPreview(previewUrl);
  };
  // Switch Media Type
  const handleTabChange = (_: any, value: "video" | "audio") => {
    setMediaType(value);

    // Remove thumbnail if audio
    if (value === "audio") {
      setThumbnail(null);
      setThumbPreview(null);
    }

    // Reset media
    setFile(null);
    setPreview(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleMedia(e.dataTransfer.files[0]);
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setThumbnail(null);
    setThumbPreview(null);
    setMenu("");
    setCategory("");
    setTitle("");
    setDescription("");
    setProgress(0);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a media file to upload.");
      return;
    }

    if (!menu) {
      setError("Please choose a menu (LiveTv or Podcast).");
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(5);

    try {
      const mediaPrefix = mediaType === "video" ? "videos" : "podcasts";
      const { url: mediaUrl, fileUrl } = await requestUploadUrl(mediaPrefix, file.type);
      await uploadFileWithProgress(mediaUrl, file, setProgress);

      let thumbnailUrl: string | undefined;

      if (mediaType === "video" && thumbnail) {
        const { url: thumbUrl, fileUrl: thumbRemote } = await requestUploadUrl(
          "thumbnails",
          thumbnail.type
        );
        await uploadFileWithProgress(thumbUrl, thumbnail);
        thumbnailUrl = thumbRemote;
      }

      await createMedia({
        title,
        description: description || undefined,
        mediaType,
        menu: menu as "LiveTv" | "Podcast",
        category: category || undefined,
        fileUrl,
        thumbnailUrl,
        status: "ready",
      });

      setSuccess("Upload completed");
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
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
        alignItems: "center",
        p: 2,
      }}
    >
      <Card sx={{ width: 700, borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold">
            Upload Media 🎬🎵
          </Typography>

          {/*MEDIA TYPE TABS */}
          <Tabs
            value={mediaType}
            onChange={handleTabChange}
            centered
            sx={{
              mt: 2,
              "& .MuiTab-root": {
                fontSize: "16px",   
                fontWeight: 600,
                minHeight: 60,      
                padding: "12px 24px",
              },
            }}
          >
            <Tab label="Video 🎬" value="video" />
            <Tab label="Audio 🎵" value="audio" />
          </Tabs>

          {/* UPLOAD */}
          <Box
            mt={2}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            sx={{
              border: "2px dashed #6366f1",
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 40 }} />
            <Typography>
              Upload {mediaType === "video" ? "Video" : "Audio"}
            </Typography>

            <input
              ref={fileRef}
              type="file"
              hidden
              accept={mediaType === "video" ? "video/*" : "audio/*"}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleMedia(e.target.files?.[0])
              }
            />
          </Box>

          {/* PREVIEW */}
          {preview && (
            <Box mt={2}>
              {mediaType === "video" ? (
                <video width="100%" controls style={{ borderRadius: 10 }}>
                  <source src={preview} />
                </video>
              ) : (
                <audio controls style={{ width: "100%" }}>
                  <source src={preview} />
                </audio>
              )}
            </Box>
          )}

          {/* THUMBNAIL (ONLY VIDEO) */}
          {mediaType === "video" && (
            <Box mt={3}>
              <Typography fontWeight="bold" mb={1}>
                Thumbnail
              </Typography>

              <Box
                onClick={() => thumbRef.current?.click()}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  handleThumbnail(e.dataTransfer.files[0]);
                }}
                onDragOver={(e) => e.preventDefault()}
                sx={{
                  border: "2px dashed #10b981",
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  position: "relative",
                  height: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f9fafb",
                }}
              >
                {!thumbPreview ? (
                  <Typography color="text.secondary">
                    Click or Drag image here
                  </Typography>
                ) : (
                  <>
                    <img
                      src={thumbPreview}
                      alt="thumbnail"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          thumbRef.current?.click();
                        }}
                      >
                        Change
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnail(null);
                          setThumbPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </>
                )}

                <input
                  ref={thumbRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleThumbnail(e.target.files?.[0])
                  }
                />
              </Box>
            </Box>
          )}

          {/* MENU */}
          <Box mt={3}>
            <FormControl fullWidth>
              <InputLabel>Menu</InputLabel>
              <Select
                value={menu}
                label="Menu"
                onChange={(e) => setMenu(e.target.value)}
                disabled={uploading}
              >
                <MenuItem value="">Select Menu</MenuItem>
                {menuOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* CATEGORY */}
          <Box mt={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categoryOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* METADATA */}
          <Box mt={3}>
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={uploading}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={uploading}
              multiline
              rows={3}
            />
          </Box>

          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}

          {success && (
            <Typography color="success.main" mt={2}>
              {success}
            </Typography>
          )}

          {uploading && (
            <Box mt={2}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" display="block" mt={1}>
                Uploading... {progress}%
              </Typography>
            </Box>
          )}

          {/* 🚀 ACTIONS */}
          <Box mt={3} display="flex" gap={2}>
            <Button variant="contained" fullWidth disabled={uploading} onClick={handleUpload}>
              Upload
            </Button>

            <Button
              variant="outlined"
              fullWidth
              disabled={uploading}
              onClick={resetForm}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}