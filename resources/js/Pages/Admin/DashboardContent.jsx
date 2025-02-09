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
import {
  Dashboard,
  PersonAdd,
  TrendingUp,
  ShowChart,
  ReceiptLong,
  TableView
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
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

// Create a custom "peso" icon component
const PesosIcon = ({ fontSize = 40, color = 'inherit', sx = {} }) => (
  <Typography
    component="span"
    sx={{ fontWeight: 'bold', fontSize, color, mr: 1, display: 'inline-block', ...sx }}
  >
    ₱
  </Typography>
);

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

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overview states
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState('0%');
  const [mostPopularService, setMostPopularService] = useState('N/A');

  // Staff & Branches
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);

  // All flows + filtered
  const [allFlows, setAllFlows] = useState([]);
  const [filteredFlows, setFilteredFlows] = useState([]);

  // Per-business sub-arrays
  const [gymFlows, setGymFlows] = useState([]);
  const [cafeFlows, setCafeFlows] = useState([]);
  const [yogurtFlows, setYogurtFlows] = useState([]);
  const [overallFlows, setOverallFlows] = useState([]);

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Charts
  const [overallChartData, setOverallChartData] = useState(null);
  const [paymentMethodPie, setPaymentMethodPie] = useState(null);
  const [gymChartData, setGymChartData] = useState(null);
  const [cafeChartData, setCafeChartData] = useState(null);
  const [yogurtChartData, setYogurtChartData] = useState(null);

  // Manual daily flow form
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
    DepositedAmount: '',
    Remarks: '',
  });

  // For auto-generate Gym
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Overall Flow Generation
  const [openOverallDialog, setOpenOverallDialog] = useState(false);
  const [overallInput, setOverallInput] = useState({ pettyDeduction: '', deposited: false });
  const [computedOverallTotal, setComputedOverallTotal] = useState(0);

  // Expenses
  const [allExpenses, setAllExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [expenseStartDate, setExpenseStartDate] = useState('');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    BranchID: '',
    ExpenseDate: '',
    ExpenseCategory: '',
    Amount: '',
    PaymentMethod: '',
    StaffID: '',
    Notes: '',
  });

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmitExpense = async () => {
    try {
      await axios.post('/finance/expenses', { ...expenseForm });
      alert('Expense created successfully!');
      setExpenseFormOpen(false);

      // Reload the expense list
      const expRes = await axios.get('/finance/expenses');
      const allExp = expRes.data.expenses || [];
      setAllExpenses(allExp);

      // Re-filter
      const newFiltered = applyDateFilter(allExp, expenseStartDate, expenseEndDate);
      setFilteredExpenses(newFiltered);
    } catch (err) {
      console.error('Failed to create expense:', err);
      alert('Error creating expense. Check console.');
    }
  };

  // Consolidated data
  const [consolidatedRows, setConsolidatedRows] = useState([]);
  const [selectedConsolidatedRow, setSelectedConsolidatedRow] = useState(null);

  // Petty Cash Dialog (Consolidated tab)
  const [pettyDialogOpen, setPettyDialogOpen] = useState(false);
  const [pettyForm, setPettyForm] = useState({
    pettyCash: '',
    depositedAmount: '',
    remarks: '',
  });

  const handleTabChange = (e, v) => setActiveTab(v);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, staffRes, branchRes, cfRes, expRes] = await Promise.all([
          axios.get('/finance/summary'),
          axios.get('/staff'),
          axios.get('/owner/branches'),
          axios.get('/finance/cashflow'),
          axios.get('/finance/expenses'),
        ]);

        // Summaries
        const summary = summaryRes.data || {};
        setTotalRevenue(summary.total_revenue || 0);
        setNetProfit(summary.net_profit || 0);
        setNewMembersThisMonth(summary.new_members_this_month || 0);
        setAttendanceRate(summary.attendance_rate || '0%');
        setMostPopularService(summary.most_popular_service || 'N/A');

        // Staff & Branches
        setStaff(staffRes.data.staff || staffRes.data || []);
        setBranches(branchRes.data.branches || branchRes.data || []);

        // Flows
        const flows = cfRes.data.flows || [];
        setAllFlows(flows);
        setFilteredFlows(flows);
        buildOverallChart(flows);
        buildPaymentPie(flows);
        buildBusinessCharts(flows);
        separateByBusiness(flows);

        // Expenses
        const allExp = expRes.data.expenses || [];
        setAllExpenses(allExp);
        setFilteredExpenses(allExp);
      } catch (err) {
        console.error(err);
        setError('Failed to load data from server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    buildConsolidatedRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFlows, allExpenses]);

  // Chart builders, flow grouping, etc.
  const buildOverallChart = (flows) => {
    const grouped = flows.reduce((acc, f) => {
      const d = f.Date;
      if (!acc[d]) acc[d] = 0;
      acc[d] += parseFloat(f.TotalSales || 0);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    setOverallChartData({
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
    });
  };

  const buildPaymentPie = (flows) => {
    let cash = 0, gcash = 0, bpi = 0, bdo = 0;
    flows.forEach((f) => {
      cash += parseFloat(f.CashSales || 0) + parseFloat(f.WalkInCashSales || 0);
      gcash += parseFloat(f.GCashSales || 0) + parseFloat(f.WalkInGCashSales || 0);
      bpi += parseFloat(f.BPISales || 0) + parseFloat(f.WalkInBPISales || 0);
      bdo += parseFloat(f.BDOSales || 0) + parseFloat(f.WalkInBDOSales || 0);
    });
    setPaymentMethodPie({
      labels: ['Cash', 'GCash', 'BPI', 'BDO'],
      datasets: [
        {
          data: [cash, gcash, bpi, bdo],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF9F40'],
        },
      ],
    });
  };

  const buildBusinessCharts = (flows) => {
    const gym = flows.filter((f) => f.BusinessType === 'Gym');
    const cafe = flows.filter((f) => f.BusinessType === 'Cafe');
    const yogurt = flows.filter((f) => f.BusinessType === 'Yogurt');

    function buildChart(arr, label) {
      const grouped = arr.reduce((acc, f) => {
        const d = f.Date;
        if (!acc[d]) {
          acc[d] = { cash: 0, gcash: 0, bpi: 0, bdo: 0 };
        }
        acc[d].cash += parseFloat(f.CashSales || 0) + parseFloat(f.WalkInCashSales || 0);
        acc[d].gcash += parseFloat(f.GCashSales || 0) + parseFloat(f.WalkInGCashSales || 0);
        acc[d].bpi += parseFloat(f.BPISales || 0) + parseFloat(f.WalkInBPISales || 0);
        acc[d].bdo += parseFloat(f.BDOSales || 0) + parseFloat(f.WalkInBDOSales || 0);
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
    }

    setGymChartData(buildChart(gym, 'Gym'));
    setCafeChartData(buildChart(cafe, 'Cafe'));
    setYogurtChartData(buildChart(yogurt, 'Yogurt'));
  };

  const separateByBusiness = (arr) => {
    setGymFlows(arr.filter((f) => f.BusinessType === 'Gym'));
    setCafeFlows(arr.filter((f) => f.BusinessType === 'Cafe'));
    setYogurtFlows(arr.filter((f) => f.BusinessType === 'Yogurt'));
    setOverallFlows(arr.filter((f) => f.BusinessType === 'Overall'));
  };

  function applyDateFilter(arr, start, end) {
    if (!start && !end) return arr;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    return arr.filter((f) => {
      const d = new Date(f.ExpenseDate || f.Date);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
  }

  const handleFilter = () => {
    const newFiltered = applyDateFilter(allFlows, startDate, endDate);
    setFilteredFlows(newFiltered);
    buildOverallChart(newFiltered);
    buildPaymentPie(newFiltered);
    buildBusinessCharts(newFiltered);
    separateByBusiness(newFiltered);
  };

  // Consolidated
  const buildConsolidatedRows = () => {
    const groupByDate = {};
    filteredFlows.forEach((flow) => {
      const d = flow.Date;
      if (!groupByDate[d]) {
        groupByDate[d] = {
          gym: 0,
          cafe: 0,
          yogurt: 0,
          overall: 0,
          pettyCash: 0,
          deposited: 0,
        };
      }
      const t = parseFloat(flow.TotalSales || 0);
      if (flow.BusinessType === 'Gym') {
        groupByDate[d].gym += t;
      } else if (flow.BusinessType === 'Cafe') {
        groupByDate[d].cafe += t;
      } else if (flow.BusinessType === 'Yogurt') {
        groupByDate[d].yogurt += t;
      } else if (flow.BusinessType === 'Overall') {
        groupByDate[d].overall += t;
        groupByDate[d].pettyCash = parseFloat(flow.PettyCash || 0);
        groupByDate[d].deposited = parseFloat(flow.DepositedAmount || 0);
      }
    });

    // sum expenses
    const expenseMap = {};
    allExpenses.forEach((exp) => {
      const dt = (exp.ExpenseDate || '').slice(0, 10);
      if (!expenseMap[dt]) expenseMap[dt] = 0;
      expenseMap[dt] += parseFloat(exp.Amount || 0);
    });

    const allDates = Object.keys(groupByDate).sort((a, b) => new Date(a) - new Date(b));
    const newRows = allDates.map((dateString, idx) => {
      const rec = groupByDate[dateString];
      const dailyExp = expenseMap[dateString] || 0;
      const totalAllBiz = rec.gym + rec.cafe + rec.yogurt + rec.overall;
      const netProfit = totalAllBiz - dailyExp;
      const takeHome = netProfit - rec.pettyCash;
      return {
        id: idx,
        Date: dateString,
        Gym: rec.gym,
        Cafe: rec.cafe,
        Yogurt: rec.yogurt,
        Overall: rec.overall,
        DailyExpenses: dailyExp,
        NetProfit: netProfit,
        PettyCash: rec.pettyCash,
        Deposited: rec.deposited,
        TakeHome: takeHome,
      };
    });
    setConsolidatedRows(newRows);
  };

  const consolidatedColumns = [
    { field: 'Date', headerName: 'Date', width: 110 },
    { field: 'Gym', headerName: 'Gym', width: 80 },
    { field: 'Cafe', headerName: 'Cafe', width: 80 },
    { field: 'Yogurt', headerName: 'Yogurt', width: 80 },
    { field: 'Overall', headerName: 'Overall', width: 80 },
    { field: 'DailyExpenses', headerName: 'Expenses', width: 90 },
    { field: 'PettyCash', headerName: 'PettyCash', width: 90 },
    { field: 'Deposited', headerName: 'Deposited', width: 90 },
    { field: 'NetProfit', headerName: 'Net Profit', width: 90 },
    { field: 'TakeHome', headerName: 'Take-Home', width: 100 },
  ];

  const handleConsolidatedRowClick = (params) => {
    setSelectedConsolidatedRow(params.row);
  };
  const openConsolidatedPettyDialog = () => {
    if (!selectedConsolidatedRow) return;
    setPettyForm({ pettyCash: '', depositedAmount: '', remarks: '' });
    setPettyDialogOpen(true);
  };
  const closeConsolidatedPettyDialog = () => {
    setPettyDialogOpen(false);
  };
  const handlePettyFormChange = (e) => {
    const { name, value } = e.target;
    setPettyForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmitConsolidatedPetty = async () => {
    if (!selectedConsolidatedRow) return;
    const petty = parseFloat(pettyForm.pettyCash) || 0;
    const deposit = parseFloat(pettyForm.depositedAmount) || 0;
    const dateStr = selectedConsolidatedRow.Date;

    try {
      await axios.post('/finance/cashflow', {
        BranchID: branches[0]?.BranchID,
        Date: dateStr,
        BusinessType: 'Overall',
        TotalSales: 0,
        PettyCash: petty,
        DepositedAmount: deposit,
        Remarks: pettyForm.remarks,
      });
      alert(`Petty Cash for ${dateStr} saved!`);
      setPettyDialogOpen(false);

      // Reload flows
      const cfRes = await axios.get('/finance/cashflow');
      const flows = cfRes.data.flows || [];
      setAllFlows(flows);

      // Re-apply date filter
      const newFiltered = applyDateFilter(flows, startDate, endDate);
      setFilteredFlows(newFiltered);
      buildOverallChart(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);
      separateByBusiness(newFiltered);
    } catch (err) {
      console.error(err);
      alert('Failed to set petty cash');
    }
  };

  const handleFilterExpenses = () => {
    const newFiltered = applyDateFilter(allExpenses, expenseStartDate, expenseEndDate);
    setFilteredExpenses(newFiltered);
  };

  // Manual flows
  const handleCashFlowChange = (e) => {
    const { name, value } = e.target;
    setCashFlowForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleCashFlowSubmit = async () => {
    try {
      await axios.post('/finance/cashflow', { ...cashFlowForm });
      alert('Daily cash flow entry created successfully!');
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
        DepositedAmount: '',
        Remarks: '',
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create daily cash flow entry.');
    }
  };

  // Auto-generate Gym
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

  // Overall Flow Generation
  const handleOpenOverallDialog = () => {
    const today = new Date().toISOString().substring(0, 10);
    const overallTotal = allFlows
      .filter((f) => f.Date === today && f.BusinessType !== 'Overall')
      .reduce((sum, f) => sum + parseFloat(f.TotalSales || 0), 0);
    setComputedOverallTotal(overallTotal);
    setOpenOverallDialog(true);
  };
  const handleCloseOverallDialog = () => {
    setOpenOverallDialog(false);
    setOverallInput({ pettyDeduction: '', deposited: false });
  };
  const handleOverallInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOverallInput((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleSubmitOverallFlow = async () => {
    const petty = parseFloat(overallInput.pettyDeduction) || 0;
    const finalTotal = computedOverallTotal - petty;
    try {
      await axios.post('/finance/cashflow', {
        BranchID: branches[0]?.BranchID,
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

  // DataGrid columns
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
    { field: 'DailyExpenses', headerName: 'Expenses', width: 90 },
    { field: 'NetProfit', headerName: 'Net Profit', width: 90 },
    { field: 'PettyCash', headerName: 'PettyCash', width: 90 },
    { field: 'TakeHome', headerName: 'Take-Home', width: 100 },
    { field: 'DepositedAmount', headerName: 'Deposited', width: 90 },
    { field: 'Remarks', headerName: 'Remarks', width: 160 },
  ];

  const flowRows = filteredFlows.map((flow, i) => {
    const dailyExpenses = allExpenses
      .filter(
        (exp) =>
          Number(exp.BranchID) === Number(flow.BranchID) &&
          (exp.ExpenseDate || '').slice(0, 10) === (flow.Date || '').slice(0, 10),
      )
      .reduce((acc, e) => acc + parseFloat(e.Amount || 0), 0);

    const totalSales = parseFloat(flow.TotalSales || 0);
    const netProfit = totalSales - dailyExpenses;
    const pettyCash = parseFloat(flow.PettyCash || 0);
    const takeHome = netProfit - pettyCash;

    return {
      id: i,
      Date: flow.Date || '',
      BranchID: flow.BranchID || '',
      BusinessType: flow.BusinessType || '',
      CashSales: parseFloat(flow.CashSales || 0),
      GCashSales: parseFloat(flow.GCashSales || 0),
      BPISales: parseFloat(flow.BPISales || 0),
      BDOSales: parseFloat(flow.BDOSales || 0),
      WalkInCashSales: parseFloat(flow.WalkInCashSales || 0),
      WalkInGCashSales: parseFloat(flow.WalkInGCashSales || 0),
      WalkInBPISales: parseFloat(flow.WalkInBPISales || 0),
      WalkInBDOSales: parseFloat(flow.WalkInBDOSales || 0),
      TotalSales: totalSales,
      DailyExpenses: dailyExpenses,
      NetProfit: netProfit,
      PettyCash: pettyCash,
      TakeHome: takeHome,
      DepositedAmount: parseFloat(flow.DepositedAmount || 0),
      Remarks: flow.Remarks || '',
    };
  });

  // Expense columns + rows
  const expenseColumns = [
    { field: 'ExpenseDate', headerName: 'Date', width: 110 },
    { field: 'BranchID', headerName: 'Branch', width: 100 },
    { field: 'ExpenseCategory', headerName: 'Category', width: 140 },
    { field: 'Amount', headerName: 'Amount', width: 100 },
    { field: 'PaymentMethod', headerName: 'Method', width: 100 },
    { field: 'StaffID', headerName: 'StaffID', width: 80 },
    { field: 'Notes', headerName: 'Notes', width: 160 },
  ];
  const expenseRows = filteredExpenses.map((exp, i) => ({
    id: exp.ExpenseID || `temp-${i}`,
    ExpenseDate: exp.ExpenseDate || '',
    BranchID: exp.BranchID || '',
    ExpenseCategory: exp.ExpenseCategory || '',
    Amount: parseFloat(exp.Amount || 0),
    PaymentMethod: exp.PaymentMethod || '',
    StaffID: exp.StaffID || '',
    Notes: exp.Notes || '',
  }));

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
        <Tab label="Daily Cash Flow" icon={<PesosIcon fontSize={24} sx={{ mb: '-4px' }} />} />
        <Tab label="Expenses" icon={<ReceiptLong />} />
        <Tab label="Consolidated" icon={<TableView />} />
      </Tabs>

      {error && (
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
        </Box>
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
                        <PesosIcon color="#4BC0C0" />
                        <Box>
                          <Typography variant="h6">Total Revenue</Typography>
                          <Typography variant="h5">
                            ₱{parseFloat(totalRevenue).toLocaleString()}
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
                        <PesosIcon color="#FF9F40" />
                        <Box>
                          <Typography variant="h6">Net Profit</Typography>
                          <Typography variant="h5">
                            ₱{parseFloat(netProfit).toLocaleString()}
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

                {/* Overall Generation Button */}
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

          {/* DAILY CASH FLOW TAB */}
          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
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

                <Typography variant="h6" gutterBottom>
                  Gym Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={flowRows.filter((r) => r.BusinessType === 'Gym')}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Cafe Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={flowRows.filter((r) => r.BusinessType === 'Cafe')}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Yogurt Cash Flow
                </Typography>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={flowRows.filter((r) => r.BusinessType === 'Yogurt')}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Overall (Petty Cash) Records
                </Typography>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={flowRows.filter((r) => r.BusinessType === 'Overall')}
                    columns={flowColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>
              </Paper>

              <Paper sx={{ p: 3, boxShadow: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Record a New Daily Cash Flow Entry
                </Typography>
                <Grid container spacing={2}>
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
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Business Type</InputLabel>
                      <Select
                        name="BusinessType"
                        label="Business Type"
                        value={cashFlowForm.BusinessType}
                        onChange={handleCashFlowChange}
                      >
                        <MenuItem value="">
                          <em>-- Select --</em>
                        </MenuItem>
                        <MenuItem value="Gym">Gym</MenuItem>
                        <MenuItem value="Cafe">Cafe</MenuItem>
                        <MenuItem value="Yogurt">Yogurt</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
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
                    />
                  </Grid>
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
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={handleCashFlowSubmit}>
                      Submit Cash Flow Entry
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

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

          {/* EXPENSES TAB */}
          {activeTab === 2 && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Expenses List
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={expenseStartDate}
                      onChange={(e) => setExpenseStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={expenseEndDate}
                      onChange={(e) => setExpenseEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button variant="contained" onClick={handleFilterExpenses} sx={{ mt: 1 }}>
                      Filter
                    </Button>
                  </Grid>
                </Grid>
                <Box sx={{ height: 400, mb: 4 }}>
                  <DataGrid
                    rows={expenseRows}
                    columns={expenseColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                  />
                </Box>
                <Button variant="contained" color="primary" onClick={() => setExpenseFormOpen(true)}>
                  Add New Expense
                </Button>
              </Paper>
            </Box>
          )}

          {/* CONSOLIDATED TAB */}
          {activeTab === 3 && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, mb: 2, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Consolidated Daily Table
                </Typography>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={consolidatedRows}
                    columns={consolidatedColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                    onRowClick={handleConsolidatedRowClick}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {selectedConsolidatedRow
                      ? `Selected Date: ${selectedConsolidatedRow.Date} 
                         NetProfit: ₱${selectedConsolidatedRow.NetProfit} 
                         PettyCash: ₱${selectedConsolidatedRow.PettyCash}`
                      : 'No date selected.'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1 }}
                    disabled={!selectedConsolidatedRow}
                    onClick={openConsolidatedPettyDialog}
                  >
                    Set Petty Cash for Selected Date
                  </Button>
                </Box>
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
            Computed Overall Total from Gym, Cafe, and Yogurt: ₱
            {computedOverallTotal.toLocaleString()}
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
          <Button variant="contained" color="primary" onClick={handleSubmitOverallFlow}>
            Submit Overall Flow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Petty Cash Dialog */}
      <Dialog open={pettyDialogOpen} onClose={closeConsolidatedPettyDialog} fullWidth maxWidth="sm">
        <DialogTitle>Set Petty Cash for {selectedConsolidatedRow?.Date || ''}</DialogTitle>
        <DialogContent dividers>
          {selectedConsolidatedRow && (
            <>
              <Typography gutterBottom>
                Net Profit: ₱{selectedConsolidatedRow.NetProfit} (Take Home before petty: ₱
                {selectedConsolidatedRow.TakeHome + selectedConsolidatedRow.PettyCash})
              </Typography>
            </>
          )}
          <TextField
            label="Petty Cash"
            name="pettyCash"
            type="number"
            value={pettyForm.pettyCash}
            onChange={handlePettyFormChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Deposited Amount"
            name="depositedAmount"
            type="number"
            value={pettyForm.depositedAmount}
            onChange={handlePettyFormChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Remarks"
            name="remarks"
            value={pettyForm.remarks}
            onChange={handlePettyFormChange}
            fullWidth
            multiline
            rows={2}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConsolidatedPettyDialog} color="secondary">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmitConsolidatedPetty}>
            Save Petty Cash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Expense Form Dialog */}
      <Dialog open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch"
                select
                fullWidth
                name="BranchID"
                value={expenseForm.BranchID}
                onChange={handleExpenseChange}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Expense Date"
                type="date"
                fullWidth
                name="ExpenseDate"
                value={expenseForm.ExpenseDate}
                onChange={handleExpenseChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Category"
                fullWidth
                name="ExpenseCategory"
                value={expenseForm.ExpenseCategory}
                onChange={handleExpenseChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                name="Amount"
                value={expenseForm.Amount}
                onChange={handleExpenseChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Payment Method"
                fullWidth
                name="PaymentMethod"
                value={expenseForm.PaymentMethod}
                onChange={handleExpenseChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Staff ID (optional)"
                fullWidth
                name="StaffID"
                value={expenseForm.StaffID}
                onChange={handleExpenseChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                name="Notes"
                value={expenseForm.Notes}
                onChange={handleExpenseChange}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseFormOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmitExpense}>
            Save Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
