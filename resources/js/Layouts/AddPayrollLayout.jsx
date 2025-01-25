import React, { useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, IconButton, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const initialPayroll = {
  StaffID: "",
  StartDate: "",
  EndDate: "",
  GrossPay: "",
  Deductions: "",
  NetPay: "",
  GeneratedDate: "",
  Status: "",
};

export default function AddPayrollLayout({
  onClose,
  onAdd,
  staffOptions = [],
}) {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!payrollData.StaffID || !payrollData.GrossPay) {
      setErrors({
        StaffID: payrollData.StaffID ? "" : "Staff ID is required",
        GrossPay: payrollData.GrossPay ? "" : "Gross Pay is required",
      });
      return;
    }
  
    // Get the staff name from staffOptions
    const selectedStaff = staffOptions.find(
      (staff) => staff.value === payrollData.StaffID
    );
  
    // Add staff name to payload
    const payload = {
      ...payrollData,
      staff: {
        StaffID: payrollData.StaffID,
        FullName: selectedStaff?.label || "N/A",
      },
    };
  
    onAdd(payload);
    onClose();
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add Payroll</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* StaffID -> DropDown */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.StaffID}>
                <InputLabel>Staff</InputLabel>
                <Select
                  name="StaffID"
                  label="Staff"
                  value={payrollData.StaffID}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>-- Select Staff --</em>
                  </MenuItem>
                  {staffOptions.map((staff) => (
                    <MenuItem key={staff.value} value={staff.value}>
                      {staff.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.StaffID && (
                  <Typography variant="caption" color="error">
                    {errors.StaffID}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* StartDate */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="StartDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={payrollData.StartDate}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {/* EndDate */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                name="EndDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={payrollData.EndDate}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {/* GrossPay */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Gross Pay"
                name="GrossPay"
                type="number"
                value={payrollData.GrossPay}
                onChange={handleChange}
                error={!!errors.GrossPay}
                helperText={errors.GrossPay}
                variant="outlined"
                required
              />
            </Grid>

            {/* Deductions */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deductions"
                name="Deductions"
                type="number"
                value={payrollData.Deductions}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {/* NetPay */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Net Pay"
                name="NetPay"
                type="number"
                value={payrollData.NetPay}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {/* GeneratedDate */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Generated Date"
                name="GeneratedDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={payrollData.GeneratedDate}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Status"
                name="Status"
                value={payrollData.Status}
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
          Add Payroll
        </Button>
      </DialogActions>
    </Dialog>
  );
}
