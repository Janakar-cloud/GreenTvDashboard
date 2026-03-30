import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { sendTestEmail } from "src/api/admin";

export default function TestEmailCard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await sendTestEmail(email.trim());
      setSuccess(`Sent to ${res.to || email}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send test email";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Admin Test Email
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Send a test email to verify SMTP configuration.
            </Typography>
            <TextField
              label="Recipient email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !email.trim()}
              >
                {loading ? "Sending..." : "Send test email"}
              </Button>
              <Button variant="outlined" onClick={() => { setEmail(""); setError(null); setSuccess(null); }} disabled={loading}>
                Clear
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
