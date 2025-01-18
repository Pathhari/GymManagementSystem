import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Divider,
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
  Legend
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// -------------- SAMPLE DATA --------------

// DailyCashFlow sample data (replacing revenue breakdown table)
// Added a new 'branch' property to each record.
const sampleDailyCashFlow = [
  {
    CashFlowID: 1,
    Date: "2025-01-15",
    BranchID: 101,
    BusinessType: "Gym",
    CashSales: 10000.0,
    GCashSales: 5000.0,
    BPISales: 3000.0,
    OtherSales: 2000.0,
    TotalSales: 20000.0,
    PettyCash: 1000.0,
    DepositedAmount: 19000.0,
    Remarks: "All good.",
    CreatedAt: "2025-01-15 08:00:00",
    UpdatedAt: "2025-01-15 20:00:00",
    branch: "Main Branch"
  },
  {
    CashFlowID: 2,
    Date: "2025-01-16",
    BranchID: 101,
    BusinessType: "Gym",
    CashSales: 12000.0,
    GCashSales: 7000.0,
    BPISales: 4000.0,
    OtherSales: 1000.0,
    TotalSales: 24000.0,
    PettyCash: 1500.0,
    DepositedAmount: 22500.0,
    Remarks: "Slightly busy day.",
    CreatedAt: "2025-01-16 08:00:00",
    UpdatedAt: "2025-01-16 20:00:00",
    branch: "Secondary Branch"
  }
];

const sampleMembershipTable = [
  { id: 1, planName: "Basic Plan", membersCount: 40 },
  { id: 2, planName: "Premium Plan", membersCount: 60 },
  { id: 3, planName: "Family Plan", membersCount: 20 }
];

const membershipGrowthDataPoints = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "New Members",
      data: [10, 15, 20, 25, 30, 40],
      borderColor: "#ffa726",
      backgroundColor: "rgba(255,167,38,0.2)",
      fill: true,
      tension: 0.3
    }
  ]
};

const sampleAttendanceTable = [
  { id: 1, sessionType: "Zumba", avgAttendance: 35 },
  { id: 2, sessionType: "Yoga", avgAttendance: 25 },
  { id: 3, sessionType: "Spinning", avgAttendance: 15 }
];

const attendanceOverTime = {
  labels: ["Week1", "Week2", "Week3", "Week4", "Week5"],
  datasets: [
    {
      label: "Attendance Over Time",
      data: [60, 75, 55, 80, 90],
      borderColor: "#5c6bc0",
      backgroundColor: "rgba(92,107,192,0.2)",
      fill: true,
      tension: 0.3
    }
  ]
};

const sampleStaffPerformance = [
  { staffName: "Alice (Trainer)", tasksCompleted: 28, feedbackScore: 4.5 },
  { staffName: "Bob (Coach)", tasksCompleted: 35, feedbackScore: 4.7 },
  { staffName: "Carol (Admin)", tasksCompleted: 12, feedbackScore: 4.2 },
  { staffName: "David (Trainer)", tasksCompleted: 40, feedbackScore: 4.9 }
];

const sampleBookingData = [
  { month: "Jan", totalBookings: 150 },
  { month: "Feb", totalBookings: 180 },
  { month: "Mar", totalBookings: 220 },
  { month: "Apr", totalBookings: 210 },
  { month: "May", totalBookings: 250 },
  { month: "Jun", totalBookings: 300 }
];

const sampleSystemMetrics = [
  { metric: "Logs Created", count: 340 },
  { metric: "Notifications Sent", count: 120 },
  { metric: "Downtime (mins)", count: 15 }
];

// ------------- NEW: Define Branch Options for Daily Cashflow Once -------------
const cashFlowBranchOptions = ["All Branches", "Main Branch", "Secondary Branch"];

