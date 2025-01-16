import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EngineeringIcon from "@mui/icons-material/Engineering";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// For CSV/PDF export
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Placeholder charts (Line / Bar / Doughnut, etc.)
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
const sampleLogs = [
  {
    logId: "LOG-1001",
    timestamp: "2025-01-01 09:15:00",
    user: "AdminUser",
    actionDesc: "Deleted Member #123",
    module: "Membership",
    logType: "Critical",
    details: "Removed membership record and all references.",
    ipAddress: "192.168.1.10",
  },
  {
    logId: "LOG-1002",
    timestamp: "2025-01-02 10:30:00",
    user: "JohnDoe",
    actionDesc: "Updated Payment #PAY-2001",
    module: "Payments",
    logType: "Informational",
    details: "Changed status from Pending to Completed.",
    ipAddress: "192.168.1.20",
  },
  {
    logId: "LOG-1003",
    timestamp: "2025-01-02 11:00:00",
    user: "Alice",
    actionDesc: "Changed user role for Bob to 'Staff'",
    module: "Staff Management",
    logType: "Critical",
    details: "Updated role from 'Viewer' to 'Staff'.",
    ipAddress: "192.168.1.30",
  },
];

// Example data for "Most Active Module" placeholder
const MOST_ACTIVE_MODULE = "Membership Management (45 Actions This Week)";

