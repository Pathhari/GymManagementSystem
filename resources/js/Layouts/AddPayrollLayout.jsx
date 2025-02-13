import React, { useState, useEffect } from "react";
import axios from "axios"; // Or your chosen HTTP client
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
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * This layout does:
 * 1) Staff selection
 * 2) Date range (StartDate, EndDate)
 * 3) Fetch attendance from server
 * 4) Calculate total regular & overtime hours
 * 5) Calculate GrossPay, show fields for Deductions, NetPay, etc.
 * 6) Let user confirm and call `onAdd` with final payload
 */
const initialPayroll = {
  StaffID: "",
  StartDate: "",
  EndDate: "",
  Deductions: "",
  // The following three are either auto-calculated or user-typed
  GrossPay: "",
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
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceFetched, setAttendanceFetched] = useState(false);
  const [noAttendanceMsg, setNoAttendanceMsg] = useState("");

  //** 1) Whenever StaffID, StartDate, or EndDate changes, fetch attendance. */
  useEffect(() => {
    const { StaffID, StartDate, EndDate } = payrollData;
    setAttendanceFetched(false); // reset whenever we change something

    // Basic checks
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

    //** 2) Call server: GET /staff/{StaffID}/attendance-range?start=___&end=___
    axios
      .get(`/staff/${StaffID}/attendance-range`, {
        params: { start: StartDate, end: EndDate },
      })
      .then((res) => {
        const data = res.data; // an array of attendance
        setAttendanceRecords(data);
        setAttendanceFetched(true);

        if (!data.length) {
          setNoAttendanceMsg(
            "No attendance found for this staff in the selected date range."
          );
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

  //** 3) Whenever attendanceRecords changes, or staff changes, recalc payroll. */
  useEffect(() => {
    if (!attendanceFetched) return; // only calculate if we have fresh data

    const { StaffID, Deductions } = payrollData;
    const staffObj = staffOptions.find((s) => s.value === StaffID);
    if (!staffObj) return;

    const hourlyRate   = staffObj.hourlyRate   || 0;
    const overtimeRate = staffObj.overtimeRate || 0;

    let totalRegularHours = 0;
    let totalOTHours = 0;

    attendanceRecords.forEach((att) => {
      const hrs = att.HoursWorked || 0;
      // If hrs > 8, remainder is OT
      if (hrs > 8) {
        totalRegularHours += 8;
        totalOTHours += (hrs - 8);
      } else {
        totalRegularHours += hrs;
      }
    });

    //** 4) Compute gross pay
    const grossPay =
      totalRegularHours * hourlyRate + totalOTHours * overtimeRate;

    //** 5) Net pay = gross - deductions (if user typed any)
    const deduc = Number(Deductions) || 0;
    const netPay = grossPay - deduc;

    setPayrollData((prev) => ({
      ...prev,
      GrossPay: grossPay, // overwrite with new calc
      NetPay: netPay,     // auto update as well
    }));
  }, [attendanceRecords, attendanceFetched, payrollData.Deductions]);

  //** 6) Generic form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Minimal validation: staff, date range, attendance found, etc.
    if (!payrollData.StaffID) {
      setErrors({ StaffID: "Staff is required" });
      return;
    }

    if (!attendanceRecords.length) {
      // Decide whether to allow payroll with no attendance or block it
      alert("Cannot create payroll with no attendance in the selected range.");
      return;
    }

    //** 7) Build final payload to post
    const selectedStaff = staffOptions.find(
      (staff) => staff.value === payrollData.StaffID
    );

    const payload = {
      StaffID:      payrollData.StaffID,
      StartDate:    payrollData.StartDate,
      EndDate:      payrollData.EndDate,
      Deductions:   Number(payrollData.Deductions) || 0,
      GrossPay:     Number(payrollData.GrossPay)   || 0,
      NetPay:       Number(payrollData.NetPay)     || 0,
      GeneratedDate: payrollData.GeneratedDate || null,
      Status:       payrollData.Status || "Pending",
      // If you want to pass staff name too (not strictly required by server):
      staff: {
        StaffID: payrollData.StaffID,
        FullName: selectedStaff?.label || "N/A",
      },
    };

    //** 8) Let parent handle the actual POST
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
        {/* A basic form */}
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Staff */}
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
              />
            </Grid>

            {/* GrossPay (auto-calculated) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="GrossPay"
                label="Gross Pay"
                type="number"
                value={payrollData.GrossPay}
                onChange={handleChange}
                // Typically read-only if you're strictly following attendance logic
              />
            </Grid>

            {/* NetPay (auto after you adjust Deductions) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="NetPay"
                label="Net Pay"
                type="number"
                value={payrollData.NetPay}
                onChange={handleChange}
              />
            </Grid>

            {/* GeneratedDate */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Generated Date"
                name="GeneratedDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={payrollData.GeneratedDate}
                onChange={handleChange}
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
              />
            </Grid>
          </Grid>
        </Box>

        {/* If there's any "no attendance" message or error */}
        {noAttendanceMsg && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {noAttendanceMsg}
          </Typography>
        )}
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
