import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
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
  DialogActions
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import dayjs from "dayjs";

// FullCalendar imports
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function StaffDashboard() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Metrics
  const [checkInsToday, setCheckInsToday] = useState(0);
  const [lockersInUse, setLockersInUse] = useState(0);
  const [pendingIssues, setPendingIssues] = useState(0);

  // Tasks
  const [tasks, setTasks] = useState([]);

  // ------------------------------
  // CHECK-IN UI
  // ------------------------------
  const [checkInMemberID, setCheckInMemberID] = useState("");
  const [checkInMethod, setCheckInMethod] = useState("card");
  const [isCamOpen, setCamOpen] = useState(false);
  const [isBiometricOpen, setBiometricOpen] = useState(false);

  // Calendar
  const [calendarEvents, setCalendarEvents] = useState([]);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadKeyMetrics();
    loadTasks();
    loadCalendarEvents();
  }, []);

  // Load staff metrics
  const loadKeyMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      // /staff/metrics => { checkInsToday, lockersInUse, pendingIssues }
      const res = await axios.get("/staff/metrics");
      setCheckInsToday(res.data.checkInsToday || 0);
      setLockersInUse(res.data.lockersInUse || 0);
      setPendingIssues(res.data.pendingIssues || 0);
    } catch (err) {
      console.error("Error loading staff metrics:", err);
      setError("Failed to load staff metrics.");
    } finally {
      setLoading(false);
    }
  };

  // Load tasks
  const loadTasks = async () => {
    try {
      const res = await axios.get("/staff/tasks");
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  // Load calendar/bookings
  const loadCalendarEvents = async () => {
    try {
      // GET /booking/today or /booking/month
      const res = await axios.get("/booking/today");
      const events = (res.data || []).map((bk) => ({
        id: `bk-${bk.BookingID}`,
        title: "",
        start: `${bk.BookingDate}T${bk.BookingTime || "08:00"}`,
        extendedProps: {
          MemberName: bk.MemberName,
          BookingTime: bk.BookingTime,
          FacilityName: bk.FacilityName
        }
      }));
      setCalendarEvents(events);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    loadKeyMetrics();
    loadTasks();
    loadCalendarEvents();
  };

  // ------------------------------
  // CHECK-IN LOGIC
  // ------------------------------
  const handleCheckIn = async () => {
    if (!checkInMemberID.trim()) {
      alert("Please enter a Member ID.");
      return;
    }
    try {
      // Post with method as well
      await axios.post("/operations/visits", {
        MemberID: checkInMemberID.trim(),
        CheckInMethod: checkInMethod
      });
      alert(`Member #${checkInMemberID.trim()} checked in successfully!`);
      setCheckInMemberID("");
      loadKeyMetrics();
    } catch (err) {
      console.error("Check-in failed:", err);
      alert("Failed to check in member.");
    }
  };

  // ------------------------------
  // BIOMETRIC & CAMERA DIALOGS
  // ------------------------------
  const handleOpenCam = () => setCamOpen(true);
  const handleCloseCam = () => setCamOpen(false);
  const handleScanCard = () => {
    // Simulate scanning from webcam
    setCheckInMemberID("123456");
    setCamOpen(false);
  };

  const handleOpenBiometric = () => setBiometricOpen(true);
  const handleCloseBiometric = () => setBiometricOpen(false);
  const handleScanFingerprint = () => {
    // Simulate fingerprint matching
    setCheckInMemberID("987654");
    setBiometricOpen(false);
  };

  // Custom event rendering: show member, facility, time
  const renderEventContent = (arg) => {
    const { MemberName, BookingTime, FacilityName } = arg.event.extendedProps;
    return (
      <div style={{ fontSize: "0.85rem" }}>
        <div>
          <strong>{MemberName}</strong>
        </div>
        {FacilityName && <div style={{ color: "#bbb" }}>{FacilityName}</div>}
        {BookingTime && (
          <div style={{ fontStyle: "italic", color: "#999" }}>
            {BookingTime}
          </div>
        )}
      </div>
    );
  };

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
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        backgroundColor: darkMode ? "#303030" : "#fafafa",
        color: darkMode ? "#ddd" : "#000"
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Front Desk Dashboard
        </Typography>
        <IconButton color="primary" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, backgroundColor: "#42A5F5", color: "#fff" }}>
            <CardContent>
              <Typography variant="subtitle2">Check-ins Today</Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {checkInsToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, backgroundColor: "#66BB6A", color: "#fff" }}>
            <CardContent>
              <Typography variant="subtitle2">Lockers In Use</Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {lockersInUse}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, backgroundColor: "#FFB74D", color: "#fff" }}>
            <CardContent>
              <Typography variant="subtitle2">Pending Issues</Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {pendingIssues}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left: CheckIn + tasks */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Check In Member" />
            <CardContent>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Check-in Method</InputLabel>
                <Select
                  label="Check-in Method"
                  value={checkInMethod}
                  onChange={(e) => setCheckInMethod(e.target.value)}
                >
                  <MenuItem value="card">Membership Card</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>

              {checkInMethod === "card" && (
                <Button variant="outlined" onClick={handleOpenCam} fullWidth sx={{ mb: 2 }}>
                  Open Camera Scanner
                </Button>
              )}
              {checkInMethod === "biometric" && (
                <Button variant="outlined" onClick={handleOpenBiometric} fullWidth sx={{ mb: 2 }}>
                  Scan Fingerprint
                </Button>
              )}

              <TextField
                label="Member ID"
                variant="outlined"
                fullWidth
                size="small"
                value={checkInMemberID}
                onChange={(e) => setCheckInMemberID(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" onClick={handleCheckIn} fullWidth>
                Check In
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="My Tasks" />
            <CardContent>
              {tasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tasks for today.
                </Typography>
              ) : (
                <List>
                  {tasks.map((task, idx) => (
                    <React.Fragment key={task.TaskID || idx}>
                      <ListItem>
                        <ListItemText
                          primary={task.TaskDescription || task.title}
                          secondary={
                            task.Status
                              ? `Status: ${task.Status}`
                              : task.dueDate
                              ? `Due: ${task.dueDate}`
                              : null
                          }
                        />
                      </ListItem>
                      {idx < tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Calendar */}
        <Grid item xs={12} md={8}>
          <Card sx={{ minHeight: 600 }}>
            <CardHeader title="Bookings" />
            <CardContent>
              {calendarEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bookings found.
                </Typography>
              ) : (
                <Box sx={{ overflow: "auto" }}>
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      start: "title",
                      center: "",
                      end: "dayGridMonth,timeGridWeek,timeGridDay"
                    }}
                    height="auto"
                    events={calendarEvents}
                    eventContent={renderEventContent}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Camera Dialog */}
      <Dialog open={isCamOpen} onClose={() => setCamOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Card Scanning via Webcam</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This is a placeholder for webcam scanning. A real implementation would
            access your camera and detect a barcode/QR or the card details.
          </Typography>
          {/* Possibly a <video> or <canvas> for the live camera feed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCamOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setCheckInMemberID("123456");
            setCamOpen(false);
          }}>
            Simulate Card Scan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Biometric Dialog */}
      <Dialog open={isBiometricOpen} onClose={() => setBiometricOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Fingerprint Scan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This is a placeholder for biometric scanning. A real approach would integrate
            with a fingerprint reader driver or library.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBiometricOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setCheckInMemberID("987654");
            setBiometricOpen(false);
          }}>
            Simulate Fingerprint
          </Button>
        </DialogActions>
      </Dialog>

      {/* FullCalendar Dark Mode Overrides */}
      <style jsx global>{`
        ${darkMode ? `
        .fc {
          background-color: #2d2d2d;
          color: #ccc;
        }
        .fc .fc-daygrid-day-frame {
          background-color: #3a3a3a;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #444 !important;
        }
        .fc .fc-button {
          background-color: #555 !important;
          border-color: #666 !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #666 !important;
          color: #999 !important;
        }
        ` : ""}
      `}</style>
    </Box>
  );
}