export default function SystemLogs() {
  // ------------------ States & Data ------------------
  const [logs, setLogs] = useState(sampleLogs);
  const [searchTerm, setSearchTerm] = useState("");

  // Date filters
  const [dateRange, setDateRange] = useState("last7days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Derive stats for overview cards
  const totalLogsCount = logs.length; // "Total Logs"
  const criticalActionsCount = logs.filter((l) => l.logType === "Critical").length;
  // Suppose "User Activity Today" means logs from the current date (2025-01-02, etc.)
  const todayStr = "2025-01-02"; // Hard-coded for example
  const userActivityTodayCount = logs.filter((l) => l.timestamp.startsWith(todayStr)).length;
  // "Most Active Module" in the last 7 days
  const mostActiveModule = MOST_ACTIVE_MODULE;

  // ------------- Filtered Logs (based on searchTerm, date range, etc.) -------------
  const filteredLogs = logs.filter((log) =>
    Object.values(log).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ------------- Table Columns -------------
  const columns = [
    { field: "logId", headerName: "Log ID", width: 100 },
    { field: "timestamp", headerName: "Timestamp", width: 160 },
    { field: "user", headerName: "User", width: 120 },
    { field: "actionDesc", headerName: "Action Description", width: 200 },
    { field: "module", headerName: "Module", width: 140 },
    {
      field: "logType",
      headerName: "Log Type",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {params.value === "Critical" ? (
            <ErrorIcon sx={{ color: "#f44336" }} />
          ) : (
            <InfoIcon sx={{ color: "#2196f3" }} />
          )}
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "details",
      headerName: "Details",
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Log Details">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#4caf50",
                color: "#fff",
                "&:hover": { backgroundColor: "#43a047" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleViewLog(params.row)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Archive Log (Older Logs)">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#9e9e9e",
                color: "#fff",
                "&:hover": { backgroundColor: "#757575" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleArchiveLog(params.row.logId)}
            >
              <ArchiveIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Log">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#f44336",
                color: "#fff",
                "&:hover": { backgroundColor: "#d32f2f" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleDeleteLog(params.row.logId)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];
  const getRowId = (row) => row.logId;

  // ------------- Handlers: View, Archive, Delete -------------
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLogData, setViewLogData] = useState(null);

  const handleViewLog = (row) => {
    setViewLogData(row);
    setViewOpen(true);
  };
  const [confirmArchiveLogId, setConfirmArchiveLogId] = useState(null);
  const handleArchiveLog = (logId) => {
    setConfirmArchiveLogId(logId);
  };
  const confirmArchive = () => {
    // In real logic, you'd remove from local array or mark "archived"
    setLogs((prev) => prev.filter((log) => log.logId !== confirmArchiveLogId));
    setConfirmArchiveLogId(null);
  };

  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);
  const handleDeleteLog = (logId) => {
    setConfirmDeleteLogId(logId);
  };
  const confirmDelete = () => {
    setLogs((prev) => prev.filter((log) => log.logId !== confirmDeleteLogId));
    setConfirmDeleteLogId(null);
  };

  // ------------- Export (CSV/PDF) -------------
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };
  // CSV
  const csvHeaders = [
    { label: "Log ID", key: "logId" },
    { label: "Timestamp", key: "timestamp" },
    { label: "User", key: "user" },
    { label: "ActionDesc", key: "actionDesc" },
    { label: "Module", key: "module" },
    { label: "LogType", key: "logType" },
    { label: "Details", key: "details" },
    // IP could be included if you want
  ];
  const csvData = filteredLogs;

  const handleExportCSV = () => {
    handleExportMenuClose();
  };
  // PDF
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    doc.text("System Logs Export", 14, 10);

    const bodyData = filteredLogs.map((l) => [
      l.logId,
      l.timestamp,
      l.user,
      l.actionDesc,
      l.module,
      l.logType,
      l.details || "",
    ]);
    doc.autoTable({
      head: [["LogID", "Timestamp", "User", "Action", "Module", "LogType", "Details"]],
      body: bodyData,
      startY: 20,
    });
    doc.save("SystemLogs.pdf");
  };

  // ------------- CHARTS (Placeholder) -------------
  // 1) Line chart for "Logs Over Time"
  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Number of Logs",
        data: [20, 15, 18, 25, 30, 22, 10],
        borderColor: "#42a5f5",
        backgroundColor: "rgba(66,165,245,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // 2) Bar or Doughnut chart for "Logs by Module" (example)
  const modulesData = {
    labels: ["Membership", "Payments", "Coaching", "Staff", "Other"],
    datasets: [
      {
        data: [30, 20, 10, 15, 5],
        backgroundColor: ["#66bb6a", "#ef5350", "#26c6da", "#ffca28", "#ab47bc"],
      },
    ],
  };
  const modulesOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    maintainAspectRatio: false,
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ---------- Date & Filter Row on Top ---------- */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date Range</InputLabel>
          <Select value={dateRange} label="Date Range" onChange={(e) => setDateRange(e.target.value)}>
            <MenuItem value="last7days">Last 7 Days</MenuItem>
            <MenuItem value="lastMonth">Last Month</MenuItem>
            <MenuItem value="lastYear">Last Year</MenuItem>
          </Select>
        </FormControl>
        <TextField
          type="date"
          size="small"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </Box>

      {/* ---------- Overview Cards ---------- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              display: "flex",
              alignItems: "center",
              p: 2,
            }}
          >
            <ListAltIcon sx={{ fontSize: 40, color: "#fff", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Total Logs</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {totalLogsCount}
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
              p: 2,
            }}
          >
            <ErrorIcon sx={{ fontSize: 40, color: "#f44336", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Critical Actions</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {criticalActionsCount}
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
              p: 2,
            }}
          >
            <EventNoteIcon sx={{ fontSize: 40, color: "#4caf50", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Logs Today</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {userActivityTodayCount}
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
              p: 2,
            }}
          >
            <EngineeringIcon sx={{ fontSize: 40, color: "#ffca28", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Most Active Module</Typography>
              <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                {mostActiveModule}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------- 2 Graphs: 1 Line (Logs Over Time), 1 Donut/Bar (Logs by Module) ---------- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
  {/* Logs Over Time Graph Card */}
  <Grid item xs={12} md={6}>
    <Paper
      sx={{
        p: 2,
        height: 400, // Match the height of other cards
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Logs Over Time
      </Typography>
      <Box
        sx={{
          flex: 1,
          position: "relative",
        }}
      >
        <Line
          data={lineData}
          options={{
            ...lineOptions,
            maintainAspectRatio: false,
          }}
        />
      </Box>
    </Paper>
  </Grid>

  {/* Logs by Module Graph Card */}
  <Grid item xs={12} md={6}>
    <Paper
      sx={{
        p: 2,
        height: 400, // Match the height of other cards
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Logs by Module
      </Typography>
      <Box
        sx={{
          flex: 1,
          position: "relative",
        }}
      >
        <Doughnut data={modulesData} options={modulesOptions} />
      </Box>
    </Paper>
  </Grid>
</Grid>
   &nbsp;
      <Typography variant="h4" gutterBottom>
        System Logs & Activity
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ---------- Search + Export Buttons ---------- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
          {/* Search box */}
         <TextField
                     placeholder="Search"
                     variant="outlined"
                     size="small"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     sx={{ width: "100%", maxWidth: 300 }}
                   />
          {/* Export Menu */}
          <Box>
  <Button
    variant="outlined"
    onClick={(e) => setExportAnchorEl(e.currentTarget)}
    startIcon={<FileDownloadIcon />}
  >
    Export
  </Button>
  <Menu
    anchorEl={exportAnchorEl}
    open={openExportMenu}
    onClose={handleExportMenuClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
  >
    <MenuItem onClick={handleExportCSV}>
      <CSVLink
        data={csvData}
        headers={csvHeaders}
        filename="SystemLogs.csv"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileDownloadIcon sx={{ color: "#42a5f5" }} />
          <Typography>Export CSV</Typography>
        </Box>
      </CSVLink>
    </MenuItem>
    <MenuItem onClick={handleExportPDF}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FileDownloadIcon sx={{ color: "#ef5350" }} />
        <Typography>Export PDF</Typography>
      </Box>
    </MenuItem>
  </Menu>
</Box>
        </Box>

        {/* ---------- DataGrid Table ---------- */}
        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            getRowId={getRowId}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </div>
      </Paper>

      {/* ------------- View Log Dialog ------------- */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {viewLogData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography>
                <strong>Log ID:</strong> {viewLogData.logId}
              </Typography>
              <Typography>
                <strong>Timestamp:</strong> {viewLogData.timestamp}
              </Typography>
              <Typography>
                <strong>User:</strong> {viewLogData.user}
              </Typography>
              <Typography>
                <strong>Action:</strong> {viewLogData.actionDesc}
              </Typography>
              <Typography>
                <strong>Module:</strong> {viewLogData.module}
              </Typography>
              <Typography>
                <strong>Log Type:</strong> {viewLogData.logType}
              </Typography>
              <Typography>
                <strong>Details:</strong> {viewLogData.details}
              </Typography>
              <Typography>
                <strong>IP Address:</strong> {viewLogData.ipAddress || "N/A"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ------------- Confirm Archive Dialog ------------- */}
      <Dialog
        open={Boolean(confirmArchiveLogId)}
        onClose={() => setConfirmArchiveLogId(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Archive Log</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to archive this log (<strong>{confirmArchiveLogId}</strong>)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmArchiveLogId(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmArchive}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------- Confirm Delete Dialog ------------- */}
      <Dialog
        open={Boolean(confirmDeleteLogId)}
        onClose={() => setConfirmDeleteLogId(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Log</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this log (<strong>{confirmDeleteLogId}</strong>)?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Warning: This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteLogId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