export default function Reports() {
  // ----------------- FILTERS & DATE -----------------
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

  // ----------------- OVERVIEW KPIs -----------------
  const totalRevenue = "₱500,000";
  const newMembersThisMonth = 25;
  const attendanceRate = "85%";
  const mostPopularService = "Zumba Classes";

  // ----------------- CHART DATA -----------------
  // Donut: Revenue by Source
  const revenueBySourceData = {
    labels: ["Memberships", "Facility Bookings", "Coaching", "Retail"],
    datasets: [
      {
        data: [350000, 90000, 30000, 20000],
        backgroundColor: ["#66bb6a", "#26c6da", "#ffca28", "#ef5350"]
      }
    ]
  };
  const revenueBySourceOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false
  };

  // Line: Revenue Trends
  const revenueTrendsData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Total Revenue",
        data: [100000, 120000, 150000, 130000, 170000, 200000],
        borderColor: "#42a5f5",
        backgroundColor: "rgba(66,165,245,0.2)",
        fill: true,
        tension: 0.3
      }
    ]
  };
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // ----------------- EXPORT MENU -----------------
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };
  const handleExportCSV = () => {
    handleExportMenuClose();
  };
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    doc.text("Daily Cashflow Report", 14, 10);
    const bodyData = filteredCashFlowRecords.map((row) => [
      row.CashFlowID,
      row.Date,
      row.BranchID,
      row.BusinessType,
      row.CashSales.toFixed(2),
      row.GCashSales.toFixed(2),
      row.BPISales.toFixed(2),
      row.OtherSales.toFixed(2),
      row.TotalSales.toFixed(2),
      row.PettyCash.toFixed(2),
      row.DepositedAmount.toFixed(2),
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

  // ----------------- DAILY CASHFLOW TABLE -----------------
  const [cashFlowRecords, setCashFlowRecords] = useState(sampleDailyCashFlow);
  // Daily Cashflow Branch Filter state
  const [selectedCashFlowBranch, setSelectedCashFlowBranch] = useState("All Branches");
  const filteredCashFlowRecords =
    selectedCashFlowBranch === "All Branches"
      ? cashFlowRecords
      : cashFlowRecords.filter((rec) => rec.branch === selectedCashFlowBranch);

  const dailyCashFlowColumns = [
    { field: "CashFlowID", headerName: "ID", width: 70 },
    { field: "Date", headerName: "Date", width: 120 },
    { field: "BranchID", headerName: "Branch ID", width: 100 },
    { field: "BusinessType", headerName: "Business Type", width: 150 },
    {
      field: "CashSales",
      headerName: "Cash Sales",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "GCashSales",
      headerName: "GCash Sales",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "BPISales",
      headerName: "BPI Sales",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "OtherSales",
      headerName: "Other Sales",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "TotalSales",
      headerName: "Total Sales",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "PettyCash",
      headerName: "Petty Cash",
      width: 120,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    {
      field: "DepositedAmount",
      headerName: "Deposited",
      width: 130,
      renderCell: (params) => `₱${params.value.toFixed(2)}`
    },
    { field: "Remarks", headerName: "Remarks", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton color="success" onClick={() => handleViewCashFlow(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton color="primary" onClick={() => handleEditCashFlow(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteCashFlow(params.row.CashFlowID)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // ----------------- Daily Cashflow Actions -----------------
  const [selectedCashFlow, setSelectedCashFlow] = useState(null);
  const [isViewCashFlowOpen, setViewCashFlowOpen] = useState(false);
  const [isEditCashFlowOpen, setEditCashFlowOpen] = useState(false);

  const handleViewCashFlow = (record) => {
    setSelectedCashFlow(record);
    setViewCashFlowOpen(true);
  };

  const handleEditCashFlow = (record) => {
    setSelectedCashFlow(record);
    setEditCashFlowOpen(true);
  };

  const handleDeleteCashFlow = (cashFlowID) => {
    const updated = cashFlowRecords.filter((c) => c.CashFlowID !== cashFlowID);
    setCashFlowRecords(updated);
  };

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

  // ----------------- MEMBERSHIP REPORTS -----------------
  const membershipDistData = {
    labels: sampleMembershipTable.map((m) => m.planName),
    datasets: [
      {
        data: sampleMembershipTable.map((m) => m.membersCount),
        backgroundColor: ["#42a5f5", "#66bb6a", "#ef5350"]
      }
    ]
  };
  const membershipDistOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false
  };

  const membershipGrowthOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // ----------------- ATTENDANCE ANALYTICS -----------------
  const attendanceBarData = {
    labels: sampleAttendanceTable.map((a) => a.sessionType),
    datasets: [
      {
        label: "Avg Attendance",
        data: sampleAttendanceTable.map((a) => a.avgAttendance),
        backgroundColor: "#5c6bc0"
      }
    ]
  };
  const attendanceBarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  const attendanceOverTimeOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // ----------------- STAFF PERFORMANCE -----------------
  const staffNames = sampleStaffPerformance.map((s) => s.staffName);
  const staffTasks = sampleStaffPerformance.map((s) => s.tasksCompleted);
  const staffPerformanceBarData = {
    labels: staffNames,
    datasets: [
      {
        label: "Tasks Completed",
        data: staffTasks,
        backgroundColor: "#66bb6a"
      }
    ]
  };
  const staffPerformanceBarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  const staffFeedbackData = {
    labels: staffNames,
    datasets: [
      {
        data: sampleStaffPerformance.map((s) => s.feedbackScore),
        backgroundColor: ["#5c6bc0", "#26c6da", "#ffca28", "#ef5350"]
      }
    ]
  };
  const staffFeedbackOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false
  };

  // ----------------- BOOKING & SESSION REPORTS -----------------
  const bookingTrendsData = {
    labels: sampleBookingData.map((b) => b.month),
    datasets: [
      {
        label: "Total Bookings",
        data: sampleBookingData.map((b) => b.totalBookings),
        borderColor: "#8d6e63",
        backgroundColor: "rgba(141,110,99,0.2)",
        fill: true,
        tension: 0.3
      }
    ]
  };
  const bookingTrendsOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  const sessionTypeLabels = ["Group Classes", "1-on-1 Sessions", "Open Gym"];
  const sessionTypeData = [120, 90, 70];
  const sessionTypePieData = {
    labels: sessionTypeLabels,
    datasets: [
      {
        data: sessionTypeData,
        backgroundColor: ["#66bb6a", "#42a5f5", "#ffca28"]
      }
    ]
  };
  const sessionTypePieOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false
  };

  // ----------------- CRITICAL SYSTEM METRICS -----------------
  const systemMetricLabels = sampleSystemMetrics.map((m) => m.metric);
  const systemMetricData = sampleSystemMetrics.map((m) => m.count);
  const systemMetricsBarData = {
    labels: systemMetricLabels,
    datasets: [
      {
        label: "Count",
        data: systemMetricData,
        backgroundColor: "#ab47bc"
      }
    ]
  };
  const systemMetricsBarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  const systemDowntimeTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Downtime (minutes)",
        data: [0, 5, 0, 10, 0, 2, 0],
        borderColor: "#ef5350",
        backgroundColor: "rgba(239,83,80,0.2)",
        fill: true,
        tension: 0.3
      }
    ]
  };
  const systemDowntimeTrendOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // ----------------- RENDER -----------------
  return (
    <Box sx={{ p: 3 }}>
      {/* Date/Time & Branch Filters */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center"
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select value={timePeriod} label="Time Period" onChange={handleTimePeriodChange}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
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
        {/* NEW: Branch Filter for Daily Cashflow */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Cashflow Branch</InputLabel>
          <Select
            value={selectedCashFlowBranch}
            label="Cashflow Branch"
            onChange={(e) => setSelectedCashFlowBranch(e.target.value)}
          >
            {cashFlowBranchOptions.map((branch) => (
              <MenuItem key={branch} value={branch}>
                {branch}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 2
            }}
          >
            <MonetizationOnIcon sx={{ fontSize: 40, color: "#ffd54f", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Total Revenue</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {totalRevenue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 2
            }}
          >
            <PersonAddIcon sx={{ fontSize: 40, color: "#81c784", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">New Members</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {newMembersThisMonth} This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 2
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, color: "#f06292", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Attendance Rate</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {attendanceRate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 2
            }}
          >
            <GroupWorkIcon sx={{ fontSize: 40, color: "#29b6f6", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Popular Service</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {mostPopularService}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily Cashflow Table */}
      <Typography variant="h5" gutterBottom>
        Daily Cashflow
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Daily Cashflow Report</Typography>
          {/* Export Buttons */}
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
                  data={sampleDailyCashFlow}
                  headers={[
                    { label: "Date", key: "Date" },
                    { label: "BranchID", key: "BranchID" },
                    { label: "BusinessType", key: "BusinessType" },
                    { label: "CashSales", key: "CashSales" },
                    { label: "GCashSales", key: "GCashSales" },
                    { label: "BPISales", key: "BPISales" },
                    { label: "OtherSales", key: "OtherSales" },
                    { label: "TotalSales", key: "TotalSales" },
                    { label: "PettyCash", key: "PettyCash" },
                    { label: "DepositedAmount", key: "DepositedAmount" },
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

      {/* View Daily Cashflow Dialog */}
      <Dialog open={isViewCashFlowOpen} onClose={handleCloseViewCashFlow} maxWidth="sm" fullWidth>
        <DialogTitle>Daily Cashflow Details</DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box>
              <Typography gutterBottom>
                <strong>ID:</strong> {selectedCashFlow.CashFlowID}
              </Typography>
              <Typography gutterBottom>
                <strong>Date:</strong> {selectedCashFlow.Date}
              </Typography>
              <Typography gutterBottom>
                <strong>Branch ID:</strong> {selectedCashFlow.BranchID}
              </Typography>
              <Typography gutterBottom>
                <strong>Business Type:</strong> {selectedCashFlow.BusinessType}
              </Typography>
              <Typography gutterBottom>
                <strong>Cash Sales:</strong> ₱{selectedCashFlow.CashSales.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>GCash Sales:</strong> ₱{selectedCashFlow.GCashSales.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>BPI Sales:</strong> ₱{selectedCashFlow.BPISales.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>Other Sales:</strong> ₱{selectedCashFlow.OtherSales.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>Total Sales:</strong> ₱{selectedCashFlow.TotalSales.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>Petty Cash:</strong> ₱{selectedCashFlow.PettyCash.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>Deposited Amount:</strong> ₱{selectedCashFlow.DepositedAmount.toFixed(2)}
              </Typography>
              <Typography gutterBottom>
                <strong>Remarks:</strong> {selectedCashFlow.Remarks}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewCashFlow}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Daily Cashflow Dialog */}
      <Dialog open={isEditCashFlowOpen} onClose={handleCloseEditCashFlow} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Daily Cashflow</DialogTitle>
        <DialogContent dividers>
          {selectedCashFlow && (
            <Box component="form" noValidate>
              <TextField
                fullWidth
                margin="dense"
                label="Date"
                name="Date"
                type="date"
                value={selectedCashFlow.Date}
                onChange={(e) =>
                  setSelectedCashFlow({ ...selectedCashFlow, Date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Branch ID"
                name="BranchID"
                type="number"
                value={selectedCashFlow.BranchID}
                onChange={(e) =>
                  setSelectedCashFlow({ ...selectedCashFlow, BranchID: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Business Type"
                name="BusinessType"
                value={selectedCashFlow.BusinessType}
                onChange={(e) =>
                  setSelectedCashFlow({ ...selectedCashFlow, BusinessType: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Cash Sales"
                name="CashSales"
                type="number"
                value={selectedCashFlow.CashSales}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    CashSales: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="GCash Sales"
                name="GCashSales"
                type="number"
                value={selectedCashFlow.GCashSales}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    GCashSales: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="BPI Sales"
                name="BPISales"
                type="number"
                value={selectedCashFlow.BPISales}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    BPISales: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Other Sales"
                name="OtherSales"
                type="number"
                value={selectedCashFlow.OtherSales}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    OtherSales: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Total Sales"
                name="TotalSales"
                type="number"
                value={selectedCashFlow.TotalSales}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    TotalSales: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Petty Cash"
                name="PettyCash"
                type="number"
                value={selectedCashFlow.PettyCash}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    PettyCash: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Deposited Amount"
                name="DepositedAmount"
                type="number"
                value={selectedCashFlow.DepositedAmount}
                onChange={(e) =>
                  setSelectedCashFlow({
                    ...selectedCashFlow,
                    DepositedAmount: parseFloat(e.target.value) || 0
                  })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Remarks"
                name="Remarks"
                value={selectedCashFlow.Remarks}
                onChange={(e) =>
                  setSelectedCashFlow({ ...selectedCashFlow, Remarks: e.target.value })
                }
                multiline
                rows={2}
              />
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

      {/* MEMBERSHIP REPORTS */}
      <Typography variant="h5" gutterBottom>
        Membership Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Membership Plan Distribution
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={membershipDistData} options={membershipDistOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Membership Growth
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={membershipGrowthDataPoints} options={membershipGrowthOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ATTENDANCE ANALYTICS */}
      <Typography variant="h5" gutterBottom>
        Attendance Analytics
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Session Attendance
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={attendanceBarData} options={attendanceBarOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Attendance Over Time
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={attendanceOverTime} options={attendanceOverTimeOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* STAFF PERFORMANCE */}
      <Typography variant="h5" gutterBottom>
        Staff Performance
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Tasks Completed
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={staffPerformanceBarData} options={staffPerformanceBarOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Average Feedback Scores
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={staffFeedbackData} options={staffFeedbackOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* BOOKING & SESSION REPORTS */}
      <Typography variant="h5" gutterBottom>
        Booking & Session Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Booking Trends
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={bookingTrendsData} options={bookingTrendsOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Session Type Distribution
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={sessionTypePieData} options={sessionTypePieOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* CRITICAL SYSTEM METRICS */}
      <Typography variant="h5" gutterBottom>
        Critical System Metrics
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              System Metrics Overview
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={systemMetricsBarData} options={systemMetricsBarOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" gutterBottom>
              Downtime Trend
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={systemDowntimeTrendData} options={systemDowntimeTrendOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
