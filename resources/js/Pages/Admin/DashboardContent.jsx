import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  Person,
  AttachMoney,
  People,
  DirectionsRun,
  NotificationImportant,
  History as HistoryIcon,
  TrendingUp,
  ReceiptLong,
  TableView,
  MiscellaneousServices
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
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
import { Line, Pie } from 'react-chartjs-2';

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

// Optional peso icon for tabs or anywhere you need a peso symbol
const PesosIcon = ({ fontSize = 24, color = 'inherit', sx = {} }) => (
  <Typography
    component="span"
    sx={{ fontWeight: 'bold', fontSize, color, mr: 0.5, display: 'inline-block', ...sx }}
  >
    ₱
  </Typography>
);

export default function OwnerDashboard() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Key metrics & logs
  const [keyMetrics, setKeyMetrics] = useState({
    totalRevenue: 0,
    totalEmailsSent: 0,
    totalClients: 0,
    trafficReceived: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [currentPromotions, setCurrentPromotions] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  // Branches & staff
  const [branchOptions, setBranchOptions] = useState([]);
  const [staff, setStaff] = useState([]);

  // Filters
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Cash flow & expenses
  const [allFlows, setAllFlows] = useState([]);
  const [filteredFlows, setFilteredFlows] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  // Dialogs for cash flow
  const [cashFlowDialogOpen, setCashFlowDialogOpen] = useState(false);
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
    PettyCash: '',
    Remarks: '',
  });

  // Generate Gym daily flow
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Overall flow
  const [openOverallDialog, setOpenOverallDialog] = useState(false);
  const [overallInput, setOverallInput] = useState({ pettyDeduction: '', deposited: false });
  const [computedOverallTotal, setComputedOverallTotal] = useState(0);

  // Expense form
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    BranchID: '',
    ExpenseDate: '',
    ExpenseCategory: '',
    Amount: '',
    PaymentMethod: '',
    StaffID: '',
    Notes: '',
  });

  // Consolidated
  const [consolidatedRows, setConsolidatedRows] = useState([]);
  const [selectedConsolidatedRow, setSelectedConsolidatedRow] = useState(null);
  const [pettyDialogOpen, setPettyDialogOpen] = useState(false);
  const [pettyForm, setPettyForm] = useState({
    pettyCash: '',
    depositedAmount: '',
    remarks: '',
  });

  // Charts
  const [cashFlows, setCashFlows] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [paymentMethodPie, setPaymentMethodPie] = useState(null);
  const [gymChartData, setGymChartData] = useState(null);
  const [cafeChartData, setCafeChartData] = useState(null);
  const [yogurtChartData, setYogurtChartData] = useState(null);
  const [expenseChartData, setExpenseChartData] = useState(null);

  // Tab change
  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. branches & staff
        const [branchRes, staffRes] = await Promise.all([
          axios.get('/owner/branches'),
          axios.get('/staff'),
        ]);
        const bOptions = branchRes.data.branches.map((b) => ({
          value: b.BranchID.toString(),
          label: b.BranchName,
        }));
        setBranchOptions([{ value: 'all', label: 'All Branches' }, ...bOptions]);
        setStaff(staffRes.data.staff || staffRes.data || []);

        // 2. key metrics
        const metricsRes = await axios.get(
          `/owner/dashboard-metrics?period=${timePeriod}&dateFrom=${dateFrom}&dateTo=${dateTo}&branch=all`
        );
        setKeyMetrics(metricsRes.data.metrics);

        // 3. promos & logs
        const [promoRes, logsRes] = await Promise.all([
          axios.get('/finance/promotions'),
          axios.get('/system/logs'),
        ]);
        setCurrentPromotions(promoRes.data.promos);
        setSystemLogs(logsRes.data.logs);

        // 4. recent transactions
        const paymentsRes = await axios.get('/payments');
        const transactions = paymentsRes.data.map((p) => ({
          id: p.PaymentID,
          amount: p.Amount,
          date: p.PaymentDate,
          status: p.Status,
        }));
        setRecentTransactions(transactions);

        // 5. flows & expenses
        const [cashflowRes, expRes] = await Promise.all([
          axios.get('/finance/cashflow'),
          axios.get('/finance/expenses'),
        ]);
        const flows = cashflowRes.data.flows || [];
        const allExp = expRes.data.expenses || [];

        setAllFlows(flows);
        setFilteredFlows(flows);
        setAllExpenses(allExp);
        setFilteredExpenses(allExp);

        // 6. build charts
        buildRevenueTrends(flows);
        buildPaymentPie(flows);
        buildBusinessCharts(flows);
        buildExpenseChart(allExp);

        // consolidated
        buildConsolidatedRows(flows, allExp);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data from server.');
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild consolidated if filtered flows or expenses change
  useEffect(() => {
    buildConsolidatedRows(filteredFlows, filteredExpenses);
  }, [filteredFlows, filteredExpenses]);

  // Chart building
  const buildRevenueTrends = (flows) => {
    const sorted = [...flows].sort((a, b) => new Date(a.Date) - new Date(b.Date));
    setCashFlows(sorted);
    setRevenueChartData({
      labels: sorted.map((f) => f.Date),
      datasets: [
        {
          label: 'Revenue',
          data: sorted.map((f) => Number(f.TotalSales || 0)),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          fill: false,
        },
      ],
    });
  };

  const buildPaymentPie = (flows) => {
    let cash = 0,
      gcash = 0,
      bpi = 0,
      bdo = 0;
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

  const buildExpenseChart = (expenses) => {
    const grouped = expenses.reduce((acc, e) => {
      const d = (e.ExpenseDate || '').slice(0, 10);
      if (!acc[d]) acc[d] = 0;
      acc[d] += parseFloat(e.Amount || 0);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    setExpenseChartData({
      labels: sortedDates,
      datasets: [
        {
          label: 'Daily Expenses',
          data: sortedDates.map((d) => grouped[d]),
          borderColor: '#f55d5d',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        },
      ],
    });
  };

  // Filters
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

  const handleFilterCashFlow = () => {
    const newFiltered = applyDateFilter(allFlows, dateFrom, dateTo);
    setFilteredFlows(newFiltered);
    buildRevenueTrends(newFiltered);
    buildPaymentPie(newFiltered);
    buildBusinessCharts(newFiltered);
  };

  const handleFilterExpenses = () => {
    const newFiltered = applyDateFilter(allExpenses, dateFrom, dateTo);
    setFilteredExpenses(newFiltered);
    // buildExpenseChart(newFiltered) if you want the chart filtered too
  };

  // Consolidated
  const buildConsolidatedRows = (flows, expenses) => {
    const groupByDate = {};
    flows.forEach((flow) => {
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
      if (flow.BusinessType === 'Gym') groupByDate[d].gym += t;
      else if (flow.BusinessType === 'Cafe') groupByDate[d].cafe += t;
      else if (flow.BusinessType === 'Yogurt') groupByDate[d].yogurt += t;
      else if (flow.BusinessType === 'Overall') {
        groupByDate[d].overall += t;
        groupByDate[d].pettyCash = parseFloat(flow.PettyCash || 0);
        groupByDate[d].deposited = parseFloat(flow.DepositedAmount || 0);
      }
    });

    // Sum expenses
    const expenseMap = {};
    expenses.forEach((exp) => {
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
    { field: 'NetProfit', headerName: 'Net Profit', width: 90 },
    { field: 'PettyCash', headerName: 'PettyCash', width: 90 },
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
        BranchID: branchOptions[0]?.value || 1,
        Date: dateStr,
        BusinessType: 'Overall',
        TotalSales: 0,
        PettyCash: petty,
        DepositedAmount: deposit,
        Remarks: pettyForm.remarks,
      });
      alert(`Petty Cash for ${dateStr} saved!`);
      setPettyDialogOpen(false);
      const cfRes = await axios.get('/finance/cashflow');
      const flows = cfRes.data.flows || [];
      setAllFlows(flows);

      // Re-filter
      const newFiltered = applyDateFilter(flows, dateFrom, dateTo);
      setFilteredFlows(newFiltered);
      buildRevenueTrends(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);
    } catch (err) {
      console.error(err);
      alert('Failed to set petty cash');
    }
  };

  // Expenses
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

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitExpense = async () => {
    try {
      await axios.post('/finance/expenses', { ...expenseForm });
      alert('Expense created successfully!');
      setExpenseFormOpen(false);

      const expRes = await axios.get('/finance/expenses');
      const allExp = expRes.data.expenses || [];
      setAllExpenses(allExp);

      // Re-filter
      const newFiltered = applyDateFilter(allExp, dateFrom, dateTo);
      setFilteredExpenses(newFiltered);
      buildExpenseChart(allExp);
    } catch (err) {
      console.error(err);
      alert('Error creating expense. Check console.');
    }
  };

  // Flows
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
          (exp.ExpenseDate || '').slice(0, 10) === (flow.Date || '').slice(0, 10)
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

  // Dialog for manual daily flow
  const handleOpenCashFlowDialog = () => {
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
      PettyCash: '',
      Remarks: '',
    });
    setCashFlowDialogOpen(true);
  };
  const handleCloseCashFlowDialog = () => setCashFlowDialogOpen(false);

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

      const newFiltered = applyDateFilter(flows, dateFrom, dateTo);
      setFilteredFlows(newFiltered);
      buildRevenueTrends(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);

      setCashFlowDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create daily cash flow entry.');
    }
  };

  // Generate Gym daily flow
  const handleGenerateCashFlow = async () => {
    try {
      const formatted = selectedDate.toISOString().substring(0, 10);
      await axios.post('/finance/generate-cashflow', {
        date: formatted,
        branch_id: selectedBranchId,
      });
      alert('Gym daily cash flow generated!');
      handleFilterCashFlow();
    } catch (err) {
      console.error(err);
      alert('Failed to generate gym daily flow');
    }
  };

  // Overall Flow
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
        BranchID: branchOptions[0]?.value || 1,
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

      const newFiltered = applyDateFilter(flows, dateFrom, dateTo);
      setFilteredFlows(newFiltered);
      buildRevenueTrends(newFiltered);
      buildPaymentPie(newFiltered);
      buildBusinessCharts(newFiltered);
    } catch (err) {
      console.error(err);
      alert('Failed to create overall daily cash flow record.');
    }
  };

  // Return content
  return (
    <Box sx={{ minHeight: '100vh', p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: 2,
          mb: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton sx={{ color: '#fff', mr: 1 }}>
          <Dashboard />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Owner Dashboard
          </Typography>
          <Typography variant="body2">Key performance overview and quick actions</Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Overview" icon={<TrendingUp />} iconPosition="start" />
        <Tab label="Daily Cash Flow" icon={<PesosIcon fontSize={18} />} iconPosition="start" />
        <Tab label="Expenses" icon={<ReceiptLong />} iconPosition="start" />
        <Tab label="Consolidated" icon={<TableView />} iconPosition="start" />
        <Tab label="Quick Actions" icon={<MiscellaneousServices />} iconPosition="start" />
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
          {/* =================== OVERVIEW TAB =================== */}
          {activeTab === 0 && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                {/* Key Metrics Cards */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      backgroundColor: '#42A5F5',
                      borderRadius: 2,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                    }}
                  >
                    <Person sx={{ fontSize: 30, color: 'white', mr: 1.5 }} />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        Members
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {keyMetrics.totalClients}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      backgroundColor: '#66BB6A',
                      borderRadius: 2,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 30, color: 'white', mr: 1.5 }} />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        Revenue
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        ₱{keyMetrics.totalRevenue.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      backgroundColor: '#FFB74D',
                      borderRadius: 2,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                    }}
                  >
                    <People sx={{ fontSize: 30, color: 'white', mr: 1.5 }} />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        Emails Sent
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {keyMetrics.totalEmailsSent}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      backgroundColor: '#9C27B0',
                      borderRadius: 2,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                    }}
                  >
                    <DirectionsRun sx={{ fontSize: 30, color: 'white', mr: 1.5 }} />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                        Attendance
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {keyMetrics.trafficReceived}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Revenue Trends Chart */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, height: 400, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Revenue Trends
                    </Typography>
                    <Box sx={{ height: '80%' }}>
                      {revenueChartData ? (
                        <Line
                          data={revenueChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      ) : (
                        <Typography>Loading chart...</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Payment Method Pie */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 400, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Payment Method Breakdown
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

                {/* Daily Expenses Trend */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, height: 400, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Expenses Trend
                    </Typography>
                    <Box sx={{ height: '80%' }}>
                      {expenseChartData ? (
                        <Line
                          data={expenseChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } },
                          }}
                        />
                      ) : (
                        <Typography>Loading expenses chart...</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Payment Breakdown by Biz */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Payment Breakdown by Business
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Gym
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
                      <Typography>Loading Gym chart...</Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Café
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
                      <Typography>Loading Café chart...</Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 280, boxShadow: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Yogurt
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
                      <Typography>Loading Yogurt chart...</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* =================== DAILY CASH FLOW TAB =================== */}
          {activeTab === 1 && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 2, mb: 2, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filter Cash Flow / Expenses By Date
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="From Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="To Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" onClick={handleFilterCashFlow} sx={{ mt: 1 }}>
                      Filter
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Gym flows */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Gym Cash Flow
              </Typography>
              <Box sx={{ height: 400, mb: 4 }}>
                <DataGrid
                  rows={filteredFlows
                    .map((f, i) => flowRows[i]) // match the mapping
                    .filter((r) => r.BusinessType === 'Gym')}
                  columns={flowColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                  disableSelectionOnClick
                />
              </Box>

              {/* Cafe flows */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Café Cash Flow
              </Typography>
              <Box sx={{ height: 400, mb: 4 }}>
                <DataGrid
                  rows={filteredFlows
                    .map((f, i) => flowRows[i])
                    .filter((r) => r.BusinessType === 'Cafe')}
                  columns={flowColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                  disableSelectionOnClick
                />
              </Box>

              {/* Yogurt flows */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Yogurt Cash Flow
              </Typography>
              <Box sx={{ height: 400 }}>
                <DataGrid
                  rows={filteredFlows
                    .map((f, i) => flowRows[i])
                    .filter((r) => r.BusinessType === 'Yogurt')}
                  columns={flowColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                  disableSelectionOnClick
                />
              </Box>
            </Box>
          )}

          {/* =================== EXPENSES TAB =================== */}
          {activeTab === 2 && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 2, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filter Expenses
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="From Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="To Date"
                      type="date"
                      fullWidth
                      size="small"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" onClick={handleFilterExpenses} sx={{ mt: 1 }}>
                      Filter
                    </Button>
                  </Grid>
                </Grid>
                <Typography variant="h6" gutterBottom>
                  Expenses List
                </Typography>
                <Box sx={{ height: 400, mb: 2 }}>
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

          {/* =================== CONSOLIDATED TAB =================== */}
          {activeTab === 3 && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 2, boxShadow: 3 }}>
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
                      ? `Selected Date: ${selectedConsolidatedRow.Date} | NetProfit: ₱${selectedConsolidatedRow.NetProfit} | PettyCash: ₱${selectedConsolidatedRow.PettyCash}`
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

          {/* =================== QUICK ACTIONS TAB =================== */}
          {activeTab === 4 && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, mb: 2, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Cash Flow
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mb: 2 }}
                      onClick={handleOpenCashFlowDialog}
                    >
                      Add Cash Flow Entry
                    </Button>

                    <Typography variant="subtitle2">Generate Gym Daily Flow</Typography>
                    <TextField
                      label="Branch"
                      select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mb: 1, mt: 1 }}
                    >
                      <MenuItem value="">
                        <em>-- Select Branch --</em>
                      </MenuItem>
                      {branchOptions
                        .filter((b) => b.value !== 'all')
                        .map((b) => (
                          <MenuItem key={b.value} value={b.value}>
                            {b.label}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      label="Date"
                      type="date"
                      size="small"
                      fullWidth
                      value={selectedDate.toISOString().substr(0, 10)}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      disabled={!selectedBranchId}
                      onClick={handleGenerateCashFlow}
                    >
                      Generate Gym Daily Flow
                    </Button>
                  </Paper>
                </Grid>

                {/* Overall Flow */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Flow
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Consolidate total Gym/Cafe/Yogurt sales for today.
                    </Typography>
                    <Button variant="contained" color="primary" fullWidth onClick={handleOpenOverallDialog}>
                      Generate Overall Flow
                    </Button>
                  </Paper>
                </Grid>

                {/* Additional Quick Actions or Promotions, Logs, etc. */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Current Promotions
                    </Typography>
                    {currentPromotions.map((promo) => (
                      <Typography key={promo.PromotionID}>
                        {promo.Name} - {promo.DiscountValue} until {promo.EndDate}
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Overall Flow Dialog */}
      <Dialog open={openOverallDialog} onClose={handleCloseOverallDialog}>
        <DialogTitle>Generate Overall Daily Cash Flow</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Computed Overall Total (Gym+Cafe+Yogurt) for today: ₱
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
            <Typography gutterBottom>
              Net Profit: ₱{selectedConsolidatedRow.NetProfit} (Take Home before petty: ₱
              {selectedConsolidatedRow.TakeHome + selectedConsolidatedRow.PettyCash})
            </Typography>
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
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  name="BranchID"
                  label="Branch"
                  value={expenseForm.BranchID}
                  onChange={handleExpenseChange}
                >
                  <MenuItem value="">
                    <em>-- Select Branch --</em>
                  </MenuItem>
                  {branchOptions
                    .filter((b) => b.value !== 'all')
                    .map((b) => (
                      <MenuItem key={b.value} value={b.value}>
                        {b.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
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

      {/* Cash Flow Dialog */}
      <Dialog open={cashFlowDialogOpen} onClose={handleCloseCashFlowDialog} fullWidth maxWidth="sm">
        <DialogTitle>Record a New Daily Cash Flow Entry</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  name="BranchID"
                  label="Branch"
                  value={cashFlowForm.BranchID}
                  onChange={handleCashFlowChange}
                >
                  <MenuItem value="">
                    <em>-- Select Branch --</em>
                  </MenuItem>
                  {branchOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                label="Walk-In Cash"
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
                label="Walk-In GCash"
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
                label="Walk-In BPI"
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
                label="Walk-In BDO"
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCashFlowDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCashFlowSubmit}>
            Submit Cash Flow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
