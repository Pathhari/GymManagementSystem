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
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Switch,
  Avatar,
  Chip
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
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import GroupsIcon from "@mui/icons-material/Groups";
import WarningIcon from "@mui/icons-material/Warning";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import BadgeIcon from "@mui/icons-material/Badge";
import EventIcon from "@mui/icons-material/Event";
import NotesIcon from "@mui/icons-material/Notes";
import { AccessTime, AlarmOn, AlarmOff, Schedule as ScheduleIcon } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";

export default function StaffDashboard() {
  const theme = useTheme();

  // Snackbar state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  // Formatting helpers
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
    let [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Dashboard state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [checkInsToday, setCheckInsToday] = useState(0);
  const [lockersInUse, setLockersInUse] = useState(0);

  const [walkIns, setWalkIns] = useState([]);
  const [members, setMembers] = useState([]);
  const [monthlyClients, setMonthlyClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);

  const [staffId, setStaffId] = useState(null);
  const [staffBranch, setStaffBranch] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // Instead of localStorage, we use a state bool for the logged‑in staff's clock status
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Derived states for metrics
  const todayString = dayjs().format('YYYY-MM-DD');  
  const walkInsTodayCount = walkIns.filter((w) => {
    return new Date(w.VisitDate).toISOString().split("T")[0] === todayString;
  }).length;

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

    // The user can toggle: "Member" or "Monthly Client"
    const [checkInType, setCheckInType] = useState("member");
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    const [isClientDetailsOpen, setClientDetailsOpen] = useState(false);
  
  // Dialog states
  const [checkInMethod, setCheckInMethod] = useState("card");
  const [isCamOpen, setCamOpen] = useState(false);
  const [isBiometricOpen, setBiometricOpen] = useState(false);
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pendingCheckInMethod, setPendingCheckInMethod] = useState("card");

  

  // Visits
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isViewVisitOpen, setViewVisitOpen] = useState(false);
  const [isEditVisitOpen, setEditVisitOpen] = useState(false);

  // Walk-Ins
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    Notes: "",
    PaymentMethod: "",
    PaymentAmount: "",
  });

  // Current time (for display in the UI)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -- PHASE 1: ON MOUNT => fetch staff data so we know staffBranch
  useEffect(() => {
    fetchStaffData(); // sets staffId and staffBranch if found
  }, []);

  // Once staffBranch is known, fetch attendance, visits, schedules, etc.
  useEffect(() => {
    if (!staffBranch) return; // skip if branch is null/undefined

    // We can wrap everything in one function or do them individually
    const fetchAllDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Metrics
        const metricsRes = await axios.get("/staff/metrics");
        setCheckInsToday(metricsRes.data.checkInsToday || 0);
        setLockersInUse(metricsRes.data.lockersInUse || 0);

        // 2) Visits (branch-based)
        const visitsRes = await axios.get("/operations/visits", {
          params: { branchID: staffBranch },
        });
        setVisits(visitsRes.data.visits || []);

        // 3) Walk-Ins
        const walkInsRes = await axios.get("/operations/walk-ins");
        setWalkIns(walkInsRes.data || []);

        // 4) Attendance (branch-based)
        const attendRes = await axios.get("/staff/attendance", {
          params: { branchID: staffBranch },
        });
        const fetchedAttendance = Array.isArray(attendRes.data)
          ? attendRes.data
          : attendRes.data.attendance || [];
        setAttendance(fetchedAttendance);

        // 5) Determine clock state for the logged-in staff
        const todayDate = new Date().toISOString().split("T")[0];
        const todaysAttendance = fetchedAttendance.filter(
          (rec) => rec.Date === todayDate && rec.StaffID === staffId
        );
        const clockedInRecord = todaysAttendance.find(
          (rec) => rec.TimeIn && !rec.TimeOut
        );
        setIsClockedIn(!!clockedInRecord);

        // 6) Schedules
        const scheduleRes = await axios.get("/staff/schedules");
        setSchedule(scheduleRes.data || []);

        // 7) Staff list (for staff kiosk clock in/out)
        const staffRes = await axios.get("/staff");
        setStaffList(staffRes.data || []);

        // 8) Members
        const membersRes = await axios.get("/membership/members");
        setMembers(membersRes.data.members || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load staff dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [staffBranch, staffId]);

  // ------------- API Calls (Step 1) -------------
  // Fetch logged-in staff info (Phase 1)
  const fetchStaffData = async () => {
    try {
      const res = await axios.get("/staff/get-logged-in-staff");
      const data = res.data;
      if (data && data.StaffID) {
        setStaffId(data.StaffID);
        setStaffBranch(data.BranchID);
      }
    } catch (err) {
      console.error("Failed to load staff info:", err);
      setError("Could not load staff info.");
    }
  };

  // On mount, load the data if you haven't already
  useEffect(() => {
    // Example loads. Adjust to your actual endpoints
    axios.get("/membership/members").then((res) => {
      setMembers(res.data.members || []);
    });
    axios.get("/monthly-clients").then((res) => {
      setMonthlyClients(res.data || []);
    });
  }, []);
  

  // ------------- CRUD / clock-in / check-in etc. -------------
  const handleTabChange = (e, val) => {
    setActiveTab(val);
  };

  const handleCheckInMethodChange = (e) => {
    setCheckInMethod(e.target.value);
  };

  // Toggle between normal members vs monthly clients
  const handleToggleCheckInType = (evt) => {
    setCheckInType(evt.target.checked ? "monthlyClient" : "member");
    // Optionally clear selected
    setSelectedMember(null);
    setSelectedClient(null);
  };

  // Show details for whichever type is selected
  const handleShowDetails = () => {
    if (checkInType === "member") {
      if (!selectedMember) {
        alert("Please select a member first.");
        return;
      }
    } else {
      if (!selectedClient) {
        alert("Please select a monthly client first.");
        return;
      }
    }
    setClientDetailsOpen(true);
  };


  // Confirm check in (calls different endpoints)
  const handleConfirmCheckIn = async () => {
    try {
      if (checkInType === "member") {
        if (!selectedMember) return;
        // Normal member => e.g. /operations/visits
        await axios.post("/operations/visits", {
          MemberID: selectedMember.MemberID,
          BranchID: staffBranch, // if needed
        });
      // Re-fetch all visits so the new one appears
      const visitsRes = await axios.get("/operations/visits", {
        params: { branchID: staffBranch },
      });
      setVisits(visitsRes.data.visits || []);

      showSuccessMessage(
        `Checked in Member: ${selectedMember.FullName}`
      );
      setSelectedMember(null);
      } else {
        if (!selectedClient) return;
        // Monthly client => e.g. /monthly-clients/{id}/attendances
        await axios.post(
          `/monthly-clients/${selectedClient.MonthlyClientID}/attendances`,
          {
            VisitDateTime: new Date().toISOString(),
            Notes: "Checked in by staff",
          }
        );
        showSuccessMessage(
          `Checked in Monthly Client: ${selectedClient.FullName}`
        );
        setSelectedClient(null);
      }
    } catch (err) {
      console.error("Check in error:", err);
      alert("Check in failed. See console for details.");
    } finally {
      setClientDetailsOpen(false);
    }
  };
  

  // Clock In/Out for staff on the kiosk
  const handleScheduleClock = async (staffRow) => {
    const dateStr = new Date().toISOString().split("T")[0];
    const stSchedule = schedule.find(
      (sch) => sch.StaffID === staffRow.StaffID && sch.ShiftDate === dateStr
    );
    if (!stSchedule) {
      showSuccessMessage(`No schedule for ${staffRow.FullName} today.`);
      return;
    }

    const att = attendance.find(
      (a) => a.StaffID === staffRow.StaffID && a.Date === dateStr
    );
    const timeStr = new Date().toLocaleTimeString("it-IT").slice(0, 5);

    let clockData = {
      StaffID: staffRow.StaffID,
      BranchID: staffBranch,
      Date: dateStr,
    };

    if (!att || !att.TimeIn) {
      // Clock In
      clockData.TimeIn = timeStr;
      clockData.TimeOut = null;
    } else if (!att.TimeOut) {
      // Clock Out
      clockData.TimeIn = null;
      clockData.TimeOut = timeStr;
    } else {
      // Already completed
      showSuccessMessage(`${staffRow.FullName} has already completed attendance.`);
      return;
    }

    try {
      const response = await axios.post(
        "/staff/attendance/clock-in-out",
        clockData
      );
      const updatedRec = response.data.attendance;
      if (!updatedRec) {
        showSuccessMessage("Attendance updated but no record returned.");
        return;
      }
      // Update local state
      setAttendance((prev) => {
        const others = prev.filter(
          (a) => !(a.StaffID === updatedRec.StaffID && a.Date === updatedRec.Date)
        );
        return [...others, updatedRec];
      });
      showSuccessMessage(
        updatedRec.TimeOut
          ? `${staffRow.FullName} clocked out at ${updatedRec.TimeOut}`
          : `${staffRow.FullName} clocked in at ${updatedRec.TimeIn}`
      );
    } catch (err) {
      console.error("Failed to clock in/out", err);
      showSuccessMessage("Error updating attendance. Check console for details.");
    }
  };

  // Clock In/Out for *logged-in staff*
  const refreshClockState = async () => {
    try {
      // fetch updated attendance for this branch
      const attendRes = await axios.get("/staff/attendance", {
        params: { branchID: staffBranch },
      });
      const fetchedAttendance = Array.isArray(attendRes.data)
        ? attendRes.data
        : attendRes.data.attendance || [];

      setAttendance(fetchedAttendance);

      const todayDate = new Date().toISOString().split("T")[0];
      const clockedInRecord = fetchedAttendance.find(
        (rec) => rec.Date === todayDate && rec.StaffID === staffId && rec.TimeIn && !rec.TimeOut
      );
      const newState = !!clockedInRecord;
      setIsClockedIn(newState);
      return newState;
    } catch (error) {
      console.error("Error refreshing clock state:", error);
      return false;
    }
  };

  const handleClockInOut = async () => {
    if (!staffId) {
      console.warn("No staffId available, cannot clock in/out.");
      return;
    }
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = currentTime.toLocaleTimeString("it-IT").slice(0, 5);

    const clockData = {
      StaffID: staffId,
      BranchID: staffBranch,
      Date: dateStr,
      TimeIn: isClockedIn ? null : timeStr,
      TimeOut: isClockedIn ? timeStr : null,
    };
    try {
      await axios.post("/staff/attendance/clock-in-out", clockData);
      // small delay, then refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newClockState = await refreshClockState();
      showSuccessMessage(
        newClockState ? "Clocked in successfully." : "Clocked out successfully."
      );
    } catch (err) {
      console.error("Failed to record attendance:", err);
      showSuccessMessage("Error clocking in/out. See console for details.");
    }
  };

  // ---------- VISITS & WALK-INS CRUD -------------
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
        Remarks: selectedVisit.Remarks,
      });
      setEditVisitOpen(false);
      // re-fetch
      const visitsRes = await axios.get("/operations/visits", {
        params: { branchID: staffBranch },
      });
      setVisits(visitsRes.data.visits || []);
      showSuccessMessage("Visit updated successfully.");
    } catch (err) {
      console.error("Failed to update visit:", err);
      alert("Error updating visit. Check console.");
    }
  };
  const handleDeleteVisit = async (visitID) => {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await axios.delete(`/operations/visits/${visitID}`);
      const visitsRes = await axios.get("/operations/visits", {
        params: { branchID: staffBranch },
      });
      setVisits(visitsRes.data.visits || []);
      showSuccessMessage("Visit deleted!");
    } catch (err) {
      console.error("Failed to delete visit:", err);
    }
  };

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
        Notes: selectedWalkIn.Notes || "",
      });
      setEditWalkInOpen(false);
      const walkInsRes = await axios.get("/operations/walk-ins");
      setWalkIns(walkInsRes.data || []);
      showSuccessMessage("Walk-In updated!");
    } catch (err) {
      console.error("Failed to update walk-in:", err);
      alert("Error updating walk-in. Check console.");
    }
  };
  const handleDeleteWalkIn = async (walkInID) => {
    if (!window.confirm("Delete this walk-in record?")) return;
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
      const walkInsRes = await axios.get("/operations/walk-ins");
      setWalkIns(walkInsRes.data || []);
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
        PaymentAmount: newWalkIn.PaymentAmount || 0,
      });
      showSuccessMessage("Walk-In created successfully.");
      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        Notes: "",
        PaymentMethod: "",
        PaymentAmount: "",
      });
      setAddWalkInOpen(false);
      // re-fetch
      const walkInsRes = await axios.get("/operations/walk-ins");
      setWalkIns(walkInsRes.data || []);
    } catch (err) {
      console.error("Failed to create walk-in:", err);
      alert("Create error. Check console for details.");
    }
  };

  // ---------- TABLE COLUMNS ----------
  const actionButtonStyles = {
    minWidth: "40px",
    padding: "6px",
    transition: "transform 0.2s",
    "&:hover": { transform: "scale(1.05)" },
  };

  const visitColumns = [
    {
      field: "MemberID",
      headerName: "Member",
      width: 250,
      renderCell: (params) => {
        const member = members.find((m) => m.MemberID === params.value);
        return member ? member.FullName : params.value;
      },
    },
    { field: "VisitID", headerName: "ID", width: 80 },
    {
      field: "VisitDate",
      headerName: "Date",
      width: 180,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
    {
      field: "VisitTime",
      headerName: "Time",
      width: 180,
      renderCell: (params) => (params.value ? formatTime(params.value) : "—"),
    },
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
                  "&:hover": { backgroundColor: "#43a047" },
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
                  "&:hover": { backgroundColor: "#1976d2" },
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
                  "&:hover": { backgroundColor: "#d32f2f" },
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const walkInColumns = [
    { field: "WalkInID", headerName: "ID", width: 80 },
    { field: "FullName", headerName: "Name", width: 130 },
    {
      field: "VisitDate",
      headerName: "Date",
      width: 150,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
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
                  "&:hover": { backgroundColor: "#43a047" },
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
                  "&:hover": { backgroundColor: "#1976d2" },
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
                  "&:hover": { backgroundColor: "#d32f2f" },
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const expiringColumns = [
    { field: "MemberID", headerName: "Member ID", width: 120 },
    { field: "FullName", headerName: "Full Name", width: 200 },
    {
      field: "MembershipEndDate",
      headerName: "Expires On",
      width: 150,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
  ];

  // ---------- RENDER ----------
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

  // Filter staff list for kiosk clock in: only staff in the same branch, exclude self
  const staffInMyBranch = staffList.filter(
    (st) =>
      st.StaffID !== staffId &&
      st.branches?.some((b) => String(b.BranchID) === String(staffBranch))
  );

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
              boxShadow: 3,
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
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.info.dark
                    : theme.palette.info.light,
                color: theme.palette.info.contrastText,
              }}
            >
              <CardContent
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
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
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.success.dark
                    : theme.palette.success.light,
                color: theme.palette.success.contrastText,
              }}
            >
              <CardContent
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
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
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.secondary.dark
                    : theme.palette.secondary.light,
                color: theme.palette.secondary.contrastText,
              }}
            >
              <CardContent
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
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
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.warning.dark
                    : theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
              }}
            >
              <CardContent
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <WarningAmberIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Expiring Soon</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {expiringSoonCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* LEFT COLUMN: Check-In Member & Staff Schedule & Clock In/Out */}
        <Grid item xs={12} md={4}>
      {/* ===================== CHECK IN CARD ===================== */}
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <CardHeader title="Check In" />
        <CardContent>

          {/* Switch: Member vs Monthly Client */}
          <FormControlLabel
            label="Monthly Client?"
            control={
              <Switch
                checked={checkInType === "monthlyClient"}
                onChange={handleToggleCheckInType}
                color="primary"
              />
            }
            sx={{ mb: 2 }}
          />

          {checkInType === "member" ? (
            <>
              {/* Normal membership Autocomplete */}
              <Autocomplete
                options={members}
                getOptionLabel={(option) =>
                  `${option.MemberID} - ${option.FullName}`
                }
                value={selectedMember}
                onChange={(_, newVal) => setSelectedMember(newVal)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Member"
                    variant="outlined"
                    size="small"
                  />
                )}
                sx={{ mb: 2 }}
              />
            </>
          ) : (
            <>
              {/* Monthly Clients Autocomplete */}
              <Autocomplete
                options={monthlyClients}
                getOptionLabel={(option) =>
                  `${option.MonthlyClientID} - ${option.FullName}`
                }
                value={selectedClient}
                onChange={(_, newVal) => setSelectedClient(newVal)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Monthly Client"
                    variant="outlined"
                    size="small"
                  />
                )}
                sx={{ mb: 2 }}
              />
            </>
          )}

          <Button
            variant="contained"
            onClick={handleShowDetails}
            fullWidth
            disabled={
              (checkInType === "member" && !selectedMember) ||
              (checkInType === "monthlyClient" && !selectedClient)
            }
          >
            Show Details / Verify
          </Button>
        </CardContent>
      </Card>


      {/* ===================== DIALOG FOR DETAILS ===================== */}
      <Dialog
        open={isClientDetailsOpen}
        onClose={() => setClientDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: 2, boxShadow: 3 } }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {checkInType === "member" ? "Member Details" : "Monthly Client Details"}
            </Typography>
            <IconButton
              onClick={() => setClientDetailsOpen(false)}
              sx={{ "&:hover": { color: theme.palette.error.main } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 1 }}>
          {/* --------------------- MEMBER CHECK-IN --------------------- */}
          {checkInType === "member" && selectedMember && (
            <Box>
              {/* TOP SECTION: Photo or initial, name, email, phone */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  mb: 2,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa",
                }}
              >
                {selectedMember.PhotoPath ? (
                  <Avatar
                    src={`/storage/${selectedMember.PhotoPath}`}
                    alt={selectedMember.FullName}
                    sx={{ width: 80, height: 80, fontSize: "1.5rem" }}
                  />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, fontSize: "1.5rem" }}>
                    {selectedMember.FullName?.[0] || "?"}
                  </Avatar>
                )}

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.3 }}>
                    {selectedMember.FullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.Email || "No Email"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.Phone || "No Phone"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* MEMBERSHIP INFO */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Membership Info
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Plan:
                  </Typography>
                  <Box mt={0.3}>
                    {selectedMember.plan ? (
                      <Chip
                        label={selectedMember.plan.PlanName}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Chip label="No Plan" variant="outlined" size="small" />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Status:
                  </Typography>
                  <Box mt={0.3}>
                    {selectedMember.status ? (
                      <Chip
                        label={selectedMember.status.StatusName}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Chip label="N/A" variant="outlined" size="small" />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Start Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMember.MembershipStartDate
                      ? formatDate(selectedMember.MembershipStartDate)
                      : "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    End Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMember.MembershipEndDate
                      ? formatDate(selectedMember.MembershipEndDate)
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mt: 3, mb: 2 }} />

              {/* CHECK-IN METHOD */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Check-In Method
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  label="Method"
                  value={checkInMethod}
                  onChange={(e) => setCheckInMethod(e.target.value)}
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="card">Membership Card</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* ------------------- MONTHLY CLIENT CHECK-IN ------------------- */}
          {checkInType === "monthlyClient" && selectedClient && (
            <Box>
              {/* BASIC INFO */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  mb: 2,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {selectedClient.FullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedClient.Email || "No Email"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedClient.Phone || "No Phone"}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Monthly Client Info
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Start Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.StartDate
                      ? formatDate(selectedClient.StartDate)
                      : "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    End Date:
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.EndDate
                      ? formatDate(selectedClient.EndDate)
                      : "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Active?
                  </Typography>
                  <Box mt={0.3}>
                    {selectedClient.IsActive ? (
                      <Chip label="Yes" color="success" variant="outlined" size="small" />
                    ) : (
                      <Chip label="No" color="error" variant="outlined" size="small" />
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ mt: 3, mb: 2 }} />

              {/* CHECK-IN METHOD */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Check-In Method
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  label="Method"
                  value={checkInMethod}
                  onChange={(e) => setCheckInMethod(e.target.value)}
                >
                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="card">Membership Card</MenuItem>
                  <MenuItem value="biometric">Biometric</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ py: 2, px: 3 }}>
          <Button onClick={() => setClientDetailsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmCheckIn}>
            Confirm Check In
          </Button>
        </DialogActions>
      </Dialog>



          {/* Staff Schedule & Clock In/Out Card */}
          <Card
            sx={{
              mb: 2,
              borderRadius: 4,
              boxShadow: 4,
              p: 3,
              backgroundColor: "background.paper",
            }}
          >
            <CardHeader
              title="Staff Schedule & Clock In/Out"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                color: "primary.dark",
              }}
            />
            <CardContent>
              <Box
                sx={{
                  textAlign: "center",
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  {dayjs(currentTime).format("dddd, MMMM D, YYYY")}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    color: "#fffff",
                    letterSpacing: 1,
                    mt: 1,
                  }}
                >
                  {currentTime.toLocaleTimeString()}
                </Typography>
              </Box>

              {/* Staff in branch (kiosk clock in/out) */}
              {staffInMyBranch.length === 0 ? (
                <Typography align="center">No staff found in your branch.</Typography>
              ) : (
                <List>
                  {staffInMyBranch.map((st) => {
                    const stSchedule = schedule.find(
                      (sch) => sch.StaffID === st.StaffID && sch.ShiftDate === todayString
                    );
                    const att = attendance.find(
                      (a) => a.StaffID === st.StaffID && a.Date === todayString
                    );
                    const clockedIn = att && att.TimeIn && !att.TimeOut;
                    const clockedOut = att && att.TimeIn && att.TimeOut;

                    const disabled = !stSchedule;
                    let btnLabel = "Clock In";
                    let btnColor = "success";
                    if (clockedIn) {
                      btnLabel = "Clock Out";
                      btnColor = "error";
                    } else if (clockedOut) {
                      btnLabel = "Completed";
                      btnColor = "info";
                    } else if (!stSchedule) {
                      btnLabel = "No Schedule";
                      btnColor = "inherit";
                    }

                    return (
                      <ListItem key={st.StaffID} divider sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={st.FullName}
                          secondary={
                            stSchedule ? (
                              <>
                                <Typography variant="body2">
                                  Shift: {stSchedule.ShiftStart} - {stSchedule.ShiftEnd}
                                </Typography>
                                {att ? (
                                  att.TimeIn && !att.TimeOut ? (
                                    <Typography variant="body2" color="success.main">
                                      Clocked In at {att.TimeIn}
                                    </Typography>
                                  ) : att.TimeIn && att.TimeOut ? (
                                    <Typography variant="body2" color="text.secondary">
                                      In: {att.TimeIn}, Out: {att.TimeOut}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="warning.main">
                                      Scheduled, not clocked in yet.
                                    </Typography>
                                  )
                                ) : (
                                  <Typography variant="body2" color="warning.main">
                                    Scheduled, but no attendance record yet.
                                  </Typography>
                                )}
                              </>
                            ) : (
                              "No schedule for today."
                            )
                          }
                          sx={{ "& .MuiTypography-root": { fontSize: "0.9rem" } }}
                        />

                        <Button
                          variant="contained"
                          color={btnColor}
                          onClick={() => handleScheduleClock(st)}
                          disabled={disabled || clockedOut}
                          sx={{ minWidth: 120, fontSize: "0.8rem", fontWeight: "bold" }}
                        >
                          {btnLabel}
                        </Button>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Tabbed Data (Visits, Walk-ins, Expiring Soon) */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
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
                        fontSize: "1rem",
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #e0e0e0",
                      },
                    }}
                  />
                </Paper>
              )}
              {activeTab === 1 && (
                <Box sx={{ height: 600, display: "flex", flexDirection: "column" }}>
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
                          fontSize: "1rem",
                        },
                        "& .MuiDataGrid-cell": {
                          borderBottom: "1px solid #e0e0e0",
                        },
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
                        fontSize: "1rem",
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #e0e0e0",
                      },
                    }}
                  />
                </Paper>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs for Camera, Biometric, Visits, Walk-ins, etc. */}
      <Dialog open={isCamOpen} onClose={() => setCamOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Card Scanning via Webcam</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for webcam scanning. A real implementation would parse a barcode or QR code.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCamOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCamOpen(false)}>
            Simulate Card Scan
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isBiometricOpen} onClose={() => setBiometricOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Fingerprint Scan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for biometric scanning. In production, integrate actual hardware.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBiometricOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setBiometricOpen(false)}>
            Simulate Fingerprint
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Visit Dialog */}
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
              const mem = members.find((m) => m.MemberID === selectedVisit.MemberID);
              return (
                <Box>
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
                      {mem && mem.PhotoPath ? (
                        <Box
                          component="img"
                          src={`/storage/${mem.PhotoPath}`}
                          alt="Member"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{ color: "gray", textAlign: "center", lineHeight: "100px" }}
                        >
                          No photo
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {mem ? mem.FullName : "—"}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontSize: "1.1rem" }}>
                        {mem ? mem.Email : "—"}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontSize: "1.1rem" }}>
                        {mem ? mem.Phone : "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Membership Info
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
                      value={mem?.plan ? mem.plan.PlanName : "N/A"} // <-- changed here
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
                      value={mem?.status ? mem.status.StatusName : "N/A"} // <-- changed here
                    />                      
                    <TextField
                        variant="filled"
                        size="small"
                        label="Start Date"
                        InputProps={{ readOnly: true }}
                        value={mem?.MembershipStartDate ? formatDate(mem.MembershipStartDate) : "—"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="End Date"
                        InputProps={{ readOnly: true }}
                        value={mem?.MembershipEndDate ? formatDate(mem.MembershipEndDate) : "—"}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                      Visit Info
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      <TextField
                        variant="filled"
                        size="small"
                        label="Visit Date"
                        InputProps={{ readOnly: true }}
                        value={selectedVisit.VisitDate ? formatDate(selectedVisit.VisitDate) : "—"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Visit Time"
                        InputProps={{ readOnly: true }}
                        value={selectedVisit.VisitTime ? formatTime(selectedVisit.VisitTime) : "—"}
                      />
                      <TextField
                        variant="filled"
                        size="small"
                        label="Method"
                        InputProps={{ readOnly: true }}
                        value={selectedVisit.CheckInMethod || "—"}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
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

      {/* View Walk-In Dialog */}
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

      {/* Edit Walk-In Dialog */}
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

      {/* Add Walk-In Dialog */}
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

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </Box>
  );
}
