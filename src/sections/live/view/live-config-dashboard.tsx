import React, { useState, useEffect } from "react";

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Divider,
  TextField,
  Typography,
  CardContent,
  LinearProgress,
} from "@mui/material";

import { getLiveConfig, type LiveConfig, updateLiveConfig, getLivePlaylist, requestLiveAccess, type LivePlaylist, type LiveAccessResponse } from "src/api/live";

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

  const [playlist, setPlaylist] = useState<LivePlaylist | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  const [accessLoading, setAccessLoading] = useState(false);
  const [accessResult, setAccessResult] = useState<LiveAccessResponse | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

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

  const handleLoadPlaylist = async () => {
    setPlaylistLoading(true);
    setPlaylistError(null);
    try {
      const data = await getLivePlaylist();
      setPlaylist(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load playlist";
      setPlaylistError(message);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    setAccessLoading(true);
    setAccessError(null);
    setAccessResult(null);
    try {
      const data = await requestLiveAccess();
      setAccessResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to request live access";
      setAccessError(message);
    } finally {
      setAccessLoading(false);
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

      <Divider sx={{ my: 4 }} />

      {/* Live Playlist Section */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        S3 Video Playlist
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Fetch the signed S3 playlist URL for the live stream. Requires authentication.
            </Typography>

            {playlistError && <Alert severity="error">{playlistError}</Alert>}

            {playlist && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">Playlist URL:</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                  }}
                >
                  {playlist.playlistUrl || '—'}
                </Typography>
                {playlist.expiresAt && (
                  <Typography variant="caption" color="text.secondary">
                    Expires: {playlist.expiresAt}
                  </Typography>
                )}
                {playlist.status && (
                  <Typography variant="caption" color="text.secondary">
                    Status: {playlist.status}
                  </Typography>
                )}
              </Stack>
            )}

            <Box>
              <Button
                variant="outlined"
                onClick={handleLoadPlaylist}
                disabled={playlistLoading}
              >
                {playlistLoading ? "Loading…" : "Fetch Playlist"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Live Access Section */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Request Live Access
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Request access to the live stream for the current authenticated user.
            </Typography>

            {accessError && <Alert severity="error">{accessError}</Alert>}

            {accessResult && (
              <Alert severity={accessResult.granted ? "success" : "warning"}>
                {accessResult.message ?? (accessResult.granted ? "Access granted" : "Access denied")}
                {accessResult.expiresAt && (
                  <Typography variant="caption" display="block">
                    Expires: {accessResult.expiresAt}
                  </Typography>
                )}
              </Alert>
            )}

            <Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleRequestAccess}
                disabled={accessLoading}
              >
                {accessLoading ? "Requesting…" : "Request Live Access"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
