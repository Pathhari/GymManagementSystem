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

import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

/** Combine Bookings & Sessions for the calendar. Adjust fields as needed. */
function createCalendarEvents(bookings, sessions) {
  const bookingEvents = bookings.map((b) => ({
    id: b.BookingID,
    date: b.BookingDate, // "YYYY-MM-DD"
    title: `Booking: ${b.MemberName} (${b.BookingTime})`,
    type: "booking",
  }));
  const sessionEvents = sessions.map((s) => ({
    id: s.SessionID,
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

  // ------------------ Load data from the server on mount ------------------
  useEffect(() => {
    fetchData();
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

  // Filter the table data
  const filteredBookings = bookings.filter((b) =>
    Object.values(b).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const filteredSessions = sessions.filter((s) =>
    Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
      // POST /booking/{id}/cancel => booking.cancel
      await axios.post(`/booking/${bookingId}/cancel`);
      // Remove from local state
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
      // POST /booking/sessions/{id}/cancel => booking.sessions.cancel
      await axios.post(`/booking/sessions/${sessionId}/cancel`);
      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.SessionID !== sessionId));
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== sessionId));
    } catch (err) {
      console.error("Failed to cancel session:", err);
    }
  };

  // ------------------ Column Definitions for DataGrid ------------------
  const bookingColumns = [
    { field: "BookingID", headerName: "Booking ID", width: 120 },
    { field: "MemberName", headerName: "Member Name", width: 150 },
    { field: "FacilityName", headerName: "Facility", width: 130 },
    { field: "BookingDate", headerName: "Date", width: 120 },
    { field: "BookingTime", headerName: "Time", width: 140 },
    { field: "Duration", headerName: "Duration", width: 100 },
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
              onClick={() => handleViewBooking(params.row.BookingID)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 40, padding: "6px" }}
              onClick={() => handleEditBooking(params.row.BookingID)}
            >
              <EditIcon />
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
        b.MemberName,
        b.FacilityName,
        b.BookingDate,
        b.BookingTime,
        b.Duration,
        b.Status,
      ]);
      doc.autoTable({
        head: [["ID", "Member", "Facility", "Date", "Time", "Dur", "Status"]],
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
          ["ID", "Name", "Coach", "Start", "End", "Cap", "Participants", "Status"],
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
  });
  const handleCreateBooking = async () => {
    try {
      await axios.post("/booking", {
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
    SessionName: "",
    SessionType: "",
    CoachID: "",
    StartTime: "",
    EndTime: "",
    Capacity: "",
    Location: "",
    Fee: "",
  });
  const handleCreateSession = async () => {
    try {
      await axios.post("/booking/sessions", {
        SessionName: newSession.SessionName,
        SessionType: newSession.SessionType,
        CoachID: newSession.CoachID,
        StartTime: newSession.StartTime,
        EndTime: newSession.EndTime,
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
      // PUT /booking/sessions/{id}
      await axios.put(`/booking/sessions/${selectedSession.SessionID}`, {
        SessionName: selectedSession.SessionName,
        SessionType: selectedSession.SessionType,
        CoachID: selectedSession.CoachID,
        StartTime: selectedSession.StartTime,
        EndTime: selectedSession.EndTime,
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

  // ------------------ Render ------------------
  return (
    <Box sx={{ p: 4 }}>
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
                calendarEvents.map((ev) => (
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
          {/* Search Box */}
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 300 }}
          />
          {/* Export + Add Buttons */}
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

            {/* Add Booking / Add Session */}
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
            <TextField
              label="Member ID"
              size="small"
              value={newBooking.MemberID}
              onChange={(e) =>
                setNewBooking({ ...newBooking, MemberID: e.target.value })
              }
            />
            <TextField
              label="Facility ID"
              size="small"
              value={newBooking.FacilityID}
              onChange={(e) =>
                setNewBooking({ ...newBooking, FacilityID: e.target.value })
              }
            />
            <TextField
              label="Booking Date (YYYY-MM-DD)"
              size="small"
              value={newBooking.BookingDate}
              onChange={(e) =>
                setNewBooking({ ...newBooking, BookingDate: e.target.value })
              }
            />
            <TextField
              label="Booking Time (HH:MM)"
              size="small"
              value={newBooking.BookingTime}
              onChange={(e) =>
                setNewBooking({ ...newBooking, BookingTime: e.target.value })
              }
            />
            <TextField
              label="Duration"
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
            <TextField
              label="Coach ID"
              size="small"
              value={newSession.CoachID}
              onChange={(e) =>
                setNewSession({ ...newSession, CoachID: e.target.value })
              }
            />
            <TextField
              label="Start Time (YYYY-MM-DDTHH:MM)"
              size="small"
              value={newSession.StartTime}
              onChange={(e) =>
                setNewSession({ ...newSession, StartTime: e.target.value })
              }
            />
            <TextField
              label="End Time (YYYY-MM-DDTHH:MM)"
              size="small"
              value={newSession.EndTime}
              onChange={(e) =>
                setNewSession({ ...newSession, EndTime: e.target.value })
              }
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
              onChange={(e) =>
                setNewSession({ ...newSession, Fee: e.target.value })
              }
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
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography>
                <strong>Booking ID:</strong> {selectedBooking.BookingID}
              </Typography>
              <Typography>
                <strong>Member Name:</strong> {selectedBooking.MemberName}
              </Typography>
              <Typography>
                <strong>Facility Name:</strong> {selectedBooking.FacilityName}
              </Typography>
              <Typography>
                <strong>Date:</strong> {selectedBooking.BookingDate}
              </Typography>
              <Typography>
                <strong>Time:</strong> {selectedBooking.BookingTime}
              </Typography>
              <Typography>
                <strong>Duration:</strong> {selectedBooking.Duration}
              </Typography>
              <Typography>
                <strong>Status:</strong> {selectedBooking.Status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewBookingModal(false)}>Close</Button>
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
              <TextField
                label="Booking Date"
                size="small"
                value={selectedBooking.BookingDate}
                onChange={(e) =>
                  setSelectedBooking({
                    ...selectedBooking,
                    BookingDate: e.target.value,
                  })
                }
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
        <DialogTitle>Session Details</DialogTitle>
        <DialogContent dividers>
          {selectedSession && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography>
                <strong>Session ID:</strong> {selectedSession.SessionID}
              </Typography>
              <Typography>
                <strong>Session Name:</strong> {selectedSession.SessionName}
              </Typography>
              <Typography>
                <strong>Coach Name:</strong> {selectedSession.CoachName}
              </Typography>
              <Typography>
                <strong>Start Time:</strong> {selectedSession.StartTime}
              </Typography>
              <Typography>
                <strong>End Time:</strong> {selectedSession.EndTime}
              </Typography>
              <Typography>
                <strong>Capacity:</strong> {selectedSession.Capacity}
              </Typography>
              <Typography>
                <strong>Participants:</strong> {selectedSession.Participants}
              </Typography>
              <Typography>
                <strong>Status:</strong> {selectedSession.Status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSessionModal(false)}>Close</Button>
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
              <TextField
                label="Start Time"
                size="small"
                value={selectedSession.StartTime}
                onChange={(e) =>
                  setSelectedSession({
                    ...selectedSession,
                    StartTime: e.target.value,
                  })
                }
              />
              <TextField
                label="End Time"
                size="small"
                value={selectedSession.EndTime}
                onChange={(e) =>
                  setSelectedSession({
                    ...selectedSession,
                    EndTime: e.target.value,
                  })
                }
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
  );
}
