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
  TableRow,
  useTheme
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
  ArcElement
} from 'chart.js';
import axios from 'axios';
import {
  Person,
  AttachMoney,
  People,
  DirectionsRun,
  NotificationImportant,
  History as HistoryIcon
} from '@mui/icons-material';

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

export default function DashboardContent() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Set background gradient based on theme mode
  const bgGradient = darkMode
   
  // States
  const [keyMetrics, setKeyMetrics] = useState({
    totalRevenue: 0,
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

  // Fetch Daily Cash Flow data for Revenue Trends
  useEffect(() => {
    const fetchCashFlows = async () => {
      try {
        const response = await axios.get(
          `/finance/cashflow?dateFrom=${dateFrom}&dateTo=${dateTo}&branch=${branch}`
        );
        const sortedFlows = response.data.flows.sort(
          (a, b) => new Date(a.Date) - new Date(b.Date)
        );
        setCashFlows(sortedFlows);
      } catch (error) {
        console.error('Error fetching cash flows:', error);
      }
    };
    fetchCashFlows();
  }, [dateFrom, dateTo, branch]);

  // Build Revenue Trends chart data
  const revenueChartData = {
    labels: cashFlows.map(flow => flow.Date),
    datasets: [
      {
        label: 'Revenue',
        data: cashFlows.map(flow => Number(flow.TotalSales)),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        fill: false,
      },
    ],
  };

  // Handlers for filters
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);
  const handleBranchChange = (e) => setBranch(e.target.value);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#4CAF50';
      case 'Pending': return '#FF9800';
      case 'Failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

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
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Key Metrics Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Total Members */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#42A5F5", borderRadius: 2, boxShadow: 3, display: "flex", alignItems: "center", p: 1.5 }}>
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

          {/* Revenue Generated */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#66BB6A", borderRadius: 2, boxShadow: 3, display: "flex", alignItems: "center", p: 1.5 }}>
              <AttachMoney sx={{ fontSize: 30, color: "white", mr: 1.5 }} />
              <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" sx={{ color: "white", mb: 0.5 }}>
                  Revenue
                </Typography>
                <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : `₱${keyMetrics.totalRevenue.toLocaleString()}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* New Members */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#FFB74D", borderRadius: 2, boxShadow: 3, display: "flex", alignItems: "center", p: 1.5 }}>
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

          {/* Attendance */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: "#9C27B0", borderRadius: 2, boxShadow: 3, display: "flex", alignItems: "center", p: 1.5 }}>
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


      {/* Revenue Trends & Recent Transactions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.text.primary }}>
              Revenue Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={revenueChartData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.text.primary }}>
              Recent Transactions
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2, backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: darkMode ? theme.palette.grey[800] : '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Transaction ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.slice(0, 8).map(transaction => (
                    <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>₱{transaction.amount}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Typography sx={{ color: getStatusColor(transaction.status), fontWeight: 'bold' }}>
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

      {/* Current Promotions & System Logs */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.text.primary }}>
              Current Promotions
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2, backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: darkMode ? theme.palette.grey[800] : '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Promotion Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Valid Till</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPromotions.map(promo => (
                    <TableRow key={promo.PromotionID}>
                      <TableCell>{promo.Name}</TableCell>
                      <TableCell>{promo.DiscountType} - {promo.DiscountValue}</TableCell>
                      <TableCell>{promo.EndDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', backgroundColor: darkMode ? theme.palette.background.paper : '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.text.primary }}>
              System Logs
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {systemLogs.slice(0, 8).map((log, index) => (
                <Card key={index} sx={{ mb: 2, backgroundColor: darkMode ? theme.palette.grey[900] : '#F5F5F5', borderRadius: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ color: '#FF9800', mr: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                      {log.logId} - {log.actionDesc}
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
