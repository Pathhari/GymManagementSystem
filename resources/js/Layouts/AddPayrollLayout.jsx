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
  Deductions: "",    // user-typed only
  GrossPay: "",      // computed
  NetPay: "",        // computed
  GeneratedDate: "",
  Status: "",
};

// EXAMPLE: We define LATE_PESO_PER_MIN and NIGHT_DIFF_RATE constants
// or you can read them from staff or a config
const LATE_PESO_PER_MIN = 1; // 1 peso per minute
// We'll compute night diff rate from staff's hourlyRate * 0.1

export default function AddPayrollLayout({ onClose, onAdd, staffOptions = [] }) {
  const [payrollData, setPayrollData] = useState(initialPayroll);
  const [errors, setErrors] = useState({});

  // Attendance & schedules
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [scheduleRecords, setScheduleRecords] = useState([]);
  const [attendanceFetched, setAttendanceFetched] = useState(false);
  const [noAttendanceMsg, setNoAttendanceMsg] = useState("");

  // For showing detailed computations in the UI
  const [nightDiffHrs, setNightDiffHrs] = useState(0);
  const [nightDiffPay, setNightDiffPay] = useState(0);
  const [latePenalty, setLatePenalty] = useState(0);

  // For Autocomplete staff search
  const [query, setQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ─────────────────────────────────────────────────────────────────
  // A) Fetch Attendance in range
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    setAttendanceFetched(false);

    if (!StaffID || !StartDate || !EndDate) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("");
      return;
    }
    const startObj = new Date(StartDate);
    const endObj = new Date(EndDate);
    if (endObj < startObj) {
      setAttendanceRecords([]);
      setNoAttendanceMsg("End date cannot be before start date.");
      return;
    }

    // GET /staff/{StaffID}/attendance-range?start=..&end=..
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
  // B) Fetch Schedules (optional) if you want them in the UI
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    if (!StaffID || !StartDate || !EndDate) {
      setScheduleRecords([]);
      return;
    }
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
  // C) Compute Pay (with ND & Late) once attendance is fetched
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attendanceFetched) return;

    // 1) Identify staff => read staff's hourly & overtime rates
    const selectedStaff = staffOptions.find(
      (s) => s.value === payrollData.StaffID
    );
    if (!selectedStaff) {
      // no staff => skip
      return;
    }

    const hourlyRate = parseFloat(selectedStaff.hourlyRate) || 0;
    const overtimeRate = parseFloat(selectedStaff.overtimeRate) || 0;
    const nightDiffRate = hourlyRate * 0.1; // 10% of hourly

    let totalRegHours = 0;
    let totalOTHours = 0;
    let totalNDHours = 0;
    let totalLateMinutes = 0;

    attendanceRecords.forEach((att) => {
      const hrs = parseFloat(att.HoursWorked) || 0;
      totalRegHours += hrs;

      const ot = parseFloat(att.OvertimeHours) || 0;
      totalOTHours += ot;

      // If your attendance records store ND hours
      const nd = parseFloat(att.NightDiffHours) || 0;
      totalNDHours += nd;

      // If attendance has LateMinutes
      const late = parseFloat(att.LateMinutes) || 0;
      totalLateMinutes += late;
    });

    // Cap regular hours at 8 * total days if you want (or do per attendance).
    // For simplicity, we'll just sum them as you do in storePayroll().
    // Then compute pay
    const regularPay =
      (totalRegHours >= 8 ? 8 : totalRegHours) * hourlyRate;
    // Actually, the simpler approach is storePayroll logic: 
    // but let's just do a direct sum approach
    // e.g. totalRegHours * hourlyRate

    // But storePayroll does a min(hrs, 8) PER attendance. 
    // If you want that logic exactly, you'd do:
    // let totalReg = 0;
    // attendanceRecords.forEach(a => totalReg += Math.min(a.HoursWorked, 8));
    // Then regularPay = totalReg * hourlyRate.
    // For now, let's keep it consistent:
    let totalReg = 0;
    attendanceRecords.forEach((att) => {
      const h = parseFloat(att.HoursWorked) || 0;
      totalReg += Math.min(h, 8);
    });
    const finalRegularPay = totalReg * hourlyRate;

    const finalOTPay = totalOTHours * overtimeRate;
    const finalNDPay = totalNDHours * nightDiffRate;
    const gross = finalRegularPay + finalOTPay + finalNDPay;

    // Late penalty
    const latePay = totalLateMinutes * LATE_PESO_PER_MIN; 
    let userDeductions = parseFloat(payrollData.Deductions);
    if (isNaN(userDeductions)) userDeductions = 0;
    const combined = userDeductions + latePay;

    const net = gross - combined;

    // Convert to string
    const safeGross = Number.isFinite(gross) ? gross.toFixed(2) : "0.00";
    const safeNet = Number.isFinite(net) ? net.toFixed(2) : "0.00";

    setPayrollData((prev) => ({
      ...prev,
      GrossPay: safeGross,
      NetPay: safeNet,
    }));
    setNightDiffHrs(totalNDHours);
    setNightDiffPay(Number.isFinite(finalNDPay) ? finalNDPay.toFixed(2) : "0.00");
    setLatePenalty(latePay);
  }, [
    attendanceFetched,
    attendanceRecords,
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
      Deductions: Number(payrollData.Deductions) || 0,
      GrossPay: Number(payrollData.GrossPay) || 0,
      NetPay: Number(payrollData.NetPay) || 0,
      GeneratedDate: payrollData.GeneratedDate || null,
      Status: payrollData.Status || "Pending",
    };

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
                  label="Manual Deductions"
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

              {/* Late Penalty (read-only) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Late Penalty"
                  type="text"
                  value={latePenalty.toFixed(2)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                    readOnly: true,
                  }}
                />
              </Grid>

              {/* Night Diff Hours & Pay */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Night Diff Hours"
                  type="text"
                  value={nightDiffHrs.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Night Diff Pay"
                  type="text"
                  value={nightDiffPay}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                    readOnly: true,
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
                    readOnly: true,
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
                    readOnly: true,
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
              <Grid item xs={12} sm={6}>
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
                  !!noAttendanceMsg
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
