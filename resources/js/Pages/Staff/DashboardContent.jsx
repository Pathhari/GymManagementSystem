import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import axios from 'axios';
import { Person, People, DirectionsRun } from '@mui/icons-material';

// New imports for FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


function BookingsSessionsOverview() {
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const calendarRef = useRef(null);

  // Fetch bookings and sessions data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // GET /booking => booking.index
        const bookingRes = await axios.get('/booking');
        const loadedBookings = bookingRes.data.bookings || [];

        // GET /booking/sessions => booking.sessions.index
        const sessionRes = await axios.get('/booking/sessions');
        const loadedSessions = sessionRes.data.sessions || [];

        setBookings(loadedBookings);
        setSessions(loadedSessions);

        // Create calendar events using your current logic
        const bookingEvents = loadedBookings.map(b => ({
          id: `booking-${b.BookingID}`,
          date: b.BookingDate, // Expected format: "YYYY-MM-DD"
          title: `Booking: ${b.MemberName} (${b.BookingTime})`,
          type: "booking",
        }));
        const sessionEvents = loadedSessions.map(s => ({
          id: `session-${s.SessionID}`,
          date: s.StartTime.split(" ")[0],
          title: `Session: ${s.SessionName} (${s.StartTime} - ${s.EndTime})`,
          type: "session",
        }));
        setCalendarEvents([...bookingEvents, ...sessionEvents]);
      } catch (err) {
        console.error("Failed to load bookings/sessions data:", err);
      }
    };
    fetchData();
  }, []);

  // Format events for FullCalendar
  const fullCalendarEvents = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: ev.date,
  }));

  return (
    <Paper sx={{ p: 2, minHeight: 250 }}>
      <Typography variant="h6" gutterBottom>
        Bookings & Sessions
      </Typography>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={fullCalendarEvents}
        // Removed fixed height to show the whole calendar.
        // You can alternatively use height="auto" or contentHeight="auto"
        editable={false}
      />
      <List dense sx={{ maxHeight: 150, overflowY: "auto", mt: 2 }}>
        {calendarEvents.length === 0 ? (
          <ListItem>
            <ListItemText primary="No events for this month." />
          </ListItem>
        ) : (
          calendarEvents.map(ev => (
            <ListItem key={ev.id}>
              <ListItemText primary={ev.title} secondary={`Date: ${ev.date}`} />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}

export default function DashboardContent() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Set background gradient based on theme mode
  const bgGradient = darkMode
 
  // States
  const [keyMetrics, setKeyMetrics] = useState({
    totalEmailsSent: 0,
    totalClients: 0,
    trafficReceived: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [currentPromotions, setCurrentPromotions] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [cashFlows, setCashFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branch, setBranch] = useState('all');
  const [branchOptions, setBranchOptions] = useState([]);
  
  // Dummy task data
  const tasks = [
    { id: 1, title: 'Task 1', dueDate: '2025-02-10', status: 'Pending' },
    { id: 2, title: 'Task 2', dueDate: '2025-02-12', status: 'Completed' },
    { id: 3, title: 'Task 3', dueDate: '2025-02-15', status: 'In Progress' },
  ];



  // Handlers for filters
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);
  const handleBranchChange = (e) => setBranch(e.target.value);

  // Fetch Key Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(
          `/owner/dashboard-metrics?period=${timePeriod}&dateFrom=${dateFrom}&dateTo=${dateTo}&branch=${branch}`
        );
        setKeyMetrics(response.data.metrics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [timePeriod, dateFrom, dateTo, branch]);

  // Fetch Branch Options
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/owner/branches');
        const fetched = response.data.branches.map(b => ({
          value: b.BranchID.toString(),
          label: b.BranchName,
        }));
        setBranchOptions([{ value: 'all', label: 'All Branches' }, ...fetched]);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranchOptions([{ value: 'all', label: 'All Branches' }]);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Recent Transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('/payments');
        const transactions = response.data.map(p => ({
          id: p.PaymentID,
          amount: p.Amount,
          date: p.PaymentDate,
          status: p.Status,
        }));
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, []);

  // Fetch Current Promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get('/finance/promotions');
        setCurrentPromotions(response.data.promos);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };
    fetchPromotions();
  }, []);

  // Fetch System Logs
  useEffect(() => {
    const fetchSystemLogs = async () => {
      try {
        const response = await axios.get('/system/logs');
        setSystemLogs(response.data.logs);
      } catch (error) {
        console.error('Error fetching system logs:', error);
      }
    };
    fetchSystemLogs();
  }, []);

  return (
    <Box sx={{ p: 4, background: bgGradient, minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700, color: theme.palette.text.primary }}>
        Dashboard
      </Typography>

     

      {/* Top Controls */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Time Period</InputLabel>
            <Select value={timePeriod} onChange={handleTimePeriodChange} label="Time Period">
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="From Date"
            type="date"
            variant="outlined"
            size="small"
            value={dateFrom}
            onChange={handleDateFromChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="To Date"
            type="date"
            variant="outlined"
            size="small"
            value={dateTo}
            onChange={handleDateToChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ ml: 'auto' }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Branch</InputLabel>
            <Select value={branch} onChange={handleBranchChange} label="Branch">
              {branchOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Key Metrics & Task List Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Left half: 3 overview cards and Task List below them */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Members Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  backgroundColor: "#42A5F5",
                  borderRadius: 2,
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                }}
              >
                <Person sx={{ fontSize: 30, color: "white", mr: 1.5 }} />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ color: "white", mb: 0.5 }}>
                    Members
                  </Typography>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                    {loading ? <CircularProgress size={20} color="inherit" /> : keyMetrics.totalClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* New Members Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  backgroundColor: "#FFB74D",
                  borderRadius: 2,
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                }}
              >
                <People sx={{ fontSize: 30, color: "white", mr: 1.5 }} />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ color: "white", mb: 0.5 }}>
                    New Members
                  </Typography>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                    {loading ? <CircularProgress size={20} color="inherit" /> : keyMetrics.totalClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Attendance Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  backgroundColor: "#9C27B0",
                  borderRadius: 2,
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                }}
              >
                <DirectionsRun sx={{ fontSize: 30, color: "white", mr: 1.5 }} />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ color: "white", mb: 0.5 }}>
                    Attendance
                  </Typography>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                    {loading ? <CircularProgress size={20} color="inherit" /> : keyMetrics.trafficReceived}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Task List (below the 3 overview cards) */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 4,
                  overflow: 'hidden',
                  backgroundColor: darkMode ? '#424242' : '#fff',
                }}
              >
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Task List
                    </Typography>
                  }
                  sx={{
                    backgroundColor: darkMode ? '#616161' : '#1976d2',
                    color: '#fff',
                    textAlign: 'center',
                    p: 1,
                  }}
                />
                <CardContent sx={{ p: 2 }}>
                  <List>
                    {tasks.map((task, index) => (
                      <React.Fragment key={task.id}>
                        <ListItem
                          sx={{
                            p: 1,
                            backgroundColor: darkMode ? '#424242' : '#fafafa',
                            borderRadius: 1,
                            transition: 'background-color 0.3s',
                            '&:hover': {
                              backgroundColor: darkMode ? '#616161' : '#e0f7fa',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                Due: {task.dueDate} &mdash; {task.status}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < tasks.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right half: Bookings & Sessions Overview */}
        <Grid item xs={12} md={6}>
          <BookingsSessionsOverview />
        </Grid>
      </Grid>
    </Box>
  );
}
