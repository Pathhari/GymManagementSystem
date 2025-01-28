import React, { useState, useEffect } from "react";
import axios from "axios";

import {
  Box,
  Typography,
  Paper,
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
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
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

// Combine Bookings & Sessions for the calendar. Adjust fields as needed.
function createCalendarEvents(bookings, sessions) {
  const bookingEvents = bookings.map((b) => ({
    id: `booking-${b.BookingID}`,
    date: b.BookingDate, // "YYYY-MM-DD"
    title: `Booking: ${b.MemberName} (${b.BookingTime})`,
    type: "booking",
  }));
  const sessionEvents = sessions.map((s) => ({
    id: `session-${s.SessionID}`,
    date: s.StartTime.split(" ")[0],
    title: `Session: ${s.SessionName} (${s.StartTime} - ${s.EndTime})`,
    type: "session",
  }));
  return [...bookingEvents, ...sessionEvents];
}

export default function BookingsSessions() {
  // ------------------ States: Bookings, Sessions, Events ------------------
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // For demonstration, if you also want a dynamic list of branches:
  const [branches, setBranches] = useState([
    // Hardcode or fetch from server
    { value: 1, label: "Contnental Branch 1" },
    { value: 2, label: "Contnental Branch 2" },
  ]);

  // ------------------ New: Branch Filter State (top-level search) ------------------
  const [branchFilter, setBranchFilter] = useState("");

  // ------------------ Pagination State for Event List ------------------
  const eventsPerPage = 6;
  const [eventPage, setEventPage] = useState(1);
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [coaches, setCoaches] = useState([]);

  // ------------------ Load data from the server on mount ------------------
  useEffect(() => {
    fetchData();
    fetchMembers();
    fetchFacilities();
    fetchCoaches();
  }, []);

  const fetchData = async () => {
    try {
      // GET /booking => booking.index
      const bookingRes = await axios.get("/booking");
      const loadedBookings = bookingRes.data.bookings || [];

      // GET /booking/sessions => booking.sessions.index
      const sessionRes = await axios.get("/booking/sessions");
      const loadedSessions = sessionRes.data.sessions || [];

      setBookings(loadedBookings);
      setSessions(loadedSessions);
      setCalendarEvents(createCalendarEvents(loadedBookings, loadedSessions));
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get("/membership/members");
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    }
  };

  async function fetchFacilities() {
    try {
      const res = await axios.get("/booking/facilities");
      // Must match the shape => { facilities: [ ... ] }
      setFacilities(res.data.facilities || []);
    } catch (err) {
      console.error("Failed to load facilities:", err);
      setFacilities([]);
    }
  }

  async function fetchCoaches() {
    try {
      const res = await axios.get("/booking/coaches");
      // { coaches: [ { CoachID, FullName, ... }, ... ] }
      setCoaches(res.data.coaches || []);
    } catch (err) {
      console.error("Failed to load coaches:", err);
      setCoaches([]);
    }
  }

  // ------------------ Tabs & Search ------------------
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleTabChange = (e, newVal) => {
    setActiveTab(newVal);
    setSearchTerm("");
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ------------------ Filter the table data ------------------
  // We'll assume each booking has a "Branch" field from the server.
  const filteredBookings = bookings.filter((b) => {
    const branchMatches = branchFilter ? b.Branch === branchFilter : true;
    const searchMatches = Object.values(b).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });
  // Similarly for sessions if you store a "Branch" or "BranchID" field
  const filteredSessions = sessions.filter((s) => {
    const branchMatches = branchFilter ? s.Branch === branchFilter : true;
    const searchMatches = Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  // ------------------ FullCalendar Config ------------------
  const fullCalendarEvents = calendarEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
  }));

  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    if (clickedDate < new Date()) {
      console.log("Cannot schedule on past date.");
      return;
    }
    setSelectedDate(clickedDate);
    setAddCalendarEventOpen(true);
  };

  const handleEventDrop = (info) => {
    const eventId = info.event.id;
    const newDateStr = info.event.startStr;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: newDateStr } : ev))
    );
    // If you want to persist date changes to DB, do that here.
  };

  // For creating a brand-new event from the calendar (Optional UI)
  const [isAddCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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

  // Editing/deleting from the event list (optional)
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  // ------------------ Booking Table Actions ------------------
  const [viewBookingModal, setViewBookingModal] = useState(false);
  const [editBookingModal, setEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleViewBooking = (bookingId) => {
    const found = bookings.find((b) => b.BookingID === bookingId);
    if (found) {
      setSelectedBooking(found);
      setViewBookingModal(true);
    }
  };
  const handleEditBooking = (bookingId) => {
    const found = bookings.find((b) => b.BookingID === bookingId);
    if (found) {
      setSelectedBooking(found);
      setEditBookingModal(true);
    }
  };
  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post(`/booking/${bookingId}/cancel`);
      setBookings((prev) => prev.filter((b) => b.BookingID !== bookingId));
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== bookingId));
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    }
  };

  // ------------------ Session Table Actions ------------------
  const [viewSessionModal, setViewSessionModal] = useState(false);
  const [editSessionModal, setEditSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleViewSession = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSelectedSession(found);
      setViewSessionModal(true);
    }
  };
  const handleEditSession = (sessionId) => {
    const found = sessions.find((s) => s.SessionID === sessionId);
    if (found) {
      setSelectedSession(found);
      setEditSessionModal(true);
    }
  };
  const handleCancelSession = async (sessionId) => {
    try {
      await axios.post(`/booking/sessions/${sessionId}/cancel`);
      setSessions((prev) => prev.filter((s) => s.SessionID !== sessionId));
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== sessionId));
    } catch (err) {
      console.error("Failed to cancel session:", err);
    }
  };

  // ------------------ Column Definitions for DataGrid ------------------
  const bookingColumns = [
    { field: "BookingID", headerName: "Booking ID", width: 100 },
    { field: "Branch", headerName: "Branch", width: 150 },
    { field: "MemberName", headerName: "Member Name", width: 150 },
    { field: "FacilityName", headerName: "Facility", width: 130 },
    { field: "BookingDate", headerName: "Date", width: 100 },
    { field: "BookingTime", headerName: "Time", width: 100 },
    { field: "Duration", headerName: "Duration", width: 80 },
    { field: "Status", headerName: "Status", width: 90 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 210,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleViewBooking(params.row.BookingID)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleCancelBooking(params.row.BookingID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const sessionColumns = [
    { field: "SessionID", headerName: "Session ID", width: 120 },
    { field: "Branch", headerName: "Branch", width: 150 },
    { field: "SessionName", headerName: "Session Name", width: 150 },
    { field: "CoachName", headerName: "Coach Name", width: 140 },
    { field: "StartTime", headerName: "Start Time", width: 150 },
    { field: "EndTime", headerName: "End Time", width: 150 },
    { field: "Capacity", headerName: "Capacity", width: 90 },
    { field: "Participants", headerName: "Participants", width: 110 },
    { field: "Status", headerName: "Status", width: 110 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 230,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleViewSession(params.row.SessionID)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleEditSession(params.row.SessionID)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleCancelSession(params.row.SessionID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const columns = activeTab === 0 ? bookingColumns : sessionColumns;
  const rows = activeTab === 0 ? filteredBookings : filteredSessions;
  const getRowId = (row) => (activeTab === 0 ? row.BookingID : row.SessionID);

  // ------------------ Export Logic (CSV / PDF) ------------------
  const [exportAnchor, setExportAnchor] = useState(null);
  const openExport = Boolean(exportAnchor);
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
      // Bookings PDF
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
        head: [["ID", "Branch", "Member", "Facility", "Date", "Time", "Dur", "Status"]],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save("Bookings.pdf");
    } else {
      // Sessions PDF
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
        head: [
          ["ID", "SessionName", "Coach", "Start", "End", "Cap", "Participants", "Status"],
        ],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save("Sessions.pdf");
    }
  };

  // ------------------ Add Booking / Session Dialogs ------------------
  const [isAddBookingOpen, setAddBookingOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    MemberID: "",
    FacilityID: "",
    BookingDate: "",
    BookingTime: "",
    Duration: "",
    PaymentID: null,
    Status: "",
    Branch: "",
  });

  // Because user must pick a branch first => then we filter facilities for that branch
  const [selectedBranchForBooking, setSelectedBranchForBooking] = useState("");

  // Filter facilities by selectedBranchForBooking
  const facilitiesForBranch = selectedBranchForBooking
  ? facilities.filter((f) => f.BranchID === selectedBranchForBooking)
  : facilities;

  const handleCreateBooking = async () => {
    try {
      await axios.post("/booking", {
        Branch: selectedBranchForBooking, // if your DB has a Branch column
        MemberID: newBooking.MemberID,
        FacilityID: newBooking.FacilityID,
        BookingDate: newBooking.BookingDate,
        BookingTime: newBooking.BookingTime,
        Duration: newBooking.Duration,
        PaymentID: newBooking.PaymentID,
        Status: newBooking.Status,
      });
      setAddBookingOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create booking:", err);
    }
  };

  const [isAddSessionOpen, setAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    Branch: "",
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

  const handleCreateSession = async () => {
    try {
      const startFull = dayjs(`${newSession.StartDate} ${newSession.StartTime}`, 'YYYY-MM-DD HH:mm:ss')
      .format('YYYY-MM-DDTHH:mm');    
      const endFull = dayjs(`${newSession.EndDate} ${newSession.EndTime}`, 'YYYY-MM-DD HH:mm:ss')
      .format('YYYY-MM-DDTHH:mm');
      // Use newSession.Branch here, not newSession.BranchID
      await axios.post("/booking/sessions", {
        BranchID: newSession.BranchID,        
        SessionName: newSession.SessionName,
        SessionType: newSession.SessionType,
        CoachID: newSession.CoachID,
        StartTime: startFull, // e.g. "YYYY-MM-DD HH:mm:ss"
        EndTime: endFull,        
        Capacity: newSession.Capacity,
        Location: newSession.Location,
        Fee: newSession.Fee,
      });
      setAddSessionOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  // ------------------ Update Booking / Session Dialogs ------------------
  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      await axios.put(`/booking/${selectedBooking.BookingID}`, {
        Branch: selectedBooking.Branch,
        MemberID: selectedBooking.MemberID,
        FacilityID: selectedBooking.FacilityID,
        BookingDate: selectedBooking.BookingDate,
        BookingTime: selectedBooking.BookingTime,
        Duration: selectedBooking.Duration,
        PaymentID: selectedBooking.PaymentID || null,
        Status: selectedBooking.Status,
      });
      setEditBookingModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update booking:", err);
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
        Branch: selectedSession.BranchID,
        SessionName: selectedSession.SessionName,
        SessionType: selectedSession.SessionType,
        CoachID: selectedSession.CoachID,
        StartTime: startFull,
        EndTime: endFull,
        Capacity: selectedSession.Capacity,
        Location: selectedSession.Location,
        Fee: selectedSession.Fee,
      });
      setEditSessionModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update session:", err);
    }
  };

  // ------------------ Pagination for Event List ------------------
  const indexOfLastEvent = eventPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = calendarEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const handleEventPageChange = (event, value) => {
    setEventPage(value);
  };

  // ------------------ Render ------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 4 }}>
        {/* Top row: Calendar + Event List */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, minHeight: 550 }}>
              <Typography variant="h6" gutterBottom>
                Calendar
              </Typography>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={fullCalendarEvents}
                height="auto"
                editable
                validRange={{
                  start: new Date().toISOString().split("T")[0],
                }}
                dateClick={handleDateClick}
                eventDrop={handleEventDrop}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Drag events to reschedule; cannot schedule on past dates.
              </Typography>
            </Paper>
          </Grid>

          {/* Event List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, minHeight: 550 }}>
              <Typography variant="h6" gutterBottom>
                Event List
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense sx={{ maxHeight: 500, overflowY: "auto" }}>
                {calendarEvents.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No events for this month."
                      primaryTypographyProps={{ color: "text.secondary" }}
                    />
                  </ListItem>
                ) : (
                  currentEvents.map((ev) => (
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
                                onClick={() => handleDeleteEvent(ev.id)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        sx={{ py: 0 }}
                      >
                        <ListItemText
                          primary={ev.title}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                          }}
                          secondary={`Date: ${ev.date}`}
                        />
                      </ListItem>
                    </Paper>
                  ))
                )}
              </List>
              {calendarEvents.length > eventsPerPage && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Pagination
                    count={Math.ceil(calendarEvents.length / eventsPerPage)}
                    page={eventPage}
                    onChange={handleEventPageChange}
                    size="small"
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Bookings & Sessions
          </Typography>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<CalendarTodayIcon />} label="Bookings" />
            <Tab icon={<FitnessCenterIcon />} label="Sessions" />
          </Tabs>
        </Box>
        &nbsp;

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* Branch Filter Dropdown */}
              <TextField
                select
                label="Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              >
                <MenuItem value="">All</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    {b.label}
                  </MenuItem>
                ))}
              </TextField>
              {/* Search Box */}
              <TextField
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ width: "100%", maxWidth: 300 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography>Export PDF</Typography>
                  </Box>
                </MenuItem>
              </Menu>

              {activeTab === 0 ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddBookingOpen(true)}
                >
                  Add Booking
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddSessionOpen(true)}
                >
                  Add Session
                </Button>
              )}
            </Box>
          </Box>

          <div style={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              getRowId={getRowId}
            />
          </div>
        </Paper>

        {/* ==================== DIALOGS ==================== */}

        {/* 1) Add Booking Dialog */}
        <Dialog
          open={isAddBookingOpen}
          onClose={() => setAddBookingOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Branch (for the new booking) */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={selectedBranchForBooking}
                  onChange={(e) => {
                    setSelectedBranchForBooking(e.target.value);
                  }}
                >
                  <MenuItem value=""> --Select Branch-- </MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.value} value={b.value}>
                      {b.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Member Select */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Member</InputLabel>
                <Select
                  label="Member"
                  value={newBooking.MemberID || ""}
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

              {/* Facility Select (filtered by branch) */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Facility</InputLabel>
                <Select
                  label="Facility"
                  value={newBooking.FacilityID || ""}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, FacilityID: e.target.value })
                  }
                >
                  {facilitiesForBranch.map((f) => (
                    <MenuItem key={f.FacilityID} value={f.FacilityID}>
                      {f.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Picker */}
              <DatePicker
                label="Booking Date"
                value={
                  newBooking.BookingDate ? dayjs(newBooking.BookingDate) : null
                }
                onChange={(dayjsValue) => {
                  const formattedString = dayjsValue
                    ? dayjsValue.format("YYYY-MM-DD")
                    : "";
                  setNewBooking((prev) => ({
                    ...prev,
                    BookingDate: formattedString,
                  }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              {/* Time Picker */}
              <TimePicker
                label="Booking Time"
                value={
                  newBooking.BookingTime
                    ? dayjs(newBooking.BookingTime, "HH:mm:ss")
                    : null
                }
                onChange={(timeValue) => {
                  const formatted = timeValue
                    ? timeValue.format("HH:mm:ss")
                    : "";
                  setNewBooking((prev) => ({
                    ...prev,
                    BookingTime: formatted,
                  }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />

              <TextField
                label="Duration (hrs)"
                size="small"
                value={newBooking.Duration}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, Duration: e.target.value })
                }
              />
              <TextField
                label="Payment ID (optional)"
                size="small"
                value={newBooking.PaymentID || ""}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, PaymentID: e.target.value })
                }
              />
              <TextField
                label="Status"
                size="small"
                value={newBooking.Status}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, Status: e.target.value })
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

        {/* 2) Add Session Dialog */}
        <Dialog
  open={isAddSessionOpen}
  onClose={() => setAddSessionOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Add New Session</DialogTitle>
  <DialogContent dividers>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Branch Selector */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Branch</InputLabel>
        <Select
          label="Branch"
          value={newSession.BranchID || ""}
          onChange={(e) =>
            setNewSession({ ...newSession, BranchID: e.target.value })
          }
        >
          {branches.map((b) => (
            <MenuItem key={b.value} value={b.value}>
              {b.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Session Name"
        size="small"
        value={newSession.SessionName}
        onChange={(e) =>
          setNewSession({ ...newSession, SessionName: e.target.value })
        }
      />
      <TextField
        label="Session Type"
        size="small"
        value={newSession.SessionType}
        onChange={(e) =>
          setNewSession({ ...newSession, SessionType: e.target.value })
        }
      />

      {/* Coach dropdown, if any */}
      <FormControl fullWidth margin="normal" size="small">
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

      {/* Start Date */}
      <DatePicker
        label="Start Date"
        value={newSession.StartDate ? dayjs(newSession.StartDate) : null}
        onChange={(dayjsVal) => {
          const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
          setNewSession({ ...newSession, StartDate: dateStr });
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
      />

      {/* Start Time */}
      <TimePicker
        label="Start Time"
        value={newSession.StartTime ? dayjs(newSession.StartTime, "HH:mm:ss") : null}
        onChange={(timeVal) => {
          const timeStr = timeVal ? timeVal.format("HH:mm:ss") : "";
          setNewSession({ ...newSession, StartTime: timeStr });
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
      />

      {/* End Date */}
      <DatePicker
        label="End Date"
        value={newSession.EndDate ? dayjs(newSession.EndDate) : null}
        onChange={(dayjsVal) => {
          const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
          setNewSession({ ...newSession, EndDate: dateStr });
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
      />

      {/* End Time */}
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
        onChange={(e) =>
          setNewSession({ ...newSession, Capacity: e.target.value })
        }
      />
      <TextField
        label="Location"
        size="small"
        value={newSession.Location}
        onChange={(e) =>
          setNewSession({ ...newSession, Location: e.target.value })
        }
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


        {/* 3) Add Event from Calendar (Optional) */}
        <Dialog
          open={isAddCalendarEventOpen}
          onClose={() => setAddCalendarEventOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            New Schedule for {selectedDate?.toDateString() || "???"}
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
                  "startTime from user",
                  "endTime from user"
                )
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* 4) Edit Event from List (Optional) */}
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
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value,
                    })
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

        {/* 5) View Booking */}
        <Dialog
          open={viewBookingModal}
          onClose={() => setViewBookingModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" color="primary">
              Booking Details
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {selectedBooking && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}></Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Booking ID:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.BookingID}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Branch:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.Branch}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Member Name:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.MemberName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Facility Name:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.FacilityName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Date:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.BookingDate}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Time:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.BookingTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Duration:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.Duration}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Status:
                    </Typography>
                    <Typography variant="body1">
                      {selectedBooking.Status}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setViewBookingModal(false)}
              variant="contained"
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 6) Edit Booking */}
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
                  label="Branch"
                  size="small"
                  value={selectedBooking.Branch}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      Branch: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Member Name"
                  size="small"
                  value={selectedBooking.MemberName}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      MemberName: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Facility Name"
                  size="small"
                  value={selectedBooking.FacilityName}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      FacilityName: e.target.value,
                    })
                  }
                />
                <DatePicker
                  label="Booking Date"
                  value={
                    selectedBooking.BookingDate
                      ? dayjs(selectedBooking.BookingDate)
                      : null
                  }
                  onChange={(newVal) => {
                    const str = newVal ? newVal.format("YYYY-MM-DD") : "";
                    setSelectedBooking({
                      ...selectedBooking,
                      BookingDate: str,
                    });
                  }}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
                <TextField
                  label="Booking Time"
                  size="small"
                  value={selectedBooking.BookingTime}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      BookingTime: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Duration"
                  size="small"
                  value={selectedBooking.Duration}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      Duration: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Status"
                  size="small"
                  value={selectedBooking.Status}
                  onChange={(e) =>
                    setSelectedBooking({
                      ...selectedBooking,
                      Status: e.target.value,
                    })
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

        {/* 7) View Session */}
        <Dialog
          open={viewSessionModal}
          onClose={() => setViewSessionModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" color="primary">
              Session Details
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {selectedSession && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}></Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Session ID:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.SessionID}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Session Name:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.SessionName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Coach Name:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.CoachName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Start Time:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.StartTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      End Time:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.EndTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Capacity:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.Capacity}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Participants:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.Participants}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Status:
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.Status}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setViewSessionModal(false)}
              variant="contained"
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 8) Edit Session */}
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
                    setSelectedSession({
                      ...selectedSession,
                      SessionName: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Session Type"
                  size="small"
                  value={selectedSession.SessionType}
                  onChange={(e) =>
                    setSelectedSession({
                      ...selectedSession,
                      SessionType: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Coach Name"
                  size="small"
                  value={selectedSession.CoachName}
                  onChange={(e) =>
                    setSelectedSession({
                      ...selectedSession,
                      CoachName: e.target.value,
                    })
                  }
                />
{/* Start Date */}
<DatePicker
      label="Start Date"
      value={
        selectedSession.StartDate
          ? dayjs(selectedSession.StartDate) 
          : null
      }
      onChange={(dayjsVal) => {
        const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
        setSelectedSession((prev) => ({ ...prev, StartDate: dateStr }));
      }}
      renderInput={(params) => <TextField {...params} size="small" />}
    />

    {/* Start Time */}
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

    {/* End Date */}
    <DatePicker
      label="End Date"
      value={
        selectedSession.EndDate
          ? dayjs(selectedSession.EndDate)
          : null
      }
      onChange={(dayjsVal) => {
        const dateStr = dayjsVal ? dayjsVal.format("YYYY-MM-DD") : "";
        setSelectedSession((prev) => ({ ...prev, EndDate: dateStr }));
      }}
      renderInput={(params) => <TextField {...params} size="small" />}
    />

    {/* End Time */}
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
                    setSelectedSession({
                      ...selectedSession,
                      Capacity: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Location"
                  size="small"
                  value={selectedSession.Location}
                  onChange={(e) =>
                    setSelectedSession({
                      ...selectedSession,
                      Location: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Fee"
                  size="small"
                  value={selectedSession.Fee}
                  onChange={(e) =>
                    setSelectedSession({
                      ...selectedSession,
                      Fee: e.target.value,
                    })
                  }
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
      </Box>
    </LocalizationProvider>
  );
}
