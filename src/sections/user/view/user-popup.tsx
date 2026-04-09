import React, { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Modal,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";

type UserPopupProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    role: string;
    status: string;
    password?: string;
  }) => void;
  initialData?: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  };
};

const UserPopup: React.FC<UserPopupProps> = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin",
    status: "active",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  React.useEffect(() => {
    setForm({
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "admin",
      status: initialData?.status || "active",
      password: "",
    });
  }, [initialData]);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 700,
          maxHeight: "90vh",        // ✅ scroll limit
          overflowY: "auto",        // ✅ enable scroll
          bgcolor: "#fff",
          mx: "auto",
          mt: "5%",
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 🔥 Sticky Header */}
        <Box
          position="sticky"
          top={0}
          bgcolor="#fff"
          zIndex={1}
          p={3}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              {initialData ? "Edit User" : "Add New User"}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* 🔥 Scrollable Content */}
        <Box p={3}>
          {/* Row 1 */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box flex={1} minWidth={250}>
              <Typography>Name *</Typography>
              <TextField
                fullWidth
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Box>

            <Box flex={1} minWidth={250}>
              <Typography>Email *</Typography>
              <TextField
                fullWidth
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Box>
          </Box>

          <Box display="flex" gap={2} mt={3} flexWrap="wrap">
            <Box flex={1} minWidth={250}>
              <Typography>Password {initialData ? "(leave blank to keep)" : "*"}</Typography>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Box>

          {/* Row 2 */}
          <Box display="flex" gap={2} mt={3} flexWrap="wrap">
            <Box flex={1} minWidth={250}>
              <Typography>Role *</Typography>
              <TextField
                select
                fullWidth
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </TextField>
            </Box>

            <Box flex={1} minWidth={250}>
              <Typography>Status *</Typography>
              <TextField
                select
                fullWidth
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
        </Box>

        {/* 🔥 Sticky Footer */}
        <Box
          position="sticky"
          bottom={0}
          bgcolor="#fff"
          p={3}
          borderTop="1px solid #eee"
          display="flex"
          justifyContent="flex-end"
          gap={2}
        >
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UserPopup;