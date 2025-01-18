import React, { useState } from "react";
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
  FormControl,         // <--- Added
  InputLabel,          // <--- Added
  Select               // <--- Added
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"; // for Bookings Tab
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter"; // for Sessions Tab
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// --------- For CSV Export ---------
import { CSVLink } from "react-csv";

// --------- For PDF Export ---------
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------------------- SAMPLE DATA ----------------------
const sampleBookings = [
  {
    BookingID: "BKG-1001",
    MemberName: "John Doe",
    FacilityName: "Main Gym",
    BookingDate: "2025-01-10",
    BookingTime: "10:00 AM - 11:00 AM",
    Duration: "1h",
    Status: "Confirmed",
  },
  {
    BookingID: "BKG-1002",
    MemberName: "Jane Smith",
    FacilityName: "Pool",
    BookingDate: "2025-01-12",
    BookingTime: "2:00 PM - 3:30 PM",
    Duration: "1h 30m",
    Status: "Cancelled",
  },
];

const sampleSessions = [
  {
    SessionID: "S-2001",
    SessionName: "Yoga Basics",
    CoachName: "Alice Johnson",
    StartTime: "2025-02-05 08:00",
    EndTime: "2025-02-05 09:00",
    Capacity: 20,
    Participants: 15,
    Status: "Ongoing",
  },
  {
    SessionID: "S-2002",
    SessionName: "Zumba Class",
    CoachName: "Carlos Martin",
    StartTime: "2025-02-05 10:00",
    EndTime: "2025-02-05 11:00",
    Capacity: 25,
    Participants: 25,
    Status: "Completed",
  },
];

