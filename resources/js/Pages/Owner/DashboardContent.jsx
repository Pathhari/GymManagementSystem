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
  useTheme,
  Menu
} from '@mui/material';
import {
  Dashboard,
  Person,
  AttachMoney,
  People,
  DirectionsRun,
  NotificationImportant,
  AccountBalance,
  History as HistoryIcon,
  TrendingUp,
  ReceiptLong,
  TableView,
  AccountBalanceWallet,
  Savings,
  EditNote,
  Cancel,
  Save,
  MonetizationOn,
  MiscellaneousServices,
  FitnessCenter,
  LocalCafe,
  Icecream,
  CreditCard as CreditCardIcon,
  Store as StoreIcon,
  MonetizationOn as MonetizationOnIcon,
  DirectionsWalk as DirectionsWalkIcon,
  AccountBalance as AccountBalanceIcon,
  Notes as NotesIcon,
  FileDownload as  FileDownloadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
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
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Line, Pie } from 'react-chartjs-2';
import AddIcon from "@mui/icons-material/Add";

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

export default function OwnerDashboard(onClose) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

   // Date translator
   const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const dateObj = new Date(dateString);
  
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Ensures AM/PM format
    });
  };
  const handleExportCSV = () => {
    handleExportMenuClose();
  };
  const handleExportPDF = () => {
    handleExportMenuClose();

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "A4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Load images from public folder
    const coverPage = "/imgs/coverpage.png"; // First page background
    const addPage = "/imgs/addpage.png"; // Background for succeeding pages

    // ✅ Add Cover Page Background
    doc.addImage(coverPage, "PNG", 0, 0, pageWidth, pageHeight);
    
    // ✅ Add Title on Cover Page
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text("Cash Flow Report", pageWidth / 2, 100, { align: "center" });

    doc.setFontSize(14);
    doc.text("Generated on: " + new Date().toLocaleDateString(), pageWidth / 2, 130, { align: "center" });

    // Prepare Table Data
    const columns = [
        { title: "Date", key: "Date" },
        { title: "Brch", key: "BranchID" },
        { title: "Type", key: "BusinessType" },
        { title: "Cash", key: "CashSales" },
        { title: "GCash", key: "GCashSales" },
        { title: "BPI", key: "BPISales" },
        { title: "BDO", key: "BDOSales" },
        { title: "W/Cash", key: "WalkInCashSales" },
        { title: "W/GCash", key: "WalkInGCashSales" },
        { title: "W/BPI", key: "WalkInBPISales" },
        { title: "W/BDO", key: "WalkInBDOSales" },
        { title: "Total", key: "TotalSales" },
        { title: "Exp", key: "DailyExpenses" },
        { title: "Net", key: "NetProfit" },
        { title: "Petty", key: "PettyCash" },
        { title: "Dpst", key: "DepositedAmount" },
        { title: "Rmks", key: "Remarks" }
    ];

    const bodyData = filteredFlows.map((row) => ({
        Date: row.Date ? formatDate(row.Date) : "N/A",
        BranchID: row.BranchID || "—",
        BusinessType: row.BusinessType || "",
        CashSales: Number(row.CashSales || 0).toFixed(2),
        GCashSales: Number(row.GCashSales || 0).toFixed(2),
        BPISales: Number(row.BPISales || 0).toFixed(2),
        BDOSales: Number(row.BDOSales || 0).toFixed(2),
        WalkInCashSales: Number(row.WalkInCashSales || 0).toFixed(2),
        WalkInGCashSales: Number(row.WalkInGCashSales || 0).toFixed(2),
        WalkInBPISales: Number(row.WalkInBPISales || 0).toFixed(2),
        WalkInBDOSales: Number(row.WalkInBDOSales || 0).toFixed(2),
        TotalSales: Number(row.TotalSales || 0).toFixed(2),
        DailyExpenses: Number(row.DailyExpenses || 0).toFixed(2),
        NetProfit: Number(row.NetProfit || 0).toFixed(2),
        PettyCash: Number(row.PettyCash || 0).toFixed(2),
        DepositedAmount: Number(row.DepositedAmount || 0).toFixed(2),
        Remarks: row.Remarks || "—",
    }));

    // ✅ Only add new pages if the table spans multiple pages
    if (bodyData.length > 15) { // Adjust based on your table's row height
        doc.addPage();
        doc.addImage(addPage, "PNG", 0, 0, pageWidth, pageHeight);
    }

    // ✅ Generate Table
    doc.autoTable({
        startY: 80,
        head: [columns.map((col) => col.title)],
        body: bodyData.map((data) => columns.map((col) => data[col.key])),
        theme: "striped",
        headStyles: {
            fillColor: "#050505",
            textColor: "#ffffff",
            fontStyle: "bold",
        },
        bodyStyles: {
            textColor: "#333333",
        },
        alternateRowStyles: {
            fillColor: "#f5f5f5",
        },
        styles: {
            overflow: "linebreak",
            cellPadding: 3,
            halign: "center",
            valign: "middle",
            fontSize: 8,
        },
        margin: { top: 50, left: 20, right: 20, bottom: 20 },
        didDrawPage: (data) => {
            if (doc.internal.getNumberOfPages() > 1) {
                doc.addImage(addPage, "PNG", 0, 0, pageWidth, pageHeight);
            }
        }
    });

    // ✅ Save the PDF
    doc.save("CashFlowReport.pdf");
};


  
  // Export logic
    const [exportAnchorEl, setExportAnchorEl] = useState(null);
    const openExportMenu = Boolean(exportAnchorEl);
    const handleExportMenuOpen = (e) => setExportAnchorEl(e.currentTarget);
    const handleExportMenuClose = () => setExportAnchorEl(null);
  
  
  // Tabs
  const [selectedTab, setSelectedTab] = useState(0);

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
          payer: p.member ? p.member.FullName : (p.WalkInName || 'Walk-In'),
          amount: p.Amount,
          method: p.PaymentMethod,
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
  
  // Currency Format
  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    return `${parseInt(value).toLocaleString("en-PH")}`;
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
    { 
      field: 'Date', 
      headerName: 'Date', 
      width: 180, 
      renderCell: (params) => params.value ? formatDate(params.value) : "—" 
    },
    { 
      field: 'Gym', 
      headerName: 'Gym', 
      width: 80, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'Cafe', 
      headerName: 'Cafe', 
      width: 80, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'Yogurt', 
      headerName: 'Yogurt', 
      width: 80, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'DailyExpenses', 
      headerName: 'Expenses', 
      width: 90, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'NetProfit', 
      headerName: 'Net Profit', 
      width: 90, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'PettyCash', 
      headerName: 'PettyCash', 
      width: 90, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'TakeHome', 
      headerName: 'Take-Home', 
      width: 100, 
      renderCell: (params) => formatCurrency(params.value) 
    },
];

  const handleConsolidatedRowClick = (params) => {
    setSelectedConsolidatedRow(params.row);
  };

  const openConsolidatedPettyDialog = (row) => {
    console.log("Opening Petty Cash Dialog for:", row); // Debugging log
    setSelectedConsolidatedRow(row);
    setPettyForm({
      pettyCash: '',
      depositedAmount: '',
      remarks: '',
    });
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
    { 
      field: 'ExpenseDate', 
      headerName: 'Date', 
      width: 180, 
      renderCell: (params) => params.value ? formatDate(params.value) : "—" 
    },
    { 
      field: 'BranchID', 
      headerName: 'Branch', 
      width: 100, 
      renderCell: (params) => params.value ?? "—" 
    },
    { 
      field: 'ExpenseCategory', 
      headerName: 'Category', 
      width: 140, 
      renderCell: (params) => params.value ?? "—" 
    },
    { 
      field: 'Amount', 
      headerName: 'Amount', 
      width: 100, 
      renderCell: (params) => formatCurrency(params.value) 
    },
    { 
      field: 'PaymentMethod', 
      headerName: 'Method', 
      width: 100, 
      renderCell: (params) => params.value ?? "—" 
    },
    { 
      field: 'StaffID', 
      headerName: 'Staff ID', 
      width: 80, 
      renderCell: (params) => params.value ?? "—" 
    },
    { 
      field: 'Notes', 
      headerName: 'Notes', 
      width: 160, 
      renderCell: (params) => params.value ?? "—" 
    },
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
    { 
      field: 'Date', 
      headerName: 'Date', 
      width: 180, 
      renderCell: (params) => params.value ? formatDate(params.value) : "—" 
    },
    { 
      field: 'BranchID', 
      headerName: 'Branch', 
      width: 100, 
      renderCell: (params) => params.value ?? "—" 
    },
    { 
      field: 'BusinessType', 
      headerName: 'Type', 
      width: 120, 
      renderCell: (params) => params.value ?? "—" 
    },
    { field: 'CashSales', headerName: 'Cash', width: 80, renderCell: (params) => formatCurrency(params.value) },
    { field: 'GCashSales', headerName: 'GCash', width: 80, renderCell: (params) => formatCurrency(params.value) },
    { field: 'BPISales', headerName: 'BPI', width: 80, renderCell: (params) => formatCurrency(params.value) },
    { field: 'BDOSales', headerName: 'BDO', width: 80, renderCell: (params) => formatCurrency(params.value) },
    { field: 'WalkInCashSales', headerName: 'W-In Cash', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { field: 'WalkInGCashSales', headerName: 'W-In GCash', width: 100, renderCell: (params) => formatCurrency(params.value) },
    { field: 'WalkInBPISales', headerName: 'W-In BPI', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { field: 'WalkInBDOSales', headerName: 'W-In BDO', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { field: 'TotalSales', headerName: 'Total', width: 80, renderCell: (params) => formatCurrency(params.value) },
    { field: 'NetProfit', headerName: 'Net Profit', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { field: 'PettyCash', headerName: 'PettyCash', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { field: 'TakeHome', headerName: 'Take-Home', width: 100, renderCell: (params) => formatCurrency(params.value) },
    { field: 'DepositedAmount', headerName: 'Deposited', width: 90, renderCell: (params) => formatCurrency(params.value) },
    { 
      field: 'Remarks', 
      headerName: 'Remarks', 
      width: 160, 
      renderCell: (params) => params.value ?? "—" 
    },
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
                 <Typography sx={{ fontSize: 30, color: 'white', mr: 1.5, fontWeight: 'bold' }}>
                  ₱
                </Typography>
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                    Payments Received
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatCurrency(keyMetrics.totalRevenue)}
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
                        Emails Received
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
                  {/* You can swap this icon with one that better represents expenses if needed */}
                  <Typography sx={{ fontSize: 30, color: 'white', mr: 1.5, fontWeight: 'bold' }}>
                    ₱
                  </Typography>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', mb: 0.5 }}>
                      Total Expenses
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {formatCurrency(keyMetrics.totalExpenses)}
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
                <Paper sx={{ p: 2, height: 280, boxShadow: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Gym
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
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
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: 280, boxShadow: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Café
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
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
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: 280, boxShadow: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Yogurt
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
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
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={12}>
                <Paper
                sx={{
                  p: 3,
                  boxShadow: 4,
                  borderRadius: 2,
                  overflow: "hidden",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Recent Transactions (incl. Walk-Ins)
                </Typography>

                {/* Box takes full available space */}
                <Box sx={{ flexGrow: 1, width: "100%" }}>
                  <DataGrid
                    rows={recentTransactions}
                    columns={[
                      {
                        field: "id",
                        headerName: "ID",
                        flex: 0.5,
                        headerAlign: "center",
                        align: "center",
                      },
                      { field: "payer", headerName: "Payer", flex: 1.5 },
                      {
                        field: "method",
                        headerName: "Method",
                        flex: 1,
                        headerAlign: "center",
                        align: "center",
                      },
                      {
                        field: "amount",
                        headerName: "Amount",
                        flex: 1,
                        headerAlign: "center",
                        align: "center",
                        renderCell: (params) => `₱${params.value}`,
                      },
                      {
                        field: "date",
                        headerName: "Date",
                        flex: 1.2,
                        headerAlign: "center",
                        align: "center",
                        renderCell: (params) => formatDateTime(params.value),
                      },
                      {
                        field: "status",
                        headerName: "Status",
                        flex: 1,
                        headerAlign: "center",
                        align: "center",
                        // *** ADDED COLOR INDICATOR BELOW ***
                        renderCell: (params) => {
                          const status = params.value;
                          const getStatusColor = (status) => {
                            switch (status) {
                              case "Completed":
                                return "#4caf50"; // green
                              case "Pending":
                                return "#ff9800"; // orange
                              default:
                                return "#f44336"; // red for any other status (e.g., Failed)
                            }
                          };
                          return (
                            <span style={{ color: getStatusColor(status), fontWeight: "bold" }}>
                              {status}
                            </span>
                          );
                        },
                      },
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                    autoHeight
                    density="compact"
                    disableColumnMenu
                  />
                </Box>
              </Paper>


              </Grid>


              </Grid>
            </Box>
          )}

            {/* =================== DAILY CASH FLOW TAB =================== */}
          {activeTab === 1 && (
  <Box sx={{ mt: 1 }}>
    {/* Date Filter Section */}
    <Paper sx={{ p: 3, mb: 2, boxShadow: 3, borderRadius: 2 }}>
  <Typography variant="h6" gutterBottom sx={{ mb: 3}}>
    Filter Cash Flow & Expenses By Date
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
    <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button variant="contained" onClick={handleFilterCashFlow}>
        Filter
      </Button>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        onClick={(e) => setExportAnchorEl(e.currentTarget)}
      >
        Export
      </Button>
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
       <MenuItem>
          <CSVLink
            data={filteredFlows.map((f, i) => flowRows[i])} // Ensure mapped rows match filtered data
            headers={flowColumns.map(col => ({ label: col.headerName, key: col.field }))} // Define headers
            filename="CashFlowData.csv"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Export CSV
          </CSVLink>
        </MenuItem>

        <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
      </Menu>
    </Grid>
  </Grid>
</Paper>

    {/* Cash Flow Tabs */}
    <Paper sx={{ p: 3, boxShadow: 4, borderRadius: 2 }}>
  <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} variant="fullWidth">
    <Tab icon={<FitnessCenter />} iconPosition="start" label="Gym Cash Flow" />
    <Tab icon={<LocalCafe />} iconPosition="start" label="Café Cash Flow" />
    <Tab icon={<Icecream />} iconPosition="start" label="Yogurt Cash Flow" />
  </Tabs>
        {/* Gym Cash Flow Table */}
          {selectedTab === 0 && (
            <Box sx={{ height: 400, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Gym Cash Flow
              </Typography>
              <DataGrid
                rows={filteredFlows
                  .map((f, i) => flowRows[i])
                  .filter((r) => r.BusinessType === 'Gym')}
                columns={flowColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                disableSelectionOnClick
                autoHeight
                density="compact"
                disableColumnMenu
              />
            </Box>
          )}

          {/* Café Cash Flow Table */}
          {selectedTab === 1 && (
            <Box sx={{ height: 400, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Café Cash Flow
              </Typography>
              <DataGrid
                rows={filteredFlows
                  .map((f, i) => flowRows[i])
                  .filter((r) => r.BusinessType === 'Cafe')}
                columns={flowColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                disableSelectionOnClick
                autoHeight
                density="compact"
                disableColumnMenu
              />
            </Box>
          )}

          {/* Yogurt Cash Flow Table */}
          {selectedTab === 2 && (
            <Box sx={{ height: 400, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Yogurt Cash Flow
              </Typography>
              <DataGrid
                rows={filteredFlows
                  .map((f, i) => flowRows[i])
                  .filter((r) => r.BusinessType === 'Yogurt')}
                columns={flowColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                disableSelectionOnClick
                autoHeight
                density="compact"
                disableColumnMenu
              />
            </Box>
          )}
        </Paper>
          </Box>
        )}


  {/* =================== EXPENSES TAB =================== */}
{activeTab === 2 && (
  <Box sx={{ mt: 1 }}>
    {/* Date Filter Section */}
    <Paper sx={{ p: 3, mb: 2, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3}}>
        Filter Expenses By Date
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
        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button variant="contained" onClick={handleFilterExpenses}>
            Filter
          </Button>
        </Grid>
      </Grid>
    </Paper>

    {/* Expenses Table Section */}
    <Paper sx={{ p: 3, boxShadow: 4, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Expenses List
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setExpenseFormOpen(true)}
        >
          Add New Expense
        </Button>
      </Box>

      <Box sx={{ height: 400, mt: 2 }}>
        <DataGrid
          rows={filteredExpenses.map((e, i) => expenseRows[i])}
          columns={expenseColumns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          disableSelectionOnClick
          autoHeight
          density="compact"
          disableColumnMenu
        />
      </Box>
    </Paper>
  </Box>
)}

{/* =================== CONSOLIDATED TAB =================== */}
{activeTab === 3 && (
  <Box sx={{ mt: 1 }}>
   <Paper sx={{ p: 2, boxShadow: 3 }}>
  <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
    Consolidated Daily Table
  </Typography>
  <Box sx={{ height: 400 }}>
    <DataGrid
      rows={consolidatedRows}
      columns={[
        ...consolidatedColumns,
        {
          field: "actions",
          headerName: "Actions",
          width: 180, 
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation(); 
                openConsolidatedPettyDialog(params.row);
              }}
            >
              Set Petty Cash
            </Button>
          ),
        },
      ]}
      pageSize={5}
      rowsPerPageOptions={[5, 10]}
      disableSelectionOnClick
      disableColumnMenu
    />
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
      <Dialog 
  open={openOverallDialog} 
  onClose={handleCloseOverallDialog} 
  fullWidth 
  maxWidth="sm" 
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 4,
      overflow: "hidden",
    },
  }}
>
  {/* Dialog Title */}
  <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
    <AccountBalance color="primary" /> Generate Overall Daily Cash Flow
  </DialogTitle>

  {/* Dialog Content */}
  <DialogContent dividers sx={{ p: 3 }}>
    <Typography 
      variant="h8" 
      sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
    >
      <MonetizationOn color="success" />
      Computed Overall Total (Gym + Cafe + Yogurt): 
      <span style={{ color: "#66BB6A", fontWeight: "bold" }}>
        ₱{computedOverallTotal.toLocaleString()}
      </span>
    </Typography>

    {/* Petty Cash Deduction */}
    <TextField
      fullWidth
      label="Petty Cash Deduction"
      name="pettyDeduction"
      type="number"
      value={overallInput.pettyDeduction}
      onChange={handleOverallInputChange}
      margin="dense"
      variant="outlined"
      InputProps={{
        startAdornment: <AccountBalance sx={{ color: "primary.main", mr: 1 }} />,
      }}
    />

    {/* Deposited Checkbox */}
    <FormControlLabel
      control={
        <Checkbox
          checked={overallInput.deposited}
          onChange={handleOverallInputChange}
          name="deposited"
        />
      }
      label="Deposited to owner"
      sx={{ mt: 2 }}
    />
  </DialogContent>

  {/* Dialog Actions */}
  <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
    <Button 
      onClick={handleCloseOverallDialog} 
      sx={{ color: "red" }} 
      startIcon={<Cancel />}
    >
      Cancel
    </Button>
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleSubmitOverallFlow} 
      startIcon={<Save />}
    >
      Submit Overall Flow
    </Button>
  </DialogActions>
</Dialog>

    {/* Petty Cash Dialog */}
    <Dialog open={pettyDialogOpen} onClose={closeConsolidatedPettyDialog} fullWidth maxWidth="sm">
  <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
    <AccountBalanceWallet color="primary" /> Set Petty Cash for {selectedConsolidatedRow?.Date ? formatDate(selectedConsolidatedRow.Date) : ''}
  </DialogTitle>
  
  <DialogContent dividers sx={{ p: 3 }}>
    {selectedConsolidatedRow && (
      <>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <MonetizationOn color="success" /> 
          Net Profit: <span style={{ color: "#66BB6A" }}>₱{Number(selectedConsolidatedRow.NetProfit || 0).toLocaleString()}</span>
        </Typography>

        <Typography variant="body1" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Savings color="action" />
          Take Home before petty: <strong>₱{Number(selectedConsolidatedRow.TakeHome || 0).toLocaleString()}</strong>
        </Typography>
      </>
    )}

    {/* Petty Cash Input */}
    <TextField
      label="Petty Cash Deduction"
      name="pettyCash"
      type="number"
      value={pettyForm.pettyCash}
      onChange={handlePettyFormChange}
      fullWidth
      margin="dense"
      variant="outlined"
      InputProps={{
        startAdornment: <AccountBalanceWallet sx={{ color: "white", mr: 1 }} />,
      }}
    />

    {/* Deposited Amount Input */}
    <TextField
      label="Deposited Amount"
      name="depositedAmount"
      type="number"
      value={pettyForm.depositedAmount}
      onChange={handlePettyFormChange}
      fullWidth
      margin="dense"
      variant="outlined"
      InputProps={{
        startAdornment: <Savings sx={{ color: "white", mr: 1 }} />,
      }}
    />

    {/* Remarks Input */}
    <TextField
      label="Remarks"
      name="remarks"
      value={pettyForm.remarks}
      onChange={handlePettyFormChange}
      fullWidth
      multiline
      rows={3}
      margin="dense"
      variant="outlined"
      InputProps={{
        startAdornment: <EditNote sx={{ color: "white", mr: 1 }} />,
      }}
    />
  </DialogContent>

  <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
    <Button 
      onClick={closeConsolidatedPettyDialog} 
      sx={{ color: "red" }}
      startIcon={<Cancel />}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={handleSubmitConsolidatedPetty}
      disabled={!pettyForm.pettyCash || pettyForm.pettyCash <= 0} // Prevents empty or negative submissions
      startIcon={<Save />}
    >
      Save Petty Cash
    </Button>
  </DialogActions>
</Dialog>



      {/* Create Expense Form Dialog */}
      <Dialog open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
    
    <ReceiptLong color="primary" /> Add New Expense
    
  </DialogTitle>
 
  <DialogContent dividers>
    <Grid container spacing={2}>
      {/* Branch Selection */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Branch</InputLabel>
          <Select
            name="BranchID"
            label="Branch"
            value={expenseForm.BranchID}
            onChange={handleExpenseChange}
            startAdornment={<StoreIcon sx={{ color: "white", mr: 1 }} />}
          >
            <MenuItem value="">
              <em>-- Select Branch --</em>
            </MenuItem>
            {branchOptions
              .filter((b) => b.value !== "all")
              .map((b) => (
                <MenuItem key={b.value} value={b.value}>
                  {b.label}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Expense Date */}
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
          InputProps={{
            startAdornment: <HistoryIcon sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>

      {/* Expense Category */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Category"
          fullWidth
          name="ExpenseCategory"
          value={expenseForm.ExpenseCategory}
          onChange={handleExpenseChange}
          size="small"
          InputProps={{
            startAdornment: <MiscellaneousServices sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>

      {/* Amount */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Amount"
          type="number"
          fullWidth
          name="Amount"
          value={expenseForm.Amount}
          onChange={handleExpenseChange}
          size="small"
          InputProps={{
            startAdornment: <MonetizationOnIcon sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>

      {/* Payment Method */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Payment Method"
          fullWidth
          name="PaymentMethod"
          value={expenseForm.PaymentMethod}
          onChange={handleExpenseChange}
          size="small"
          InputProps={{
            startAdornment: <CreditCardIcon sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>

      {/* Staff ID */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Staff ID (optional)"
          fullWidth
          name="StaffID"
          value={expenseForm.StaffID}
          onChange={handleExpenseChange}
          size="small"
          InputProps={{
            startAdornment: <Person sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>

      {/* Notes */}
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
          InputProps={{
            startAdornment: <EditNote sx={{ color: "white", mr: 1 }} />,
          }}
        />
      </Grid>
    </Grid>
  </DialogContent>

  {/* Dialog Actions - Cancel on the left, Save on the right */}
  <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
    <Button variant="contained" color="primary" onClick={handleSubmitExpense} startIcon={<Save />}>
      Save Expense
    </Button>
  </DialogActions>
</Dialog>


    {/* Cash Flow Dialog */}
    <Dialog
  open={cashFlowDialogOpen}
  onClose={handleCloseCashFlowDialog}
  fullWidth
  maxWidth="lg"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 4,
      overflow: "hidden",
    },
  }}
>
  {/* Title Section with Icon */}
  <DialogTitle
    sx={{
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "1.6rem",
      py: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
    }}
  >
    <CreditCardIcon sx={{ fontSize: 32, color: "primary.main" }} />
    Record a New Daily Cash Flow Entry
  </DialogTitle>

  {/* Content Section */}
  <DialogContent dividers sx={{ p: 4 }}>
    <Grid container spacing={3}>
      {/* Business Details */}
      <Grid item xs={12} sm={4}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <StoreIcon color="primary" /> Business Information
        </Typography>
        <FormControl fullWidth size="medium" sx={{ mb: 2 }}>
          <InputLabel>Branch</InputLabel>
          <Select name="BranchID" label="Branch" value={cashFlowForm.BranchID} onChange={handleCashFlowChange}>
            <MenuItem value=""><em>-- Select Branch --</em></MenuItem>
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="medium" sx={{ mb: 2 }}>
          <InputLabel>Business Type</InputLabel>
          <Select name="BusinessType" label="Business Type" value={cashFlowForm.BusinessType} onChange={handleCashFlowChange}>
            <MenuItem value=""><em>-- Select --</em></MenuItem>
            <MenuItem value="Gym">Gym</MenuItem>
            <MenuItem value="Cafe">Cafe</MenuItem>
            <MenuItem value="Yogurt">Yogurt</MenuItem>
          </Select>
        </FormControl>

        <TextField fullWidth type="date" label="Date" name="Date" value={cashFlowForm.Date} onChange={handleCashFlowChange} InputLabelProps={{ shrink: true }} variant="outlined" size="medium" sx={{ mb: 2 }} />
      </Grid>

      {/* Sales Breakdown */}
      <Grid item xs={12} sm={4}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <MonetizationOnIcon color="primary" /> Sales Breakdown
        </Typography>

        <TextField fullWidth type="number" label="Cash Sales" name="CashSales" value={cashFlowForm.CashSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="GCash Sales" name="GCashSales" value={cashFlowForm.GCashSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="BPI Sales" name="BPISales" value={cashFlowForm.BPISales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="BDO Sales" name="BDOSales" value={cashFlowForm.BDOSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
      </Grid>

      {/* Walk-In Sales */}
      <Grid item xs={12} sm={4}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <DirectionsWalkIcon color="primary" /> Walk-In & Finances
        </Typography>

        <TextField fullWidth type="number" label="Walk-In Cash" name="WalkInCashSales" value={cashFlowForm.WalkInCashSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Walk-In GCash" name="WalkInGCashSales" value={cashFlowForm.WalkInGCashSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Walk-In BPI" name="WalkInBPISales" value={cashFlowForm.WalkInBPISales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Walk-In BDO" name="WalkInBDOSales" value={cashFlowForm.WalkInBDOSales} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
      </Grid>

      {/* Deposits & Petty Cash */}
      <Grid item xs={12} sm={6}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon color="primary" /> Deposits & Petty Cash
        </Typography>

        <TextField fullWidth type="number" label="Deposited Amount" name="DepositedAmount" value={cashFlowForm.DepositedAmount} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
        <TextField fullWidth type="number" label="Petty Cash" name="PettyCash" value={cashFlowForm.PettyCash} onChange={handleCashFlowChange} variant="outlined" size="medium" sx={{ mb: 2 }} />
      </Grid>

      {/* Remarks */}
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <NotesIcon color="primary" /> Remarks
        </Typography>
        <TextField fullWidth label="Remarks" name="Remarks" value={cashFlowForm.Remarks} onChange={handleCashFlowChange} variant="outlined" size="medium" multiline rows={3} />
      </Grid>
    </Grid>
  </DialogContent>

  {/* Dialog Actions - Adjusted Button Positioning */}
  <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
    <Button 
    onClick={handleCloseCashFlowDialog} 
    sx={{ color: "red" }} // Red color applied 
    startIcon={<Cancel />}
  >
    Cancel
  </Button>

    <Button variant="contained" color="primary" onClick={handleCashFlowSubmit} startIcon={<Save />}>
      Submit Cash Flow
    </Button>
  </DialogActions>
</Dialog>



    </Box>
  );
}
