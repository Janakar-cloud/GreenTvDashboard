import React, { useEffect, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import { type AboutBlock, type AboutBlockPayload } from "src/api/about";

export default function NewAboutBlockModal({
  open,
  onClose,
  onSave,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AboutBlockPayload) => void;
  initialData?: AboutBlock;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [order, setOrder] = useState<number | undefined>(undefined);
  const [kind, setKind] = useState<AboutBlockPayload['kind']>('theme');

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setBody(initialData?.body || "");
      setMediaUrl(initialData?.mediaUrl || "");
      setOrder(initialData?.order);
      setKind(initialData?.kind || 'theme');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      body: body || undefined,
      mediaUrl: mediaUrl || undefined,
      order,
      kind,
      id: initialData?.id || '', // will be stripped by payload typing but kept to avoid TS complaint
    } as AboutBlockPayload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {initialData ? "Edit About Block" : "New About Block"}
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

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />

              <TextField
                fullWidth
                label="Media URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Kind</InputLabel>
                  <Select value={kind} label="Kind" onChange={(e) => setKind(e.target.value as AboutBlockPayload['kind'])}>
                    <MenuItem value="theme">Theme</MenuItem>
                    <MenuItem value="timeline">Timeline</MenuItem>
                    <MenuItem value="gallery">Gallery</MenuItem>
                    <MenuItem value="cta">CTA</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="number"
                  label="Order"
                  value={order ?? ''}
                  onChange={(e) => setOrder(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="1"
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
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
