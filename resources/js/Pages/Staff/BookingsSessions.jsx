import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  OutlinedInput,
  InputAdornment,
  Autocomplete,
  Snackbar,
  Alert
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

// ICONS
import StoreIcon from "@mui/icons-material/Store";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BusinessIcon from "@mui/icons-material/Business";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import EventIcon from "@mui/icons-material/Event";
import CategoryIcon from "@mui/icons-material/Category";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import GroupsIcon from "@mui/icons-material/Groups";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoIcon from "@mui/icons-material/Info";
import PaymentIcon from "@mui/icons-material/Payment";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PhoneIcon from "@mui/icons-material/Phone";
import SportsIcon from "@mui/icons-material/Sports";
import PeopleIcon from "@mui/icons-material/People";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

// Date Libraries & CSV/PDF
import dayjs from "dayjs";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// React Big Calendar
import moment from "moment";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";

// MUI X Date Pickers
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDateTimePicker, DatePicker, TimePicker } from "@mui/x-date-pickers";

import { styled } from "@mui/material/styles";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

const BigCalendarWrapper = styled("div")(({ theme }) => ({
  ".rbc-calendar": {
    height: "730px",
    borderRadius: 4,
  },
  ".rbc-month-view, .rbc-time-view": {
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
    color: theme.palette.text.primary,
  },
  ".rbc-off-range-bg": {
    backgroundColor:
      theme.palette.mode === "dark" ? "#2b2b2b" : "#f0f0f0",
    opacity: 0.9,
  },
  ".rbc-day-bg": {
    borderColor: theme.palette.divider,
  },
  ".rbc-today": {
    backgroundColor:
      theme.palette.mode === "dark" ? "#424242" : "#e3f2fd",
  },
  ".rbc-event": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 4,
  },
  ".rbc-show-more": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.primary.dark
        : theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
}));

function formatTime(timeString) {
  if (!timeString) return "—";
  const timeObj = dayjs(timeString, "HH:mm:ss", true);
  return timeObj.isValid() ? timeObj.format("h:mm A") : "Invalid Time";
}

function createCalendarEvents(bookings, sessions, sessionBookings) {
  const bookingEvents = bookings.map((b) => ({
    id: `booking-${b.BookingID}`,
    date: b.BookingDate,
    title: `Booking: ${b.MemberName} (${formatTime(b.BookingTime)})`,
    type: "booking",
  }));

  const sessionEvents = sessions.map((s) => ({
    id: `session-${s.SessionID}`,
    start: dayjs(s.StartTime).format("YYYY-MM-DDTHH:mm:ss"),
    end: dayjs(s.EndTime).format("YYYY-MM-DDTHH:mm:ss"),
    title: `Session: ${s.SessionName}`,
    type: "session",
  }));

  const sessionBookingEvents = sessionBookings.map((sb) => ({
    id: `sb-${sb.SessionBookingID}`,
    date: sb.BookingDate,
    title: `SessionBooking: ${sb.SessionName} (Member: ${sb.MemberName})`,
    type: "sessionBooking",
  }));

  return [...bookingEvents, ...sessionEvents, ...sessionBookingEvents];
}


