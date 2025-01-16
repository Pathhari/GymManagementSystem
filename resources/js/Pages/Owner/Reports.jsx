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
  Divider
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import FavoriteIcon from "@mui/icons-material/Favorite";
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
const sampleRevenueTable = [
  { id: 1, source: "Memberships", amount: 350000 },
  { id: 2, source: "Facility Bookings", amount: 90000 },
  { id: 3, source: "Coaching Sessions", amount: 30000 },
  { id: 4, source: "Retail Products", amount: 20000 }
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

export default function Reports() {
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

  // Overview KPIs
  const totalRevenue = "₱500,000";
  const newMembersThisMonth = 25;
  const attendanceRate = "85%";
  const mostPopularService = "Zumba Classes";

  // Donut: "Revenue by Source"
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

  // Line: "Revenue Trends"
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

  // Export menu for table
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
    doc.text("Example Table Export", 14, 10);
    doc.save("Reports.pdf");
  };

  // Table columns
  const revenueTableColumns = [
    { field: "source", headerName: "Revenue Source", width: 180 },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => `₱${params.value.toLocaleString()}`
    }
  ];

  // MEMBERSHIP REPORTS
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

  // ATTENDANCE ANALYTICS
  // 1) Bar: Session Attendance
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

  // 2) Line: Attendance Over Time
  const attendanceOverTimeOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // STAFF PERFORMANCE
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

  // BOOKING & SESSION REPORTS
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

  // CRITICAL SYSTEM METRICS
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

  return (
    <Box sx={{ p: 3 }}>
     

      {/* Date/Time Filters */}
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

      {/* REVENUE REPORTS */}
      <Typography variant="h5" gutterBottom>
        Revenue Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* 2 charts: Donut + Line */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Revenue by Source
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={revenueBySourceData} options={revenueBySourceOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Revenue Trends
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={revenueTrendsData} options={lineOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

       {/* Title */}
       <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Divider sx={{ mb: 2 }} />
          
      {/*(Revenue breakdown) */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Revenue Breakdown (Table)</Typography>

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
                  data={sampleRevenueTable}
                  headers={[
                    { label: "Source", key: "source" },
                    { label: "Amount", key: "amount" }
                  ]}
                  filename="RevenueBreakdown.csv"
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
            rows={sampleRevenueTable}
            columns={revenueTableColumns}
            pageSize={5}
            rowsPerPageOptions={[5]}
          />
        </div>
      </Paper>

      {/* MEMBERSHIP REPORTS */}
      <Typography variant="h5" gutterBottom>
        Membership Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Doughnut: membership distribution */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Membership Plan Distribution
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={membershipDistData} options={membershipDistOptions} />
            </Box>
          </Paper>
        </Grid>
        {/* Line: membership growth */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
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
        {/* Bar: Session Attendance */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Session Attendance
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={attendanceBarData} options={attendanceBarOptions} />
            </Box>
          </Paper>
        </Grid>
        {/* Line: Attendance Over Time */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Attendance Over Time
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={attendanceOverTime} options={attendanceOverTimeOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* STAFF PERFORMANCE (2 Charts) */}
      <Typography variant="h5" gutterBottom>
        Staff Performance
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Bar for tasks completed */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Tasks Completed
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={staffPerformanceBarData} options={staffPerformanceBarOptions} />
            </Box>
          </Paper>
        </Grid>
        {/* Doughnut for feedback scores */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Average Feedback Scores
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={staffFeedbackData} options={staffFeedbackOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* BOOKING & SESSION REPORTS (2 Charts) */}
      <Typography variant="h5" gutterBottom>
        Booking & Session Reports
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Line for booking trends */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Booking Trends
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Line data={bookingTrendsData} options={bookingTrendsOptions} />
            </Box>
          </Paper>
        </Grid>
        {/* Pie for session types */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Session Type Distribution
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Doughnut data={sessionTypePieData} options={sessionTypePieOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* CRITICAL SYSTEM METRICS (2 Charts) */}
      <Typography variant="h5" gutterBottom>
        Critical System Metrics
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              System Metrics Overview
            </Typography>
            <Box sx={{ flex: 1, position: "relative" }}>
              <Bar data={systemMetricsBarData} options={systemMetricsBarOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 320,
              display: "flex",
              flexDirection: "column"
            }}
          >
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
