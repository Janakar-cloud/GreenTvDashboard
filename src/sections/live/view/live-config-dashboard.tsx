import React, { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

import { getLiveConfig, updateLiveConfig, type LiveConfig } from "src/api/live";

export default function LiveConfigDashboard() {
  const [form, setForm] = useState<LiveConfig>({
    streamUrl: "",
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLiveConfig();
        setForm({
          streamUrl: data.streamUrl || "",
          title: data.title || "",
          description: data.description || "",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load live config";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleChange = (key: keyof LiveConfig) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateLiveConfig(form);
      setSuccess("Live configuration saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save live config";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Live Configuration
      </Typography>

      {loading && (
        <Box mb={2}>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Box mb={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {success && (
        <Box mb={2}>
          <Alert severity="success">{success}</Alert>
        </Box>
      )}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <TextField
              label="Stream URL"
              fullWidth
              value={form.streamUrl || ""}
              onChange={handleChange("streamUrl")}
              placeholder="https://example.com/live.m3u8"
            />

            <TextField
              label="Title"
              fullWidth
              value={form.title || ""}
              onChange={handleChange("title")}
              placeholder="Live broadcast"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={form.description || ""}
              onChange={handleChange("description")}
              placeholder="Describe the live stream"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setForm({ streamUrl: "", title: "", description: "" });
                }}
                disabled={saving}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
