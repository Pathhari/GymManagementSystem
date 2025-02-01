import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
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
  ArcElement
} from 'chart.js';
import axios from 'axios';
import {
  Person,
  AttachMoney,
  People,
  DirectionsRun,
  NotificationImportant
} from '@mui/icons-material';

// Register necessary components for Chart.js
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

export default function DashboardContent() {
  const [keyMetrics, setKeyMetrics] = useState({
    totalRevenue: 0,
    totalEmailsSent: 0,
    totalClients: 0,
    trafficReceived: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 'TXN001', amount: 100, date: '2024-01-10', status: 'Completed' },
    { id: 'TXN002', amount: 250, date: '2024-01-12', status: 'Pending' },
    { id: 'TXN003', amount: 400, date: '2024-01-14', status: 'Completed' },
    { id: 'TXN004', amount: 150, date: '2024-01-15', status: 'Failed' },
    { id: 'TXN005', amount: 500, date: '2024-01-16', status: 'Completed' },
    { id: 'TXN006', amount: 350, date: '2024-01-17', status: 'Pending' },
    { id: 'TXN007', amount: 600, date: '2024-01-18', status: 'Completed' },
    { id: 'TXN008', amount: 250, date: '2024-01-20', status: 'Failed' },
    { id: 'TXN009', amount: 450, date: '2024-01-21', status: 'Completed' },
    { id: 'TXN010', amount: 300, date: '2024-01-22', status: 'Pending' },
  ]);

  // Dummy Notifications Data
  const [notifications, setNotifications] = useState([
    { message: 'New transaction completed: TXN001' },
    { message: 'Revenue milestone reached: $500,000' },
    { message: 'New client added: Company ABC' },
    { message: 'System update available: Version 2.3' },
    { message: 'Performance review scheduled for next week' },
    { message: 'Reminder: Monthly report due in 3 days' },
    { message: 'New member registered: John Doe' },
    { message: 'Website traffic spike detected' },
    { message: 'New feature release: Dark mode now available' },
    { message: 'System maintenance scheduled for tomorrow' },
  ]);

  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('monthly'); // Default to monthly
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // New branch filter state with a default value (e.g., All)
  const [branch, setBranch] = useState('all');

  // Dummy branch options. You can later connect to an API or database to get these.
  const branchOptions = [
    { value: 'all', label: 'All Branches' },
    { value: 'branch1', label: 'Branch 1' },
    { value: 'branch2', label: 'Branch 2' },
    { value: 'branch3', label: 'Branch 3' },
  ];

  // Fetch data from your API whenever a filter changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pass branch filter as a query parameter
        const response = await axios.get(
          `/admin/dashboard-metrics?period=${timePeriod}&dateFrom=${dateFrom}&dateTo=${dateTo}&branch=${branch}`
        );
        setKeyMetrics(response.data.metrics);
        setNotifications(response.data.notifications); // Fetch notifications as well
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [timePeriod, dateFrom, dateTo, branch]); // Re-fetch when any of these change

  // Line Chart for Revenue Trends (Data for different time periods)
  const revenueChartData = {
    labels:
      timePeriod === 'monthly'
        ? [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ]
        : timePeriod === 'weekly'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : timePeriod === 'daily'
        ? ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
        : ['2022', '2023', '2024'], // Example yearly labels
    datasets: [
      {
        label: 'Revenue',
        data:
          timePeriod === 'monthly'
            ? [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600]
            : timePeriod === 'weekly'
            ? [400, 600, 700, 500]
            : timePeriod === 'daily'
            ? [50, 60, 70, 80, 90, 100, 110]
            : [1200, 1300, 1400], // Example yearly data
        borderColor: '#42A5F5',
        fill: false,
      },
    ],
  };

  // Bar Chart for Performance Comparison for different periods
  const performanceComparisonData = {
    labels:
      timePeriod === 'monthly'
        ? [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ]
        : timePeriod === 'weekly'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        : timePeriod === 'daily'
        ? ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
        : ['2022', '2023', '2024'],
    datasets: [
      {
        label: 'Successful Campaigns',
        data:
          timePeriod === 'monthly'
            ? [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170]
            : timePeriod === 'weekly'
            ? [20, 30, 40, 50]
            : timePeriod === 'daily'
            ? [10, 20, 30, 40, 50, 60, 70]
            : [100, 120, 150],
        backgroundColor: '#66BB6A',
      },
      {
        label: 'Unsuccessful Campaigns',
        data:
          timePeriod === 'monthly'
            ? [40, 30, 20, 10, 0, 5, 10, 20, 15, 10, 5, 0]
            : timePeriod === 'weekly'
            ? [10, 5, 2, 0]
            : timePeriod === 'daily'
            ? [5, 10, 15, 20, 10, 5, 0]
            : [30, 40, 50],
        backgroundColor: '#FF7043',
      },
    ],
  };

  // Handle the dropdown change event for Time Period
  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
  };

  // Handle Date From Change
  const handleDateFromChange = (event) => {
    setDateFrom(event.target.value);
  };

  // Handle Date To Change
  const handleDateToChange = (event) => {
    setDateTo(event.target.value);
  };

  // Handle Branch Filter Change
  const handleBranchChange = (event) => {
    setBranch(event.target.value);
  };

  // Function to get color for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#4CAF50'; // Green
      case 'Pending':
        return '#FF9800'; // Orange
      case 'Failed':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ marginBottom: '60px', fontSize: '40px' }}
      >
        | Dashboard
        <Typography variant="body2" sx={{ fontSize: '12px', marginBottom: '30px' }}>
          Overview of the entire system.
        </Typography>
      </Typography>

      {/* Top Controls: Time Period, Date Pickers, and Branch Filter */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              label="Time Period"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Date Picker for From Date */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Date Picker for To Date */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="To Date"
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Branch Filter Dropdown placed on the top right */}
        <Grid item xs={12} sm={6} md={3} sx={{ marginLeft: 'auto' }}>
          <FormControl fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branch}
              onChange={handleBranchChange}
              label="Branch"
            >
              {branchOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Key Metrics Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Emails Sent (Members) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#42A5F5', height: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <Person sx={{ fontSize: 40, marginRight: '10px', color: 'white' }} />
                Members
              </Typography>
              <Typography variant="h5" sx={{ color: 'white' }}>
                {loading ? <CircularProgress size={24} /> : keyMetrics.totalEmailsSent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* New Clients */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#FFB74D', height: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <People sx={{ fontSize: 40, marginRight: '10px', color: 'white' }} /> New Members
              </Typography>
              <Typography variant="h5" sx={{ color: 'white' }}>
                {loading ? <CircularProgress size={24} /> : keyMetrics.totalClients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Traffic Received */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#9C27B0', height: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <DirectionsRun sx={{ fontSize: 40, marginRight: '10px', color: 'white' }} /> Attendance
              </Typography>
              <Typography variant="h5" sx={{ color: 'white' }}>
                {loading ? <CircularProgress size={24} /> : keyMetrics.trafficReceived}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Trends and Recent Transactions side by side */}
      <Grid container spacing={3}>
    

        {/* Recent Transactions (Table) */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>
                      Transaction ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#424242' }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.slice(0, 8).map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      sx={{ '&:hover': { backgroundColor: 'black' } }}
                    >
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>${transaction.amount}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: getStatusColor(transaction.status),
                            fontWeight: 'bold',
                          }}
                        >
                          {transaction.status}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Campaign Performance and Notifications side by side */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Campaign Performance (Bar Chart) */}
        

        {/* Notifications */}
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.slice(0, 8).map((notification, index) => (
                <Card
                  key={index}
                  sx={{ mb: 2, backgroundColor: '#F5F5F5', padding: '10px' }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationImportant sx={{ color: '#FF9800', marginRight: '10px' }} />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', color: '#424242' }}
                    >
                      {notification.message}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
