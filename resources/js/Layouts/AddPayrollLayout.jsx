import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  IconButton,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  InputAdornment,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

// ICON IMPORTS
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SaveIcon from "@mui/icons-material/Save";

import { route } from "ziggy-js";

const initialPayroll = {
  StaffID: "",
  StartDate: "",
  EndDate: "",
  Deductions: "",
  GrossPay: "",
  NetPay: "",
  GeneratedDate: "",
  Status: "",
};

export default function AddPayrollLayout({ onClose, onAdd, staffOptions = [] }) {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [errors, setErrors] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceFetched, setAttendanceFetched] = useState(false);
  const [noAttendanceMsg, setNoAttendanceMsg] = useState("");

  // Remove the state and useEffect for fetching suggestions,
  // since staffOptions is passed directly from the parent.
  // Instead, we keep local state for the Autocomplete input.
  const [query, setQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ──────────────────────────────────────────────────────────────
  // Fetch attendance when StaffID, StartDate, or EndDate changes
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    setAttendanceFetched(false);

    if (!StaffID || !StartDate || !EndDate) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("");
      return;
    }

    const startDateObj = new Date(StartDate);
    const endDateObj = new Date(EndDate);
    if (endDateObj < startDateObj) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("End date cannot be before start date.");
      return;
    }

    axios
      .get(`/staff/${StaffID}/attendance-range`, {
        params: { start: StartDate, end: EndDate },
      })
      .then((res) => {
        const data = res.data;
        setAttendanceRecords(data);
        setAttendanceFetched(true);
        if (!data.length) {
          setNoAttendanceMsg("No attendance found for this staff in the selected date range.");
        } else {
          setNoAttendanceMsg("");
        }
      })
      .catch((err) => {
        console.error("Error fetching attendance range:", err);
        setNoAttendanceMsg("Error fetching attendance. Check console.");
        setAttendanceRecords([]);
      });
  }, [payrollData.StaffID, payrollData.StartDate, payrollData.EndDate]);

  // ──────────────────────────────────────────────────────────────
  // Recalculate payroll when attendance records or deductions change
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attendanceFetched) return;
    // Find the selected staff from staffOptions (passed as prop)
    const selectedStaff = staffOptions.find((s) => s.value === payrollData.StaffID);
    if (!selectedStaff) return;

    const hourlyRate = selectedStaff.hourlyRate || 0;
    const overtimeRate = selectedStaff.overtimeRate || 0;

    let totalRegularHours = 0;
    let totalOTHours = 0;

    attendanceRecords.forEach((att) => {
      const hrs = att.HoursWorked || 0;
      if (hrs > 8) {
        totalRegularHours += 8;
        totalOTHours += hrs - 8;
      } else {
        totalRegularHours += hrs;
      }
    });

    const grossPay = totalRegularHours * hourlyRate + totalOTHours * overtimeRate;
    const deduc = Number(payrollData.Deductions) || 0;
    const netPay = grossPay - deduc;

    setPayrollData((prev) => ({
      ...prev,
      GrossPay: grossPay.toString(),
      NetPay: netPay.toString(),
    }));
  }, [attendanceRecords, attendanceFetched, payrollData.Deductions, staffOptions, payrollData.StaffID]);

  // ──────────────────────────────────────────────────────────────
  // Generic form handlers
  // ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Find a matching staff from staffOptions based on the selected StaffID
    const selectedStaff = staffOptions.find((s) => s.value === payrollData.StaffID);
    if (!selectedStaff) {
      setErrors({ StaffID: "No matching staff found. Please refine your search." });
      return;
    }

    if (!attendanceRecords.length) {
      alert("Cannot create payroll with no attendance in the selected range.");
      return;
    }

    const payload = {
      StaffID: selectedStaff.value,
      StartDate: payrollData.StartDate,
      EndDate: payrollData.EndDate,
      Deductions: Number(payrollData.Deductions) || 0,
      GrossPay: Number(payrollData.GrossPay) || 0,
      NetPay: Number(payrollData.NetPay) || 0,
      GeneratedDate: payrollData.GeneratedDate || null,
      Status: payrollData.Status || "Pending",
      staff: {
        StaffID: selectedStaff.value,
        FullName: selectedStaff.label || "N/A",
      },
    };

    onAdd(payload);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      {/* Dialog Title */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <Typography component="span" sx={{ fontWeight: "bold", verticalAlign: "middle", mr: 1 }}>
              ₱
            </Typography>
            Add Payroll
          </Typography>
          <IconButton onClick={onClose} sx={{ "&:hover": { color: "red" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          {/* The Form */}
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2} direction={isMobile ? "column" : "row"}>
              {/* Staff - using Autocomplete with staffOptions passed from parent */}
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!errors.StaffID}>
                  <Autocomplete
                    options={staffOptions}
                    getOptionLabel={(option) => option.label}
                    inputValue={query}
                    onInputChange={(event, newInputValue) => {
                      setQuery(newInputValue);
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setPayrollData((prev) => ({
                          ...prev,
                          StaffID: newValue.value,
                        }));
                        setErrors((prev) => ({ ...prev, StaffID: undefined }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Staff"
                        variant="outlined"
                        error={!!errors.StaffID}
                        helperText={errors.StaffID}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="StartDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={payrollData.StartDate}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="EndDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={payrollData.EndDate}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Deductions */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="Deductions"
                  label="Deductions"
                  type="number"
                  value={payrollData.Deductions}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: "bold" }}>₱</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Gross Pay */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="GrossPay"
                  label="Gross Pay"
                  type="number"
                  value={payrollData.GrossPay}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: "bold" }}>₱</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Net Pay */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="NetPay"
                  label="Net Pay"
                  type="number"
                  value={payrollData.NetPay}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: "bold" }}>₱</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Generated Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Generated Date"
                  name="GeneratedDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={payrollData.GeneratedDate}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PendingActionsIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {noAttendanceMsg && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {noAttendanceMsg}
              </Typography>
            )}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={
                  !payrollData.StaffID ||
                  !payrollData.StartDate ||
                  !payrollData.EndDate ||
                  !payrollData.GrossPay ||
                  payrollData.GrossPay < 0 ||
                  !payrollData.NetPay ||
                  payrollData.NetPay < 0 ||
                  !payrollData.GeneratedDate ||
                  !payrollData.Status
                }
              >
                Submit Payroll
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
