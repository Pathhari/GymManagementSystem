import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Snackbar,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Autocomplete from "@mui/material/Autocomplete";
import { DataGrid } from "@mui/x-data-grid";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HistoryIcon from '@mui/icons-material/History';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BadgeIcon from '@mui/icons-material/Badge';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';

import {
  AccessTime,
  AlarmOn,
  AlarmOff,
  Schedule as ScheduleIcon
} from "@mui/icons-material";
import axios from "axios";

export default function StaffDashboard() {
  const theme = useTheme();

  // Snackbar state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    let [hours, minutes, seconds] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 to 12 for 12AM
    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Dashboard metrics and table states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkInsToday, setCheckInsToday] = useState(0);
  const [lockersInUse, setLockersInUse] = useState(0);

  // For walk-ins metrics
  const [walkIns, setWalkIns] = useState([]);
  const walkInsTodayCount = walkIns.filter(
    (w) => w.VisitDate === new Date().toISOString().split("T")[0]
  ).length;

  // Compute expiring soon from member data (within next 7 days)
  const [members, setMembers] = useState([]);
  const today = new Date();
  const next7 = new Date();
  next7.setDate(today.getDate() + 7);
  const upcomingExpirations = members.filter((member) => {
    if (!member?.MembershipEndDate) return false;
    const endDate = new Date(member.MembershipEndDate);
    return endDate > today && endDate <= next7;
  });
  const expiringSoonCount = upcomingExpirations.length;

  // Tabs: 0 => Visits, 1 => Walk-Ins, 2 => Expiring Soon
  const [activeTab, setActiveTab] = useState(0);

  // Check-In – using Autocomplete for member search
  const [checkInMethod, setCheckInMethod] = useState("card");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isCamOpen, setCamOpen] = useState(false);
  const [isBiometricOpen, setBiometricOpen] = useState(false);

  // Visits states
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isViewVisitOpen, setViewVisitOpen] = useState(false);
  const [isEditVisitOpen, setEditVisitOpen] = useState(false);

  // Walk-Ins states
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);

  // Add Walk-In states
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    Notes: "",
    PaymentMethod: "",
    PaymentAmount: ""
  });

  // Clock In/Out states
  const [staffId, setStaffId] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ------------------------------------------------------------------
  // HOOKS: Load dashboard data, staff info, and members on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    loadDashboardData();
    fetchStaffData();
    fetchMembers();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist clock state via localStorage
  useEffect(() => {
    const storedClockState = localStorage.getItem("isClockedIn");
    if (storedClockState === "true") {
      setIsClockedIn(true);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("isClockedIn", isClockedIn ? "true" : "false");
  }, [isClockedIn]);

  // ------------------------------------------------------------------
  // API Calls
  // ------------------------------------------------------------------
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Metrics
      const metricsRes = await axios.get("/staff/metrics");
      setCheckInsToday(metricsRes.data.checkInsToday || 0);
      setLockersInUse(metricsRes.data.lockersInUse || 0);
      // 2) Visits
      const visitsRes = await axios.get("/operations/visits");
      setVisits(visitsRes.data.visits || []);
      // 3) Walk-ins
      const walkInsRes = await axios.get("/operations/walk-ins");
      setWalkIns(walkInsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load staff dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffData = async () => {
    try {
      const res = await axios.get("/staff/dashboard-info");
      const data = res.data;
      if (data.staffId) setStaffId(data.staffId);
      if (data.attendance) setAttendance(data.attendance);
      if (data.schedule) setSchedule(data.schedule);
    } catch (err) {
      console.error("Failed to load staff dashboard info:", err);
    }
  };

  // Fetch members for check-in and expiring soon logic
  const fetchMembers = async () => {
    try {
      const res = await axios.get("/membership/members");
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  // ------------------------------------------------------------------
  // Tabs change handler for the table area
  // ------------------------------------------------------------------
  const handleTabChange = (e, val) => {
    setActiveTab(val);
  };

  // ------------------------------------------------------------------
  // Check-In Function using selected member from Autocomplete
  // ------------------------------------------------------------------
  const handleCheckIn = async () => {
    if (!selectedMember) {
      alert("Please select a member.");
      return;
    }
    try {
      await axios.post("/operations/visits", {
        MemberID: selectedMember.MemberID,
        CheckInMethod: checkInMethod
      });
      showSuccessMessage(`Member ${selectedMember.FullName} checked in successfully!`);
      setSelectedMember(null);
      loadDashboardData(); // Refresh metrics & visits
    } catch (err) {
      console.error("Check-in error:", err);
      if (err.response && err.response.status === 409) {
        alert("Member is already checked in for today.");
      } else {
        alert("Failed to check in. See console for details.");
      }
    }
  };

  // ------------------------------------------------------------------
  // Camera & Biometric Dialogs
  // ------------------------------------------------------------------
  const handleOpenCam = () => setCamOpen(true);
  const handleCloseCam = () => setCamOpen(false);
  const handleSimulateCardScan = () => {
    setCamOpen(false);
  };

  const handleOpenBiometric = () => setBiometricOpen(true);
  const handleCloseBiometric = () => setBiometricOpen(false);
  const handleSimulateFingerprint = () => {
    setBiometricOpen(false);
  };

  // ------------------------------------------------------------------
  // Visits CRUD
  // ------------------------------------------------------------------
  const handleViewVisit = (visit) => {
    setSelectedVisit(visit);
    setViewVisitOpen(true);
  };
  const handleEditVisit = (visit) => {
    setSelectedVisit({ ...visit });
    setEditVisitOpen(true);
  };
  const handleEditVisitSubmit = async () => {
    if (!selectedVisit) return;
    try {
      await axios.put(`/operations/visits/${selectedVisit.VisitID}`, {
        MemberID: selectedVisit.MemberID,
        VisitDate: selectedVisit.VisitDate,
        VisitTime: selectedVisit.VisitTime,
        CheckInMethod: selectedVisit.CheckInMethod,
        Remarks: selectedVisit.Remarks
      });
      setEditVisitOpen(false);
      loadDashboardData();
      showSuccessMessage("Visit updated successfully.");
    } catch (err) {
      console.error("Failed to update visit:", err);
    }
  };
  const handleDeleteVisit = async (visitID) => {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await axios.delete(`/operations/visits/${visitID}`);
      loadDashboardData();
      showSuccessMessage("Visit deleted!");
    } catch (err) {
      console.error("Failed to delete visit:", err);
    }
  };

  // ------------------------------------------------------------------
  // Walk-Ins CRUD
  // ------------------------------------------------------------------
  const handleViewWalkIn = (wk) => {
    setSelectedWalkIn(wk);
    setViewWalkInOpen(true);
  };
  const handleEditWalkIn = (wk) => {
    setSelectedWalkIn({ ...wk });
    setEditWalkInOpen(true);
  };
  const handleEditWalkInSubmit = async () => {
    if (!selectedWalkIn) return;
    try {
      await axios.put(`/operations/walk-ins/${selectedWalkIn.WalkInID}`, {
        FullName: selectedWalkIn.FullName || "",
        VisitDate: selectedWalkIn.VisitDate,
        PaymentID: selectedWalkIn.PaymentID || null,
        PaymentMethod: selectedWalkIn.PaymentMethod || "",
        AmountPaid: selectedWalkIn.AmountPaid || 0,
        Notes: selectedWalkIn.Notes || ""
      });
      setEditWalkInOpen(false);
      loadDashboardData();
      showSuccessMessage("Walk-In updated!");
    } catch (err) {
      console.error("Failed to update walk-in:", err);
    }
  };
  const handleDeleteWalkIn = async (walkInID) => {
    if (!window.confirm("Delete this walk-in record?")) return;
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
      loadDashboardData();
      showSuccessMessage("Walk-In deleted.");
    } catch (err) {
      console.error("Failed to delete walk-in:", err);
    }
  };

  const handleAddWalkInChange = (e) => {
    setNewWalkIn((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAddWalkIn = async () => {
    try {
      await axios.post("/operations/walk-ins", {
        FullName: newWalkIn.FullName || null,
        VisitDate: newWalkIn.VisitDate,
        Notes: newWalkIn.Notes || null,
        PaymentMethod: newWalkIn.PaymentMethod || null,
        PaymentAmount: newWalkIn.PaymentAmount || 0
      });
      showSuccessMessage("Walk-In created successfully.");
      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        Notes: "",
        PaymentMethod: "",
        PaymentAmount: ""
      });
      setAddWalkInOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to create walk-in:", err);
      alert("Create error. Check console for details.");
    }
  };

  // ------------------------------------------------------------------
  // Clock In/Out Logic
  // ------------------------------------------------------------------
  const handleClockInOut = async () => {
    if (!staffId) {
      console.warn("No staffId available.");
      return;
    }
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = currentTime.toLocaleTimeString("it-IT").slice(0, 5);
    const clockData = {
      StaffID: staffId,
      Date: dateStr,
      TimeIn: isClockedIn ? null : timeStr,
      TimeOut: isClockedIn ? timeStr : null,
    };
    try {
      await axios.post("/staff/attendance/clock-in-out", clockData);
      const attendRes = await axios.get("/staff/attendance");
      setAttendance(
        Array.isArray(attendRes.data)
          ? attendRes.data
          : attendRes.data.attendance || []
      );
      setIsClockedIn(!isClockedIn);
      showSuccessMessage(isClockedIn ? "Clocked out successfully." : "Clocked in successfully.");
    } catch (err) {
      console.error("Failed to record attendance:", err);
    }
  };

  // ------------------------------------------------------------------
  // TABLE COLUMNS (with updated action button colors)
  // ------------------------------------------------------------------
  const actionButtonStyles = {
    minWidth: "40px",
    padding: "6px",
    transition: "transform 0.2s",
    "&:hover": { transform: "scale(1.05)" }
  };

  const visitColumns = [
    {
      field: "MemberID",
      headerName: "Member",
      width: 250,
      renderCell: (params) => {
        const member = members.find((m) => m.MemberID === params.value);
        return member ? member.FullName : params.value;
      }
    },
    { field: "VisitID", headerName: "ID", width: 80 },
    { field: "VisitDate", headerName: "Date", width: 180, renderCell: (params) => params.value ? formatDate(params.value) : "—" },
    { field: "VisitTime", headerName: "Time", width: 180, renderCell: (params) => params.value ? formatTime(params.value) : "—" },
    { field: "CheckInMethod", headerName: "Method", width: 100 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleViewVisit(row)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#4caf50",
                  "&:hover": { backgroundColor: "#43a047" }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleEditVisit(row)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#2196f3",
                  "&:hover": { backgroundColor: "#1976d2" }
                }}
              >
                <EditIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDeleteVisit(row.VisitID)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#f44336",
                  "&:hover": { backgroundColor: "#d32f2f" }
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  const walkInColumns = [
    { field: "WalkInID", headerName: "ID", width: 80 },
    { field: "FullName", headerName: "Name", width: 130 },
    { field: "VisitDate", headerName: "Date", width: 100 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleViewWalkIn(row)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#4caf50",
                  "&:hover": { backgroundColor: "#43a047" }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleEditWalkIn(row)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#2196f3",
                  "&:hover": { backgroundColor: "#1976d2" }
                }}
              >
                <EditIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDeleteWalkIn(row.WalkInID)}
                sx={{
                  ...actionButtonStyles,
                  backgroundColor: "#f44336",
                  "&:hover": { backgroundColor: "#d32f2f" }
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      }
    }
  ];

  const expiringColumns = [
    { field: "MemberID", headerName: "Member ID", width: 120 },
    { field: "FullName", headerName: "Full Name", width: 200 },
    {
      field: "MembershipEndDate",
      headerName: "Expires On",
      width: 150,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "—"
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: 2 }}>
      <Grid container spacing={2}>
        {/* Header */}
        <Grid item xs={12}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #B993D6 0%, #8CA6DB 100%)",
              color: "#fff",
              borderRadius: 2,
              p: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
              boxShadow: 3
            }}
          >
            <IconButton sx={{ color: "#fff", mr: 1 }}>
              <DashboardIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Staff Dashboard
              </Typography>
              <Typography variant="body2">
                Key performance overview and quick actions
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Metrics Cards Row */}
        <Grid container item xs={12} spacing={2}>
          <Grid item xs={12} md={3}>
            <Card
              onClick={() => setActiveTab(0)}
              sx={{
                p: 2,
                cursor: "pointer",
                borderRadius: 2,
                boxShadow: activeTab === 0 ? 6 : 2,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 6 },
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.info.dark : theme.palette.info.light,
                color: theme.palette.info.contrastText
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <GroupIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Check-ins Today</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {checkInsToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              onClick={() => setActiveTab(1)}
              sx={{
                p: 2,
                cursor: "pointer",
                borderRadius: 2,
                boxShadow: activeTab === 1 ? 6 : 2,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 6 },
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.success.dark : theme.palette.success.light,
                color: theme.palette.success.contrastText
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <DirectionsWalkIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Walk-ins Today</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {walkInsTodayCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: "pointer",
                borderRadius: 2,
                boxShadow: 2,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 6 },
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.secondary.dark : theme.palette.secondary.light,
                color: theme.palette.secondary.contrastText
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <BadgeIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Lockers In Use</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {lockersInUse}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card
              onClick={() => setActiveTab(2)}
              sx={{
                p: 2,
                cursor: "pointer",
                borderRadius: 2,
                boxShadow: activeTab === 2 ? 6 : 2,
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 6 },
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.warning.dark : theme.palette.warning.light,
                color: theme.palette.warning.contrastText
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <WarningAmberIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Expiring Soon</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {expiringSoonCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Original Left Column: Check-In & Clock In/Out */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader title="Check In Member" />
            <CardContent>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Check-in Method</InputLabel>
                <Select
                  label="Check-in Method"
                  value={checkInMethod}
                  onChange={(e) => setCheckInMethod(e.target.value)}
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="card">Membership Card</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                options={members}
                getOptionLabel={(option) =>
                  `${option.MemberID} - ${option.FullName}`
                }
                value={selectedMember}
                onChange={(event, newValue) => setSelectedMember(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Member"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
              />
              <Button variant="contained" onClick={handleCheckIn} fullWidth>
                Check In
              </Button>
            </CardContent>
          </Card>

          <Card
            sx={{
              mb: 2,
              borderRadius: 2,
              boxShadow: 2,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <CardHeader title="Clock In / Clock Out" />
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  <AccessTime /> {currentTime.toLocaleTimeString()}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleClockInOut}
                  fullWidth
                  sx={{ mt: 2 }}
                  style={{
                    backgroundColor: isClockedIn ? "#f44336" : "#4caf50",
                    color: "#fff"
                  }}
                >
                  {isClockedIn ? (
                    <>
                      <AlarmOff /> Clock Out
                    </>
                  ) : (
                    <>
                      <AlarmOn /> Clock In
                    </>
                  )}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon /> Work Schedule
              </Typography>
              {schedule.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No schedules found.
                </Typography>
              ) : (
                schedule.map((shift, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 1 }}>
                    <Typography>
                      {shift.ShiftDate
                        ? new Date(shift.ShiftDate).toLocaleDateString()
                        : "Unknown Date"}
                    </Typography>
                    <Typography color="textSecondary">
                      {shift.ShiftStart || "??:??"} - {shift.ShiftEnd || "??:??"}
                    </Typography>
                  </Paper>
                ))
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Attendance History
              </Typography>
              {attendance.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No attendance records found.
                </Typography>
              ) : (
                attendance.map((entry, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" p={1}>
                    <Typography>
                      {formatDate(entry.Date)}
                    </Typography>
                    <Typography color="textSecondary">
                      {formatTime(entry.TimeIn)}
                      {entry.TimeOut ? ` - ${formatTime(entry.TimeOut)}` : ""}
                    </Typography>
                  </Box>
                ))
              )}

            </CardContent>
          </Card>
        </Grid>

        {/* Original Right Column: Table with Tabs */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab icon={<GroupIcon />} label="Visits" />
                <Tab icon={<DirectionsWalkIcon />} label="Walk-Ins" />
                <Tab icon={<WarningAmberIcon />} label="Expiring Soon" />
              </Tabs>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflow: "hidden" }}>
              {activeTab === 0 && (
                <Paper sx={{ height: 600 }}>
                  <DataGrid
                    rows={visits}
                    columns={visitColumns}
                    getRowId={(row) => row.VisitID}
                    pageSize={30}
                    rowsPerPageOptions={[30]}
                    sx={{
                      border: 0,
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f5f5f5",
                        fontWeight: "bold",
                        fontSize: "1rem"
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #e0e0e0"
                      }
                    }}
                  />
                </Paper>
              )}
              {activeTab === 1 && (
                <Box sx={{ height: 600, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ textAlign: "right", mb: 1 }}>
                    <Button variant="contained" onClick={() => setAddWalkInOpen(true)}>
                      Add Walk-In
                    </Button>
                  </Box>
                  <Paper sx={{ height: 600 }}>
                    <DataGrid
                      rows={walkIns}
                      columns={walkInColumns}
                      getRowId={(row) => row.WalkInID}
                      pageSize={30}
                      rowsPerPageOptions={[30]}
                      sx={{
                        border: 0,
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: "#f5f5f5",
                          fontWeight: "bold",
                          fontSize: "1rem"
                        },
                        "& .MuiDataGrid-cell": {
                          borderBottom: "1px solid #e0e0e0"
                        }
                      }}
                    />
                  </Paper>
                </Box>
              )}
              {activeTab === 2 && (
                <Paper sx={{ height: 600, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Expiring Soon
                  </Typography>
                  <DataGrid
                    rows={upcomingExpirations}
                    columns={expiringColumns}
                    getRowId={(row) => row.MemberID}
                    pageSize={30}
                    rowsPerPageOptions={[30]}
                    sx={{
                      border: 0,
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f5f5f5",
                        fontWeight: "bold",
                        fontSize: "1rem"
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #e0e0e0"
                      }
                    }}
                  />
                </Paper>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <Dialog open={isCamOpen} onClose={handleCloseCam} fullWidth maxWidth="sm">
        <DialogTitle>Card Scanning via Webcam</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for webcam scanning. A real implementation would parse a barcode or QR code.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCam}>Cancel</Button>
          <Button variant="contained" onClick={handleSimulateCardScan}>
            Simulate Card Scan
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isBiometricOpen} onClose={handleCloseBiometric} fullWidth maxWidth="xs">
        <DialogTitle>Fingerprint Scan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for biometric scanning. In production, you'd integrate hardware or a library.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBiometric}>Cancel</Button>
          <Button variant="contained" onClick={handleSimulateFingerprint}>
            Simulate Fingerprint
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewVisitOpen}
        onClose={() => setViewVisitOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
            boxShadow: 2,
            p: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Visit Details
            </Typography>
            <IconButton
              onClick={() => setViewVisitOpen(false)}
              sx={{ "&:hover": { color: theme.palette.error.main } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedVisit &&
            (() => {
              const member = members.find(
                (m) => m.MemberID === selectedVisit.MemberID
              );
              return (
                <Box>
                  {/* Member Basic Info */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "#f9f9f9",
                        border: "1px solid #ddd",
                      }}
                    >
                      {member && member.PhotoPath ? (
                        <Box
                          component="img"
                          src={`/storage/${member.PhotoPath}`}
                          alt="Member"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "gray",
                            textAlign: "center",
                            lineHeight: "100px",
                          }}
                        >
                          No photo
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {member ? member.FullName : "—"}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontSize: "1.1rem" }}>
                        {member ? member.Email : "—"}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontSize: "1.1rem" }}>
                        {member ? member.Phone : "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {/* Membership Information */}
                  <Box mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Membership Information
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      <TextField
                        variant="filled"
                        size="small"
                        label="Plan"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <GroupsIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        value={member && member.PlanName ? member.PlanName : "Unknown"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Status"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <WarningIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        value={member && member.Status ? member.Status : "Unknown"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Start Date"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventAvailableIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        value={
                          member && member.MembershipStartDate
                            ? formatDate(member.MembershipStartDate)
                            : "—"
                        }
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="End Date"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <HistoryIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        value={
                          member && member.MembershipEndDate
                            ? formatDate(member.MembershipEndDate)
                            : "—"
                        }
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {/* Visit Information */}
                  <Box mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Visit Information
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      <TextField
                        variant="filled"
                        size="small"
                        label="Visit Date"
                        InputProps={{ readOnly: true }}
                        value={
                          selectedVisit.VisitDate
                            ? formatDate(selectedVisit.VisitDate)
                            : "—"
                        }
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Visit Time"
                        InputProps={{ readOnly: true }}
                        value={
                          selectedVisit.VisitTime
                            ? formatTime(selectedVisit.VisitTime)
                            : "—"
                        }
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Method"
                        InputProps={{ readOnly: true }}
                        value={selectedVisit.CheckInMethod || "—"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Visit ID"
                        InputProps={{ readOnly: true }}
                        value={selectedVisit.VisitID || "—"}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {/* Notes */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Notes
                    </Typography>
                    <TextField
                      variant="filled"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      InputProps={{ readOnly: true }}
                      value={
                        member && member.Notes ? member.Notes : "No notes available."
                      }
                    />
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVisitOpen} onClose={() => setEditVisitOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Visit</DialogTitle>
        <DialogContent dividers>
          {selectedVisit && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="MemberID"
                value={selectedVisit.MemberID}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, MemberID: e.target.value }))
                }
              />
              <TextField
                label="VisitDate"
                type="date"
                value={selectedVisit.VisitDate}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, VisitDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="VisitTime"
                value={selectedVisit.VisitTime}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, VisitTime: e.target.value }))
                }
              />
              <TextField
                label="CheckInMethod"
                value={selectedVisit.CheckInMethod || ""}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, CheckInMethod: e.target.value }))
                }
              />
              <TextField
                label="Remarks"
                value={selectedVisit.Remarks || ""}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, Remarks: e.target.value }))
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditVisitOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditVisitSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isViewWalkInOpen} onClose={() => setViewWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Walk-In Details</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box>
              <Typography>
                <strong>ID:</strong> {selectedWalkIn.WalkInID}
              </Typography>
              <Typography>
                <strong>Name:</strong> {selectedWalkIn.FullName}
              </Typography>
              <Typography>
                <strong>VisitDate:</strong> {selectedWalkIn.VisitDate}
              </Typography>
              <Typography>
                <strong>Notes:</strong> {selectedWalkIn.Notes}
              </Typography>
              <Typography>
                <strong>PaymentMethod:</strong> {selectedWalkIn.PaymentMethod}
              </Typography>
              <Typography>
                <strong>AmountPaid:</strong> {selectedWalkIn.AmountPaid}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewWalkInOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditWalkInOpen} onClose={() => setEditWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Walk-In</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Name"
                value={selectedWalkIn.FullName || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                label="VisitDate"
                type="date"
                value={selectedWalkIn.VisitDate || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, VisitDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Payment Method"
                value={selectedWalkIn.PaymentMethod || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, PaymentMethod: e.target.value }))
                }
              />
              <TextField
                label="AmountPaid"
                type="number"
                value={selectedWalkIn.AmountPaid || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, AmountPaid: e.target.value }))
                }
              />
              <TextField
                label="Notes"
                multiline
                rows={2}
                value={selectedWalkIn.Notes || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, Notes: e.target.value }))
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditWalkInSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isAddWalkInOpen} onClose={() => setAddWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Walk-In</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Full Name"
            name="FullName"
            fullWidth
            margin="dense"
            value={newWalkIn.FullName}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Visit Date"
            name="VisitDate"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={newWalkIn.VisitDate}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Payment Method"
            name="PaymentMethod"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentMethod}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Payment Amount"
            name="PaymentAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentAmount}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Notes"
            name="Notes"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={newWalkIn.Notes}
            onChange={handleAddWalkInChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWalkIn}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </Box>
  );
}
