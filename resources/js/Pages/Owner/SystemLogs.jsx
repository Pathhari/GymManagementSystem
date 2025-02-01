import React, { useState, useEffect, useMemo } from "react";
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
  Divider
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EngineeringIcon from "@mui/icons-material/Engineering";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Chart.js
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
import { Line, Doughnut } from "react-chartjs-2";

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

const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content');

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const branchOptions = ["All Branches", "New York", "Los Angeles", "Chicago"];

  const [dateRange, setDateRange] = useState("last7days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch logs on mount
  useEffect(() => {
    setLoading(true);
    fetch("/system/logs", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  // ------------------ Overview Stats ------------------
  const totalLogsCount = logs.length;
  const criticalActionsCount = logs.filter((l) => l.logType === "Critical").length;

  // Logs from "today"
  const todayStr = new Date().toISOString().slice(0, 10); // e.g. "2025-01-02"
  const userActivityTodayCount = logs.filter((l) => l.timestamp.startsWith(todayStr)).length;

  const mostActiveModule = "Membership Management (45 Actions This Week)"; // example placeholder

  // ------------------ Filtering (Branch, Search) ------------------
  const branchFilteredLogs = useMemo(() => {
    if (selectedBranch === "All Branches") return logs;
    return logs.filter((log) => (log.branch || "") === selectedBranch);
  }, [logs, selectedBranch]);

  const filteredLogs = useMemo(() => {
    return branchFilteredLogs.filter((log) =>
      Object.values(log).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [branchFilteredLogs, searchTerm]);

  // ------------------ BUILD CHART DATA DYNAMICALLY ------------------
  // 1) Logs Over Time (Line Chart)
  const lineChartData = useMemo(() => {
    // Group logs by date (YYYY-MM-DD)
    const countsByDate = {};
    logs.forEach((log) => {
      // assume 'timestamp' is '2025-01-02 10:30:00'
      const dateOnly = log.timestamp.slice(0, 10); // '2025-01-02'
      if (!countsByDate[dateOnly]) countsByDate[dateOnly] = 0;
      countsByDate[dateOnly]++;
    });

    // Create arrays sorted by date
    const sortedDates = Object.keys(countsByDate).sort();
    const counts = sortedDates.map((d) => countsByDate[d]);

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Number of Logs",
          data: counts,
          borderColor: "#42a5f5",
          backgroundColor: "rgba(66,165,245,0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    };
  }, [logs]);

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false
  };

  // 2) Logs by Module (Doughnut)
  const modulesChartData = useMemo(() => {
    const countsByModule = {};
    logs.forEach((log) => {
      const mod = log.module || "Unknown";
      if (!countsByModule[mod]) countsByModule[mod] = 0;
      countsByModule[mod]++;
    });
    const modules = Object.keys(countsByModule);
    const counts = modules.map((m) => countsByModule[m]);

    return {
      labels: modules,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "#66bb6a",
            "#ef5350",
            "#26c6da",
            "#ffca28",
            "#ab47bc",
            "#ffa726",
            "#8d6e63"
          ]
        }
      ]
    };
  }, [logs]);

  const modulesOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
    maintainAspectRatio: false
  };

  // ------------------ DataGrid Columns ------------------
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
      )
    },
    {
      field: "details",
      headerName: "Details",
      width: 220,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography noWrap>{params.value}</Typography>
        </Tooltip>
      )
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
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
                padding: "6px"
              }}
              onClick={() => handleViewLog(params.row)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Archive Log (local only)">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#9e9e9e",
                color: "#fff",
                "&:hover": { backgroundColor: "#757575" },
                minWidth: "40px",
                padding: "6px"
              }}
              onClick={() => handleArchiveLog(params.row.logId)}
            >
              <ArchiveIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Log (backend)">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#f44336",
                color: "#fff",
                "&:hover": { backgroundColor: "#d32f2f" },
                minWidth: "40px",
                padding: "6px"
              }}
              onClick={() => handleDeleteLog(params.row.logId)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      )
    }
  ];
  const getRowId = (row) => row.logId;

  // ------------------ Handlers: View, Archive, Delete ------------------
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
    setLogs((prev) => prev.filter((l) => l.logId !== confirmArchiveLogId));
    setConfirmArchiveLogId(null);
  };

  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);
  const handleDeleteLog = (logId) => {
    setConfirmDeleteLogId(logId);
  };
  const confirmDelete = () => {
    if (!confirmDeleteLogId) return;
    const numericId = confirmDeleteLogId.split("-")[1] || "";
    fetch(`/system/logs/${numericId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setLogs((prev) => prev.filter((l) => l.logId !== confirmDeleteLogId));
        setConfirmDeleteLogId(null);
      })
      .catch((err) => console.error("Error deleting log:", err));
  };

  // ------------------ Export (CSV/PDF) ------------------
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (e) => {
    setExportAnchorEl(e.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const csvHeaders = [
    { label: "Log ID", key: "logId" },
    { label: "Timestamp", key: "timestamp" },
    { label: "User", key: "user" },
    { label: "ActionDesc", key: "actionDesc" },
    { label: "Module", key: "module" },
    { label: "LogType", key: "logType" },
    { label: "Details", key: "details" },
    { label: "IPAddress", key: "ipAddress" },
    { label: "Branch", key: "branch" }
  ];
  const csvData = filteredLogs;

  const handleExportCSV = () => {
    handleExportMenuClose();
  };

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
      l.ipAddress || "",
      l.branch || ""
    ]);
    doc.autoTable({
      head: [
        ["LogID", "Timestamp", "User", "Action", "Module", "LogType", "Details", "IP", "Branch"]
      ],
      body: bodyData,
      startY: 20
    });
    doc.save("SystemLogs.pdf");
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ---------- Date/Branch Filters ---------- */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            label="Date Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            label="Branch"
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branchOptions.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ---------- Overview Cards ---------- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Total Logs */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 1 }}>
                <ListAltIcon sx={{ fontSize: 40, color: "#42a5f5", mr: 2 }} />
                <CardContent>
                  <Typography variant="h6">Total Logs</Typography>
                  <Typography variant="h5">{totalLogsCount}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Critical Actions */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 1 }}>
                <ErrorIcon sx={{ fontSize: 40, color: "#e53935", mr: 2 }} />
                <CardContent>
                  <Typography variant="h6">Critical Actions</Typography>
                  <Typography variant="h5">{criticalActionsCount}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Logs Today */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 1 }}>
                <EventNoteIcon sx={{ fontSize: 40, color: "#43a047", mr: 2 }} />
                <CardContent>
                  <Typography variant="h6">Logs Today</Typography>
                  <Typography variant="h5">{userActivityTodayCount}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Most Active Module */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", display: "flex", alignItems: "center", p: 1 }}>
                <EngineeringIcon sx={{ fontSize: 40, color: "#ffca28", mr: 2 }} />
                <CardContent>
                  <Typography variant="h7">Most Active Module</Typography>
                  <Typography variant="body2">{mostActiveModule}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      {/* ---------- Logs Over Time & Logs by Module ---------- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Logs Over Time */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400, display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Logs Over Time</Typography>
              <Box sx={{ flex: 1 }}>
                <Line data={lineChartData} options={lineOptions} />
              </Box>
            </Paper>
          </Grid>

          {/* Logs by Module */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400, display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Logs by Module</Typography>
              <Box sx={{ flex: 1 }}>
                <Doughnut data={modulesChartData} options={modulesOptions} />
              </Box>
            </Paper>
          </Grid>
        </Grid>


      <Typography variant="h4" gutterBottom>
        System Logs & Activity
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ---------- Search + Export Buttons ---------- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
          <TextField
            placeholder="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "100%", maxWidth: 300 }}
          />

          <Box>
            <Button variant="outlined" onClick={handleExportMenuOpen} startIcon={<FileDownloadIcon />}>
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
                  Export CSV
                </CSVLink>
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </Menu>
          </Box>
        </Box>

        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            getRowId={getRowId}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            loading={loading}
          />
        </div>
      </Paper>

      {/* ---------- View Log Dialog ---------- */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Log Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewLogData && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Log ID:
                  </Typography>
                  <Typography variant="body1">{viewLogData.logId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Timestamp:
                  </Typography>
                  <Typography variant="body1">{viewLogData.timestamp}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    User:
                  </Typography>
                  <Typography variant="body1">{viewLogData.user}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Action:
                  </Typography>
                  <Typography variant="body1">{viewLogData.actionDesc}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Module:
                  </Typography>
                  <Typography variant="body1">{viewLogData.module}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Log Type:
                  </Typography>
                  <Typography variant="body1">{viewLogData.logType}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Details:
                  </Typography>
                  <Typography variant="body1">{viewLogData.details}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    IP Address:
                  </Typography>
                  <Typography variant="body1">
                    {viewLogData.ipAddress || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Branch:
                  </Typography>
                  <Typography variant="body1">{viewLogData.branch || "N/A"}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Confirm Archive Dialog ---------- */}
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

      {/* ---------- Confirm Delete Dialog ---------- */}
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
