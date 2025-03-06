// File: AddScheduleLayout.jsx
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { route } from "ziggy-js";

export default function AddScheduleLayout({ onClose, staffOptions = [], onSchedulesCreated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Form state
  const [staffID, setStaffID] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [shiftType, setShiftType] = useState("morning");
  const [dynamicStart, setDynamicStart] = useState("");
  const [dynamicEnd, setDynamicEnd] = useState("");

  // For server validation errors
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // clear old errors

    // Basic client checks
    if (!staffID || !dateFrom || !dateTo || !shiftType) {
      alert("Please fill in all required fields.");
      return;
    }
    if (new Date(dateTo) < new Date(dateFrom)) {
      alert("End date cannot be before Start date.");
      return;
    }

    // Build the payload
    const payload = {
      StaffID: staffID,
      dateFrom,
      dateTo,
      shiftType,
      startTime: dynamicStart,
      endTime: dynamicEnd,
    };

    try {
      // POST directly here => you can call your storeSchedules or bulkStoreSchedules
      // For example: route('staff.schedules.bulkStore')
      const response = await axios.post(route("staff.schedules.bulkStore"), payload);

      // If success => maybe call parent's onSchedulesCreated to refresh
      if (onSchedulesCreated) {
        onSchedulesCreated(response.data); // e.g. { message, schedules: [...] }
      }

      onClose();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        // Format: err.response.data.errors => { dateFrom: [...], ... }
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Error creating schedules:", err);
        alert("Something went wrong. Check console for details.");
      }
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            <AddIcon sx={{ mr: 1 }} />
            Add Schedules
          </Typography>
          <IconButton onClick={onClose} sx={{ "&:hover": { color: "red" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Display server-side validation errors, if any */}
        {Object.keys(errors).length > 0 && (
          <Box sx={{ mb: 2 }}>
            {Object.entries(errors).map(([field, msgs]) => (
              <Alert severity="error" key={field} sx={{ mb: 1 }}>
                {msgs.join(" ")}
              </Alert>
            ))}
          </Box>
        )}

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2} direction={isMobile ? "column" : "row"}>
            {/* Staff */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.StaffID}>
                <InputLabel id="staff-select-label">Select Staff</InputLabel>
                <Select
                  labelId="staff-select-label"
                  label="Select Staff"
                  value={staffID}
                  onChange={(e) => setStaffID(e.target.value)}
                >
                  {staffOptions.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
                {/* If you wanted a small text below the Select for error: 
                {errors.StaffID && (
                  <Typography variant="caption" color="error">{errors.StaffID[0]}</Typography>
                )} */}
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                error={!!errors.dateFrom}
                helperText={errors.dateFrom?.[0] || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                error={!!errors.dateTo}
                helperText={errors.dateTo?.[0] || ""}
              />
            </Grid>

            {/* Shift Type */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.shiftType}>
                <InputLabel id="shift-select-label">Shift Type</InputLabel>
                <Select
                  labelId="shift-select-label"
                  label="Shift Type"
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                >
                  <MenuItem value="morning">Morning (5:30 AM - 2:30 PM)</MenuItem>
                  <MenuItem value="mid">Mid (10:00 AM - 7:00 PM)</MenuItem>
                  <MenuItem value="evening">Evening (3:00 PM - 12:00 MN)</MenuItem>
                  <MenuItem value="dynamic">Dynamic (Custom times)</MenuItem>
                </Select>
                {/* Optional error text */}
                {errors.shiftType && (
                  <Typography variant="caption" color="error">
                    {errors.shiftType[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* If shiftType === "dynamic", show Start/End fields */}
            {shiftType === "dynamic" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    value={dynamicStart}
                    onChange={(e) => setDynamicStart(e.target.value)}
                    error={!!errors.startTime}
                    helperText={errors.startTime?.[0] || ""}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    value={dynamicEnd}
                    onChange={(e) => setDynamicEnd(e.target.value)}
                    error={!!errors.endTime}
                    helperText={errors.endTime?.[0] || ""}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Save Schedules
        </Button>
      </DialogActions>
    </Dialog>
  );
}
