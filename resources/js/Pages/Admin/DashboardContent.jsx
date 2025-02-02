import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  MonetizationOn,
  Dashboard,
  AttachMoney,
  Paid,
  PersonAdd,
  TrendingUp,
  PieChart,
  ShowChart,
} from '@mui/icons-material';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Tabs: 0 = Overview, 1 = Daily Cash Flow
  const [activeTab, setActiveTab] = useState(0);

  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overview states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState('0%');
  const [mostPopularService, setMostPopularService] = useState('N/A');

  // Staff & Branch data
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);

  // All flows
  const [allFlows, setAllFlows] = useState([]);
  // Filtered flows for the date filter
  const [filteredFlows, setFilteredFlows] = useState([]);
  // Separate arrays for each business
  const [gymFlows, setGymFlows] = useState([]);
  const [cafeFlows, setCafeFlows] = useState([]);
  const [yogurtFlows, setYogurtFlows] = useState([]);
  const [overallFlows, setOverallFlows] = useState([]);

  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Chart data
  const [overallChartData, setOverallChartData] = useState(null);
  const [paymentMethodPie, setPaymentMethodPie] = useState(null);
  const [gymChartData, setGymChartData] = useState(null);
  const [cafeChartData, setCafeChartData] = useState(null);
  const [yogurtChartData, setYogurtChartData] = useState(null);

  // Manual entry form
  const [cashFlowForm, setCashFlowForm] = useState({
    BranchID: '',
    BusinessType: '',
    Date: '',
    CashSales: '',
    GCashSales: '',
    BPISales: '',
    BDOSales: '',
    WalkInCashSales: '',
    WalkInGCashSales: '',
    WalkInBPISales: '',
    WalkInBDOSales: '',
    PettyCash: '',
    DepositedAmount: '',
    Remarks: '',
  });
  const [yesterdayPettyCash, setYesterdayPettyCash] = useState(0);

  // For auto-generate Gym flow
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // New Overall flow dialog state
  const [openOverallDialog, setOpenOverallDialog] = useState(false);
  const [overallInput, setOverallInput] = useState({
    pettyDeduction: '',
    deposited: false,
  });
  const [computedOverallTotal, setComputedOverallTotal] = useState(0);

  // Switch tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // On mount: load summaries, staff, branches, flows
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [summaryRes, staffRes, branchRes, cfRes] = await Promise.all([
          axios.get('/finance/summary'),
          axios.get('/staff'),
          axios.get('/owner/branches'),
          axios.get('/finance/cashflow'),
        ]);

        // Summaries
        const summary = summaryRes.data || {};
        setTotalRevenue(summary.total_revenue || 0);
        setNetProfit(summary.net_profit || 0);
        setNewMembersThisMonth(summary.new_members_this_month || 0);
        setAttendanceRate(summary.attendance_rate || '0%');
        setMostPopularService(summary.most_popular_service || 'N/A');

        // Staff & Branches
        setStaff(staffRes.data.staff || []);
        setBranches(branchRes.data.branches || branchRes.data || []);

        // Flows
        const flows = cfRes.data.flows || [];
        setAllFlows(flows);
        setFilteredFlows(flows); // no filter initially

        // Build initial charts and separate flows by business
        buildOverallChart(flows);
        buildPaymentPie(flows);
        buildBusinessCharts(flows);
        separateByBusiness(flows);
      } catch (err) {
        console.error(err);
        setError('Failed to load data from server.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Build overall daily total chart
  const buildOverallChart = (flows) => {
    const grouped = flows.reduce((acc, f) => {
      const d = f.Date;
      if (!acc[d]) acc[d] = 0;
      acc[d] += Number(f.TotalSales || 0);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    const data = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Overall Daily Total',
          data: sortedDates.map((d) => grouped[d]),
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
        },
      ],
    };
    setOverallChartData(data);
  };

  // Build payment method pie chart (combined)
  const buildPaymentPie = (flows) => {
    let cash = 0,
      gcash = 0,
      bpi = 0,
      bdo = 0;
    flows.forEach((f) => {
      cash += Number(f.CashSales || 0) + Number(f.WalkInCashSales || 0);
      gcash += Number(f.GCashSales || 0) + Number(f.WalkInGCashSales || 0);
      bpi += Number(f.BPISales || 0) + Number(f.WalkInBPISales || 0);
      bdo += Number(f.BDOSales || 0) + Number(f.WalkInBDOSales || 0);
    });
    const data = {
      labels: ['Cash', 'GCash', 'BPI', 'BDO'],
      datasets: [
        {
          data: [cash, gcash, bpi, bdo],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF9F40'],
        },
      ],
    };
    setPaymentMethodPie(data);
  };

  // Build business-specific charts for Gym, Cafe, Yogurt
  const buildBusinessCharts = (flows) => {
    const gym = flows.filter((f) => f.BusinessType === 'Gym');
    const cafe = flows.filter((f) => f.BusinessType === 'Cafe');
    const yogurt = flows.filter((f) => f.BusinessType === 'Yogurt');

    const buildChart = (arr, label) => {
      const grouped = arr.reduce((acc, f) => {
        const d = f.Date;
        if (!acc[d]) {
          acc[d] = { cash: 0, gcash: 0, bpi: 0, bdo: 0 };
        }
        acc[d].cash += Number(f.CashSales || 0) + Number(f.WalkInCashSales || 0);
        acc[d].gcash += Number(f.GCashSales || 0) + Number(f.WalkInGCashSales || 0);
        acc[d].bpi += Number(f.BPISales || 0) + Number(f.WalkInBPISales || 0);
        acc[d].bdo += Number(f.BDOSales || 0) + Number(f.WalkInBDOSales || 0);
        return acc;
      }, {});

      const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
      return {
        labels: sortedDates,
        datasets: [
          {
            label: `${label} - Cash`,
            data: sortedDates.map((d) => grouped[d].cash),
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
          },
          {
            label: `${label} - GCash`,
            data: sortedDates.map((d) => grouped[d].gcash),
            borderColor: '#9966FF',
            backgroundColor: 'rgba(153,102,255,0.2)',
            fill: true,
          },
          {
            label: `${label} - BPI`,
            data: sortedDates.map((d) => grouped[d].bpi),
            borderColor: '#FFCE56',
            backgroundColor: 'rgba(255,206,86,0.2)',
            fill: true,
          },
          {
            label: `${label} - BDO`,
            data: sortedDates.map((d) => grouped[d].bdo),
            borderColor: '#FF9F40',
            backgroundColor: 'rgba(255,159,64,0.2)',
            fill: true,
          },
        ],
      };
    };

    setGymChartData(buildChart(gym, 'Gym'));
    setCafeChartData(buildChart(cafe, 'Cafe'));
    setYogurtChartData(buildChart(yogurt, 'Yogurt'));
  };

  // Separate flows by business
  const separateByBusiness = (arr) => {
    const gym = arr.filter((f) => f.BusinessType === 'Gym');
    const cafe = arr.filter((f) => f.BusinessType === 'Cafe');
    const yogurt = arr.filter((f) => f.BusinessType === 'Yogurt');
    const overall = arr.filter((f) => f.BusinessType === 'Overall');
    setGymFlows(gym);
    setCafeFlows(cafe);
    setYogurtFlows(yogurt);
    setOverallFlows(overall);
  };

  // Filter flows by date range
  const applyDateFilter = (flows, start, end) => {
    if (!start && !end) return flows;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    return flows.filter((f) => {
      const d = new Date(f.Date);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
  };

  const handleFilter = () => {
    const newFiltered = applyDateFilter(allFlows, startDate, endDate);
    setFilteredFlows(newFiltered);
    buildOverallChart(newFiltered);
    buildPaymentPie(newFiltered);
    buildBusinessCharts(newFiltered);
    separateByBusiness(newFiltered);
  };

  // Listen for changes to BranchID, Date, BusinessType in manual form for petty cash calculation
  useEffect(() => {
    const { BranchID, Date, BusinessType } = cashFlowForm;
    if (BranchID && Date && BusinessType) {
      fetchYesterdaysPettyCash(BranchID, Date, BusinessType);
    } else {
      setYesterdayPettyCash(0);
    }
  }, [cashFlowForm.BranchID, cashFlowForm.Date, cashFlowForm.BusinessType]);

  const fetchYesterdaysPettyCash = (branchID, dateStr, businessType) => {
    if (!branchID || !dateStr || !businessType) return;
    const dateObj = new Date(dateStr);
    const yesterObj = new Date(dateObj.getTime() - 86400000);
    const yyyy = yesterObj.getFullYear();
    const mm = String(yesterObj.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterObj.getDate()).padStart(2, '0');
    const yDate = `${yyyy}-${mm}-${dd}`;

    const match = allFlows.find(
      (f) =>
        Number(f.BranchID) === Number(branchID) &&
        f.BusinessType === businessType &&
        f.Date === yDate
    );
    if (match && match.PettyCash !== undefined) {
      setYesterdayPettyCash(Number(match.PettyCash) || 0);
    } else {
      setYesterdayPettyCash(0);
    }
  };

  const effectivePettyCash = () => {
    const inputVal = parseFloat(cashFlowForm.PettyCash) || 0;
    return yesterdayPettyCash + inputVal;
  };

  // Manual form change handler
  const handleCashFlowChange = (e) => {
    const { name, value } = e.target;
    setCashFlowForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCashFlowSubmit = async () => {
    try {
      await axios.post('/finance/cashflow', { ...cashFlowForm });
      alert('Daily cash flow entry created successfully!');
      // Reload flows
      const cfRes = await axios.get('/finance/cashflow');
      const flows = cfRes.data.flows || [];
      setAllFlows(flows);
      const newFiltered = applyDateFilter(flows, startDate, endDate);
      setFilteredFlows(newFiltered);
      buildOverallChart(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);
      separateByBusiness(newFiltered);
      // Reset form
      setCashFlowForm({
        BranchID: '',
        BusinessType: '',
        Date: '',
        CashSales: '',
        GCashSales: '',
        BPISales: '',
        BDOSales: '',
        WalkInCashSales: '',
        WalkInGCashSales: '',
        WalkInBPISales: '',
        WalkInBDOSales: '',
        PettyCash: '',
        DepositedAmount: '',
        Remarks: '',
      });
      setYesterdayPettyCash(0);
    } catch (err) {
      console.error('Error creating daily flow:', err);
      alert('Failed to create daily cash flow entry.');
    }
  };

  // Auto-generate Gym flow
  const handleGenerateCashFlow = async () => {
    try {
      const formatted = selectedDate.toISOString().substring(0, 10);
      await axios.post('/finance/generate-cashflow', {
        date: formatted,
        branch_id: selectedBranchId,
      });
      alert('Gym daily cash flow generated!');
      handleFilter();
    } catch (err) {
      console.error(err);
      alert('Failed to generate gym daily flow');
    }
  };

  // NEW: Overall Flow Generation
  // When manager clicks this, we compute overall totals for the current day (from Gym, Cafe, Yogurt),
  // then open a dialog to collect petty cash deduction and deposit status.
  const handleOpenOverallDialog = () => {
    const today = new Date().toISOString().substring(0, 10);
    // Sum totals for flows from today that are NOT Overall (i.e. Gym, Cafe, Yogurt)
    const overallTotal = allFlows
      .filter((f) => f.Date === today && f.BusinessType !== 'Overall')
      .reduce((sum, f) => sum + parseFloat(f.TotalSales || "0.00"), 0);
    setComputedOverallTotal(overallTotal);
    setOpenOverallDialog(true);
  };

  const handleCloseOverallDialog = () => {
    setOpenOverallDialog(false);
    setOverallInput({ pettyDeduction: '', deposited: false });
  };

  const handleOverallInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOverallInput((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmitOverallFlow = async () => {
    // Calculate the final overall total: overallTotal minus petty deduction
    const petty = parseFloat(overallInput.pettyDeduction) || 0;
    const finalTotal = computedOverallTotal - petty;
    try {
      // Post an "Overall" record to the server.
      // You may adjust endpoint and payload as needed.
      await axios.post('/finance/cashflow', {
        BranchID: selectedBranchId || (branches[0] && branches[0].BranchID), // default branch if not selected
        Date: new Date().toISOString().substring(0, 10),
        BusinessType: 'Overall',
        CashSales: 0,
        GCashSales: 0,
        BPISales: 0,
        BDOSales: 0,
        WalkInCashSales: 0,
        WalkInGCashSales: 0,
        WalkInBPISales: 0,
        WalkInBDOSales: 0,
        TotalSales: finalTotal,
        PettyCash: petty,
        DepositedAmount: overallInput.deposited ? finalTotal : 0,
        Remarks: overallInput.deposited
          ? 'Overall flow generated; money deposited to owner.'
          : 'Overall flow generated; pending deposit.',
      });
      alert('Overall daily cash flow record created successfully!');
      handleCloseOverallDialog();
      // Reload flows
      const cfRes = await axios.get('/finance/cashflow');
      const flows = cfRes.data.flows || [];
      setAllFlows(flows);
      const newFiltered = applyDateFilter(flows, startDate, endDate);
      setFilteredFlows(newFiltered);
      buildOverallChart(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);
      separateByBusiness(newFiltered);
    } catch (err) {
      console.error(err);
      alert('Failed to create overall daily cash flow record.');
    }
  };

  // DataGrid columns (expanded) with optional chaining & parsing
  const flowColumns = [
    { field: 'Date', headerName: 'Date', width: 110 },
    { field: 'BranchID', headerName: 'Branch', width: 100 },
    { field: 'BusinessType', headerName: 'Type', width: 120 },
    { field: 'CashSales', headerName: 'Cash', width: 80 },
    { field: 'GCashSales', headerName: 'GCash', width: 80 },
    { field: 'BPISales', headerName: 'BPI', width: 80 },
    { field: 'BDOSales', headerName: 'BDO', width: 80 },
    { field: 'WalkInCashSales', headerName: 'W-In Cash', width: 90 },
    { field: 'WalkInGCashSales', headerName: 'W-In GCash', width: 100 },
    { field: 'WalkInBPISales', headerName: 'W-In BPI', width: 90 },
    { field: 'WalkInBDOSales', headerName: 'W-In BDO', width: 90 },
    { field: 'TotalSales', headerName: 'Total', width: 80 },
    { field: 'PettyCash', headerName: 'PettyCash', width: 90 },
    { field: 'DepositedAmount', headerName: 'Deposited', width: 90 },
    { field: 'Remarks', headerName: 'Remarks', width: 160 },
  ];
  
  const flowRows = filteredFlows.map((flow, i) => ({
    id: i,
    Date: flow.Date || '',
    BranchID: flow.BranchID || '',
    BusinessType: flow.BusinessType || '',
    CashSales: flow.CashSales ? parseFloat(flow.CashSales) : 0,
    GCashSales: flow.GCashSales ? parseFloat(flow.GCashSales) : 0,
    BPISales: flow.BPISales ? parseFloat(flow.BPISales) : 0,
    BDOSales: flow.BDOSales ? parseFloat(flow.BDOSales) : 0,
    WalkInCashSales: flow.WalkInCashSales ? parseFloat(flow.WalkInCashSales) : 0,
    WalkInGCashSales: flow.WalkInGCashSales ? parseFloat(flow.WalkInGCashSales) : 0,
    WalkInBPISales: flow.WalkInBPISales ? parseFloat(flow.WalkInBPISales) : 0,
    WalkInBDOSales: flow.WalkInBDOSales ? parseFloat(flow.WalkInBDOSales) : 0,
    TotalSales: flow.TotalSales ? parseFloat(flow.TotalSales) : 0,
    PettyCash: flow.PettyCash ? parseFloat(flow.PettyCash) : 0,
    DepositedAmount: flow.DepositedAmount ? parseFloat(flow.DepositedAmount) : 0,
    Remarks: flow.Remarks || '',
  }));
  
  

  // Sub-tables for each business
  const gymRows = gymFlows.map((f, idx) => ({ id: `gym-${idx}`, ...f }));
  const cafeRows = cafeFlows.map((f, idx) => ({ id: `cafe-${idx}`, ...f }));
  const yogurtRows = yogurtFlows.map((f, idx) => ({ id: `yogurt-${idx}`, ...f }));
  const overallRows = overallFlows.map((f, idx) => ({ id: `overall-${idx}`, ...f }));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: darkMode ? theme.palette.background.default : '#f0f2f5',
        py: 4,
        px: { xs: 2, sm: 4 },
        transition: 'background 0.5s ease',
      }}
    >
      {/* Animated header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: 2,
          mb: 4,
          p: { xs: 2, sm: 4 },
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ color: '#fff', mr: 1 }}>
            <Dashboard />
          </IconButton>
          Continental Gym Admin Dashboard
        </Typography>
        <Typography variant="subtitle1">
          A detailed overview of all business operations and daily cash flows
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" icon={<TrendingUp />} />
        <Tab label="Daily Cash Flow" icon={<MonetizationOn />} />
      </Tabs>

      {error && (
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 0 && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                {/* SUMMARY CARDS */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 3, borderLeft: '5px solid #4BC0C0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoney sx={{ fontSize: 40, color: '#4BC0C0', mr: 1 }} />
                        <Box>
                          <Typography variant="h6">Total Revenue</Typography>
                          <Typography variant="h5">
                            ${parseFloat(totalRevenue).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 3, borderLeft: '5px solid #FF9F40' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Paid sx={{ fontSize: 40, color: '#FF9F40', mr: 1 }} />
                        <Box>
                          <Typography variant="h6">Net Profit</Typography>
                          <Typography variant="h5">
                            ${parseFloat(netProfit).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 3, borderLeft: '5px solid #9966FF' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAdd sx={{ fontSize: 40, color: '#9966FF', mr: 1 }} />
                        <Box>
                          <Typography variant="h6">New Members</Typography>
                          <Typography variant="h5">{newMembersThisMonth}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 3, borderLeft: '5px solid #FFCE56' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShowChart sx={{ fontSize: 40, color: '#FFCE56', mr: 1 }} />
                        <Box>
                          <Typography variant="h6">Attendance Rate</Typography>
                          <Typography variant="h5">{attendanceRate}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* CHARTS */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: 400, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Daily Cash Flow
                    </Typography>
                    <Box sx={{ height: '80%' }}>
                      {overallChartData ? (
                        <Line
                          data={overallChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } },
                          }}
                        />
                      ) : (
                        <Typography>Loading chart...</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 400, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Payment Method Breakdown (All Biz)
                    </Typography>
                    <Box sx={{ height: '80%' }}>
                      {paymentMethodPie ? (
                        <Pie
                          data={paymentMethodPie}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } },
                          }}
                        />
                      ) : (
                        <Typography>Loading pie chart...</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Per-Business charts */}
                <Grid item xs={12}>
                  <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
                    Payment Breakdown by Business
                  </Typography>
                  <Divider />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Gym Payment Methods
                    </Typography>
                    {gymChartData ? (
                      <Line
                        data={gymChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } },
                        }}
                      />
                    ) : (
                      <Typography>Loading...</Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Cafe Payment Methods
                    </Typography>
                    {cafeChartData ? (
                      <Line
                        data={cafeChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } },
                        }}
                      />
                    ) : (
                      <Typography>Loading...</Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Yogurt Payment Methods
                    </Typography>
                    {yogurtChartData ? (
                      <Line
                        data={yogurtChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } },
                        }}
                      />
                    ) : (
                      <Typography>Loading...</Typography>
                    )}
                  </Paper>
                </Grid>

                {/* NEW: Overall Generation Button */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, boxShadow: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Generate Overall Daily Cash Flow
                    </Typography>
                    <Button variant="contained" color="primary" onClick={handleOpenOverallDialog}>
                      Generate Overall Flow
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* DAILY CASH FLOW TAB - Detailed Tables & Manual Entry */}
          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
              {/* Filter Section */}
              <Paper sx={{ p: 3, boxShadow: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Filter Daily Cash Flow
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button variant="contained" onClick={handleFilter} sx={{ mt: 1 }}>
                      Filter
                    </Button>
                  </Grid>
                </Grid>

                {/* Combined Table */}
                <Typography variant="h6" gutterBottom>
                  All Businesses (Combined)
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={flowRows}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                {/* Gym Table */}
                <Typography variant="h6" gutterBottom>
                  Gym Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={gymRows}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                {/* Cafe Table */}
                <Typography variant="h6" gutterBottom>
                  Cafe Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={cafeRows}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                {/* Yogurt Table */}
                <Typography variant="h6" gutterBottom>
                  Yogurt Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={yogurtRows}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                {/* Overall Table */}
                <Typography variant="h6" gutterBottom>
                  Overall (Petty Cash) Records
                </Typography>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={overallRows}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>
              </Paper>

              {/* Manual Entry */}
              <Paper sx={{ p: 3, boxShadow: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Record a New Daily Cash Flow Entry
                </Typography>
                <Grid container spacing={2}>
                  {/* Branch */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      select
                      label="Branch"
                      name="BranchID"
                      value={cashFlowForm.BranchID}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                      SelectProps={{ native: true }}
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map((b) => (
                        <option key={b.BranchID} value={b.BranchID}>
                          {b.BranchName || `Branch #${b.BranchID}`}
                        </option>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Business Type */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Business Type</InputLabel>
                      <Select
                        name="BusinessType"
                        label="Business Type"
                        value={cashFlowForm.BusinessType}
                        onChange={handleCashFlowChange}
                      >
                        <MenuItem value=""><em>-- Select --</em></MenuItem>
                        <MenuItem value="Gym">Gym</MenuItem>
                        <MenuItem value="Cafe">Cafe</MenuItem>
                        <MenuItem value="Yogurt">Yogurt</MenuItem>
                        <MenuItem value="Overall">Overall (Petty Cash)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Date */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      name="Date"
                      value={cashFlowForm.Date}
                      onChange={handleCashFlowChange}
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* Cash Sales */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cash Sales"
                      name="CashSales"
                      value={cashFlowForm.CashSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* GCash Sales */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="GCash Sales"
                      name="GCashSales"
                      value={cashFlowForm.GCashSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* BPI Sales */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="BPI Sales"
                      name="BPISales"
                      value={cashFlowForm.BPISales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* BDO Sales */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="BDO Sales"
                      name="BDOSales"
                      value={cashFlowForm.BDOSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* Walk-In Sales */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Walk-In Cash Sales"
                      name="WalkInCashSales"
                      value={cashFlowForm.WalkInCashSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Walk-In GCash Sales"
                      name="WalkInGCashSales"
                      value={cashFlowForm.WalkInGCashSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Walk-In BPI Sales"
                      name="WalkInBPISales"
                      value={cashFlowForm.WalkInBPISales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Walk-In BDO Sales"
                      name="WalkInBDOSales"
                      value={cashFlowForm.WalkInBDOSales}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* Petty Cash (Overall only) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Petty Cash"
                      name="PettyCash"
                      value={cashFlowForm.PettyCash}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                      disabled={cashFlowForm.BusinessType !== 'Overall'}
                    />
                  </Grid>

                  {/* Effective Petty Cash */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Effective Petty Cash"
                      value={effectivePettyCash()}
                      variant="outlined"
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  {/* Deposited Amount (Overall only) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Deposited Amount"
                      name="DepositedAmount"
                      value={cashFlowForm.DepositedAmount}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                      disabled={cashFlowForm.BusinessType !== 'Overall'}
                    />
                  </Grid>

                  {/* Remarks */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Remarks"
                      name="Remarks"
                      value={cashFlowForm.Remarks}
                      onChange={handleCashFlowChange}
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {/* Submit */}
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={handleCashFlowSubmit}>
                      Submit Cash Flow Entry
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Auto-Generate Gym */}
              <Paper sx={{ p: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Generate Today's Gym Cash Flow Automatically
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="branchSelectLabel">Branch</InputLabel>
                      <Select
                        labelId="branchSelectLabel"
                        label="Branch"
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>-- Select Branch --</em>
                        </MenuItem>
                        {branches.map((b) => (
                          <MenuItem key={b.BranchID} value={b.BranchID}>
                            {b.BranchName || `Branch #${b.BranchID}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={selectedDate.toISOString().substr(0, 10)}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleGenerateCashFlow}
                      disabled={!selectedBranchId}
                    >
                      Generate Gym Daily Cash Flow
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </>
      )}

      {/* Overall Flow Dialog */}
      <Dialog open={openOverallDialog} onClose={handleCloseOverallDialog}>
        <DialogTitle>Generate Overall Daily Cash Flow</DialogTitle>
        <DialogContent>
          <Typography>
            Computed Overall Total from Gym, Cafe, and Yogurt: ${computedOverallTotal.toLocaleString()}
          </Typography>
          <TextField
            fullWidth
            label="Petty Cash Deduction"
            name="pettyDeduction"
            type="number"
            value={overallInput.pettyDeduction}
            onChange={handleOverallInputChange}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={overallInput.deposited}
                onChange={handleOverallInputChange}
                name="deposited"
              />
            }
            label="Deposited to owner"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOverallDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmitOverallFlow} variant="contained" color="primary">
            Submit Overall Flow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