// Combine Bookings & Sessions into a single array for the Event List & Calendar
function createCalendarEvents(bookings, sessions) {
  const bookingEvents = bookings.map((b) => ({
    id: b.BookingID,
    date: b.BookingDate,
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
  // ------------------ TABS & SEARCH ------------------
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // ------------------ Dialog States ------------------
  const [isAddBookingOpen, setAddBookingOpen] = useState(false);
  const [isAddSessionOpen, setAddSessionOpen] = useState(false);

  // For "View" and "Edit" modals (Bookings)
  const [viewBookingModal, setViewBookingModal] = useState(false);
  const [editBookingModal, setEditBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // For "View" and "Edit" modals (Sessions)
  const [viewSessionModal, setViewSessionModal] = useState(false);
  const [editSessionModal, setEditSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Calendar: New schedule
  const [isAddCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // For "Edit Event" in the event list
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Bookings & Sessions data
  const [bookings, setBookings] = useState(sampleBookings);
  const [sessions, setSessions] = useState(sampleSessions);

  // Filtered data for table
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

  // Combined events for calendar
  const [calendarEvents, setCalendarEvents] = useState(
    createCalendarEvents(bookings, sessions)
  );

  // ------------------ NEW: DATE & BRANCH FILTERS for Overview Panel ------------------
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // New branch filter state with dummy options
  const [branch, setBranch] = useState("all");
  const branchOptions = [
    { value: "all", label: "All Branches" },
    { value: "1", label: "Branch 1" },
    { value: "2", label: "Branch 2" },
    { value: "3", label: "Branch 3" },
  ];

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
    // Insert your filtering logic if desired
  };

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
    // Insert your filtering logic if desired
  };

  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
    // Insert your filtering logic if desired
  };

  const handleBranchChange = (e) => {
    setBranch(e.target.value);
    // Insert branch filtering logic if desired
  };

  // ------------------ Tab & Search Handlers ------------------
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ------------------ FullCalendar Handlers ------------------
  const fullCalendarEvents = calendarEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
  }));

  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    const now = new Date();
    if (clickedDate < new Date(now.toDateString())) {
      console.log("Cannot schedule an event on a past date!");
      return;
    }
    setSelectedDate(clickedDate);
    setAddCalendarEventOpen(true);
  };

  const handleEventDrop = (info) => {
    const newDateStr = info.event.startStr;
    const eventId = info.event.id;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: newDateStr } : ev))
    );
    console.log(`Event dragged to ${newDateStr}`);
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

  // ------------- EVENT LIST EDIT/DELETE -------------
  const handleDeleteEvent = (id) => {
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
  };
  const handleEditEvent = (id) => {
    const found = calendarEvents.find((ev) => ev.id === id);
    if (found) {
      setSelectedEvent(found);
      setEditEventOpen(true);
    }
  };
  const handleSaveEditedEvent = () => {
    if (!selectedEvent) return;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? selectedEvent : ev))
    );
    setEditEventOpen(false);
  };

  // -------------- TABLE ACTIONS: BOOKINGS --------------
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
  const handleCancelBooking = (bookingId) => {
    setBookings((prev) => prev.filter((b) => b.BookingID !== bookingId));
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== bookingId));
  };

  // -------------- TABLE ACTIONS: SESSIONS --------------
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
  const handleCancelSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.SessionID !== sessionId));
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== sessionId));
  };

  // -------------- COLUMN DEFINITIONS --------------
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
  const getRowId = (row) =>
    activeTab === 0 ? row.BookingID : row.SessionID;

  // --------- Export Menu logic ---------
  const [exportAnchor, setExportAnchor] = useState(null);
  const openExport = Boolean(exportAnchor);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  // CSV export headers
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

  const handleExportCSV = () => {
    handleExportClose();
  };

  // Export to PDF
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
        head: [
          [
            "Booking ID",
            "Member Name",
            "Facility",
            "Date",
            "Time",
            "Duration",
            "Status",
          ],
        ],
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
          [
            "Session ID",
            "Session Name",
            "Coach Name",
            "Start Time",
            "End Time",
            "Capacity",
            "Participants",
            "Status",
          ],
        ],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save("Sessions.pdf");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ====== OVERVIEW PANEL: Calendar & Event List ====== */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Larger dynamic FullCalendar */}
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
              Drag events to reschedule, cannot schedule on past dates.
            </Typography>
          </Paper>
        </Grid>

        {/* Event list based on combined data */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              minHeight: 550,
              background: "secondary",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
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
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 2,
                      borderColor: "#ccc",
                    }}
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

      {/* ====== CONTROLS: Title, Tabs & Filters ====== */}
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
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ alignSelf: "center" }}
        >
          <Tab icon={<CalendarTodayIcon />} label="Bookings" />
          <Tab icon={<FitnessCenterIcon />} label="Sessions" />
        </Tabs>
      </Box>

      {/* ---------- Filters: Time Period, Date & Branch ---------- */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={timePeriod}
            label="Time Period"
            onChange={handleTimePeriodChange}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
        <TextField
          type="date"
          size="small"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={handleDateFromChange}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={handleDateToChange}
        />
        {/* Branch Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Branch</InputLabel>
          <Select value={branch} label="Branch" onChange={handleBranchChange}>
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ====== Table & Action Buttons ====== */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 300 }}
          />

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
              <MenuItem onClick={handleExportCSV}>
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
            rows={activeTab === 0 ? filteredBookings : filteredSessions}
            columns={activeTab === 0 ? bookingColumns : sessionColumns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            getRowId={(row) =>
              activeTab === 0 ? row.BookingID : row.SessionID
            }
          />
        </div>
      </Paper>

      {/* ---------- Add Booking Dialog ---------- */}
      <Dialog
        open={isAddBookingOpen}
        onClose={() => setAddBookingOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Booking</DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField label="Booking ID" variant="outlined" size="small" />
            <TextField label="Member Name" variant="outlined" size="small" />
            <TextField label="Facility Name" variant="outlined" size="small" />
            <TextField label="Booking Date" variant="outlined" size="small" />
            <TextField label="Booking Time" variant="outlined" size="small" />
            <TextField label="Duration" variant="outlined" size="small" />
            <TextField label="Status" variant="outlined" size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBookingOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log("Booking saved!");
              setAddBookingOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Add Session Dialog ---------- */}
      <Dialog
        open={isAddSessionOpen}
        onClose={() => setAddSessionOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Session</DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField label="Session ID" variant="outlined" size="small" />
            <TextField label="Session Name" variant="outlined" size="small" />
            <TextField label="Coach Name" variant="outlined" size="small" />
            <TextField label="Start Time" variant="outlined" size="small" />
            <TextField label="End Time" variant="outlined" size="small" />
            <TextField label="Capacity" type="number" variant="outlined" size="small" />
            <TextField label="Participants" type="number" variant="outlined" size="small" />
            <TextField label="Status" variant="outlined" size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSessionOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log("Session saved!");
              setAddSessionOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Add Calendar Event Dialog ---------- */}
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
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField label="Title" variant="outlined" size="small" />
            <TextField label="Description" variant="outlined" size="small" />
            <TextField label="Start Time" variant="outlined" size="small" />
            <TextField label="End Time" variant="outlined" size="small" />
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

      {/* ---------- Edit Event Dialog ---------- */}
      <Dialog
        open={isEditEventOpen}
        onClose={() => setEditEventOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Title"
                variant="outlined"
                size="small"
                value={selectedEvent.title}
                onChange={(e) =>
                  setSelectedEvent({ ...selectedEvent, title: e.target.value })
                }
              />
              <TextField
                label="Date (YYYY-MM-DD)"
                variant="outlined"
                size="small"
                value={selectedEvent.date}
                onChange={(e) =>
                  setSelectedEvent({ ...selectedEvent, date: e.target.value })
                }
              />
              <TextField
                label="Description"
                variant="outlined"
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

      {/* ---------- View Booking Dialog ---------- */}
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

      {/* ---------- Edit Booking Dialog ---------- */}
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
                label="Booking ID"
                defaultValue={selectedBooking.BookingID}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Member Name"
                defaultValue={selectedBooking.MemberName}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Facility Name"
                defaultValue={selectedBooking.FacilityName}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Date"
                defaultValue={selectedBooking.BookingDate}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Time"
                defaultValue={selectedBooking.BookingTime}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Duration"
                defaultValue={selectedBooking.Duration}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Status"
                defaultValue={selectedBooking.Status}
                variant="outlined"
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBookingModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log("Booking updated!");
              setEditBookingModal(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- View Session Dialog ---------- */}
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
                <strong>Start:</strong> {selectedSession.StartTime}
              </Typography>
              <Typography>
                <strong>End:</strong> {selectedSession.EndTime}
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

      {/* ---------- Edit Session Dialog ---------- */}
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
                label="Session ID"
                defaultValue={selectedSession.SessionID}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Session Name"
                defaultValue={selectedSession.SessionName}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Coach Name"
                defaultValue={selectedSession.CoachName}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Start Time"
                defaultValue={selectedSession.StartTime}
                variant="outlined"
                size="small"
              />
              <TextField
                label="End Time"
                defaultValue={selectedSession.EndTime}
                variant="outlined"
                size="small"
              />
              <TextField
                label="Capacity"
                defaultValue={selectedSession.Capacity}
                type="number"
                variant="outlined"
                size="small"
              />
              <TextField
                label="Participants"
                defaultValue={selectedSession.Participants}
                type="number"
                variant="outlined"
                size="small"
              />
              <TextField
                label="Status"
                defaultValue={selectedSession.Status}
                variant="outlined"
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSessionModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              console.log("Session updated!");
              setEditSessionModal(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
