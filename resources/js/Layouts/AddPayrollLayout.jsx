import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, FormControl, IconButton, Typography, Divider,
  useMediaQuery, useTheme, InputAdornment
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SaveIcon from "@mui/icons-material/Save";

const initialPayroll = {
  StaffID: "",
  StartDate: "",
  EndDate: "",
  Deductions: "",   // user-typed only
  GrossPay: "",     // computed
  NetPay: "",       // computed
  GeneratedDate: "",
  Status: "",
};

export default function AddPayrollLayout({ onClose, onAdd, staffOptions = [] }) {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [errors, setErrors] = useState({});

  // Attendance & Schedules
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [scheduleRecords, setScheduleRecords] = useState([]);
  const [attendanceFetched, setAttendanceFetched] = useState(false);
  const [noAttendanceMsg, setNoAttendanceMsg] = useState("");

  // For Autocomplete
  const [query, setQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ─────────────────────────────────────────────────────────────────
  // A) Fetch Attendance for Staff + Date Range
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    setAttendanceFetched(false);

    // Reset if missing fields
    if (!StaffID || !StartDate || !EndDate) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("");
      return;
    }

    // Validate date order
    const startObj = new Date(StartDate);
    const endObj = new Date(EndDate);
    if (endObj < startObj) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("End date cannot be before start date.");
      return;
    }

    // Example: GET /staff/{StaffID}/attendance-range?start=YYYY-MM-DD&end=YYYY-MM-DD
    axios
      .get(`/staff/${StaffID}/attendance-range`, {
        params: { start: StartDate, end: EndDate },
      })
      .then((res) => {
        const data = res.data;
        setAttendanceRecords(data);
        setAttendanceFetched(true);
        if (!data.length) {
          setNoAttendanceMsg("No attendance found in that date range.");
        } else {
          setNoAttendanceMsg("");
        }
      })
      .catch((err) => {
        console.error("Error fetching attendance range:", err);
        setNoAttendanceMsg("Error fetching attendance. See console.");
        setAttendanceRecords([]);
      });
  }, [payrollData.StaffID, payrollData.StartDate, payrollData.EndDate]);

  // ─────────────────────────────────────────────────────────────────
  // B) Fetch Schedules for Staff + Date Range
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    if (!StaffID || !StartDate || !EndDate) {
      setScheduleRecords([]);
      return;
    }

    // Example: GET /staff/schedules/{StaffID}/schedule-range?start=YYYY-MM-DD&end=YYYY-MM-DD
    axios
      .get(`/staff/schedules/${StaffID}/schedule-range`, {
        params: { start: StartDate, end: EndDate },
      })
      .then((res) => {
        setScheduleRecords(res.data);
      })
      .catch((err) => {
        console.error("Error fetching schedule range:", err);
        setScheduleRecords([]);
      });
  }, [payrollData.StaffID, payrollData.StartDate, payrollData.EndDate]);

  // ─────────────────────────────────────────────────────────────────
  // C) Compute GrossPay & NetPay once we have attendance & schedules
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("Calculating Net Pay effect fired", {
      attendanceFetched,
      scheduleRecords,
    });
    if (!attendanceFetched || !scheduleRecords.length) return;
  
    // 1) Identify staff => get rates
    const selectedStaff = staffOptions.find(
      (s) => s.value === payrollData.StaffID
    );
    if (!selectedStaff) return;
  
    const hourlyRate = selectedStaff.hourlyRate || 0;
    const overtimeRate = selectedStaff.overtimeRate || 0;
  
    let totalRegularHours = 0;
    let totalOTHours = 0;
    let totalLateDeductions = 0;
  
    // 2) For each attendance, accumulate hours
    attendanceRecords.forEach((att) => {
      // parse the strings
      const regularHrs = parseFloat(att.HoursWorked) || 0;
      const otHrs = parseFloat(att.OvertimeHours) || 0;
    
      totalRegularHours += regularHrs;
      totalOTHours += otHrs;
    
      // Check lateness if needed
      const schedule = scheduleRecords.find((sc) => sc.ShiftDate === att.Date);
      if (!schedule || !att.TimeIn) return;
  
      try {
        const shiftStart = new Date(`${schedule.ShiftDate}T${schedule.ShiftStart}`);
        const timeIn = new Date(`${att.Date}T${att.TimeIn}`);
        const graceEnds = new Date(shiftStart.getTime() + 10 * 60000);
        if (timeIn > graceEnds) {
          const diffMs = timeIn - graceEnds;
          const lateMins = Math.floor(diffMs / 60000);
          totalLateDeductions += lateMins;
        }
      } catch (err) {
        console.warn("Error computing late deduction:", err);
      }
    });
  
    // 3) Compute gross pay
    const gross = totalRegularHours * hourlyRate + totalOTHours * overtimeRate;
  
    // 4) Deductions
    let userDeductions = Number(payrollData.Deductions);
    if (isNaN(userDeductions)) userDeductions = 0; 
    const net = gross - (userDeductions + totalLateDeductions);
  
    // 5) **Safely** convert to string
    //    Use Number.isFinite(...) to avoid calling .toFixed() on NaN.
    const safeGross = Number.isFinite(gross) ? gross.toFixed(2) : "0.00";
    const safeNet = Number.isFinite(net) ? net.toFixed(2) : "0.00";
  
    setPayrollData((prev) => ({
      ...prev,
      GrossPay: safeGross,
      NetPay: safeNet,
    }));
  }, [
    attendanceRecords,
    scheduleRecords,
    attendanceFetched,
    payrollData.Deductions,
    payrollData.StaffID,
    staffOptions,
  ]);

  // ─────────────────────────────────────────────────────────────────
  // D) Handlers
  // ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // 1) Validate staff
    const selectedStaff = staffOptions.find(
      (s) => s.value === payrollData.StaffID
    );
    if (!selectedStaff) {
      setErrors({ StaffID: "No matching staff found or staff is required." });
      return;
    }

    // 2) Validate attendance
    if (!attendanceRecords.length) {
      alert("Cannot create payroll: No attendance in this date range.");
      return;
    }

    // 3) Final payload
    const payload = {
      StaffID: selectedStaff.value,
      StartDate: payrollData.StartDate,
      EndDate: payrollData.EndDate,
      // Only the user-typed Deductions
      Deductions: Number(payrollData.Deductions) || 0,
      GrossPay: Number(payrollData.GrossPay) || 0,
      NetPay: Number(payrollData.NetPay) || 0,
      GeneratedDate: payrollData.GeneratedDate || null,
      Status: payrollData.Status || "Pending",
      // If you want to attach staff info for the store response
      staff: {
        StaffID: selectedStaff.value,
        FullName: selectedStaff.label,
      },
    };

    // Let the parent handle the actual axios POST
    onAdd(payload);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <Typography
              component="span"
              sx={{ fontWeight: "bold", verticalAlign: "middle", mr: 1 }}
            >
              ₱
            </Typography>
            Add Payroll
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2} direction={isMobile ? "column" : "row"}>
              {/* Staff Autocomplete */}
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!errors.StaffID}>
                  <Autocomplete
                    options={staffOptions}
                    getOptionLabel={(opt) => opt.label}
                    inputValue={query}
                    onInputChange={(e, val) => setQuery(val)}
                    onChange={(e, val) => {
                      if (val) {
                        setPayrollData((prev) => ({
                          ...prev,
                          StaffID: val.value,
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

              {/* Start/End Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="StartDate"
                  label="Start Date"
                  type="date"
                  value={payrollData.StartDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="EndDate"
                  label="End Date"
                  type="date"
                  value={payrollData.EndDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
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
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* GrossPay (computed) */}
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
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                    readOnly: true, // If you want to lock it from user editing
                  }}
                />
              </Grid>

              {/* NetPay (computed) */}
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
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                    readOnly: true, // If you want to lock it as well
                  }}
                />
              </Grid>

              {/* GeneratedDate */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Generated Date"
                  name="GeneratedDate"
                  type="date"
                  value={payrollData.GeneratedDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
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

            {/* If no attendance in range */}
            {noAttendanceMsg && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {noAttendanceMsg}
              </Typography>
            )}

            <Box
              sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}
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
                  !payrollData.Status ||
                  !!noAttendanceMsg // block submit if there's an error msg
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