export default function BookingsSessions() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  // ------------------ Get Logged-In Staff Branch ------------------
  const { auth } = usePage().props;
  const staffBranch = auth?.user?.branch_id || "";

  // ------------------ States ------------------
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);

  // In owner version, branches were hard coded.
  const [branches] = useState([
    { value: "1", label: "Contnental Branch 1" },
    { value: "2", label: "Contnental Branch 2" },
  ]);

  // For staff version, preset the branch filter to the logged-in branch
  const [branchFilter, setBranchFilter] = useState(staffBranch);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [exportAnchor, setExportAnchor] = useState(null);
  const openExport = Boolean(exportAnchor);

  // Calendar dialogs and state
  const [isAddCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Booking dialogs
  const [isAddBookingOpen, setAddBookingOpen] = useState(false);
  const [viewBookingModal, setViewBookingModal] = useState(false);
  const [editBookingModal, setEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Session dialogs
  const [isAddSessionOpen, setAddSessionOpen] = useState(false);
  const [viewSessionModal, setViewSessionModal] = useState(false);
  const [editSessionModal, setEditSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // New Booking fields
  const [newBooking, setNewBooking] = useState({
    MemberID: "",
    FacilityID: "",
    BookingDate: "",
    BookingTime: "",
    Duration: "",
    Status: "",
    PaymentMethod: "",
    PaymentAmount: "",
  });
  const [selectedBranchForBooking, setSelectedBranchForBooking] = useState("");

  // New Session fields
  const [newSession, setNewSession] = useState({
    BranchID: "",
    SessionName: "",
    SessionType: "",
    CoachID: "",
    StartDate: "",
    StartTime: "",
    EndDate: "",
    EndTime: "",
    Capacity: "",
    Location: "",
    Fee: "",
  });

  // Book Session Dialog
  const [isBookSessionOpen, setBookSessionOpen] = useState(false);
  const [sessionToBook, setSessionToBook] = useState(null);
  const [sessionBookingMemberID, setSessionBookingMemberID] = useState("");
  const [sessionBookingDate, setSessionBookingDate] = useState("");
  const [sessionBookingStatus, setSessionBookingStatus] = useState("Confirmed");
  const [sessionBookingPaymentMethod, setSessionBookingPaymentMethod] = useState("Cash");
  const [sessionBookingPaymentAmount, setSessionBookingPaymentAmount] = useState("");

  // (Other dialogs for waitlist, attendance, coaches, etc. remain unchanged)
  const [isAddCoachOpen, setAddCoachOpen] = useState(false);
  const [viewCoachModal, setViewCoachModal] = useState(false);
  const [editCoachModal, setEditCoachModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [newCoach, setNewCoach] = useState({
    FullName: "",
    Specialty: "",
    Availability: "",
    ContactInfo: "",
  });

  // Real-time validation
  const isValidBooking = () => {
    return (
      newBooking.BookingDate.trim() !== "" &&
      newBooking.BookingTime.trim() !== "" &&
      newBooking.Duration.toString().trim() !== "" &&
      newBooking.PaymentAmount.toString().trim() !== "" &&
      Number(newBooking.PaymentAmount) > 0 &&
      newBooking.MemberID &&
      newBooking.FacilityID
    );
  };
  const [isSubmitEnabledBooking, setIsSubmitEnabledBooking] = useState(false);
  useEffect(() => {
    setIsSubmitEnabledBooking(isValidBooking());
  }, [selectedBranchForBooking, newBooking]);

  const isValidSession = () => {
    return (
      newSession.SessionName.trim() !== "" &&
      newSession.SessionType.trim() !== "" &&
      newSession.StartTime.trim() !== "" &&
      newSession.EndTime.trim() !== "" &&
      newSession.Capacity.toString().trim() !== "" &&
      newSession.Location.trim() !== "" &&
      newSession.BranchID &&
      newSession.CoachID
    );
  };
  const [isSubmitEnabledSession, setIsSubmitEnabledSession] = useState(false);
  useEffect(() => {
    setIsSubmitEnabledSession(isValidSession());
  }, [newSession]);

  const isValidCoach = () => {
    return (
      newCoach.FullName.trim() !== "" &&
      newCoach.Specialty.trim() !== "" &&
      newCoach.Availability.trim() !== "" &&
      newCoach.ContactInfo.trim() !== ""
    );
  };
  const [isSubmitEnabledCoach, setIsSubmitEnabledCoach] = useState(false);
  useEffect(() => {
    setIsSubmitEnabledCoach(isValidCoach());
  }, [newCoach]);
  // ------------------ Effects ------------------
  useEffect(() => {
    fetchAllData();
  }, []);

    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");
    const [snackSeverity, setSnackSeverity] = useState("info");
    const showSnack = (message, severity = "info") => {
      setSnackMessage(message);
      setSnackSeverity(severity);
      setSnackOpen(true);
    };
  
  const fetchAllData = async () => {
    try {
      const bookingRes = await axios.get("/booking");
      const loadedBookings = bookingRes.data.bookings || [];

      const sessionRes = await axios.get("/booking/sessions");
      const loadedSessions = sessionRes.data.sessions || [];

      const sbRes = await axios.get("/booking/sessions/bookings");
      const loadedSessionBookings = sbRes.data.session_bookings || [];

      const membersRes = await axios.get("/membership/members");
      const loadedMembers = membersRes.data.members || [];

      const facRes = await axios.get("/facilities");
      const loadedFacilities = facRes.data.facilities || [];

      const coachesRes = await axios.get("/booking/coaches");
      const loadedCoaches = coachesRes.data.coaches || [];

      setBookings(loadedBookings);
      setSessions(loadedSessions);
      setSessionBookings(loadedSessionBookings);
      setMembers(loadedMembers);
      setFacilities(loadedFacilities);
      setCoaches(loadedCoaches);

      const mergedEvents = createCalendarEvents(
        loadedBookings,
        loadedSessions,
        loadedSessionBookings
      );
      setCalendarEvents(mergedEvents);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  
  // Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleOpenDeleteDialog = (type, id) => {
    setDeleteType(type);
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    try {
      if (deleteType === "booking") {
        await handleDeleteBooking(deleteItemId);
      } else if (deleteType === "session") {
        await axios.delete(`/booking/sessions/${deleteItemId}`);
        setSessions((prev) => prev.filter((s) => s.SessionID !== deleteItemId));
        setCalendarEvents((prev) =>
          prev.filter((ev) => ev.id !== `session-${deleteItemId}`)
        );
        showSnack("Session deleted!", "success");
      } else if (deleteType === "coach") {
        await handleDeleteCoach(deleteItemId);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleteDialogOpen(false);
  };

  // Confirmation
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [dialogType, setDialogType] = useState(""); // "booking" | "session" | "coach"
  

  // ------------------ Filtering ------------------
  const filteredBookings = bookings.filter((b) => {
    const branchMatches = Number(b.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(b).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  const filteredSessions = sessions.filter((s) => {
    const branchMatches = Number(s.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  const bigCalendarEvents = calendarEvents.map((event) => {
    if (event.start && event.end) {
      return { ...event, start: new Date(event.start), end: new Date(event.end) };
    } else if (event.date) {
      const d = new Date(event.date);
      return { ...event, start: d, end: d, allDay: true };
    }
    return event;
  });

  // ------------------ Calendar Handlers ------------------
  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    if (clickedDate < new Date()) return;
    setSelectedDate(clickedDate);
    setAddCalendarEventOpen(true);
  };

  const handleEventDrop = (info) => {
    const eventId = info.event.id;
    const newDateStr = info.event.startStr;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: newDateStr } : ev))
    );
  };

  const handleSaveCalendarEvent = (title, desc, start, end) => {
    const newEv = {
      id: Date.now().toString(),
      date: selectedDate?.toISOString().split("T")[0] || "2025-01-01",
      title: `${title} (${start} - ${end})`,
      description: desc,
    };
    setCalendarEvents((prev) => [...prev, newEv]);
    setAddCalendarEventOpen(false);
  };

  const handleEditEvent = (id) => {
    const found = calendarEvents.find((ev) => ev.id === id);
    if (found) {
      setSelectedEvent(found);
      setEditEventOpen(true);
    }
  };

  const handleDeleteEvent = (id) => {
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleSaveEditedEvent = () => {
    if (!selectedEvent) return;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? selectedEvent : ev))
    );
    setEditEventOpen(false);
  };

  // ------------------ Bookings CRUD ------------------
  const handleViewBooking = (bookingId) => {
    const found = bookings.find((b) => b.BookingID === bookingId);
    if (found) {
      setSelectedBooking(found);
      setViewBookingModal(true);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post(`/booking/${bookingId}/cancel`);
      setBookings((prev) => prev.filter((b) => b.BookingID !== bookingId));
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== `booking-${bookingId}`));
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    }
  };

  const handleEditBooking = (bookingId) => {
    const found = bookings.find((b) => b.BookingID === bookingId);
    if (found) {
      setSelectedBooking(found);
      setEditBookingModal(true);
    }
  };

  const handleCreateBooking = async () => {
    try {
      await axios.post("/booking", {
        MemberID: newBooking.MemberID,
        FacilityID: newBooking.FacilityID,
        BookingDate: newBooking.BookingDate,
        BookingTime: newBooking.BookingTime,
        Duration: newBooking.Duration || 1,
        Status: newBooking.Status || "Confirmed",
        PaymentMethod: newBooking.PaymentMethod || "Cash",
        Amount: Number(newBooking.PaymentAmount) || 0,
      });
      setAddBookingOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to create booking:", err);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      await axios.put(`/booking/${selectedBooking.BookingID}`, {
        MemberID: selectedBooking.MemberID,
        FacilityID: selectedBooking.FacilityID,
        BookingDate: selectedBooking.BookingDate,
        BookingTime: selectedBooking.BookingTime,
        Duration: selectedBooking.Duration,
        PaymentID: selectedBooking.PaymentID || null,
        Status: selectedBooking.Status,
      });
      setEditBookingModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  };

  // ------------------ Sessions CRUD ------------------
  const handleViewSession = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSelectedSession(found);
      setViewSessionModal(true);
    }
  };

  const handleCancelSession = async (sessionId) => {
    try {
      await axios.post(`/booking/sessions/${sessionId}/cancel`);
      setSessions((prev) => prev.filter((s) => s.SessionID !== sessionId));
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== `session-${sessionId}`));
    } catch (err) {
      console.error("Failed to cancel session:", err);
    }
  };

  const handleEditSession = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSelectedSession(found);
      setEditSessionModal(true);
    }
  };

  const handleCreateSession = async () => {
    try {
      const startFull = dayjs(`${newSession.StartDate} ${newSession.StartTime}`, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DDTHH:mm");
      const endFull = dayjs(`${newSession.EndDate} ${newSession.EndTime}`, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DDTHH:mm");
      await axios.post("/booking/sessions", {
        BranchID: newSession.BranchID,
        SessionName: newSession.SessionName,
        SessionType: newSession.SessionType,
        CoachID: newSession.CoachID,
        StartTime: startFull,
        EndTime: endFull,
        Capacity: Number(newSession.Capacity) || 10,
        Location: newSession.Location || "",
        Fee: Number(newSession.Fee) || 0,
      });
      setAddSessionOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    try {
      const startFull = selectedSession.StartDate && selectedSession.StartTime
        ? `${selectedSession.StartDate} ${selectedSession.StartTime}`
        : "";
      const endFull = selectedSession.EndDate && selectedSession.EndTime
        ? `${selectedSession.EndDate} ${selectedSession.EndTime}`
        : "";
      await axios.put(`/booking/sessions/${selectedSession.SessionID}`, {
        SessionName: selectedSession.SessionName,
        BranchID: selectedSession.BranchID,
        SessionType: selectedSession.SessionType,
        CoachID: selectedSession.CoachID,
        StartTime: startFull,
        EndTime: endFull,
        Capacity: selectedSession.Capacity,
        Location: selectedSession.Location,
        Fee: selectedSession.Fee,
        Status: selectedSession.Status,
      });
      setEditSessionModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to update session:", err);
    }
  };

  // ------------------ Book a Session ------------------
  const handleOpenBookSession = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSessionToBook(found);
      setSessionBookingMemberID("");
      setSessionBookingDate(dayjs().format("YYYY-MM-DD"));
      setSessionBookingStatus("Confirmed");
      setSessionBookingPaymentMethod("Cash");
      setSessionBookingPaymentAmount("");
      setBookSessionOpen(true);
    }
  };

  const handleBookSessionConfirm = async () => {
    if (!sessionToBook) return;
    try {
      await axios.post("/booking/sessions/book", {
        SessionID: sessionToBook.SessionID,
        MemberID: sessionBookingMemberID,
        BookingDate: sessionBookingDate,
        Status: sessionBookingStatus,
        PaymentMethod: sessionBookingPaymentMethod,
        Amount: Number(sessionBookingPaymentAmount) || 0,
      });
      setBookSessionOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to book the session:", err);
    }
  };

  // ------------------ Coaches CRUD ------------------
  const handleViewCoach = (coachId) => {
    const found = coaches.find((c) => c.CoachID === coachId);
    if (found) {
      setSelectedCoach(found);
      setViewCoachModal(true);
    }
  };

  const handleEditCoach = (coachId) => {
    const found = coaches.find((c) => c.CoachID === coachId);
    if (found) {
      setSelectedCoach(found);
      setEditCoachModal(true);
    }
  };

  const handleDeleteCoach = async (coachId) => {
    try {
      await axios.delete(`/booking/coaches/${coachId}`);
      setCoaches((prev) => prev.filter((c) => c.CoachID !== coachId));
    } catch (err) {
      console.error("Failed to delete coach:", err);
    }
  };

  const handleCreateCoach = async () => {
    try {
      await axios.post("/booking/coaches", {
        FullName: newCoach.FullName,
        Specialty: newCoach.Specialty,
        Availability: newCoach.Availability,
        ContactInfo: newCoach.ContactInfo,
      });
      setAddCoachOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to create coach:", err);
    }
  };

  const handleUpdateCoach = async () => {
    if (!selectedCoach) return;
    try {
      await axios.put(`/booking/coaches/${selectedCoach.CoachID}`, {
        FullName: selectedCoach.FullName,
        Specialty: selectedCoach.Specialty,
        Availability: selectedCoach.Availability,
        ContactInfo: selectedCoach.ContactInfo,
      });
      setEditCoachModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to update coach:", err);
    }
  };

  // ------------------ DataGrid Columns ------------------
  const bookingColumns = [
    { field: "BookingID", headerName: "ID", width: 80 },
    { field: "Branch", headerName: "Branch", width: 120 },
    { field: "MemberName", headerName: "Member Name", width: 150 },
    { field: "FacilityName", headerName: "Facility", width: 130 },
    { field: "BookingDate", headerName: "Date", width: 100 },
    { field: "BookingTime", headerName: "Time", width: 80 },
    { field: "Duration", headerName: "Hrs", width: 70 },
    { field: "Status", headerName: "Status", width: 100 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              onClick={() => handleViewBooking(params.row.BookingID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCancelBooking(params.row.BookingID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const sessionColumns = [
    { field: "SessionID", headerName: "ID", width: 80 },
    { field: "Branch", headerName: "Branch", width: 150 },
    { field: "SessionName", headerName: "Session Name", width: 180 },
    { field: "CoachName", headerName: "Coach", width: 130 },
    { field: "StartTime", headerName: "Start", width: 120 },
    { field: "EndTime", headerName: "End", width: 120 },
    { field: "Capacity", headerName: "Cap", width: 70 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 450,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              onClick={() => handleViewSession(params.row.SessionID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleEditSession(params.row.SessionID)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCancelSession(params.row.SessionID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Book Member">
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleOpenBookSession(params.row.SessionID)}
            >
              Book
            </Button>
          </Tooltip>
          <Tooltip title="Waitlist">
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleOpenWaitlist(params.row.SessionID)}
            >
              W.List
            </Button>
          </Tooltip>
          <Tooltip title="Mark Attendance">
            <Button
              variant="outlined"
              onClick={() => handleOpenAttendance(params.row.SessionID)}
            >
              Att
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const coachesColumns = [
    { field: "CoachID", headerName: "ID", width: 80 },
    { field: "FullName", headerName: "Name", width: 150 },
    { field: "Specialty", headerName: "Specialty", width: 130 },
    { field: "Availability", headerName: "Availability", width: 130 },
    { field: "ContactInfo", headerName: "Contact Info", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              onClick={() => handleViewCoach(params.row.CoachID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleEditCoach(params.row.CoachID)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteCoach(params.row.CoachID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const columns =
    activeTab === 0 ? bookingColumns : activeTab === 1 ? sessionColumns : coachesColumns;
  const rows =
    activeTab === 0 ? filteredBookings : activeTab === 1 ? filteredSessions : coaches;
  const getRowId = (row) =>
    activeTab === 0 ? row.BookingID : activeTab === 1 ? row.SessionID : row.CoachID;

  // ------------------ Export Handlers ------------------
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const csvHeadersBookings = [
    { label: "Booking ID", key: "BookingID" },
    { label: "Branch", key: "Branch" },
    { label: "Member Name", key: "MemberName" },
    { label: "Facility", key: "FacilityName" },
    { label: "Date", key: "BookingDate" },
    { label: "Time", key: "BookingTime" },
    { label: "Duration", key: "Duration" },
    { label: "Status", key: "Status" },
  ];
  const csvHeadersSessions = [
    { label: "Session ID", key: "SessionID" },
    { label: "Session Name", key: "SessionName" },
    { label: "Coach Name", key: "CoachName" },
    { label: "Start Time", key: "StartTime" },
    { label: "End Time", key: "EndTime" },
    { label: "Capacity", key: "Capacity" },
    { label: "Participants", key: "Participants" },
    { label: "Status", key: "Status" },
  ];

  const handleExportPDF = () => {
    handleExportClose();
    let title = "";
    let filename = "";
    let tableHeaders = [];
    let tableBody = [];

    if (activeTab === 0) {
      title = "Facility Bookings Report";
      filename = "BookingsReport.pdf";
      tableHeaders = [
        "Booking ID",
        "Branch",
        "Member Name",
        "Facility",
        "Date",
        "Time",
        "Duration",
        "Status",
      ];
      tableBody = filteredBookings.map((b) => [
        b.BookingID || "N/A",
        b.Branch || "—",
        b.MemberName || "N/A",
        b.FacilityName || "N/A",
        formatDate(b.BookingDate),
        b.BookingTime ? formatTime(b.BookingTime) : "—",
        b.Duration || "—",
        b.Status || "—",
      ]);
    } else {
      title = "Coach Sessions Report";
      filename = "SessionsReport.pdf";
      tableHeaders = [
        "Session ID",
        "Branch",
        "Session Name",
        "Coach Name",
        "Start",
        "End",
        "Capacity",
      ];
      tableBody = filteredSessions.map((s) => [
        s.SessionID || "N/A",
        s.Branch || "—",
        s.SessionName || "N/A",
        s.CoachName || "—",
        formatDateTime(s.StartTime),
        formatDateTime(s.EndTime),
        s.Capacity || "—",
      ]);
    }

    if (tableBody.length === 0) {
      alert("No records to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const coverPageImg = "/imgs/coverpage2.png";

    doc.addImage(coverPageImg, "PNG", 0, 0, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text(title, pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(14);
    doc.text("Generated on: " + new Date().toLocaleDateString(), pageWidth / 2, 130, {
      align: "center",
    });

    doc.autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: 100,
      theme: "striped",
      headStyles: {
        fillColor: "#050505",
        textColor: "#ffffff",
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        textColor: "#333333",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: "#f0f4f7",
      },
      styles: {
        overflow: "linebreak",
        cellPadding: 5,
        halign: "center",
        valign: "middle",
      },
      margin: { top: 50, left: 20, right: 20, bottom: 20 },
    });

    doc.save(filename);
  };

  // Calendar pagination
  const eventsPerPage = 6;
  const [eventPage, setEventPage] = useState(1);
  const indexOfLastEvent = eventPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = calendarEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const handleEventPageChange = (event, value) => setEventPage(value);

  // ------------------ Render ------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isSmall ? 2 : 4 }}>
        {/* CALENDAR & EVENT LIST */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ minHeight: 500 }}>
              <CardHeader title="Calendar" />
              <CardContent>
                <BigCalendarWrapper>
                  <DnDCalendar
                    localizer={localizer}
                    events={bigCalendarEvents}
                    defaultView="month"
                    style={{ height: 730, backgroundColor: "#fff" }}
                    selectable
                    defaultDate={new Date()}
                    onSelectSlot={(slotInfo) => {
                      if (new Date(slotInfo.start) < new Date()) return;
                      handleDateClick({ dateStr: slotInfo.start.toISOString() });
                    }}
                    onEventDrop={({ event, start, end }) =>
                      handleEventDrop({ event: { id: event.id, startStr: start.toISOString() } })
                    }
                  />
                </BigCalendarWrapper>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Drag events to reschedule; cannot schedule on past dates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ minHeight: 500 }}>
              <CardHeader title="Event List" />
              <CardContent sx={{ pt: 0 }}>
                <Divider sx={{ mb: 2 }} />
                {calendarEvents.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No events found.
                  </Typography>
                )}
                <List dense sx={{ maxHeight: 380, overflowY: "auto" }}>
                  {currentEvents.map((ev) => (
                    <Paper key={ev.id} variant="outlined" sx={{ mb: 1, p: 1, borderRadius: 2 }}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Edit Event">
                              <IconButton onClick={() => handleEditEvent(ev.id)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton sx={{ ml: 1 }} onClick={() => handleDeleteEvent(ev.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={ev.title}
                          primaryTypographyProps={{ fontWeight: 500 }}
                          secondary={`Date: ${ev.date}`}
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              </CardContent>
              {calendarEvents.length > eventsPerPage && (
                <CardActions>
                  <Pagination
                    count={Math.ceil(calendarEvents.length / eventsPerPage)}
                    page={eventPage}
                    onChange={handleEventPageChange}
                    size="small"
                    sx={{ mx: "auto" }}
                  />
                </CardActions>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* TABS / FILTERS / EXPORT */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4">Bookings & Sessions</Typography>
          <Tabs
            value={activeTab}
            onChange={(e, val) => {
              setActiveTab(val);
              setSearchTerm("");
            }}
            sx={{ mb: 2 }}
          >
            <Tab icon={<CalendarTodayIcon />} label="Bookings" />
            <Tab icon={<FitnessCenterIcon />} label="Sessions" />
            <Tab icon={<PersonIcon />} label="Coaches" />
          </Tabs>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: isSmall ? "column" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {/* Branch filter preset to logged-in staff branch and disabled */}
              <TextField
                select
                label="Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                size="small"
                sx={{ width: 150 }}
                disabled
              >
                <MenuItem value={staffBranch}>
                  {branches.find((b) => b.value === staffBranch)?.label || "Your Branch"}
                </MenuItem>
              </TextField>
              <TextField
                placeholder="Search"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 200 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={handleExportClick}
                startIcon={<FileDownloadIcon />}
                sx={{ textTransform: "none" }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchor}
                open={openExport}
                onClose={handleExportClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <MenuItem>
                  {activeTab === 0 ? (
                    <CSVLink
                      data={filteredBookings}
                      headers={csvHeadersBookings}
                      filename="Bookings.csv"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <Typography>Export CSV</Typography>
                    </CSVLink>
                  ) : (
                    <CSVLink
                      data={filteredSessions}
                      headers={csvHeadersSessions}
                      filename="Sessions.csv"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <Typography>Export CSV</Typography>
                    </CSVLink>
                  )}
                </MenuItem>
                <MenuItem onClick={handleExportPDF}>
                  <Typography>Export PDF</Typography>
                </MenuItem>
              </Menu>

              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddBookingOpen(true)}
                >
                  Add Booking
                </Button>
              )}
              {activeTab === 1 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddSessionOpen(true)}
                >
                  Add Session
                </Button>
              )}
              {activeTab === 2 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddCoachOpen(true)}
                >
                  Add Coach
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              getRowId={getRowId}
            />
          </Box>
        </Paper>

        {/* ADD BOOKING DIALOG */}
        <Dialog
          open={isAddBookingOpen}
          onClose={() => setAddBookingOpen(false)}
          fullWidth
          maxWidth="lg"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Add New Booking
                </Typography>
              </Box>
              <IconButton onClick={() => setAddBookingOpen(false)} sx={{ "&:hover": { color: "error.main" } }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Branch</InputLabel>
                  <Select
                    name="Branch"
                    value={selectedBranchForBooking}
                    onChange={(e) => setSelectedBranchForBooking(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">-- Select Branch --</MenuItem>
                    {branches.map((b) => (
                      <MenuItem key={b.value} value={String(b.value)}>
                        {b.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Facility</InputLabel>
                  <Select
                    name="FacilityID"
                    value={newBooking.FacilityID}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, FacilityID: e.target.value })
                    }
                    startAdornment={
                      <InputAdornment position="start">
                        <FitnessCenterIcon />
                      </InputAdornment>
                    }
                  >
                    {(selectedBranchForBooking
                      ? facilities.filter(
                          (f) => String(f.BranchID) === selectedBranchForBooking
                        )
                      : facilities
                    ).map((f) => (
                      <MenuItem key={f.FacilityID} value={f.FacilityID}>
                        {f.FacilityName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => option.FullName || ""}
                  value={
                    members.find((m) => m.MemberID === newBooking.MemberID) ||
                    null
                  }
                  onChange={(event, newValue) =>
                    setNewBooking({
                      ...newBooking,
                      MemberID: newValue ? newValue.MemberID : "",
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Member"
                      required
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Booking Date"
                  type="date"
                  fullWidth
                  required
                  value={newBooking.BookingDate || ""}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, BookingDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: dayjs().format("YYYY-MM-DD") }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Booking Time"
                  type="time"
                  fullWidth
                  required
                  value={newBooking.BookingTime || ""}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, BookingTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min:
                      newBooking.BookingDate === dayjs().format("YYYY-MM-DD")
                        ? dayjs().format("HH:mm")
                        : undefined,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration (hrs)"
                  type="number"
                  fullWidth
                  required
                  value={newBooking.Duration || ""}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, Duration: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HourglassBottomIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  fullWidth
                  required
                  value={newBooking.Status || ""}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, Status: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InfoIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Amount"
                  type="number"
                  fullWidth
                  required
                  value={newBooking.PaymentAmount || ""}
                  onChange={(e) =>
                    setNewBooking({
                      ...newBooking,
                      PaymentAmount: e.target.value,
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body1">₱</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setDialogType("booking");
                setOpenConfirmation(true);
              }}
              sx={{ textTransform: "none" }}
              disabled={!isSubmitEnabledBooking}
            >
              <SaveIcon sx={{ mr: 1 }} /> Save Booking
            </Button>
          </DialogActions>
        </Dialog>

        {/* ADD SESSION DIALOG */}
        <Dialog
          open={isAddSessionOpen}
          onClose={() => setAddSessionOpen(false)}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">
                <FitnessCenterIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                Add New Session
              </Typography>
              <IconButton
                onClick={() => setAddSessionOpen(false)}
                sx={{ color: "inherit", "&:hover": { color: "red" } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ p: 2 }}>
              <Divider sx={{ mb: 3 }} />
              <form onSubmit={(e) => e.preventDefault()}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Branch</InputLabel>
                      <Select
                        name="BranchID"
                        value={newSession.BranchID || ""}
                        onChange={(e) =>
                          setNewSession({ ...newSession, BranchID: e.target.value })
                        }
                        input={
                          <OutlinedInput
                            label="Branch"
                            startAdornment={
                              <InputAdornment position="start">
                                <BusinessIcon />
                              </InputAdornment>
                            }
                          />
                        }
                      >
                        {branches.map((b) => (
                          <MenuItem key={b.value} value={String(b.value)}>
                            {b.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Session Name"
                      name="SessionName"
                      fullWidth
                      required
                      value={newSession.SessionName}
                      onChange={(e) =>
                        setNewSession({ ...newSession, SessionName: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Session Type"
                      name="SessionType"
                      fullWidth
                      required
                      value={newSession.SessionType}
                      onChange={(e) =>
                        setNewSession({ ...newSession, SessionType: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CategoryIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={coaches}
                      getOptionLabel={(option) => option.FullName || ""}
                      value={coaches.find((c) => c.CoachID === newSession.CoachID) || null}
                      onChange={(event, newValue) =>
                        setNewSession({
                          ...newSession,
                          CoachID: newValue ? newValue.CoachID : "",
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Coach"
                          required
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DesktopDateTimePicker
                      label="Start Date & Time"
                      value={newSession.StartTime ? dayjs(newSession.StartTime) : null}
                      onChange={(newValue) => {
                        if (newValue && newValue.isValid()) {
                          setNewSession({
                            ...newSession,
                            StartTime: newValue.format("YYYY-MM-DD HH:mm:ss"),
                          });
                        }
                      }}
                      format="YYYY-MM-DD HH:mm"
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                      minDateTime={dayjs()}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DesktopDateTimePicker
                      label="End Date & Time"
                      value={newSession.EndTime ? dayjs(newSession.EndTime) : null}
                      onChange={(newValue) => {
                        if (newValue && newValue.isValid()) {
                          setNewSession({
                            ...newSession,
                            EndTime: newValue.format("YYYY-MM-DD HH:mm:ss"),
                          });
                        }
                      }}
                      format="YYYY-MM-DD HH:mm"
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                      minDateTime={newSession.StartTime ? dayjs(newSession.StartTime) : dayjs()}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Capacity"
                      name="Capacity"
                      type="number"
                      fullWidth
                      required
                      value={newSession.Capacity}
                      onChange={(e) =>
                        setNewSession({ ...newSession, Capacity: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupsIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Location"
                      name="Location"
                      fullWidth
                      required
                      value={newSession.Location}
                      onChange={(e) =>
                        setNewSession({ ...newSession, Location: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Fee"
                      name="Fee"
                      type="number"
                      fullWidth
                      value={newSession.Fee}
                      onChange={(e) =>
                        setNewSession({ ...newSession, Fee: e.target.value })
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaymentIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                <Box
                  sx={{
                    mt: 4,
                    display: "flex",
                    flexDirection: "row",
                    gap: 3,
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setDialogType("session");
                      setOpenConfirmation(true);
                    }}
                    disabled={!isSubmitEnabledSession}
                  >
                    <SaveIcon /> Save Session
                  </Button>
                </Box>
              </form>
            </Box>
          </DialogContent>
        </Dialog>

        {/* VIEW BOOKING DIALOG */}
        <Dialog
          open={viewBookingModal}
          onClose={() => setViewBookingModal(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Booking Details
                </Typography>
              </Box>
              <IconButton
                onClick={() => setViewBookingModal(false)}
                sx={{ "&:hover": { color: theme.palette.error.main } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {selectedBooking && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Booking ID"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.BookingID || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Branch"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.Branch || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Member Name"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.MemberName || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Facility Name"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.FacilityName || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={formatDate(selectedBooking.BookingDate || "—")}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={formatTime(selectedBooking.BookingTime || "—")}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Duration"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.Duration || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Status"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedBooking.Status || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        {/* EDIT BOOKING DIALOG */}
        <Dialog
          open={editBookingModal}
          onClose={() => setEditBookingModal(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Edit Booking
                </Typography>
              </Box>
              <IconButton
                onClick={() => setEditBookingModal(false)}
                sx={{ "&:hover": { color: theme.palette.error.main } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {selectedBooking && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => option.FullName || ""}
                  value={
                    members.find((m) => m.MemberID === selectedBooking.MemberID) || null
                  }
                  onChange={(e, val) => {
                    if (val) {
                      setSelectedBooking((prev) => ({
                        ...prev,
                        MemberID: val.MemberID,
                        MemberName: val.FullName,
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" size="small" fullWidth />
                  )}
                />
                <TextField
                  label="Facility Name"
                  size="small"
                  fullWidth
                  value={selectedBooking.FacilityName || ""}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, FacilityName: e.target.value })
                  }
                />
                <DesktopDateTimePicker
                  label="Booking Date & Time"
                  value={
                    selectedBooking.BookingDate && selectedBooking.BookingTime
                      ? dayjs(`${selectedBooking.BookingDate} ${selectedBooking.BookingTime}`)
                      : null
                  }
                  onChange={(newVal) => {
                    if (newVal && newVal.isValid()) {
                      const formatted = newVal.format("YYYY-MM-DD HH:mm:ss");
                      const [date, time] = formatted.split(" ");
                      setSelectedBooking({
                        ...selectedBooking,
                        BookingDate: date,
                        BookingTime: time,
                      });
                    }
                  }}
                  format="YYYY-MM-DD HH:mm"
                  slotProps={{
                    textField: (params) => (
                      <TextField {...params} size="small" fullWidth />
                    ),
                  }}
                />
                <TextField
                  label="Duration"
                  size="small"
                  fullWidth
                  value={selectedBooking.Duration || ""}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, Duration: e.target.value })
                  }
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={selectedBooking.Status || ""}
                    onChange={(e) =>
                      setSelectedBooking((prev) => ({ ...prev, Status: e.target.value }))
                    }
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateBooking}
              sx={{ textTransform: "none" }}
            >
              <SaveIcon sx={{ mr: 1 }} /> Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* EDIT SESSION DIALOG */}
        <Dialog
          open={editSessionModal}
          onClose={() => setEditSessionModal(false)}
          fullWidth
          maxWidth="md"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EditIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Edit Session
              </Typography>
            </Box>
            <IconButton
              onClick={() => setEditSessionModal(false)}
              sx={{
                color: "gray",
                "&:hover": { color: "red" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedSession && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Branch"
                    fullWidth
                    value={selectedSession.Branch || ""}
                    onChange={(e) =>
                      setSelectedSession({ ...selectedSession, Branch: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Session Name"
                    fullWidth
                    value={selectedSession.SessionName || ""}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        SessionName: e.target.value,
                      })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FitnessCenterIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Session Type"
                    fullWidth
                    value={selectedSession.SessionType || ""}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        SessionType: e.target.value,
                      })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={coaches}
                    getOptionLabel={(option) => option.FullName || ""}
                    value={
                      coaches.find((c) => c.CoachID === selectedSession.CoachID) ||
                      null
                    }
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setSelectedSession({
                          ...selectedSession,
                          CoachID: newValue.CoachID,
                          CoachName: newValue.FullName,
                        });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Coach"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <PersonIcon />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DesktopDateTimePicker
                    label="Start Date & Time"
                    value={
                      selectedSession.StartTime
                        ? dayjs(selectedSession.StartTime, "YYYY-MM-DD HH:mm:ss")
                        : null
                    }
                    onChange={(newVal) => {
                      if (newVal && newVal.isValid()) {
                        setSelectedSession({
                          ...selectedSession,
                          StartTime: newVal.format("YYYY-MM-DD HH:mm:ss"),
                        });
                      }
                    }}
                    format="YYYY-MM-DD HH:mm"
                    slotProps={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DesktopDateTimePicker
                    label="End Date & Time"
                    value={
                      selectedSession.EndTime
                        ? dayjs(selectedSession.EndTime, "YYYY-MM-DD HH:mm:ss")
                        : null
                    }
                    onChange={(newVal) => {
                      if (newVal && newVal.isValid()) {
                        setSelectedSession({
                          ...selectedSession,
                          EndTime: newVal.format("YYYY-MM-DD HH:mm:ss"),
                        });
                      }
                    }}
                    format="YYYY-MM-DD HH:mm"
                    slotProps={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TimelapseIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Capacity"
                    fullWidth
                    type="number"
                    value={selectedSession.Capacity || ""}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        Capacity: e.target.value,
                      })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    fullWidth
                    value={selectedSession.Location || ""}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        Location: e.target.value,
                      })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fee"
                    fullWidth
                    type="number"
                    value={selectedSession.Fee || ""}
                    onChange={(e) =>
                      setSelectedSession({ ...selectedSession, Fee: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MonetizationOnIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateSession}
              sx={{ textTransform: "none" }}
            >
              <SaveIcon sx={{ mr: 1 }} /> Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* VIEW SESSION DIALOG */}
        <Dialog
          open={viewSessionModal}
          onClose={() => setViewSessionModal(false)}
          fullWidth
          maxWidth="md"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <VisibilityIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  View Session
                </Typography>
              </Box>
              <IconButton
                onClick={() => setViewSessionModal(false)}
                sx={{
                  "&:hover": { color: "red" },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedSession && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Branch"
                    fullWidth
                    value={selectedSession.Branch || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Session Name"
                    fullWidth
                    value={selectedSession.SessionName || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FitnessCenterIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Session Type"
                    fullWidth
                    value={selectedSession.SessionType || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Coach"
                    fullWidth
                    value={selectedSession.CoachName || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date & Time"
                    fullWidth
                    value={formatDateTime(selectedSession.StartTime || "")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date & Time"
                    fullWidth
                    value={formatDateTime(selectedSession.EndTime || "")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Capacity"
                    fullWidth
                    value={selectedSession.Capacity || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Participants"
                    fullWidth
                    value={selectedSession.Participants || 0}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PeopleIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    fullWidth
                    value={selectedSession.Location || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fee"
                    fullWidth
                    value={`₱${selectedSession.Fee || "0.00"}`}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MonetizationOnIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        {/* BOOK SESSION DIALOG */}
        <Dialog
          open={isBookSessionOpen}
          onClose={() => setBookSessionOpen(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventAvailableIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Book a Session
                </Typography>
              </Box>
              <IconButton onClick={() => setBookSessionOpen(false)} sx={{ "&:hover": { color: "red" } }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            {sessionToBook && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Session:</strong> {sessionToBook.SessionName}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={members}
                    getOptionLabel={(option) => option.FullName || ""}
                    value={
                      members.find((m) => m.MemberID === sessionBookingMemberID) ||
                      null
                    }
                    onChange={(event, newValue) =>
                      setSessionBookingMemberID(newValue ? newValue.MemberID : "")
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Select Member" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DesktopDateTimePicker
                    label="Booking Date & Time"
                    value={sessionBookingDate ? dayjs(sessionBookingDate) : null}
                    disabled
                    format="MMMM D, YYYY h:mm A"
                    slotProps={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          value={
                            sessionBookingDate
                              ? formatDateTime(sessionBookingDate)
                              : "—"
                          }
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Booking Status</InputLabel>
                    <Select
                      value={sessionBookingStatus || ""}
                      onChange={(e) => setSessionBookingStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={sessionBookingPaymentMethod || ""}
                      onChange={(e) => setSessionBookingPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Payment Amount (₱)"
                    type="number"
                    fullWidth
                    value={sessionBookingPaymentAmount || ""}
                    onChange={(e) => setSessionBookingPaymentAmount(e.target.value)}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBookSessionConfirm}
              sx={{ textTransform: "none" }}
            >
              <EventIcon sx={{ mr: 1 }} /> Confirm Booking
            </Button>
          </DialogActions>
        </Dialog>

        {/* ADD COACH DIALOG */}
        <Dialog
          open={isAddCoachOpen}
          onClose={() => setAddCoachOpen(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Add New Coach
                </Typography>
              </Box>
              <IconButton onClick={() => setAddCoachOpen(false)} sx={{ "&:hover": { color: "error.main" } }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  fullWidth
                  required
                  value={newCoach.FullName}
                  onChange={(e) => setNewCoach({ ...newCoach, FullName: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Specialty"
                  fullWidth
                  required
                  value={newCoach.Specialty}
                  onChange={(e) => setNewCoach({ ...newCoach, Specialty: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FitnessCenterIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Availability"
                  fullWidth
                  required
                  value={newCoach.Availability}
                  onChange={(e) => setNewCoach({ ...newCoach, Availability: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Contact Info"
                  fullWidth
                  required
                  value={newCoach.ContactInfo}
                  onChange={(e) => setNewCoach({ ...newCoach, ContactInfo: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setDialogType("coach");
                setOpenConfirmation(true);
              }}
              sx={{ textTransform: "none" }}
              disabled={!isSubmitEnabledCoach}
            >
              <SaveIcon sx={{ mr: 1 }} /> Save Coach
            </Button>
          </DialogActions>
        </Dialog>

        {/* VIEW COACH DIALOG */}
        <Dialog
          open={viewCoachModal}
          onClose={() => setViewCoachModal(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SportsIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Coach Details
                </Typography>
              </Box>
              <IconButton
                onClick={() => setViewCoachModal(false)}
                sx={{ "&:hover": { color: theme.palette.error.main } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {selectedCoach && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Coach ID"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedCoach.CoachID || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedCoach.FullName || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Specialty"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedCoach.Specialty || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Availability"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedCoach.Availability || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Info"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedCoach.ContactInfo || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        {/* EDIT COACH DIALOG */}
        <Dialog
          open={editCoachModal}
          onClose={() => setEditCoachModal(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              boxShadow: 6,
              p: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ManageAccountsIcon sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Edit Coach
                </Typography>
              </Box>
              <IconButton
                onClick={() => setEditCoachModal(false)}
                sx={{ "&:hover": { color: theme.palette.error.main } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 4 }}>
            {selectedCoach && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    size="small"
                    value={selectedCoach.FullName || ""}
                    onChange={(e) =>
                      setSelectedCoach({ ...selectedCoach, FullName: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Specialty"
                    size="small"
                    value={selectedCoach.Specialty || ""}
                    onChange={(e) =>
                      setSelectedCoach({ ...selectedCoach, Specialty: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Availability"
                    size="small"
                    value={selectedCoach.Availability || ""}
                    onChange={(e) =>
                      setSelectedCoach({ ...selectedCoach, Availability: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Info"
                    size="small"
                    value={selectedCoach.ContactInfo || ""}
                    onChange={(e) =>
                      setSelectedCoach({ ...selectedCoach, ContactInfo: e.target.value })
                    }
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateCoach}
              sx={{ textTransform: "none" }}
            >
              <SaveIcon sx={{ mr: 1 }} /> Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* EDIT CALENDAR EVENT DIALOG (Optional) */}
        <Dialog
          open={isEditEventOpen}
          onClose={() => setEditEventOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Event</DialogTitle>
          <DialogContent dividers>
            {selectedEvent && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Title"
                  size="small"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, title: e.target.value })
                  }
                />
                <TextField
                  label="Date (YYYY-MM-DD)"
                  size="small"
                  value={selectedEvent.date}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, date: e.target.value })
                  }
                />
                <TextField
                  label="Description"
                  size="small"
                  value={selectedEvent.description || ""}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, description: e.target.value })
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditEventOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEditedEvent}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* DELETE CONFIRMATION DIALOG */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteForeverIcon sx={{ color: "error.main", fontSize: 28 }} />
              Confirm Deletion
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Typography>
              Are you sure you want to delete this record? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "gray" }}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* CONFIRMATION DIALOG FOR ADD */}
        <Dialog
          open={openConfirmation}
          onClose={() => setOpenConfirmation(false)}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
        >
          <DialogTitle sx={{ textAlign: "center", p: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <CheckCircleOutlineIcon sx={{ fontSize: 50, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Confirm Submission
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1">
              {dialogType === "booking"
                ? "Are you sure you want to add this facility booking?"
                : dialogType === "session"
                ? "Are you sure you want to add this coach session?"
                : dialogType === "coach"
                ? "Are you sure you want to add this coach?"
                : ""}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2, py: 2 }}>
            <Button
              onClick={() => setOpenConfirmation(false)}
              sx={{ textTransform: "none" }}
              style={{ color: "red" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: "none" }}
              onClick={async () => {
                if (dialogType === "booking") {
                  await handleCreateBooking();
                } else if (dialogType === "session") {
                  await handleCreateSession();
                } else if (dialogType === "coach") {
                  await handleCreateCoach();
                }
                setOpenConfirmation(false);
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR MESSAGES */}
        <Snackbar
          open={snackOpen}
          autoHideDuration={3000}
          onClose={() => setSnackOpen(false)}
        >
          <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
            {snackMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
