
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

// Define initial payroll values
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

export default function AddPayrollLayout({ onClose, onAdd }) {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Example: require StaffID and GrossPay (adjust as needed)
    if (!payrollData.StaffID || !payrollData.GrossPay) {
      setErrors({
        StaffID: payrollData.StaffID ? "" : "Staff ID is required",
        GrossPay: payrollData.GrossPay ? "" : "Gross Pay is required",
      });
      return;
    }
    // Pass the new payroll data upward
    onAdd(payrollData);
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
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Staff ID"
                name="StaffID"
                value={payrollData.StaffID}
                onChange={handleChange}
                error={!!errors.StaffID}
                helperText={errors.StaffID}
                variant="outlined"
                required
              />
            </Grid>
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
