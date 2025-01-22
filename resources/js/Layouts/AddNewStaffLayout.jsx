import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { route } from "ziggy-js";

const initialStaff = {
  FullName: "",
  Email: "",
  Phone: "",
  Role: "",
  BranchID: "",
  DateHired: "",
  DailyRate: "",
  HourlyRate: "",
  OvertimeRate: "",
  Notes: "",
};

export default function AddNewStaffLayout({ onClose, onStaffAdded }) {
  const [newStaff, setNewStaff] = useState(initialStaff);
  const [branches, setBranches] = useState([]); // ← hold the list from the server
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 1) Fetch the branches on mount
  useEffect(() => {
    axios
      .get(route("branches.index")) // route pointing to your `indexJson`
      .then((response) => {
        // response.data is { branches: [ ... ] }
        // So we want the array => response.data.branches
        const arrayOfBranches = response.data.branches;
        setBranches(Array.isArray(arrayOfBranches) ? arrayOfBranches : []);
      })
      .catch((error) => {
        console.error("Error fetching branches:", error);
        setBranches([]);
      });
  }, []);

  // 2) Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  // 3) Submit the staff form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!newStaff.FullName.trim()) newErrors.FullName = "Full Name is required";
    if (!newStaff.Email.trim()) newErrors.Email = "Email is required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      alert("Please fix the errors before submitting.");
      return;
    }

    try {
      const payload = { ...newStaff };
      const response = await axios.post(route("staff.store"), payload);
      const createdStaff = response.data;
      alert("Staff registration submitted!");

      if (onStaffAdded) {
        onStaffAdded(createdStaff);
      }
      onClose();
    } catch (error) {
      console.error("Error creating staff:", error);
      // If validation errors from backend
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("An error occurred while creating the staff.");
      }
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Add New Staff</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          {/* The Form */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} direction={isMobile ? "column" : "row"}>
              <Grid item xs={12} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Basic &amp; Employment Information
                </Typography>

                <Grid container spacing={2}>
                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      name="FullName"
                      value={newStaff.FullName}
                      onChange={handleInputChange}
                      error={!!errors.FullName}
                      helperText={errors.FullName}
                      required
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      variant="outlined"
                      type="email"
                      fullWidth
                      name="Email"
                      value={newStaff.Email}
                      onChange={handleInputChange}
                      error={!!errors.Email}
                      helperText={errors.Email}
                      required
                    />
                  </Grid>

                  {/* Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      name="Phone"
                      value={newStaff.Phone}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  {/* Role */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Role"
                      variant="outlined"
                      fullWidth
                      name="Role"
                      value={newStaff.Role}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  {/* Branch Select from branches array */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Branch</InputLabel>
                      <Select
                        name="BranchID"
                        label="Branch"
                        value={newStaff.BranchID}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="">
                          <em>-- Select Branch --</em>
                        </MenuItem>
                        {branches.map((branch) => (
                          <MenuItem key={branch.BranchID} value={branch.BranchID}>
                            {branch.BranchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* DateHired */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date Hired"
                      variant="outlined"
                      fullWidth
                      name="DateHired"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={newStaff.DateHired}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  {/* Rates */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Daily Rate"
                      variant="outlined"
                      fullWidth
                      name="DailyRate"
                      type="number"
                      value={newStaff.DailyRate}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Hourly Rate"
                      variant="outlined"
                      fullWidth
                      name="HourlyRate"
                      type="number"
                      value={newStaff.HourlyRate}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Overtime Rate"
                      variant="outlined"
                      fullWidth
                      name="OvertimeRate"
                      type="number"
                      value={newStaff.OvertimeRate}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField
                      label="Additional Notes"
                      variant="outlined"
                      fullWidth
                      name="Notes"
                      value={newStaff.Notes}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button variant="text" color="inherit" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" type="submit">
                Submit Registration
              </Button>
            </Box>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
