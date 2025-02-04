import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// MUI components
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import { Person, People, DirectionsRun } from '@mui/icons-material';
import Menu from '@mui/material/Menu';
// Calendar & DataGrid
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DataGrid } from '@mui/x-data-grid';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// For dayjs pickers
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

// CSV & PDF
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Chart.js
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Framer Motion for animations
import { motion } from 'framer-motion';

// Register chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement
);

/**
 * Utility: Combine bookings & sessions into calendar events.
 */
function createCalendarEvents(bookings, sessions) {
  const bookingEvents = bookings.map((b) => ({
    id: `booking-${b.BookingID}`,
    date: b.BookingDate, // "YYYY-MM-DD"
    title: `Booking: ${b.MemberName} (${b.BookingTime})`,
    type: 'booking',
  }));
  const sessionEvents = sessions.map((s) => ({
    id: `session-${s.SessionID}`,
    date: s.StartTime.split(' ')[0],
    title: `Session: ${s.SessionName} (${s.StartTime} - ${s.EndTime})`,
    type: 'session',
  }));
  return [...bookingEvents, ...sessionEvents];
}

// ------------------ Bookings & Sessions Overview ------------------
function BookingsSessionsOverview() {
  const calendarRef = useRef(null);

  // Data States
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Additional Data
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [coaches, setCoaches] = useState([]);

  // Filter & Search
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Export menu
  const [exportAnchor, setExportAnchor] = useState(null);

  // Add/Edit states
  const [isAddBookingOpen, setAddBookingOpen] = useState(false);
  const [isAddSessionOpen, setAddSessionOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewBookingModal, setViewBookingModal] = useState(false);
  const [editBookingModal, setEditBookingModal] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [viewSessionModal, setViewSessionModal] = useState(false);
  const [editSessionModal, setEditSessionModal] = useState(false);

  const [newBooking, setNewBooking] = useState({
    MemberID: '',
    FacilityID: '',
    BookingDate: '',
    BookingTime: '',
    Duration: '',
    PaymentID: null,
    Status: '',
    // etc...
  });
  const [newSession, setNewSession] = useState({
    // e.g. BranchID if you have it
    SessionName: '',
    SessionType: '',
    CoachID: '',
    StartDate: '',
    StartTime: '',
    EndDate: '',
    EndTime: '',
    Capacity: '',
    Location: '',
    Fee: '',
  });

  // For adding events directly on the calendar
  const [isAddCalendarEventOpen, setAddCalendarEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEditEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // For pagination on event list
  const eventsPerPage = 6;
  const [eventPage, setEventPage] = useState(1);

  // ------------------ Load Data from Endpoints ------------------
  useEffect(() => {
    fetchData();
    fetchMembers();
    fetchFacilities();
    fetchCoaches();
  }, []);

  // 1) GET /booking & GET /booking/sessions
  const fetchData = async () => {
    try {
      // GET /booking
      const bookingRes = await axios.get('/booking');
      const loadedBookings = bookingRes.data.bookings || [];

      // GET /booking/sessions
      const sessionRes = await axios.get('/booking/sessions');
      const loadedSessions = sessionRes.data.sessions || [];

      setBookings(loadedBookings);
      setSessions(loadedSessions);

      // Merge into calendar
      setCalendarEvents(createCalendarEvents(loadedBookings, loadedSessions));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // 2) GET /membership/members
  const fetchMembers = async () => {
    try {
      const res = await axios.get('/membership/members');
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  // 3) GET /booking/facilities
  const fetchFacilities = async () => {
    try {
      const res = await axios.get('/booking/facilities');
      setFacilities(res.data.facilities || []);
    } catch (err) {
      console.error('Failed to load facilities:', err);
    }
  };

  // 4) GET /booking/coaches
  const fetchCoaches = async () => {
    try {
      const res = await axios.get('/booking/coaches');
      setCoaches(res.data.coaches || []);
    } catch (err) {
      console.error('Failed to load coaches:', err);
    }
  };

  // ------------------ Filter / Search (Optional) ------------------
  const filteredBookings = bookings.filter((b) => {
    const branchMatches = branchFilter === 'all' || Number(b.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(b).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  const filteredSessions = sessions.filter((s) => {
    const branchMatches = branchFilter === 'all' || Number(s.BranchID) === Number(branchFilter);
    const searchMatches = Object.values(s).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    return branchMatches && searchMatches;
  });

  // ------------------ Calendar Logic ------------------
  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    if (clickedDate < new Date()) {
      console.log('Cannot schedule on past date.');
      return;
    }
    setSelectedDate(clickedDate);
    setAddCalendarEventOpen(true);
  };

  const handleEventDrop = (info) => {
    // If you want to update the booking/session date in DB, do it here
    const eventId = info.event.id;
    const newDateStr = info.event.startStr;
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, date: newDateStr } : ev))
    );
  };

  const handleSaveCalendarEvent = (title, desc, start, end) => {
    // Just local example
    const newEv = {
      id: Date.now().toString(),
      date: selectedDate?.toISOString().split('T')[0] || '2025-01-01',
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

  // ------------------ Bookings Actions ------------------
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
      // Example: POST /booking/{id}/cancel
      await axios.post(`/booking/${bookingId}/cancel`);
      setBookings((prev) => prev.filter((b) => b.BookingID !== bookingId));
      setCalendarEvents((prev) => prev.filter((ev) => !ev.id.endsWith(String(bookingId))));
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  // ------------------ Sessions Actions ------------------
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
      // Example: POST /booking/sessions/{sessionId}/cancel
      await axios.post(`/booking/sessions/${sessionId}/cancel`);
      setSessions((prev) => prev.filter((s) => s.SessionID !== sessionId));
      setCalendarEvents((prev) => prev.filter((ev) => !ev.id.endsWith(String(sessionId))));
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  // ------------------ DataGrid Columns ------------------
  const bookingColumns = [
    { field: 'BookingID', headerName: 'Booking ID', width: 100 },
    { field: 'Branch', headerName: 'Branch', width: 150 },
    { field: 'MemberName', headerName: 'Member Name', width: 150 },
    { field: 'FacilityName', headerName: 'Facility', width: 130 },
    { field: 'BookingDate', headerName: 'Date', width: 100 },
    { field: 'BookingTime', headerName: 'Time', width: 100 },
    { field: 'Duration', headerName: 'Duration', width: 80 },
    { field: 'Status', headerName: 'Status', width: 90 },
    {
      field: 'Actions',
      headerName: 'Actions',
      width: 210,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              sx={{ minWidth: 40, padding: '6px' }}
              onClick={() => handleViewBooking(params.row.BookingID)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 40, padding: '6px' }}
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
    { field: 'SessionID', headerName: 'Session ID', width: 120 },
    { field: 'Branch', headerName: 'Branch', width: 150 },
    { field: 'SessionName', headerName: 'Session Name', width: 150 },
    { field: 'CoachName', headerName: 'Coach Name', width: 140 },
    { field: 'StartTime', headerName: 'Start Time', width: 150 },
    { field: 'EndTime', headerName: 'End Time', width: 150 },
    { field: 'Capacity', headerName: 'Capacity', width: 90 },
    { field: 'Participants', headerName: 'Participants', width: 110 },
    { field: 'Status', headerName: 'Status', width: 110 },
    {
      field: 'Actions',
      headerName: 'Actions',
      width: 230,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              color="success"
              sx={{ minWidth: 40, padding: '6px' }}
              onClick={() => handleViewSession(params.row.SessionID)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 40, padding: '6px' }}
              onClick={() => handleEditSession(params.row.SessionID)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 40, padding: '6px' }}
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

  // ------------------ Export Logic ------------------
  const openExport = Boolean(exportAnchor);
  const handleExportClick = (e) => setExportAnchor(e.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const csvHeadersBookings = [
    { label: 'Booking ID', key: 'BookingID' },
    { label: 'Branch', key: 'Branch' },
    { label: 'Member Name', key: 'MemberName' },
    { label: 'Facility', key: 'FacilityName' },
    { label: 'Date', key: 'BookingDate' },
    { label: 'Time', key: 'BookingTime' },
    { label: 'Duration', key: 'Duration' },
    { label: 'Status', key: 'Status' },
  ];
  const csvHeadersSessions = [
    { label: 'Session ID', key: 'SessionID' },
    { label: 'Session Name', key: 'SessionName' },
    { label: 'Coach Name', key: 'CoachName' },
    { label: 'Start Time', key: 'StartTime' },
    { label: 'End Time', key: 'EndTime' },
    { label: 'Capacity', key: 'Capacity' },
    { label: 'Participants', key: 'Participants' },
    { label: 'Status', key: 'Status' },
  ];

  const handleExportPDF = () => {
    handleExportClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text('Bookings Export', 14, 10);
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
        head: [['ID', 'Branch', 'Member', 'Facility', 'Date', 'Time', 'Dur', 'Status']],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save('Bookings.pdf');
    } else {
      doc.text('Sessions Export', 14, 10);
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
        head: [['ID', 'SessionName', 'Coach', 'Start', 'End', 'Cap', 'Participants', 'Status']],
        body: rowsForPDF,
        startY: 20,
      });
      doc.save('Sessions.pdf');
    }
  };

  // ------------------ Add Booking / Session ------------------
  const handleCreateBooking = async () => {
    try {
      // POST /booking
      await axios.post('/booking', {
        ...newBooking,
      });
      setAddBookingOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create booking:', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      // Combine date/time
      const startFull = dayjs(`${newSession.StartDate} ${newSession.StartTime}`, 'YYYY-MM-DD HH:mm:ss').format(
        'YYYY-MM-DD HH:mm:ss'
      );
      const endFull = dayjs(`${newSession.EndDate} ${newSession.EndTime}`, 'YYYY-MM-DD HH:mm:ss').format(
        'YYYY-MM-DD HH:mm:ss'
      );

      // POST /booking/sessions
      await axios.post('/booking/sessions', {
        ...newSession,
        StartTime: startFull,
        EndTime: endFull,
      });
      setAddSessionOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // ------------------ Edit Booking / Session ------------------
  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    try {
      // PUT or POST /booking/{id}
      await axios.put(`/booking/${selectedBooking.BookingID}`, selectedBooking);
      setEditBookingModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    try {
      // Combine date/time for StartTime, EndTime if needed
      await axios.put(`/booking/sessions/${selectedSession.SessionID}`, selectedSession);
      setEditSessionModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  // ------------------ Pagination for Calendar Events ------------------
  const indexOfLastEvent = eventPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = calendarEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const handleEventPageChange = (event, value) => {
    setEventPage(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, mt: 2 }}>
        {/* Title & Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Bookings & Sessions</Typography>
          <Box>
            <Button
              variant={activeTab === 0 ? 'contained' : 'outlined'}
              startIcon={<CalendarTodayIcon />}
              onClick={() => {
                setActiveTab(0);
                setSearchTerm('');
              }}
              sx={{ mr: 1 }}
            >
              Bookings
            </Button>
            <Button
              variant={activeTab === 1 ? 'contained' : 'outlined'}
              startIcon={<FitnessCenterIcon />}
              onClick={() => {
                setActiveTab(1);
                setSearchTerm('');
              }}
            >
              Sessions
            </Button>
          </Box>
        </Box>

        {/* Calendar & Event List */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Calendar */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, minHeight: 550 }}>
              <Typography variant="h6" gutterBottom>
                Calendar
              </Typography>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents.map((ev) => ({
                  id: ev.id,
                  title: ev.title,
                  start: ev.date,
                }))}
                height="auto"
                editable
                validRange={{ start: new Date().toISOString().split('T')[0] }}
                dateClick={handleDateClick}
                eventDrop={handleEventDrop}
              />
            </Paper>
          </Grid>
          {/* Event List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, minHeight: 550 }}>
              <Typography variant="h6" gutterBottom>
                Event List
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense sx={{ maxHeight: 500, overflowY: 'auto' }}>
                {calendarEvents.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No events for this month." />
                  </ListItem>
                ) : (
                  currentEvents.map((ev) => (
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
                              <IconButton onClick={() => handleDeleteEvent(ev.id)} sx={{ ml: 1 }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        sx={{ py: 0 }}
                      >
                        <ListItemText
                          primary={ev.title}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                          secondary={`Date: ${ev.date}`}
                        />
                      </ListItem>
                    </Paper>
                  ))
                )}
              </List>
              {calendarEvents.length > eventsPerPage && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
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

        {/* Branch Filter & Search (Optional) */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                size="small"
                sx={{ width: 150 }}
              >
                <MenuItem value="all">All</MenuItem>
                {/* If you have actual branch data, map over them:
                {branches.map((b) => (
                  <MenuItem key={b.value} value={String(b.value)}>
                    {b.label}
                  </MenuItem>
                ))} 
                */}
              </TextField>
              <TextField
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: '100%', maxWidth: 300 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={(e) => setExportAnchor(e.currentTarget)}
                startIcon={<FileDownloadIcon />}
                sx={{ textTransform: 'none' }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchor}
                open={openExport}
                onClose={handleExportClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <MenuItem>
                  {activeTab === 0 ? (
                    <CSVLink
                      data={filteredBookings}
                      headers={csvHeadersBookings}
                      filename="Bookings.csv"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'inherit',
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <Typography>Export CSV</Typography>
                    </CSVLink>
                  )}
                </MenuItem>
                <MenuItem onClick={handleExportPDF}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Export PDF</Typography>
                  </Box>
                </MenuItem>
              </Menu>

              {activeTab === 0 ? (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddBookingOpen(true)}>
                  Add Booking
                </Button>
              ) : (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddSessionOpen(true)}>
                  Add Session
                </Button>
              )}
            </Box>
          </Box>

          {/* Bookings or Sessions Table */}
          <div style={{ height: 420, width: '100%' }}>
            <DataGrid
              rows={activeTab === 0 ? filteredBookings : filteredSessions}
              columns={activeTab === 0 ? bookingColumns : sessionColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              getRowId={getRowId}
            />
          </div>
        </Paper>

        {/* ADD BOOKING DIALOG */}
        <Dialog open={isAddBookingOpen} onClose={() => setAddBookingOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Member</InputLabel>
                <Select
                  label="Member"
                  value={newBooking.MemberID || ''}
                  onChange={(e) => setNewBooking({ ...newBooking, MemberID: e.target.value })}
                >
                  {members.map((m) => (
                    <MenuItem key={m.MemberID} value={m.MemberID}>
                      {m.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Facility ID dropdown */}
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Facility</InputLabel>
                <Select
                  label="Facility"
                  value={newBooking.FacilityID || ''}
                  onChange={(e) => setNewBooking({ ...newBooking, FacilityID: e.target.value })}
                >
                  {facilities.map((f) => (
                    <MenuItem key={f.FacilityID} value={f.FacilityID}>
                      {f.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Booking Date"
                value={newBooking.BookingDate ? dayjs(newBooking.BookingDate) : null}
                onChange={(val) => {
                  const str = val ? val.format('YYYY-MM-DD') : '';
                  setNewBooking((prev) => ({ ...prev, BookingDate: str }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TimePicker
                label="Booking Time"
                value={newBooking.BookingTime ? dayjs(newBooking.BookingTime, 'HH:mm:ss') : null}
                onChange={(timeVal) => {
                  const tStr = timeVal ? timeVal.format('HH:mm:ss') : '';
                  setNewBooking((prev) => ({ ...prev, BookingTime: tStr }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TextField
                label="Duration"
                size="small"
                value={newBooking.Duration}
                onChange={(e) => setNewBooking({ ...newBooking, Duration: e.target.value })}
              />
              <TextField
                label="Payment ID"
                size="small"
                value={newBooking.PaymentID || ''}
                onChange={(e) => setNewBooking({ ...newBooking, PaymentID: e.target.value })}
              />
              <TextField
                label="Status"
                size="small"
                value={newBooking.Status}
                onChange={(e) => setNewBooking({ ...newBooking, Status: e.target.value })}
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

        {/* ADD SESSION DIALOG */}
        <Dialog open={isAddSessionOpen} onClose={() => setAddSessionOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add New Session</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Coach</InputLabel>
                <Select
                  label="Coach"
                  value={newSession.CoachID || ''}
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
                onChange={(val) => {
                  const str = val ? val.format('YYYY-MM-DD') : '';
                  setNewSession((prev) => ({ ...prev, StartDate: str }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TimePicker
                label="Start Time"
                value={newSession.StartTime ? dayjs(newSession.StartTime, 'HH:mm:ss') : null}
                onChange={(timeVal) => {
                  const tStr = timeVal ? timeVal.format('HH:mm:ss') : '';
                  setNewSession((prev) => ({ ...prev, StartTime: tStr }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="End Date"
                value={newSession.EndDate ? dayjs(newSession.EndDate) : null}
                onChange={(val) => {
                  const str = val ? val.format('YYYY-MM-DD') : '';
                  setNewSession((prev) => ({ ...prev, EndDate: str }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TimePicker
                label="End Time"
                value={newSession.EndTime ? dayjs(newSession.EndTime, 'HH:mm:ss') : null}
                onChange={(timeVal) => {
                  const tStr = timeVal ? timeVal.format('HH:mm:ss') : '';
                  setNewSession((prev) => ({ ...prev, EndTime: tStr }));
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <TextField
                label="Capacity"
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

        {/* Add Event from Calendar (Optional) */}
        <Dialog
          open={isAddCalendarEventOpen}
          onClose={() => setAddCalendarEventOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>New Calendar Event for {selectedDate?.toDateString() || '??'}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                handleSaveCalendarEvent('Title from user', 'Description from user', 'start', 'end')
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Event */}
        <Dialog open={isEditEventOpen} onClose={() => setEditEventOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Event</DialogTitle>
          <DialogContent dividers>
            {selectedEvent && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  value={selectedEvent.description || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
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

        {/* View Booking */}
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
                {/* Display details... */}
                <Typography>Booking ID: {selectedBooking.BookingID}</Typography>
                {/* etc */}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setViewBookingModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Booking */}
        <Dialog
          open={editBookingModal}
          onClose={() => setEditBookingModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogContent dividers>
            {selectedBooking && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Branch"
                  size="small"
                  value={selectedBooking.Branch || ''}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, Branch: e.target.value })
                  }
                />
                <TextField
                  label="Member Name"
                  size="small"
                  value={selectedBooking.MemberName || ''}
                  onChange={(e) =>
                    setSelectedBooking({ ...selectedBooking, MemberName: e.target.value })
                  }
                />
                {/* etc... */}
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

        {/* View Session */}
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
                <Typography>Session ID: {selectedSession.SessionID}</Typography>
                <Typography>Session Name: {selectedSession.SessionName}</Typography>
                {/* etc */}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setViewSessionModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Session */}
        <Dialog
          open={editSessionModal}
          onClose={() => setEditSessionModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Session</DialogTitle>
          <DialogContent dividers>
            {selectedSession && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Session Name"
                  size="small"
                  value={selectedSession.SessionName || ''}
                  onChange={(e) =>
                    setSelectedSession({ ...selectedSession, SessionName: e.target.value })
                  }
                />
                {/* etc */}
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

// ------------------ Main Dashboard Component ------------------
export default function DashboardContent() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const bgGradient = darkMode
    ? 'linear-gradient(to bottom, #303030, #424242)'
    : 'linear-gradient(to bottom, #ffffff, #f5f5f5)';

  // For the top metrics
  const [metrics, setMetrics] = useState({
    attendanceToday: 0,
    totalCheckIns: 0,
    pendingPayments: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // A simple tasks example
  const tasks = [
    { id: 1, title: 'Task 1', dueDate: '2025-02-10', status: 'Pending' },
    { id: 2, title: 'Task 2', dueDate: '2025-02-12', status: 'Completed' },
    { id: 3, title: 'Task 3', dueDate: '2025-02-15', status: 'In Progress' },
  ];

  // Example chart data
  const attendanceChartData = {
    labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
    datasets: [
      {
        label: 'Check-ins',
        data: [5, 10, 15, 20, 25, 30],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const monthlyRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [1000, 2000, 1500, 2500, 2200],
        backgroundColor: theme.palette.secondary.main,
      },
    ],
  };

  // For a refresh
  const handleRefresh = () => {
    console.log('Refresh clicked');
    // Re-fetch any data if you want
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
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
    <Box sx={{ p: 4, background: bgGradient, minHeight: '100vh' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ mb: 0, fontWeight: 700, color: theme.palette.text.primary }}
        >
          Staff Dashboard
        </Typography>
        <IconButton color="primary" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* 3 Cards (Today's Check-ins, etc.) */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ p: 2, backgroundColor: '#42A5F5', color: '#fff' }}>
              <CardContent>
                <Typography variant="subtitle2">Today's Check-ins</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metrics.attendanceToday}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ p: 2, backgroundColor: '#66BB6A', color: '#fff' }}>
              <CardContent>
                <Typography variant="subtitle2">Total Check-ins</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metrics.totalCheckIns}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ p: 2, backgroundColor: '#FFB74D', color: '#fff' }}>
              <CardContent>
                <Typography variant="subtitle2">Pending Payments</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₱{Number(0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Task List */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 4, mb: 4 }}>
            <CardHeader
              title={<Typography variant="h6">Task List</Typography>}
              sx={{ backgroundColor: darkMode ? '#616161' : '#1976d2', color: '#fff' }}
            />
            <CardContent>
              <List>
                {tasks.map((task, i) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {task.title}
                          </Typography>
                        }
                        secondary={`Due: ${task.dueDate} - ${task.status}`}
                      />
                    </ListItem>
                    {i < tasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Example Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Attendance Trend
            </Typography>
            <Line data={attendanceChartData} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Monthly Revenue
            </Typography>
            <Bar data={monthlyRevenueData} />
          </Paper>
        </Grid>
      </Grid>

      {/* Insert the BookingsSessionsOverview below, or integrate it in the same grid */}
      <BookingsSessionsOverview />
    </Box>
  );
}
