import React, { useCallback, useEffect, useMemo, useState } from "react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { createAboutBlock, deleteAboutBlock, getAboutBlocks, updateAboutBlock, type AboutBlock, type AboutBlockPayload } from "src/api/about";

import NewAboutBlockModal from "../NewAboutBlock";

export default function AboutDashboard() {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<AboutBlock[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<AboutBlock | null>(null);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAboutBlocks(search || undefined);
      const items = Array.isArray(data) ? data : (data as AboutBlock[]);
      setBlocks(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load about blocks";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadBlocks();
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [loadBlocks, search]);

  const kinds = useMemo(() => Array.from(new Set(blocks.map((b) => b.kind))), [blocks]);

  const filtered = useMemo(
    () =>
      blocks.filter((b) => {
        const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
        const matchesKind = !kindFilter || b.kind === kindFilter;
        return matchesSearch && matchesKind;
      }),
    [blocks, search, kindFilter]
  );

  const handleSave = async (payload: AboutBlockPayload) => {
    try {
      if (editing) {
        await updateAboutBlock(editing.id, payload);
      } else {
        await createAboutBlock(payload);
      }
      setOpenModal(false);
      setEditing(null);
      loadBlocks();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save about block";
      setError(message);
    }
  };

  const handleDelete = async (block: AboutBlock) => {
    if (!window.confirm("Delete this about block?")) return;
    try {
      await deleteAboutBlock(block.id);
      loadBlocks();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete about block";
      setError(message);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        About Blocks
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}
        gap={2}
        mb={2}
      >
        <Card>
          <CardContent>
            <Typography>Total Blocks</Typography>
            <Typography variant="h4">{blocks.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography>CTA Blocks</Typography>
            <Typography variant="h4" color="primary">
              {blocks.filter((b) => b.kind === 'cta').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography>With Media</Typography>
            <Typography variant="h4" color="secondary">
              {blocks.filter((b) => !!b.mediaUrl).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          placeholder="Search blocks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All kinds</MenuItem>
          {kinds.map((kind) => (
            <MenuItem key={kind} value={kind}>
              {kind}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setOpenModal(true);
          }}
        >
          New Block
        </Button>
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

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Title</b></TableCell>
              <TableCell><b>Kind</b></TableCell>
              <TableCell><b>Order</b></TableCell>
              <TableCell><b>Media</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>Loading blocks...</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography>No about blocks found.</Typography>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((block) => (
              <TableRow key={block.id}>
                <TableCell>{block.title}</TableCell>
                <TableCell>
                  <Chip label={block.kind} size="small" />
                </TableCell>
                <TableCell>{block.order ?? '--'}</TableCell>
                <TableCell>{block.mediaUrl ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      onClick={() => {
                        setEditing(block);
                        setOpenModal(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(block)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <NewAboutBlockModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditing(null);
        }}
        initialData={editing || undefined}
        onSave={handleSave}
      />
    </Box>
  );
}
