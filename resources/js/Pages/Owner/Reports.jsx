import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Branch filter options for daily cashflow (could also be fetched)
const cashFlowBranchOptions = ["All Branches", "Main Branch", "Secondary Branch"];

export default function Reports() {
  // ------------------ FILTERS & DATE ------------------
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

  // ------------------ OVERVIEW KPIs ------------------
  const [totalRevenue, setTotalRevenue] = useState("₱0");
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState("0%");
  const [mostPopularService, setMostPopularService] = useState("N/A");

  // 1) Fetch real KPI data from multiple endpoints
  useEffect(() => {
    // A) Fetch total revenue
    axios
      .get("/finance/summary", { withCredentials: true })
      .then((res) => {
        // e.g. { total_revenue: 250000, net_profit: 175000 }
        const rev = res.data.total_revenue || 0;
        // Convert to formatted string
        setTotalRevenue(`₱${Number(rev).toLocaleString()}`);
      })
      .catch((err) => console.error("Error fetching finance summary:", err));

    // B) Fetch membership growth => set newMembersThisMonth
    axios
      .get("/membership/growth", { withCredentials: true })
      .then((res) => {
        // e.g. [ { month:"Jan 2025", count:12 }, { month:"Feb 2025", count:15 } ]
        const growthData = res.data || [];
        const thisMonthYear = new Date().toLocaleString("en-US", {
          month: "short",
          year: "numeric"
        }); // e.g. "Aug 2025"
        const found = growthData.find((g) => g.month === thisMonthYear);
        setNewMembersThisMonth(found ? found.count : 0);
      })
      .catch((err) => console.error("Error fetching membership growth:", err));

    // C) Fetch attendance analytics => compute attendance rate
    axios
      .get("/staff/attendance-analytics", { withCredentials: true })
      .then((res) => {
        // e.g. [ { year:2025, week:5, totalAttendance:80 }, ... ]
        const analytics = res.data || [];
        let sum = 0;
        analytics.forEach((a) => {
          sum += Number(a.totalAttendance);
        });
        const avg = analytics.length > 0 ? sum / analytics.length : 0;
        // Suppose target is 100 per "week"
        const ratePercent = (avg / 100) * 100; // scale to 100%
        // cap at 100% if you want
        const finalRate = Math.min(ratePercent, 100).toFixed(0) + "%";
        setAttendanceRate(finalRate);
      })
      .catch((err) => console.error("Error fetching attendance analytics:", err));

    // D) Fetch most popular service
    axios
      .get("/booking/most-popular", { withCredentials: true })
      .then((res) => {
        // e.g. { mostPopularService: "Zumba Classes" }
        setMostPopularService(res.data.mostPopularService || "N/A");
      })
      .catch((err) => console.error("Error fetching most popular service:", err));
  }, []);

  // ------------------ DAILY CASHFLOW ------------------
  const [cashFlowRecords, setCashFlowRecords] = useState([]);
  const [selectedCashFlowBranch, setSelectedCashFlowBranch] = useState("All Branches");
  const filteredCashFlowRecords =
    selectedCashFlowBranch === "All Branches"
      ? cashFlowRecords
      : cashFlowRecords.filter((rec) => rec.branch === selectedCashFlowBranch);

  // ------------------ MEMBERSHIP DISTRIBUTION ------------------
  const [membershipPlans, setMembershipPlans] = useState([]);
  // Expect each plan record to have { PlanID, PlanName, members_count }
  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        const res = await axios.get("/membership/plans", { withCredentials: true });
        setMembershipPlans(res.data || []);
      } catch (error) {
        console.error("Error fetching membership plans:", error);
      }
    };
    fetchMembershipPlans();
  }, []);

  const membershipDistData = {
    labels: membershipPlans.map((p) => p.PlanName),
    datasets: [
      {
        data: membershipPlans.map((p) => Number(p.members_count) || 0),
        backgroundColor: ["#42a5f5", "#66bb6a", "#ef5350"],
      },
    ],
  };
  const membershipDistOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false,
  };

  // ------------------ MEMBERSHIP GROWTH ------------------
  const [membershipGrowth, setMembershipGrowth] = useState([]);
  useEffect(() => {
    const fetchMembershipGrowth = async () => {
      try {
        const res = await axios.get("/membership/growth", { withCredentials: true });
        setMembershipGrowth(res.data || []);
      } catch (error) {
        console.error("Error fetching membership growth:", error);
      }
    };
    fetchMembershipGrowth();
  }, []);
  const membershipGrowthData = {
    labels: membershipGrowth.map((d) => d.month),
    datasets: [
      {
        label: "New Members",
        data: membershipGrowth.map((d) => Number(d.count)),
        borderColor: "#ffa726",
        backgroundColor: "rgba(255,167,38,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const membershipGrowthOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  // ------------------ ATTENDANCE ANALYTICS ------------------
  const [attendanceAnalytics, setAttendanceAnalytics] = useState([]);
  useEffect(() => {
    const fetchAttendanceAnalytics = async () => {
      try {
        const res = await axios.get("/staff/attendance-analytics", { withCredentials: true });
        // Map to labels like "2025-W01" if desired.
        const labels = res.data.map(
          (d) => `${d.year}-W${String(d.week).padStart(2, "0")}`
        );
        const data = res.data.map((d) => Number(d.totalAttendance));
        setAttendanceAnalytics({ labels, data });
      } catch (error) {
        console.error("Error fetching attendance analytics:", error);
      }
    };
    fetchAttendanceAnalytics();
  }, []);
  const attendanceAnalyticsData = {
    labels: attendanceAnalytics.labels || [],
    datasets: [
      {
        label: "Total Attendance",
        data: attendanceAnalytics.data || [],
        borderColor: "#5c6bc0",
        backgroundColor: "rgba(92,107,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const attendanceAnalyticsOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  // ------------------ STAFF PERFORMANCE ------------------
  const [staffPerformance, setStaffPerformance] = useState([]);
  useEffect(() => {
    const fetchStaffPerformance = async () => {
      try {
        const res = await axios.get("/staff/performance", { withCredentials: true });
        setStaffPerformance(res.data);
      } catch (error) {
        console.error("Error fetching staff performance:", error);
      }
    };
    fetchStaffPerformance();
  }, []);
  
  // Prepare the data for the "Tasks Completed" chart
  const staffNames = staffPerformance.map((s) => s.FullName); // use FullName field
  const staffTasks = staffPerformance.map((s) => s.tasksCompleted);
  
  const staffPerformanceBarData = {
    labels: staffNames,
    datasets: [
      {
        label: "Tasks Completed",
        data: staffTasks,
        backgroundColor: "#66bb6a",
      },
    ],
  };
  
  const staffPerformanceBarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };
  

  // ------------------ BOOKING TRENDS ------------------
  const [bookingTrends, setBookingTrends] = useState([]);
  useEffect(() => {
    const fetchBookingTrends = async () => {
      try {
        const res = await axios.get("/booking/trends", { withCredentials: true });
        setBookingTrends(res.data || []);
      } catch (error) {
        console.error("Error fetching booking trends:", error);
      }
    };
    fetchBookingTrends();
  }, []);
  const bookingTrendsData = {
    labels: bookingTrends.map((b) => b.month),
    datasets: [
      {
        label: "Total Bookings",
        data: bookingTrends.map((b) => Number(b.totalBookings)),
        borderColor: "#8d6e63",
        backgroundColor: "rgba(141,110,99,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const bookingTrendsOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  // ------------------ SYSTEM METRICS ------------------
  const [systemMetrics, setSystemMetrics] = useState({});
  useEffect(() => {
    const fetchSystemMetrics = async () => {
      try {
        const res = await axios.get("/system/metrics", { withCredentials: true });
        setSystemMetrics(res.data || {});
      } catch (error) {
        console.error("Error fetching system metrics:", error);
      }
    };
    fetchSystemMetrics();
  }, []);
  const systemMetricsBarData = {
    labels: ["Logs", "Notifications"],
    datasets: [
      {
        label: "Count",
        data: [
          systemMetrics.logsCount || 0,
          systemMetrics.notificationsCount || 0,
        ],
        backgroundColor: "#ab47bc",
      },
    ],
  };
  const systemMetricsBarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  // ------------------ DAILY CASHFLOW (Already working) ------------------
  useEffect(() => {
    const fetchCashFlow = async () => {
      try {
        const res = await axios.get("/finance/cashflow", { withCredentials: true });
        setCashFlowRecords(res.data.flows || []);
      } catch (error) {
        console.error("Error fetching cash flow:", error);
      }
    };
    fetchCashFlow();
  }, []);

  const dailyCashFlowColumns = [
    { field: "CashFlowID", headerName: "ID", width: 70 },
    { field: "Date", headerName: "Date", width: 120 },
    { field: "BranchID", headerName: "Branch ID", width: 100 },
    { field: "BusinessType", headerName: "Business Type", width: 150 },
    {
      field: "CashSales",
      headerName: "Cash Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "GCashSales",
      headerName: "GCash Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "BPISales",
      headerName: "BPI Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "OtherSales",
      headerName: "Other Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "TotalSales",
      headerName: "Total Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "PettyCash",
      headerName: "Petty Cash",
      width: 120,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    {
      field: "DepositedAmount",
      headerName: "Deposited",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      }
    },
    { field: "Remarks", headerName: "Remarks", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#4caf50",
                color: "#fff",
                "&:hover": { backgroundColor: "#43a047" },
                minWidth: "40px",
                padding: "6px"
              }}
              onClick={() => setSelectedCashFlow(params.row)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#2196f3",
                color: "#fff",
                "&:hover": { backgroundColor: "#1976d2" },
                minWidth: "40px",
                padding: "6px"
              }}
              onClick={() => setSelectedCashFlow(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#f44336",
                color: "#fff",
                "&:hover": { backgroundColor: "#d32f2f" },
                minWidth: "40px",
                padding: "6px"
              }}
              onClick={() => {
                const updated = cashFlowRecords.filter(
                  (c) => c.CashFlowID !== params.row.CashFlowID
                );
                setCashFlowRecords(updated);
              }}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      )
    }
  ];

  // ------------------ CASHFLOW DIALOG STATES ------------------
  const [selectedCashFlow, setSelectedCashFlow] = useState(null);
  const [isViewCashFlowOpen, setViewCashFlowOpen] = useState(false);
  const [isEditCashFlowOpen, setEditCashFlowOpen] = useState(false);

  const handleCloseViewCashFlow = () => {
    setViewCashFlowOpen(false);
    setSelectedCashFlow(null);
  };

  const handleCloseEditCashFlow = () => {
    setEditCashFlowOpen(false);
    setSelectedCashFlow(null);
  };

  const handleSaveCashFlowEdits = () => {
    const updatedRecords = cashFlowRecords.map((c) =>
      c.CashFlowID === selectedCashFlow.CashFlowID ? selectedCashFlow : c
    );
    setCashFlowRecords(updatedRecords);
    setEditCashFlowOpen(false);
  };

  // ------------------ EXPORT MENU ------------------
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);
  const handleExportCSV = () => handleExportMenuClose();
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    doc.text("Daily Cashflow Report", 14, 10);
    const bodyData = filteredCashFlowRecords.map((row) => [
      row.CashFlowID,
      row.Date,
      row.BranchID,
      row.BusinessType,
      parseFloat(row.CashSales || 0).toFixed(2),
      parseFloat(row.GCashSales || 0).toFixed(2),
      parseFloat(row.BPISales || 0).toFixed(2),
      parseFloat(row.OtherSales || 0).toFixed(2),
      parseFloat(row.TotalSales || 0).toFixed(2),
      parseFloat(row.PettyCash || 0).toFixed(2),
      parseFloat(row.DepositedAmount || 0).toFixed(2),
      row.Remarks
    ]);
    doc.autoTable({
      head: [
        [
          "ID",
          "Date",
          "BranchID",
          "Business Type",
          "Cash Sales",
          "GCash Sales",
          "BPI Sales",
          "Other Sales",
          "Total Sales",
          "Petty Cash",
          "Deposited",
          "Remarks"
        ]
      ],
      body: bodyData,
      startY: 20,
      margin: { horizontal: 10 },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133] }
    });
    doc.save("DailyCashflow.pdf");
  };

  // ------------------ RENDER ------------------
  return (
    <Box sx={{ p: 3 }}>
      {/* Filters */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select value={timePeriod} label="Time Period" onChange={handleTimePeriodChange}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
        <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={handleDateFromChange} />
        <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={dateTo} onChange={handleDateToChange} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Cashflow Branch</InputLabel>
          <Select value={selectedCashFlowBranch} label="Cashflow Branch" onChange={(e) => setSelectedCashFlowBranch(e.target.value)}>
            {cashFlowBranchOptions.map((branch) => (
              <MenuItem key={branch} value={branch}>{branch}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 2 }}>
            <MonetizationOnIcon sx={{ fontSize: 40, color: "#ffd54f", mr: 2 }} />
            <Box>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {totalRevenue}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 2 }}>
            <PersonAddIcon sx={{ fontSize: 40, color: "#81c784", mr: 2 }} />
            <Box>
              <Typography variant="h6">New Members</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {newMembersThisMonth} This Month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 2 }}>
            <FavoriteIcon sx={{ fontSize: 40, color: "#f06292", mr: 2 }} />
            <Box>
              <Typography variant="h6">Attendance Rate</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {attendanceRate}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 2 }}>
            <GroupWorkIcon sx={{ fontSize: 40, color: "#29b6f6", mr: 2 }} />
            <Box>
              <Typography variant="h6">Popular Service</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {mostPopularService}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Daily Cashflow Table */}
      <Typography variant="h5" gutterBottom>Daily Cashflow</Typography>
      <Divider sx={{ mb: 2 }} />
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Daily Cashflow Report</Typography>
          <Box>
            <Button variant="outlined" onClick={handleExportMenuOpen}>
              <FileDownloadIcon sx={{ mr: 1 }} /> Export
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={openExportMenu}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <MenuItem onClick={handleExportCSV}>
                <CSVLink
                  data={cashFlowRecords}
                  headers={[
                    { label: "Date", key: "Date" },
                    { label: "BranchID", key: "BranchID" },
                    { label: "BusinessType", key: "BusinessType" },
                    { label: "Cash Sales", key: "CashSales" },
                    { label: "GCash Sales", key: "GCashSales" },
                    { label: "BPI Sales", key: "BPISales" },
                    { label: "Other Sales", key: "OtherSales" },
                    { label: "Total Sales", key: "TotalSales" },
                    { label: "Petty Cash", key: "PettyCash" },
                    { label: "Deposited Amount", key: "DepositedAmount" },
                    { label: "Remarks", key: "Remarks" }
                  ]}
                  filename="DailyCashflow.csv"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Export CSV
                </CSVLink>
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </Menu>
          </Box>
        </Box>
        <div style={{ height: 300, width: "100%" }}>
          <DataGrid
            rows={filteredCashFlowRecords}
            columns={dailyCashFlowColumns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.CashFlowID}
          />
        </div>
      </Paper>

      {/* View & Edit Cashflow Dialogs */}
      <Dialog open={isViewCashFlowOpen} onClose={handleCloseViewCashFlow} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">Daily Cashflow Details</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">ID:</Typography>
                  <Typography variant="body1">{selectedCashFlow.CashFlowID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date:</Typography>
                  <Typography variant="body1">{selectedCashFlow.Date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Branch ID:</Typography>
                  <Typography variant="body1">{selectedCashFlow.BranchID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Business Type:</Typography>
                  <Typography variant="body1">{selectedCashFlow.BusinessType}</Typography>
                </Grid>
                {/* Repeat similar blocks for other fields */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Cash Sales:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.CashSales || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">GCash Sales:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.GCashSales || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">BPI Sales:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.BPISales || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Other Sales:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.OtherSales || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total Sales:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.TotalSales || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Petty Cash:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.PettyCash || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Deposited Amount:</Typography>
                  <Typography variant="body1">₱{parseFloat(selectedCashFlow.DepositedAmount || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Remarks:</Typography>
                  <Typography variant="body1">{selectedCashFlow.Remarks}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewCashFlow} variant="contained" color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditCashFlowOpen} onClose={handleCloseEditCashFlow} fullWidth maxWidth="sm">
        <DialogTitle>Edit Daily Cashflow</DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box component="form" noValidate>
              {/* Form fields for editing (similar to view dialog, with onChange updating selectedCashFlow) */}
              <TextField
                fullWidth
                margin="dense"
                label="Date"
                name="Date"
                type="date"
                value={selectedCashFlow.Date}
                onChange={(e) => setSelectedCashFlow({ ...selectedCashFlow, Date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              {/* Repeat for other fields as needed */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditCashFlow}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCashFlowEdits}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* MEMBERSHIP REPORTS */}
      <Typography variant="h5" gutterBottom>Membership Reports</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>Membership Plan Distribution</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={membershipDistData} options={membershipDistOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>Membership Growth</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={membershipGrowthData} options={membershipGrowthOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ATTENDANCE ANALYTICS */}
      <Typography variant="h5" gutterBottom>Attendance Analytics</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>Attendance Over Time</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={attendanceAnalyticsData} options={attendanceAnalyticsOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* STAFF PERFORMANCE */}
      <Typography variant="h5" gutterBottom>Staff Performance</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>Tasks Completed</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={staffPerformanceBarData} options={staffPerformanceBarOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* BOOKING TRENDS */}
      <Typography variant="h5" gutterBottom>Booking & Session Reports</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>Booking Trends</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={bookingTrendsData} options={bookingTrendsOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* SYSTEM METRICS */}
      <Typography variant="h5" gutterBottom>Critical System Metrics</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>System Metrics Overview</Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={systemMetricsBarData} options={systemMetricsBarOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
