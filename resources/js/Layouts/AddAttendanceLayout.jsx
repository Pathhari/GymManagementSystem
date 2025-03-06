import React, { useState, useEffect } from "react";
import axios from "axios";
import { route } from "ziggy-js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  FormHelperText
} from "@mui/material";

export default function AddAttendanceLayout({
  onClose,
  onAdd,
  staffOptions,
}) {
  const [staffID, setStaffID] = useState("");
  const [date, setDate] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");

  const [scheduleFound, setScheduleFound] = useState(false);
  
  // Optional: track errors for basic validation
  const [errors, setErrors] = useState({});

  // 1) **Fetch the day’s schedule** if staff + date are chosen
  useEffect(() => {
    if (!staffID || !date) {
      setScheduleFound(false);
      return;
    }

    const url = route("staff.schedules.range", staffID) + `?start=${date}&end=${date}`;
    axios
      .get(url)
      .then((res) => {
        const schedules = res.data; // array
        if (schedules.length > 0) {
          const schedule = schedules[0];
          setScheduleFound(true);

          // If you want to auto-fill TimeIn/TimeOut with the schedule's start/end:
          if (schedule.ShiftStart) setTimeIn(schedule.ShiftStart);
          if (schedule.ShiftEnd) setTimeOut(schedule.ShiftEnd);
        } else {
          // No schedule
          setScheduleFound(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching schedule for chosen date:", err);
        setScheduleFound(false);
      });
  }, [staffID, date]);

  // 2) **Auto-calculate Hours Worked** if TimeIn & TimeOut are set
  useEffect(() => {
    if (timeIn && timeOut) {
      // Ensure timeOut > timeIn
      const [inHour, inMin] = timeIn.split(":").map(Number);
      const [outHour, outMin] = timeOut.split(":").map(Number);

      const inDate = new Date(0, 0, 0, inHour, inMin); 
      const outDate = new Date(0, 0, 0, outHour, outMin);

      // if outDate is before inDate => user error
      if (outDate <= inDate) {
        // We'll set HoursWorked to 0 or empty
        setHoursWorked("");
      } else {
        const diffMs = outDate - inDate; // ms difference
        const diffHrs = diffMs / 1000 / 3600; // to hours
        // Round to 2 decimals if you want
        setHoursWorked(diffHrs.toFixed(2));
      }
    } else {
      setHoursWorked("");
    }
  }, [timeIn, timeOut]);

  // 3) **Submit** => do minimal validation, then pass to parent
  const handleSubmit = () => {
    // Clear errors
    setErrors({});

    let newErrors = {};
    if (!staffID) newErrors.staffID = "Staff is required.";
    if (!date) newErrors.date = "Date is required.";
    if (timeIn && timeOut) {
      // TimeIn must be before TimeOut
      if (timeOut <= timeIn) {
        newErrors.timeOut = "TimeOut must be after TimeIn.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      StaffID: staffID,
      Date: date,
      TimeIn: timeIn || null,
      TimeOut: timeOut || null,
      HoursWorked: hoursWorked ? parseFloat(hoursWorked) : 0,
      OvertimeHours: overtimeHours ? parseFloat(overtimeHours) : 0,
    };

    onAdd(payload);
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Attendance</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        
        {/* STAFF */}
        <FormControl fullWidth error={!!errors.staffID}>
          <InputLabel>Staff</InputLabel>
          <Select
            label="Staff"
            value={staffID}
            onChange={(e) => setStaffID(e.target.value)}
          >
            <MenuItem value="">Select staff</MenuItem>
            {staffOptions.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
          {errors.staffID && (
            <FormHelperText>{errors.staffID}</FormHelperText>
          )}
        </FormControl>

        {/* DATE */}
        <TextField
          label="Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={!!errors.date}
          helperText={errors.date}
          fullWidth
        />

        {/* TIME IN */}
        <TextField
          label="Time In"
          type="time"
          InputLabelProps={{ shrink: true }}
          value={timeIn}
          onChange={(e) => setTimeIn(e.target.value)}
          fullWidth
        />

        {/* TIME OUT */}
        <TextField
          label="Time Out"
          type="time"
          InputLabelProps={{ shrink: true }}
          value={timeOut}
          onChange={(e) => setTimeOut(e.target.value)}
          error={!!errors.timeOut}
          helperText={errors.timeOut}
          fullWidth
        />

        {/* HOURS WORKED */}
        <TextField
          label="Hours Worked"
          type="number"
          value={hoursWorked}
          onChange={(e) => setHoursWorked(e.target.value)}
          fullWidth
          // Possibly readOnly if you want the auto-calculated value
          // InputProps={{ readOnly: true }}
        />

        {/* OVERTIME HOURS */}
        <TextField
          label="Overtime Hours"
          type="number"
          value={overtimeHours}
          onChange={(e) => setOvertimeHours(e.target.value)}
          fullWidth
        />

        {/* Optional info about schedule found */}
        {staffID && date && !scheduleFound && (
          <FormHelperText sx={{ color: "orange" }}>
            No schedule found for this date.
          </FormHelperText>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
