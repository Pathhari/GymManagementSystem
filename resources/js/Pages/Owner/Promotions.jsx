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
  Divider
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// Overview Card Icons
import StarsIcon from "@mui/icons-material/Stars";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RedeemIcon from "@mui/icons-material/Redeem";

// DataGrid
import { DataGrid } from "@mui/x-data-grid";

// For CSV/PDF export
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Charts (Line, Doughnut) from react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// ---------- SAMPLE PROMOTIONS DATA -----------
// Added a "branch" property to each promotion object.
const samplePromotions = [
  {
    promotionId: "PROMO-1001",
    name: "Summer Discount",
    type: "Percentage",
    discountValue: "20%",
    startDate: "2025-06-01",
    endDate: "2025-06-30",
    status: "Active",
    redemptions: 50,
    notes: "Applies to membership plans",
    branch: "New York"
  },
  {
    promotionId: "PROMO-1002",
    name: "Back-to-School Sale",
    type: "Fixed Amount",
    discountValue: "$15",
    startDate: "2025-09-01",
    endDate: "2025-09-15",
    status: "Upcoming",
    redemptions: 0,
    notes: "Coaching sessions only",
    branch: "Los Angeles"
  },
  {
    promotionId: "PROMO-1003",
    name: "Old Year Clearance",
    type: "Percentage",
    discountValue: "25%",
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    status: "Expired",
    redemptions: 40,
    notes: "Ended last Jan. 5",
    branch: "Chicago"
  }
];

// Branch filter options (including an "All Branches" option)
const branchOptions = ["All Branches", "New York", "Los Angeles", "Chicago"];

