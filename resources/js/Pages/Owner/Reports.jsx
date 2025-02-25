import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  memo,
  useRef,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
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
  Tooltip,
  CircularProgress,
} from "@mui/material";
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
import axios from "axios";

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
  Filler,
} from "chart.js";

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

// --- Lazy load heavy modules with prefetch hints ---
const DataGrid = lazy(() =>
  import(/* webpackPrefetch: true */ "@mui/x-data-grid").then((module) => ({ default: module.DataGrid }))
);
const Doughnut = lazy(() =>
  import(/* webpackPrefetch: true */ "react-chartjs-2").then((module) => ({ default: module.Doughnut }))
);
const Line = lazy(() =>
  import(/* webpackPrefetch: true */ "react-chartjs-2").then((module) => ({ default: module.Line }))
);
const Bar = lazy(() =>
  import(/* webpackPrefetch: true */ "react-chartjs-2").then((module) => ({ default: module.Bar }))
);

// --- Helper Component: LazyLoadSection ---
// This component defers rendering its children until it comes into view.
const LazyLoadSection = ({ children, fallback = <CircularProgress /> }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
};

const Reports = () => {
  // ------------------ STATE ------------------
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Overview KPIs
  const [totalRevenue, setTotalRevenue] = useState("₱0");
  const [newMembersThisMonth, setNewMembersThisMonth] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState("0%");
  const [mostPopularService, setMostPopularService] = useState("N/A");

  // Cashflow Data
  const [cashFlowRecords, setCashFlowRecords] = useState([]);
  const [selectedCashFlowBranch, setSelectedCashFlowBranch] = useState("All Branches");
  const [selectedCashFlow, setSelectedCashFlow] = useState(null);
  const [isViewCashFlowOpen, setViewCashFlowOpen] = useState(false);
  const [isEditCashFlowOpen, setEditCashFlowOpen] = useState(false);

  // Export Menu
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Charts & Tables Data
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [membershipGrowth, setMembershipGrowth] = useState([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState({ labels: [], data: [] });
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [bookingTrends, setBookingTrends] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [branches, setBranches] = useState([]);

  // ------------------ DATA FETCHING ------------------
  useEffect(() => {
    async function loadData() {
      try {
        const [
          financeSummary,
          growthResponse,
          attendanceResponse,
          popularServiceResponse,
          cashflowResponse,
          membershipPlansResponse,
          staffPerformanceResponse,
          bookingTrendsResponse,
          systemMetricsResponse,
          branchesResponse,
        ] = await Promise.all([
          axios.get("/finance/summary", { withCredentials: true }),
          axios.get("/membership/growth", { withCredentials: true }),
          axios.get("/staff/attendance-analytics", { withCredentials: true }),
          axios.get("/booking/most-popular", { withCredentials: true }),
          axios.get("/finance/cashflow", { withCredentials: true }),
          axios.get("/membership/plans", { withCredentials: true }),
          axios.get("/staff/performance", { withCredentials: true }),
          axios.get("/booking/trends", { withCredentials: true }),
          axios.get("/system/metrics", { withCredentials: true }),
          axios.get("/owner/branches", { withCredentials: true }),
        ]);

        // Total Revenue
        const rev = financeSummary.data.total_revenue || 0;
        setTotalRevenue(`₱${Number(rev).toLocaleString()}`);

        // Membership Growth & New Members
        const growthData = growthResponse.data || [];
        setMembershipGrowth(growthData);
        const thisMonthYear = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
        const found = growthData.find((g) => g.month === thisMonthYear);
        setNewMembersThisMonth(found ? found.count : 0);

        // Attendance Analytics & Rate
        const analytics = attendanceResponse.data || [];
        let sum = 0;
        analytics.forEach((a) => { sum += Number(a.totalAttendance); });
        const avg = analytics.length > 0 ? sum / analytics.length : 0;
        setAttendanceRate(Math.min(avg, 100).toFixed(0) + "%");
        const labels = analytics.map((d) => `${d.year}-W${String(d.week).padStart(2, "0")}`);
        const data = analytics.map((d) => Number(d.totalAttendance));
        setAttendanceAnalytics({ labels, data });

        // Popular Service
        setMostPopularService(popularServiceResponse.data.mostPopularService || "N/A");

        // Cashflow Records
        setCashFlowRecords(cashflowResponse.data.flows || []);

        // Membership Plans
        setMembershipPlans(membershipPlansResponse.data || []);

        // Staff Performance
        setStaffPerformance(staffPerformanceResponse.data || []);

        // Booking Trends
        setBookingTrends(bookingTrendsResponse.data || []);

        // System Metrics
        setSystemMetrics(systemMetricsResponse.data || {});

        // Branches
        setBranches(branchesResponse.data.branches || []);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ------------------ HANDLERS ------------------
  const handleTimePeriodChange = useCallback((e) => setTimePeriod(e.target.value), []);
  const handleDateFromChange = useCallback((e) => setDateFrom(e.target.value), []);
  const handleDateToChange = useCallback((e) => setDateTo(e.target.value), []);

  const handleExportMenuOpen = useCallback((event) => setExportAnchorEl(event.currentTarget), []);
  const handleExportMenuClose = useCallback(() => setExportAnchorEl(null), []);
  const handleExportCSV = useCallback(() => {
    handleExportMenuClose();
    // CSV export handled via CSVLink (if needed)
  }, [handleExportMenuClose]);

  const handleExportPDF = useCallback(() => {
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
      row.Remarks,
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
          "Remarks",
        ],
      ],
      body: bodyData,
      startY: 20,
      margin: { horizontal: 10 },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save("DailyCashflow.pdf");
  }, [handleExportMenuClose, cashFlowRecords, selectedCashFlowBranch]);

  const handleCloseViewCashFlow = useCallback(() => {
    setViewCashFlowOpen(false);
    setSelectedCashFlow(null);
  }, []);

  const handleCloseEditCashFlow = useCallback(() => {
    setEditCashFlowOpen(false);
    setSelectedCashFlow(null);
  }, []);

  const handleSaveCashFlowEdits = useCallback(() => {
    const updatedRecords = cashFlowRecords.map((c) =>
      c.CashFlowID === selectedCashFlow.CashFlowID ? selectedCashFlow : c
    );
    setCashFlowRecords(updatedRecords);
    setEditCashFlowOpen(false);
  }, [cashFlowRecords, selectedCashFlow]);

  // ------------------ FILTERED DATA ------------------
  const filteredCashFlowRecords = useMemo(() => {
    return selectedCashFlowBranch === "All Branches"
      ? cashFlowRecords
      : cashFlowRecords.filter((rec) => rec.BranchID === selectedCashFlowBranch);
  }, [cashFlowRecords, selectedCashFlowBranch]);

  // ------------------ MEMOIZED CHART DATA & OPTIONS ------------------
  const membershipDistData = useMemo(() => ({
    labels: membershipPlans.map((p) => p.PlanName),
    datasets: [
      {
        data: membershipPlans.map((p) => Number(p.members_count) || 0),
        backgroundColor: ["#42a5f5", "#66bb6a", "#ef5350"],
      },
    ],
  }), [membershipPlans]);

  const membershipDistOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false,
  }), []);

  const membershipGrowthData = useMemo(() => ({
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
  }), [membershipGrowth]);

  const membershipGrowthOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  const attendanceAnalyticsData = useMemo(() => ({
    labels: attendanceAnalytics.labels,
    datasets: [
      {
        label: "Total Attendance",
        data: attendanceAnalytics.data,
        borderColor: "#5c6bc0",
        backgroundColor: "rgba(92,107,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  }), [attendanceAnalytics]);

  const attendanceAnalyticsOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  const staffPerformanceBarData = useMemo(() => ({
    labels: staffPerformance.map((s) => s.FullName),
    datasets: [
      {
        label: "Tasks Completed",
        data: staffPerformance.map((s) => s.tasksCompleted),
        backgroundColor: "#66bb6a",
      },
    ],
  }), [staffPerformance]);

  const staffPerformanceBarOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  const handleFilterApply = useCallback(() => {
    console.log("Filters applied:", {
      timePeriod,
      dateFrom,
      dateTo,
      selectedCashFlowBranch,
    });
  }, [timePeriod, dateFrom, dateTo, selectedCashFlowBranch]);

  const bookingTrendsData = useMemo(() => ({
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
  }), [bookingTrends]);

  const bookingTrendsOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  const systemMetricsBarData = useMemo(() => ({
    labels: ["Logs", "Notifications"],
    datasets: [
      {
        label: "Count",
        data: [systemMetrics.logsCount || 0, systemMetrics.notificationsCount || 0],
        backgroundColor: "#ab47bc",
      },
    ],
  }), [systemMetrics]);

  const systemMetricsBarOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  // ------------------ DATA GRID COLUMNS ------------------
  const dailyCashFlowColumns = useMemo(() => [
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
      },
    },
    {
      field: "GCashSales",
      headerName: "GCash Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
    },
    {
      field: "BPISales",
      headerName: "BPI Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
    },
    {
      field: "OtherSales",
      headerName: "Other Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
    },
    {
      field: "TotalSales",
      headerName: "Total Sales",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
    },
    {
      field: "PettyCash",
      headerName: "Petty Cash",
      width: 120,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
    },
    {
      field: "DepositedAmount",
      headerName: "Deposited",
      width: 130,
      renderCell: (params) => {
        const value = parseFloat(params.value);
        return isNaN(value) ? "₱0.00" : `₱${value.toFixed(2)}`;
      },
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
                p: 1,
              }}
              aria-label="View Cashflow"
              onClick={() => {
                setSelectedCashFlow(params.row);
                setViewCashFlowOpen(true);
              }}
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
                p: 1,
              }}
              aria-label="Edit Cashflow"
              onClick={() => {
                setSelectedCashFlow(params.row);
                setEditCashFlowOpen(true);
              }}
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
                p: 1,
              }}
              aria-label="Delete Cashflow"
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
      ),
    },
  ], [cashFlowRecords]);

  // ------------------ LOADING STATE ------------------
  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  // ------------------ RENDER UI ------------------
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Filter Section */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        {/* Time Period */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-period-label">Time Period</InputLabel>
          <Select
            labelId="time-period-label"
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

        {/* Date Range */}
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
          <InputLabel id="branch-label">Branch</InputLabel>
          <Select
            labelId="branch-label"
            value={selectedCashFlowBranch}
            label="Branch"
            onChange={(e) => setSelectedCashFlowBranch(e.target.value)}
          >
            <MenuItem value="All Branches">All Branches</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.BranchID} value={b.BranchID}>
                {b.BranchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filter Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleFilterApply}
          sx={{ textTransform: "none", height: "40px" }}
        >
          FILTER
        </Button>
      </Box>

      {/* Overview KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 40, color: "#42a5f5", mr: 2, fontWeight: "bold" }}
            >
              ₱
            </Typography>
            <CardContent>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="h5">{totalRevenue}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* New Members */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 1,
            }}
          >
            <PersonAddIcon sx={{ fontSize: 40, color: "#e53935", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">New Members</Typography>
              <Typography variant="h5">
                {newMembersThisMonth} This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 1,
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, color: "#43a047", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Attendance Rate</Typography>
              <Typography variant="h5">{attendanceRate}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Most Popular Service */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 1,
            }}
          >
            <GroupWorkIcon sx={{ fontSize: 40, color: "#ffca28", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Popular Service</Typography>
              <Typography variant="h5">{mostPopularService}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Membership Reports Section */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: 320,
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Membership Plan Distribution
              </Typography>
              <Box sx={{ flex: 1, position: "relative" }}>
                <Suspense fallback={<CircularProgress />}>
                  <Doughnut
                    data={membershipDistData}
                    options={membershipDistOptions}
                  />
                </Suspense>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: 320,
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Membership Growth
              </Typography>
              <Box sx={{ flex: 1, position: "relative" }}>
                <Suspense fallback={<CircularProgress />}>
                  <Line
                    data={membershipGrowthData}
                    options={membershipGrowthOptions}
                  />
                </Suspense>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </LazyLoadSection>

      {/* Attendance Analytics Section */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            height: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Attendance Over Time
          </Typography>
          <Box sx={{ flex: 1, position: "relative" }}>
            <Suspense fallback={<CircularProgress />}>
              <Line
                data={attendanceAnalyticsData}
                options={attendanceAnalyticsOptions}
              />
            </Suspense>
          </Box>
        </Paper>
      </LazyLoadSection>

      {/* Staff Performance Section */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            height: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Staff Performance - Tasks Completed
          </Typography>
          <Box sx={{ flex: 1, position: "relative" }}>
            <Suspense fallback={<CircularProgress />}>
              <Bar
                data={staffPerformanceBarData}
                options={staffPerformanceBarOptions}
              />
            </Suspense>
          </Box>
        </Paper>
      </LazyLoadSection>

      {/* Booking Trends Section */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            height: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Booking & Session Reports - Booking Trends
          </Typography>
          <Box sx={{ flex: 1, position: "relative" }}>
            <Suspense fallback={<CircularProgress />}>
              <Line
                data={bookingTrendsData}
                options={bookingTrendsOptions}
              />
            </Suspense>
          </Box>
        </Paper>
      </LazyLoadSection>

      {/* System Metrics Section */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            height: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Critical System Metrics
          </Typography>
          <Box sx={{ flex: 1, position: "relative" }}>
            <Suspense fallback={<CircularProgress />}>
              <Bar
                data={systemMetricsBarData}
                options={systemMetricsBarOptions}
              />
            </Suspense>
          </Box>
        </Paper>
      </LazyLoadSection>

      {/* Cashflow View Dialog */}
      <Dialog
        open={isViewCashFlowOpen}
        onClose={handleCloseViewCashFlow}
        fullWidth
        maxWidth="sm"
        aria-labelledby="view-cashflow-dialog-title"
      >
        <DialogTitle id="view-cashflow-dialog-title">
          <Typography variant="h6" color="primary">
            Daily Cashflow Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    ID:
                  </Typography>
                  <Typography variant="body1">
                    {selectedCashFlow.CashFlowID}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Date:
                  </Typography>
                  <Typography variant="body1">
                    {selectedCashFlow.Date}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Branch ID:
                  </Typography>
                  <Typography variant="body1">
                    {selectedCashFlow.BranchID}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Business Type:
                  </Typography>
                  <Typography variant="body1">
                    {selectedCashFlow.BusinessType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Cash Sales:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.CashSales || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    GCash Sales:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.GCashSales || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    BPI Sales:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.BPISales || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Other Sales:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.OtherSales || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Sales:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.TotalSales || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Petty Cash:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.PettyCash || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Deposited Amount:
                  </Typography>
                  <Typography variant="body1">
                    ₱{parseFloat(selectedCashFlow.DepositedAmount || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Remarks:
                  </Typography>
                  <Typography variant="body1">
                    {selectedCashFlow.Remarks}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewCashFlow} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cashflow Edit Dialog */}
      <Dialog
        open={isEditCashFlowOpen}
        onClose={handleCloseEditCashFlow}
        fullWidth
        maxWidth="sm"
        aria-labelledby="edit-cashflow-dialog-title"
      >
        <DialogTitle id="edit-cashflow-dialog-title">
          Edit Daily Cashflow
        </DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <TextField
                fullWidth
                margin="dense"
                label="Date"
                name="Date"
                type="date"
                value={selectedCashFlow.Date}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    Date: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
              {/* Additional edit fields can be added here */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditCashFlow}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCashFlowEdits}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default memo(Reports);
