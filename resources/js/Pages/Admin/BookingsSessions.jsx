import React, { useState, useEffect } from "react";
import axios from "axios";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// --------------------- CREATE CALENDAR EVENTS ---------------------
// Now includes sessionBookings
function createCalendarEvents(bookings, sessions, sessionBookings) {
  const bookingEvents = bookings.map((b) => ({
    id: `booking-${b.BookingID}`,
    date: b.BookingDate,
    title: `Booking: ${b.MemberName} (${b.BookingTime})`,
    type: "booking",
  }));

  const sessionEvents = sessions.map((s) => ({
    id: `session-${s.SessionID}`,
    date: s.StartTime.split(" ")[0],
    title: `Session: ${s.SessionName} (${s.StartTime} - ${s.EndTime})`,
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

  // ------------------ States ------------------
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);

  // Branch Filter
  const [branches] = useState([
    { value: "1", label: "Contnental Branch 1" },
    { value: "2", label: "Contnental Branch 2" },
  ]);
  const [branchFilter, setBranchFilter] = useState("all");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Export Menu
  const [exportAnchor, setExportAnchor] = useState(null);
  const openExport = Boolean(exportAnchor);

  // Calendar Dialogs
  const [isAddCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Booking Dialogs
  const [isAddBookingOpen, setAddBookingOpen] = useState(false);
  const [viewBookingModal, setViewBookingModal] = useState(false);
  const [editBookingModal, setEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Session Dialogs
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

  // New Session fields (no payment creation here)
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

  // Book Session (Coaching) Dialog
  const [isBookSessionOpen, setBookSessionOpen] = useState(false);
  const [sessionToBook, setSessionToBook] = useState(null);
  const [sessionBookingMemberID, setSessionBookingMemberID] = useState("");
  const [sessionBookingDate, setSessionBookingDate] = useState("");
  const [sessionBookingStatus, setSessionBookingStatus] = useState("Confirmed");
  // Payment fields (for session booking)
  const [sessionBookingPaymentMethod, setSessionBookingPaymentMethod] = useState("Cash");
  const [sessionBookingPaymentAmount, setSessionBookingPaymentAmount] = useState("");

  // Waitlist
  const [isWaitlistOpen, setWaitlistOpen] = useState(false);
  const [sessionToWaitlist, setSessionToWaitlist] = useState(null);
  const [waitlistMemberID, setWaitlistMemberID] = useState("");
  const [waitlistDate, setWaitlistDate] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState("Pending");

  // Attendance
  const [isAttendanceOpen, setAttendanceOpen] = useState(false);
  const [sessionToMark, setSessionToMark] = useState(null);
  const [attendanceMemberID, setAttendanceMemberID] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");

  // Coach Dialogs
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

  // Calendar pagination
  const eventsPerPage = 6;
  const [eventPage, setEventPage] = useState(1);

  // ------------------ Effects ------------------
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // 1) Main bookings
      const bookingRes = await axios.get("/booking");
      const loadedBookings = bookingRes.data.bookings || [];

      // 2) Sessions
      const sessionRes = await axios.get("/booking/sessions");
      const loadedSessions = sessionRes.data.sessions || [];

      // 3) SessionBookings
      const sbRes = await axios.get("/booking/sessions/bookings");
      const loadedSessionBookings = sbRes.data.session_bookings || [];

      // 4) Members
      const membersRes = await axios.get("/membership/members");
      const loadedMembers = membersRes.data.members || [];

      // 5) Facilities
      const facRes = await axios.get("/facilities");
      const loadedFacilities = facRes.data.facilities || [];

      // 6) Coaches
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

  // ------------------ Filtering ------------------
  const filteredBookings = bookings.filter((b) => {
    const branchMatches =
      branchFilter === "all" || Number(b.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(b).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  const filteredSessions = sessions.filter((s) => {
    const branchMatches =
      branchFilter === "all" || Number(s.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  // ------------------ FullCalendar Handlers ------------------
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
    // Example: if your API supports it
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
      // Adjust if your backend supports PUT /booking/:id
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
      const startFull = dayjs(
        `${newSession.StartDate} ${newSession.StartTime}`,
        "YYYY-MM-DD HH:mm:ss"
      ).format("YYYY-MM-DDTHH:mm");
      const endFull = dayjs(
        `${newSession.EndDate} ${newSession.EndTime}`,
        "YYYY-MM-DD HH:mm:ss"
      ).format("YYYY-MM-DDTHH:mm");

      // No payment creation here
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
      const startFull =
        selectedSession.StartDate && selectedSession.StartTime
          ? `${selectedSession.StartDate} ${selectedSession.StartTime}`
          : "";
      const endFull =
        selectedSession.EndDate && selectedSession.EndTime
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

  // ------------------ Book a Session (with Payment) ------------------
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

  // ------------------ Waitlist ------------------
  const handleOpenWaitlist = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSessionToWaitlist(found);
      setWaitlistMemberID("");
      setWaitlistDate(dayjs().format("YYYY-MM-DD"));
      setWaitlistStatus("Pending");
      setWaitlistOpen(true);
    }
  };

  const handleWaitlistConfirm = async () => {
    try {
      await axios.post("/booking/sessions/waitlist", {
        SessionID: sessionToWaitlist.SessionID,
        MemberID: waitlistMemberID,
        WaitlistDate: waitlistDate,
        Status: waitlistStatus,
      });
      setWaitlistOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to add to waitlist:", err);
    }
  };

  // ------------------ Attendance ------------------
  const handleOpenAttendance = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSessionToMark(found);
      setAttendanceMemberID("");
      setAttendanceDate(dayjs().format("YYYY-MM-DD"));
      setAttendanceOpen(true);
    }
  };

  const handleAttendanceConfirm = async () => {
    if (!sessionToMark) return;
    try {
      await axios.post("/booking/sessions/attendance", {
        SessionID: sessionToMark.SessionID,
        MemberID: attendanceMemberID,
        AttendanceDate: attendanceDate,
      });
      setAttendanceOpen(false);
      fetchAllData();
    } catch (err) {
      console.error("Failed to mark attendance:", err);
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
    // Example if your API supports it
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
    activeTab === 0
      ? bookingColumns
      : activeTab === 1
      ? sessionColumns
      : coachesColumns;
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
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text("Bookings Export", 14, 10);
      const rowsForPDF = filteredBookings.map((b) => [
        b.BookingID,
        b.Branch,
        b.MemberName,
        b.FacilityName,
        b.BookingDate,
        b.BookingTime,
        b.Duration,
        b.Status,
      ]);
      doc.autoTable({
        head: [["ID", "Branch", "Member", "Facility", "Date", "Time", "Hrs", "Status"]],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save("Bookings.pdf");
    } else {
      doc.text("Sessions Export", 14, 10);
      const rowsForPDF = filteredSessions.map((s) => [
        s.SessionID,
        s.SessionName,
        s.CoachName,
        s.StartTime,
        s.EndTime,
        s.Capacity,
        s.Participants,
        s.Status,
      ]);
      doc.autoTable({
        head: [["ID", "SessionName", "Coach", "Start", "End", "Cap", "Joined", "Status"]],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save("Sessions.pdf");
    }
  };

  // ------------------ Pagination for Calendar Events ------------------
  const indexOfLastEvent = eventPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = calendarEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const handleEventPageChange = (event, value) => setEventPage(value);

  // ------------------ Render ------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isSmall ? 2 : 4 }}>
        {/* ========== TOP: CALENDAR + EVENT LIST ========== */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ minHeight: 500 }}>
              <CardHeader title="Calendar" />
              <CardContent>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  height="auto"
                  editable
                  validRange={{ start: new Date().toISOString().split("T")[0] }}
                  dateClick={handleDateClick}
                  eventDrop={handleEventDrop}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Drag events to reschedule; cannot schedule on past dates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* EVENT LIST */}
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
                    <Paper
                      key={ev.id}
                      variant="outlined"
                      sx={{ mb: 1, p: 1, borderRadius: 2 }}
                    >
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Edit Event">
                              <IconButton onClick={() => handleEditEvent(ev.id)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton
                                sx={{ ml: 1 }}
                                onClick={() => handleDeleteEvent(ev.id)}
                              >
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

        {/* ========== TABS / FILTERS / EXPORT / ADD BUTTONS ========== */}
        <Typography variant="h4" sx={{ mb: 1 }}>
          Bookings & Sessions
        </Typography>
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
              <TextField
                select
                label="Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              >
                <MenuItem value="all">All</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.value} value={String(b.value)}>
                    {b.label}
                  </MenuItem>
                ))}
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

          {/* DATAGRID */}
          <Box style={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              getRowId={getRowId}
            />
          </Box>
        </Paper>

        {/* =================== DIALOGS =================== */}

        {/* 1) Add Booking */}
        <Dialog
          open={isAddBookingOpen}
          onClose={() => setAddBookingOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Add New Booking</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={selectedBranchForBooking}
                  onChange={(e) => setSelectedBranchForBooking(e.target.value)}
                >
                  <MenuItem value="">--Select Branch--</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Member</InputLabel>
                <Select
                  label="Member"
                  value={newBooking.MemberID}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, MemberID: e.target.value })
                  }
                >
                  {members.map((m) => (
                    <MenuItem key={m.MemberID} value={m.MemberID}>
                      {m.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Facility</InputLabel>
                <Select
                  label="Facility"
                  value={newBooking.FacilityID}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, FacilityID: e.target.value })
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

              <DatePicker
                label="Booking Date"
                value={newBooking.BookingDate ? dayjs(newBooking.BookingDate) : null}
                onChange={(val) => {
                  const formatted = val ? val.format("YYYY-MM-DD") : "";
                  setNewBooking((prev) => ({ ...prev, BookingDate: formatted }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              <TimePicker
                label="Booking Time"
                value={
                  newBooking.BookingTime ? dayjs(newBooking.BookingTime, "HH:mm:ss") : null
                }
                onChange={(timeVal) => {
                  const formatted = timeVal ? timeVal.format("HH:mm:ss") : "";
                  setNewBooking((prev) => ({ ...prev, BookingTime: formatted }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              <TextField
                label="Duration (hrs)"
                size="small"
                value={newBooking.Duration}
                onChange={(e) => setNewBooking({ ...newBooking, Duration: e.target.value })}
              />
              <TextField
                label="Status"
                size="small"
                value={newBooking.Status}
                onChange={(e) => setNewBooking({ ...newBooking, Status: e.target.value })}
              />

              <TextField
                label="Payment Method"
                size="small"
                value={newBooking.PaymentMethod || ""}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, PaymentMethod: e.target.value })
                }
              />
              <TextField
                label="Payment Amount"
                size="small"
                type="number"
                value={newBooking.PaymentAmount || ""}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, PaymentAmount: e.target.value })
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddBookingOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateBooking}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 2) View Booking */}
        <Dialog
          open={viewBookingModal}
          onClose={() => setViewBookingModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Booking Details</DialogTitle>
          <DialogContent dividers>
            {selectedBooking && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Booking ID:</Typography>
                    <Typography>{selectedBooking.BookingID}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Branch:</Typography>
                    <Typography>{selectedBooking.Branch}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Member Name:</Typography>
                    <Typography>{selectedBooking.MemberName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Facility Name:</Typography>
                    <Typography>{selectedBooking.FacilityName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Date:</Typography>
                    <Typography>{selectedBooking.BookingDate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Time:</Typography>
                    <Typography>{selectedBooking.BookingTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Duration:</Typography>
                    <Typography>{selectedBooking.Duration}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Typography>{selectedBooking.Status}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setViewBookingModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 3) Edit Booking */}
        <Dialog
          open={editBookingModal}
          onClose={() => setEditBookingModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogContent dividers>
            {selectedBooking && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Member Name"
                  size="small"
                  value={selectedBooking.MemberName}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, MemberName: e.target.value })
                  }
                />
                <TextField
                  label="Facility Name"
                  size="small"
                  value={selectedBooking.FacilityName}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, FacilityName: e.target.value })
                  }
                />
                <DatePicker
                  label="Booking Date"
                  value={
                    selectedBooking.BookingDate ? dayjs(selectedBooking.BookingDate) : null
                  }
                  onChange={(newVal) => {
                    const str = newVal ? newVal.format("YYYY-MM-DD") : "";
                    setSelectedBooking({ ...selectedBooking, BookingDate: str });
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
                <TextField
                  label="Booking Time"
                  size="small"
                  value={selectedBooking.BookingTime}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, BookingTime: e.target.value })
                  }
                />
                <TextField
                  label="Duration"
                  size="small"
                  value={selectedBooking.Duration}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, Duration: e.target.value })
                  }
                />
                <TextField
                  label="Status"
                  size="small"
                  value={selectedBooking.Status}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, Status: e.target.value })
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditBookingModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateBooking}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 4) Add Session (NO Payment fields) */}
        <Dialog
          open={isAddSessionOpen}
          onClose={() => setAddSessionOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add New Session</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={newSession.BranchID || ""}
                  onChange={(e) => setNewSession({ ...newSession, BranchID: e.target.value })}
                >
                  {branches.map((b) => (
                    <MenuItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Session Name"
                size="small"
                value={newSession.SessionName}
                onChange={(e) => setNewSession({ ...newSession, SessionName: e.target.value })}
              />
              <TextField
                label="Session Type"
                size="small"
                value={newSession.SessionType}
                onChange={(e) => setNewSession({ ...newSession, SessionType: e.target.value })}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Coach</InputLabel>
                <Select
                  label="Coach"
                  value={newSession.CoachID || ""}
                  onChange={(e) => setNewSession({ ...newSession, CoachID: e.target.value })}
                >
                  {coaches.map((c) => (
                    <MenuItem key={c.CoachID} value={c.CoachID}>
                      {c.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={newSession.StartDate ? dayjs(newSession.StartDate) : null}
                onChange={(dayjsVal) => {
                  const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
                  setNewSession({ ...newSession, StartDate: dateStr });
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TimePicker
                label="Start Time"
                value={
                  newSession.StartTime ? dayjs(newSession.StartTime, "HH:mm:ss") : null
                }
                onChange={(timeVal) => {
                  const timeStr = timeVal ? timeVal.format("HH:mm:ss") : "";
                  setNewSession({ ...newSession, StartTime: timeStr });
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              <DatePicker
                label="End Date"
                value={newSession.EndDate ? dayjs(newSession.EndDate) : null}
                onChange={(dayjsVal) => {
                  const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
                  setNewSession({ ...newSession, EndDate: dateStr });
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TimePicker
                label="End Time"
                value={newSession.EndTime ? dayjs(newSession.EndTime, "HH:mm:ss") : null}
                onChange={(timeVal) => {
                  const timeStr = timeVal ? timeVal.format("HH:mm:ss") : "";
                  setNewSession({ ...newSession, EndTime: timeStr });
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              <TextField
                label="Capacity"
                type="number"
                size="small"
                value={newSession.Capacity}
                onChange={(e) => setNewSession({ ...newSession, Capacity: e.target.value })}
              />
              <TextField
                label="Location"
                size="small"
                value={newSession.Location}
                onChange={(e) => setNewSession({ ...newSession, Location: e.target.value })}
              />
              <TextField
                label="Fee"
                type="number"
                size="small"
                value={newSession.Fee}
                onChange={(e) => setNewSession({ ...newSession, Fee: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddSessionOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateSession}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 5) View Session */}
        <Dialog
          open={viewSessionModal}
          onClose={() => setViewSessionModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Session Details</DialogTitle>
          <DialogContent dividers>
            {selectedSession && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Session ID:</Typography>
                    <Typography>{selectedSession.SessionID}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Session Name:</Typography>
                    <Typography>{selectedSession.SessionName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Coach Name:</Typography>
                    <Typography>{selectedSession.CoachName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Start Time:</Typography>
                    <Typography>{selectedSession.StartTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">End Time:</Typography>
                    <Typography>{selectedSession.EndTime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Capacity:</Typography>
                    <Typography>{selectedSession.Capacity}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Participants:</Typography>
                    <Typography>{selectedSession.Participants}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Typography>{selectedSession.Status}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setViewSessionModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 6) Edit Session */}
        <Dialog
          open={editSessionModal}
          onClose={() => setEditSessionModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Session</DialogTitle>
          <DialogContent dividers>
            {selectedSession && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Branch"
                  size="small"
                  value={selectedSession.Branch || ""}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, Branch: e.target.value })
                  }
                />
                <TextField
                  label="Session Name"
                  size="small"
                  value={selectedSession.SessionName}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, SessionName: e.target.value })
                  }
                />
                <TextField
                  label="Session Type"
                  size="small"
                  value={selectedSession.SessionType}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, SessionType: e.target.value })
                  }
                />
                <TextField
                  label="Coach Name"
                  size="small"
                  value={selectedSession.CoachName}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, CoachName: e.target.value })
                  }
                />

                <DatePicker
                  label="Start Date"
                  value={
                    selectedSession.StartDate ? dayjs(selectedSession.StartDate) : null
                  }
                  onChange={(val) => {
                    const dateStr = val ? val.format("YYYY-MM-DD") : "";
                    setSelectedSession((prev) => ({ ...prev, StartDate: dateStr }));
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
                <TimePicker
                  label="Start Time"
                  value={
                    selectedSession.StartTime
                      ? dayjs(selectedSession.StartTime, "HH:mm:ss")
                      : null
                  }
                  onChange={(timeVal) => {
                    const timeStr = timeVal ? timeVal.format("HH:mm:ss") : "";
                    setSelectedSession((prev) => ({ ...prev, StartTime: timeStr }));
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />

                <DatePicker
                  label="End Date"
                  value={
                    selectedSession.EndDate ? dayjs(selectedSession.EndDate) : null
                  }
                  onChange={(val) => {
                    const dateStr = val ? val.format("YYYY-MM-DD") : "";
                    setSelectedSession((prev) => ({ ...prev, EndDate: dateStr }));
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
                <TimePicker
                  label="End Time"
                  value={
                    selectedSession.EndTime
                      ? dayjs(selectedSession.EndTime, "HH:mm:ss")
                      : null
                  }
                  onChange={(timeVal) => {
                    const timeStr = timeVal ? timeVal.format("HH:mm:ss") : "";
                    setSelectedSession((prev) => ({ ...prev, EndTime: timeStr }));
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />

                <TextField
                  label="Capacity"
                  size="small"
                  value={selectedSession.Capacity}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, Capacity: e.target.value })
                  }
                />
                <TextField
                  label="Location"
                  size="small"
                  value={selectedSession.Location}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, Location: e.target.value })
                  }
                />
                <TextField
                  label="Fee"
                  size="small"
                  value={selectedSession.Fee}
                  onChange={(e) => setSelectedSession({ ...selectedSession, Fee: e.target.value })}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSessionModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateSession}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 7) Book a Member into Session (with Payment) */}
        <Dialog
          open={isBookSessionOpen}
          onClose={() => setBookSessionOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Book Session for Member</DialogTitle>
          <DialogContent dividers>
            {sessionToBook && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography>
                  Session: <strong>{sessionToBook.SessionName}</strong>
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Member</InputLabel>
                  <Select
                    label="Member"
                    value={sessionBookingMemberID}
                    onChange={(e) => setSessionBookingMemberID(e.target.value)}
                  >
                    {members.map((m) => (
                      <MenuItem key={m.MemberID} value={m.MemberID}>
                        {m.FullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Booking Date"
                  value={sessionBookingDate ? dayjs(sessionBookingDate) : null}
                  onChange={(val) => {
                    const formatted = val ? val.format("YYYY-MM-DD") : "";
                    setSessionBookingDate(formatted);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />

                <TextField
                  label="Status"
                  size="small"
                  value={sessionBookingStatus}
                  onChange={(e) => setSessionBookingStatus(e.target.value)}
                />

                {/* Payment Fields */}
                <TextField
                  label="Payment Method"
                  size="small"
                  value={sessionBookingPaymentMethod}
                  onChange={(e) => setSessionBookingPaymentMethod(e.target.value)}
                />
                <TextField
                  label="Payment Amount"
                  size="small"
                  type="number"
                  value={sessionBookingPaymentAmount}
                  onChange={(e) => setSessionBookingPaymentAmount(e.target.value)}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookSessionOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleBookSessionConfirm}>
              Book
            </Button>
          </DialogActions>
        </Dialog>

        {/* 8) Waitlist Dialog */}
        <Dialog
          open={isWaitlistOpen}
          onClose={() => setWaitlistOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Waitlist Member</DialogTitle>
          <DialogContent dividers>
            {sessionToWaitlist && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography>
                  Session: <strong>{sessionToWaitlist.SessionName}</strong>
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Member</InputLabel>
                  <Select
                    label="Member"
                    value={waitlistMemberID}
                    onChange={(e) => setWaitlistMemberID(e.target.value)}
                  >
                    {members.map((m) => (
                      <MenuItem key={m.MemberID} value={m.MemberID}>
                        {m.FullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Waitlist Date"
                  value={waitlistDate ? dayjs(waitlistDate) : null}
                  onChange={(val) => {
                    const formatted = val ? val.format("YYYY-MM-DD") : "";
                    setWaitlistDate(formatted);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />

                <TextField
                  label="Status"
                  size="small"
                  value={waitlistStatus}
                  onChange={(e) => setWaitlistStatus(e.target.value)}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWaitlistOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleWaitlistConfirm}>
              Waitlist
            </Button>
          </DialogActions>
        </Dialog>

        {/* 9) Mark Attendance */}
        <Dialog
          open={isAttendanceOpen}
          onClose={() => setAttendanceOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogContent dividers>
            {sessionToMark && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography>
                  Session: <strong>{sessionToMark.SessionName}</strong>
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Member</InputLabel>
                  <Select
                    label="Member"
                    value={attendanceMemberID}
                    onChange={(e) => setAttendanceMemberID(e.target.value)}
                  >
                    {members.map((m) => (
                      <MenuItem key={m.MemberID} value={m.MemberID}>
                        {m.FullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DatePicker
                  label="Attendance Date"
                  value={attendanceDate ? dayjs(attendanceDate) : null}
                  onChange={(val) => {
                    const formatted = val ? val.format("YYYY-MM-DD") : "";
                    setAttendanceDate(formatted);
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAttendanceOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAttendanceConfirm}>
              Mark
            </Button>
          </DialogActions>
        </Dialog>

        {/* 10) Add Coach */}
        <Dialog
          open={isAddCoachOpen}
          onClose={() => setAddCoachOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add New Coach</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Full Name"
                size="small"
                value={newCoach.FullName}
                onChange={(e) => setNewCoach({ ...newCoach, FullName: e.target.value })}
              />
              <TextField
                label="Specialty"
                size="small"
                value={newCoach.Specialty}
                onChange={(e) => setNewCoach({ ...newCoach, Specialty: e.target.value })}
              />
              <TextField
                label="Availability"
                size="small"
                value={newCoach.Availability}
                onChange={(e) => setNewCoach({ ...newCoach, Availability: e.target.value })}
              />
              <TextField
                label="Contact Info"
                size="small"
                value={newCoach.ContactInfo}
                onChange={(e) => setNewCoach({ ...newCoach, ContactInfo: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddCoachOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateCoach}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 11) View Coach */}
        <Dialog
          open={viewCoachModal}
          onClose={() => setViewCoachModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Coach Details</DialogTitle>
          <DialogContent dividers>
            {selectedCoach && (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2">Coach ID:</Typography>
                <Typography sx={{ mb: 1 }}>{selectedCoach.CoachID}</Typography>

                <Typography variant="subtitle2">Full Name:</Typography>
                <Typography sx={{ mb: 1 }}>{selectedCoach.FullName}</Typography>

                <Typography variant="subtitle2">Specialty:</Typography>
                <Typography sx={{ mb: 1 }}>{selectedCoach.Specialty}</Typography>

                <Typography variant="subtitle2">Availability:</Typography>
                <Typography sx={{ mb: 1 }}>{selectedCoach.Availability}</Typography>

                <Typography variant="subtitle2">Contact:</Typography>
                <Typography sx={{ mb: 1 }}>{selectedCoach.ContactInfo}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setViewCoachModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 12) Edit Coach */}
        <Dialog
          open={editCoachModal}
          onClose={() => setEditCoachModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Coach</DialogTitle>
          <DialogContent dividers>
            {selectedCoach && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Full Name"
                  size="small"
                  value={selectedCoach.FullName}
                  onChange={(e) =>
                    setSelectedCoach({ ...selectedCoach, FullName: e.target.value })
                  }
                />
                <TextField
                  label="Specialty"
                  size="small"
                  value={selectedCoach.Specialty}
                  onChange={(e) =>
                    setSelectedCoach({ ...selectedCoach, Specialty: e.target.value })
                  }
                />
                <TextField
                  label="Availability"
                  size="small"
                  value={selectedCoach.Availability}
                  onChange={(e) =>
                    setSelectedCoach({ ...selectedCoach, Availability: e.target.value })
                  }
                />
                <TextField
                  label="Contact Info"
                  size="small"
                  value={selectedCoach.ContactInfo}
                  onChange={(e) =>
                    setSelectedCoach({ ...selectedCoach, ContactInfo: e.target.value })
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditCoachModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateCoach}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* OPTIONAL: Add Calendar Event */}
        <Dialog
          open={isAddCalendarEventOpen}
          onClose={() => setAddCalendarEventOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            New Event for {selectedDate?.toDateString() || "???"}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Title" size="small" />
              <TextField label="Description" size="small" />
              <TextField label="Start Time" size="small" />
              <TextField label="End Time" size="small" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddCalendarEventOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                handleSaveCalendarEvent(
                  "Title from user",
                  "Description from user",
                  "startTime",
                  "endTime"
                )
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Calendar Event (Optional) */}
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
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                />
                <TextField
                  label="Date (YYYY-MM-DD)"
                  size="small"
                  value={selectedEvent.date}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
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
      </Box>
    </LocalizationProvider>
  );
}
