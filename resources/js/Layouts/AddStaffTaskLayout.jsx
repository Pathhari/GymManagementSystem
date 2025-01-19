// File: src/Layouts/AddStaffTaskLayout.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Define initial task object
const initialTask = {
  StaffID: "",
  TaskDescription: "",
  TaskDate: "",
  Status: "Pending",
};

export default function AddStaffTaskLayout({ onClose, onAdd }) {
  const [taskData, setTaskData] = useState(initialTask);
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Require StaffID and TaskDescription (adjust as needed)
    if (!taskData.StaffID || !taskData.TaskDescription) {
      setErrors({
        StaffID: taskData.StaffID ? "" : "Staff ID is required",
        TaskDescription: taskData.TaskDescription ? "" : "Description is required",
      });
      return;
    }
    onAdd(taskData);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Staff Task</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Staff ID"
                name="StaffID"
                value={taskData.StaffID}
                onChange={handleChange}
                error={!!errors.StaffID}
                helperText={errors.StaffID}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Description"
                name="TaskDescription"
                value={taskData.TaskDescription}
                onChange={handleChange}
                error={!!errors.TaskDescription}
                helperText={errors.TaskDescription}
                variant="outlined"
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Task Date"
                name="TaskDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={taskData.TaskDate}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Status"
                name="Status"
                value={taskData.Status}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ py: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
