import React, { useState, useEffect } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  IconButton,
  Typography,
  CardContent,
  DialogTitle,
  DialogContent,
} from "@mui/material";

import { type CaseStory, type CaseStoryPayload } from "src/api/caseStories";

// Simple modal for creating or editing a case story
export default function NewCaseStoryModal({
  open,
  onClose,
  onSave,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CaseStoryPayload) => void;
  initialData?: CaseStory;
}) {
  const [title, setTitle] = useState("");
  const [impact, setImpact] = useState("");
  const [duration, setDuration] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [metrics, setMetrics] = useState<{ label: string; value: string }[]>([]);
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setImpact(initialData?.impact || "");
      setDuration(initialData?.duration || "");
      setHeroImage(initialData?.heroImage || "");
      setBodyMd(initialData?.bodyMd || "");
      setTags(initialData?.tags || []);
      setMetrics(initialData?.metrics || []);
      setTagInput("");
      setMetricLabel("");
      setMetricValue("");
    }
  }, [initialData, open]);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    setTags((prev) => [...prev, tagInput.trim()]);
    setTagInput("");
  };

  const handleAddMetric = () => {
    if (!metricLabel.trim() || !metricValue.trim()) return;
    setMetrics((prev) => [...prev, { label: metricLabel.trim(), value: metricValue.trim() }]);
    setMetricLabel("");
    setMetricValue("");
  };

  const handleDeleteMetric = (label: string, value: string) => {
    setMetrics((prev) => prev.filter((m) => m.label !== label || m.value !== value));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      impact: impact || undefined,
      duration: duration || undefined,
      heroImage: heroImage || undefined,
      bodyMd: bodyMd || undefined,
      tags,
      metrics: metrics.length ? metrics : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {initialData ? "Edit Case Story" : "New Case Story"}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Card sx={{ borderRadius: 3, boxShadow: 0 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Impact"
                  placeholder="e.g., Increased conversions by 25%"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Duration"
                  placeholder="e.g., Q1 2026"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </Stack>

              <TextField
                fullWidth
                label="Hero Image URL"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Story (Markdown)"
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
              />

              <Stack spacing={1}>
                <Typography variant="subtitle2">Tags</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    fullWidth
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button variant="contained" onClick={handleAddTag}>
                    Add
                  </Button>
                </Stack>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {tags.map((tag) => (
                    <Chip key={tag} label={tag} onDelete={() => setTags((prev) => prev.filter((t) => t !== tag))} />
                  ))}
                </Box>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2">Metrics</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    fullWidth
                    label="Label"
                    placeholder="e.g., Conversion Rate"
                    value={metricLabel}
                    onChange={(e) => setMetricLabel(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Value"
                    placeholder="e.g., 25%"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                  />
                  <Button variant="outlined" onClick={handleAddMetric}>
                    Add metric
                  </Button>
                </Stack>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {metrics.map((metric) => (
                    <Chip
                      key={`${metric.label}-${metric.value}`}
                      label={`${metric.label}: ${metric.value}`}
                      onDelete={() => handleDeleteMetric(metric.label, metric.value)}
                    />
                  ))}
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={!title.trim()}
                  fullWidth
                >
                  {initialData ? "Update" : "Save"}
                </Button>
                <Button variant="outlined" onClick={onClose} fullWidth>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
