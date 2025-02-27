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
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
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

// ChartJS stuff
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

// Lazy-loaded components
const DataGrid = lazy(() =>
  import("@mui/x-data-grid").then((module) => ({ default: module.DataGrid }))
);
const Doughnut = lazy(() =>
  import("react-chartjs-2").then((module) => ({ default: module.Doughnut }))
);
const Line = lazy(() =>
  import("react-chartjs-2").then((module) => ({ default: module.Line }))
);
const Bar = lazy(() =>
  import("react-chartjs-2").then((module) => ({ default: module.Bar }))
);

/** Simple component that defers rendering until it scrolls into view. */
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
  const [membershipPlans, setMembershipPlans] = useState([]); // now includes .members
  const [membershipGrowth, setMembershipGrowth] = useState([]); // each has .BranchID
  const [attendanceAnalytics, setAttendanceAnalytics] = useState({ labels: [], data: [] });
  const [staffPerformance, setStaffPerformance] = useState([]); // each has .BranchID
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
          membershipPlansResponse,   // returns plan + .members
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
          axios.get("/membership/plans", { withCredentials: true }),    // <== has .members
          axios.get("/staff/performance", { withCredentials: true }),
          axios.get("/booking/trends", { withCredentials: true }),
          axios.get("/system/metrics", { withCredentials: true }),
          axios.get("/owner/branches", { withCredentials: true }),
        ]);

        // 1) Total Revenue
        const rev = financeSummary.data.total_revenue || 0;
        setTotalRevenue(`₱${Number(rev).toLocaleString()}`);

        // 2) Membership Growth & new members
        const growthData = growthResponse.data || [];
        setMembershipGrowth(growthData);
        const thisMonthYear = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
        const found = growthData.find((g) => g.month === thisMonthYear);
        setNewMembersThisMonth(found ? found.count : 0);

        // 3) Attendance Analytics & Rate
        const analytics = attendanceResponse.data || [];
        let sum = 0;
        analytics.forEach((a) => {
          sum += Number(a.totalAttendance);
        });
        const avg = analytics.length > 0 ? sum / analytics.length : 0;
        setAttendanceRate(Math.min(avg, 100).toFixed(0) + "%");
        const labels = analytics.map((d) => `${d.year}-W${String(d.week).padStart(2, "0")}`);
        const data = analytics.map((d) => Number(d.totalAttendance));
        setAttendanceAnalytics({ labels, data });

        // 4) Popular Service
        setMostPopularService(popularServiceResponse.data.mostPopularService || "N/A");

        // 5) Cashflow Records
        setCashFlowRecords(cashflowResponse.data.flows || []);

        // 6) Membership Plans (with .members)
        setMembershipPlans(membershipPlansResponse.data || []);

        // 7) Staff Performance
        setStaffPerformance(staffPerformanceResponse.data || []);

        // 8) Booking Trends
        setBookingTrends(bookingTrendsResponse.data || []);

        // 9) System Metrics
        setSystemMetrics(systemMetricsResponse.data || {});

        // 10) Branches
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
    // CSV export logic if needed
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
  }, [handleExportMenuClose, /* also depends on filteredCashFlowRecords */]);

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

  // The main "Apply" button
  const handleFilterApply = useCallback(() => {
    console.log("Filters applied:", {
      timePeriod,
      dateFrom,
      dateTo,
      selectedCashFlowBranch,
    });
  }, [timePeriod, dateFrom, dateTo, selectedCashFlowBranch]);

  // ------------------ 1) FILTER CASHFLOW (Branch + Date) ------------------
  const filteredCashFlowRecords = useMemo(() => {
    let filtered = (selectedCashFlowBranch === "All Branches")
      ? cashFlowRecords
      : cashFlowRecords.filter((rec) => rec.BranchID === selectedCashFlowBranch);

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      filtered = filtered.filter((rec) => {
        const recordDate = new Date(rec.Date);
        return recordDate >= from && recordDate <= to;
      });
    }
    return filtered;
  }, [cashFlowRecords, selectedCashFlowBranch, dateFrom, dateTo]);

  // ------------------ 2) MEMBERSHIP PLAN DISTRIBUTION by Branch ------------------
  // membershipPlans: array of plans. Each plan has `.members` which is an array of members.
  // We'll count how many members belong to the chosen branch.
  const membershipDistData = useMemo(() => {
    const labels = [];
    const data = [];

    membershipPlans.forEach((plan) => {
      // plan.members is e.g. [{MemberID, StartedBranchID, ...}, ...]
      let relevantMembers = plan.members || [];
      if (selectedCashFlowBranch !== "All Branches") {
        relevantMembers = relevantMembers.filter(
          (m) => m.StartedBranchID === parseInt(selectedCashFlowBranch)
        );
      }
      labels.push(plan.PlanName);
      data.push(relevantMembers.length);
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ["#42a5f5", "#66bb6a", "#ef5350", "#ffa726", "#ab47bc"],
        },
      ],
    };
  }, [membershipPlans, selectedCashFlowBranch]);

  const membershipDistOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false,
  }), []);

  // ------------------ 3) MEMBERSHIP GROWTH by Branch ------------------
  // We assume each item has { BranchID, month, count }
  const filteredMembershipGrowth = useMemo(() => {
    if (selectedCashFlowBranch === "All Branches") return membershipGrowth;
    return membershipGrowth.filter((g) => g.BranchID === parseInt(selectedCashFlowBranch));
  }, [membershipGrowth, selectedCashFlowBranch]);

  const membershipGrowthData = useMemo(() => ({
    labels: filteredMembershipGrowth.map((d) => d.month),
    datasets: [
      {
        label: "New Members",
        data: filteredMembershipGrowth.map((d) => Number(d.count)),
        borderColor: "#ffa726",
        backgroundColor: "rgba(255,167,38,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  }), [filteredMembershipGrowth]);

  const membershipGrowthOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  // ------------------ 4) STAFF PERFORMANCE by Branch ------------------
  // staffPerformance: array with { StaffID, FullName, BranchID, tasksCompleted } presumably
  const filteredStaffPerformance = useMemo(() => {
    if (selectedCashFlowBranch === "All Branches") return staffPerformance;
    return staffPerformance.filter((s) => s.BranchID === parseInt(selectedCashFlowBranch));
  }, [staffPerformance, selectedCashFlowBranch]);

  const staffPerformanceBarData = useMemo(() => ({
    labels: filteredStaffPerformance.map((s) => s.FullName),
    datasets: [
      {
        label: "Tasks Completed",
        data: filteredStaffPerformance.map((s) => s.tasksCompleted),
        backgroundColor: "#66bb6a",
      },
    ],
  }), [filteredStaffPerformance]);

  const staffPerformanceBarOptions = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }), []);

  // ------------------ REMAINING CHARTS (Attendance, Booking, System Metrics) ------------------
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
      {/* FILTER SECTION */}
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
          <InputLabel>Time Period</InputLabel>
          <Select
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
          label="From"
          type="date"
          size="small"
          value={dateFrom}
          onChange={handleDateFromChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={dateTo}
          onChange={handleDateToChange}
          InputLabelProps={{ shrink: true }}
        />

        {/* Branch Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Branch</InputLabel>
          <Select
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

        <Button variant="contained" color="primary" onClick={handleFilterApply}>
          Filter
        </Button>
      </Box>

      {/* MEMBERSHIP REPORTS: Plans + Growth */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Membership Plan Distribution */}
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

          {/* Membership Growth */}
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

      {/* STAFF PERFORMANCE */}
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

      {/* EXAMPLE: DAILY CASHFLOW TABLE */}
      <LazyLoadSection fallback={<CircularProgress />}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2,
            height: 450,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Daily Cashflow Records
          </Typography>
          <Box sx={{ flex: 1, position: "relative" }}>
            <Suspense fallback={<CircularProgress />}>
              <DataGrid
                rows={filteredCashFlowRecords}
                columns={dailyCashFlowColumns}
                getRowId={(row) => row.CashFlowID}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
              />
            </Suspense>
          </Box>
        </Paper>
      </LazyLoadSection>
    </Container>
  );
};

export default memo(Reports);