export default function PromotionsSegments() {
  // ------------------- STATE & DATA -------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState(samplePromotions);

  // New: Branch Filter state
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  // Filter promotions by branch first, then apply search filter.
  const branchFilteredPromotions =
    selectedBranch === "All Branches"
      ? promotions
      : promotions.filter((p) => p.branch === selectedBranch);

  const filteredPromotions = branchFilteredPromotions.filter((p) =>
    Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ------------------- Date Filters -------------------
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

  // ------------------- Overview & Stats -------------------
  const activePromosCount = promotions.filter((p) => p.status === "Active").length;
  const upcomingPromosCount = promotions.filter((p) => p.status === "Upcoming").length;
  const expiredPromosCount = promotions.filter((p) => p.status === "Expired").length;
  const totalRedemptions = promotions.reduce((acc, cur) => acc + (cur.redemptions || 0), 0);

  // ------------------- TABLE COLUMNS -------------------
  const columns = [
    { field: "promotionId", headerName: "Promotion ID", width: 130 },
    { field: "name", headerName: "Name", width: 170 },
    { field: "type", headerName: "Type", width: 140 },
    { field: "discountValue", headerName: "Discount", width: 110 },
    { field: "startDate", headerName: "Start Date", width: 110 },
    { field: "endDate", headerName: "End Date", width: 110 },
    { field: "status", headerName: "Status", width: 100 },
    { field: "redemptions", headerName: "Redemptions", width: 120 },
    { field: "branch", headerName: "Branch", width: 120 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 280,
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
              onClick={() => handleViewPromo(params.row)}
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
              onClick={() => handleEditPromo(params.row)}
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
              onClick={() => handleDeletePromo(params.row.promotionId)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      )
    }
  ];
  const getRowId = (row) => row.promotionId;

  // ------------------- ADD PROMOTION -------------------
  const [isAddOpen, setAddOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    promotionId: "",
    name: "",
    type: "",
    discountValue: "",
    startDate: "",
    endDate: "",
    status: "Upcoming",
    redemptions: 0,
    notes: "",
    branch: branchOptions[1] // default to first branch option (skip "All Branches")
  });
  const [addError, setAddError] = useState("");

  const handleOpenAdd = () => {
    setNewPromo({
      promotionId: "",
      name: "",
      type: "",
      discountValue: "",
      startDate: "",
      endDate: "",
      status: "Upcoming",
      redemptions: 0,
      notes: "",
      branch: branchOptions[1]
    });
    setAddError("");
    setAddOpen(true);
  };
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewPromo((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddSubmit = () => {
    if (!newPromo.promotionId || !newPromo.name || !newPromo.type) {
      setAddError("Please fill out required fields (ID, Name, Type).");
      return;
    }
    // Check duplicates
    if (promotions.some((p) => p.promotionId === newPromo.promotionId)) {
      setAddError("That Promotion ID already exists!");
      return;
    }
    setPromotions((prev) => [...prev, newPromo]);
    setAddOpen(false);
  };

  // ------------------- VIEW PROMOTION -------------------
  const [isViewOpen, setViewOpen] = useState(false);
  const [viewPromo, setViewPromo] = useState(null);

  const handleViewPromo = (row) => {
    setViewPromo(row);
    setViewOpen(true);
  };

  // ------------------- EDIT PROMOTION -------------------
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEditPromo = (row) => {
    setEditData({ ...row });
    setEditOpen(true);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = () => {
    if (!editData.name || !editData.type) {
      alert("Please fill out required fields (Name, Type).");
      return;
    }
    setPromotions((prev) =>
      prev.map((p) => (p.promotionId === editData.promotionId ? editData : p))
    );
    setEditOpen(false);
  };

  // ------------------- DELETE PROMOTION -------------------
  const handleDeletePromo = (id) => {
    setPromotions((prev) => prev.filter((p) => p.promotionId !== id));
  };

  // ------------------- EXPORT (CSV/PDF) -------------------
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
    { label: "Promo ID", key: "promotionId" },
    { label: "Name", key: "name" },
    { label: "Type", key: "type" },
    { label: "Discount", key: "discountValue" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Status", key: "status" },
    { label: "Redemptions", key: "redemptions" },
    { label: "Branch", key: "branch" },
    { label: "Notes", key: "notes" }
  ];
  const csvData = filteredPromotions;
  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  // PDF
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    doc.text("Promotions Export", 14, 10);

    const bodyData = filteredPromotions.map((p) => [
      p.promotionId,
      p.name,
      p.type,
      p.discountValue,
      p.startDate,
      p.endDate,
      p.status,
      String(p.redemptions),
      p.branch,
      p.notes || ""
    ]);
    doc.autoTable({
      head: [["ID", "Name", "Type", "Discount", "Start", "End", "Status", "Redemptions", "Branch", "Notes"]],
      body: bodyData,
      startY: 20
    });
    doc.save("Promotions.pdf");
  };

  // ------------------- CHARTS: LINE & DONUT -------------------
  // Line Chart: "Promotion Usage Over Time" (placeholder data)
  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Promotion Redemptions",
        data: [10, 15, 25, 20, 40, 50],
        fill: false,
        borderColor: "#4caf50",
        tension: 0.2
      }
    ]
  };
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Donut chart: "Segments" (placeholder data)
  const donutData = {
    labels: ["Segment A", "Segment B", "Segment C", "Segment D"],
    datasets: [
      {
        data: [25, 20, 30, 25],
        backgroundColor: ["#42a5f5", "#ffca28", "#ef5350", "#ab47bc"]
      }
    ]
  };
  const donutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" }
    },
    maintainAspectRatio: false
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ---------- Date Period & Branch Filters on Top ---------- */}
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            label="Branch"
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branchOptions.map((branch) => (
              <MenuItem key={branch} value={branch}>
                {branch}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
              p: 2
            }}
          >
            <StarsIcon sx={{ fontSize: 40, color: "#ffd700", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Active Promotions</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {activePromosCount}
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
            <CalendarTodayIcon sx={{ fontSize: 40, color: "#4caf50", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Upcoming</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {upcomingPromosCount}
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
            <WarningAmberIcon sx={{ fontSize: 40, color: "red", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Expired</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {expiredPromosCount}
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
            <RedeemIcon sx={{ fontSize: 40, color: "#ffc107", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Redemptions</Typography>
              <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {totalRedemptions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---------- "Promotions & Segments" Header ---------- */}
      <Typography variant="h4" gutterBottom>
        Promotions & Segments
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ---------- Search + Export + Add Buttons ---------- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "100%", maxWidth: 300 }}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Export */}
            <Button
              variant="outlined"
              onClick={handleExportMenuOpen}
              startIcon={<FileDownloadIcon />}
              sx={{ textTransform: "none" }}
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
                  filename="Promotions.csv"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Export CSV
                </CSVLink>
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </Menu>

            {/* Add Promotion */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
            >
              Add Promotion
            </Button>
          </Box>
        </Box>

        {/* ---------- DataGrid Table ---------- */}
        <div style={{ height: 420, width: "100%" }}>
          <DataGrid
            rows={filteredPromotions}
            columns={columns}
            getRowId={getRowId}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </div>
      </Paper>

      {/* ---------- Add Promotion Dialog ---------- */}
      <Dialog open={isAddOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Promotion</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Promotion ID"
            name="promotionId"
            fullWidth
            margin="normal"
            value={newPromo.promotionId}
            onChange={handleAddChange}
          />
          <TextField
            label="Promotion Name"
            name="name"
            fullWidth
            margin="normal"
            value={newPromo.name}
            onChange={handleAddChange}
          />
          <TextField
            label="Promotion Type"
            name="type"
            fullWidth
            margin="normal"
            value={newPromo.type}
            onChange={handleAddChange}
          />
          <TextField
            label="Discount Value"
            name="discountValue"
            fullWidth
            margin="normal"
            value={newPromo.discountValue}
            onChange={handleAddChange}
          />
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newPromo.startDate}
            onChange={handleAddChange}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newPromo.endDate}
            onChange={handleAddChange}
          />
          <TextField
            label="Notes"
            name="notes"
            fullWidth
            margin="normal"
            value={newPromo.notes}
            onChange={handleAddChange}
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Branch</InputLabel>
            <Select
              label="Select Branch"
              name="branch"
              value={newPromo.branch}
              onChange={handleAddChange}
            >
              {branchOptions
                .filter((branch) => branch !== "All Branches")
                .map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {addError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {addError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- View Promotion Dialog ---------- */}
      <Dialog
  open={isViewOpen}
  onClose={() => setViewOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Typography variant="h6" color="primary">
      Promotion Details
    </Typography>
  </DialogTitle>
  <DialogContent dividers>
    {viewPromo && (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
           
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              ID:
            </Typography>
            <Typography variant="body1">{viewPromo.promotionId}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Name:
            </Typography>
            <Typography variant="body1">{viewPromo.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Type:
            </Typography>
            <Typography variant="body1">{viewPromo.type}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Discount:
            </Typography>
            <Typography variant="body1">{viewPromo.discountValue}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Start:
            </Typography>
            <Typography variant="body1">{viewPromo.startDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              End:
            </Typography>
            <Typography variant="body1">{viewPromo.endDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Status:
            </Typography>
            <Typography variant="body1">{viewPromo.status}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Redemptions:
            </Typography>
            <Typography variant="body1">{viewPromo.redemptions}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Branch:
            </Typography>
            <Typography variant="body1">{viewPromo.branch}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Notes:
            </Typography>
            <Typography variant="body1">{viewPromo.notes}</Typography>
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewOpen(false)}
      variant="contained"
      color="primary"
    >
      Close
    </Button>
  </DialogActions>
</Dialog>


      {/* ---------- Edit Promotion Dialog ---------- */}
      <Dialog open={isEditOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Promotion</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Promotion ID" value={editData.promotionId} disabled />
              <TextField label="Promotion Name" name="name" value={editData.name} onChange={handleEditChange} />
              <TextField label="Type" name="type" value={editData.type} onChange={handleEditChange} />
              <TextField label="Discount Value" name="discountValue" value={editData.discountValue} onChange={handleEditChange} />
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editData.startDate}
                onChange={handleEditChange}
              />
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editData.endDate}
                onChange={handleEditChange}
              />
              <TextField label="Status" name="status" value={editData.status} onChange={handleEditChange} />
              <TextField
                label="Redemptions"
                name="redemptions"
                type="number"
                value={editData.redemptions}
                onChange={handleEditChange}
              />
              <TextField
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={editData.notes}
                onChange={handleEditChange}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Export Menu ---------- */}
      {/* You can add the Export Menu code if needed */}
    </Box>
  );
}
