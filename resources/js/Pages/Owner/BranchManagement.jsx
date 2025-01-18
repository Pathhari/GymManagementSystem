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
  Tabs,
  Tab,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import GroupIcon from "@mui/icons-material/Group";
import BuildIcon from "@mui/icons-material/Build";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

// For CSV Export
import { CSVLink } from "react-csv";
// For PDF Export
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------------------- SAMPLE DATA ----------------------
const sampleBranches = [
  {
    BranchID: 1,
    BranchName: "Downtown Gym",
    Location: "New York, NY",
    Status: "Active",
    Contact: "123-456-7890",
  },
  {
    BranchID: 2,
    BranchName: "Uptown Fitness",
    Location: "San Francisco, CA",
    Status: "Active",
    Contact: "987-654-3210",
  },
  {
    BranchID: 3,
    BranchName: "Westside Yoga",
    Location: "Los Angeles, CA",
    Status: "Deactivated",
    Contact: "555-123-4567",
  },
];

const sampleStaffAssignment = [
  {
    AssignmentID: 1,
    BranchName: "Downtown Gym",
    StaffName: "John Doe",
    Role: "Trainer",
    Contact: "123-456-7890",
  },
  {
    AssignmentID: 2,
    BranchName: "Uptown Fitness",
    StaffName: "Jane Smith",
    Role: "Manager",
    Contact: "987-654-3210",
  },
];

const sampleMaintenanceLog = [
  {
    LogID: 1,
    BranchName: "Downtown Gym",
    Task: "Treadmill repair",
    Status: "Pending",
    DueDate: "2025-01-20",
  },
  {
    LogID: 2,
    BranchName: "Uptown Fitness",
    Task: "HVAC system maintenance",
    Status: "In Progress",
    DueDate: "2025-01-22",
  },
];

const sampleFinancialSummary = [
  {
    SummaryID: 1,
    BranchName: "Downtown Gym",
    CashSales: 1500,
    GCashSales: 500,
    BPISales: 300,
    TotalRevenue: 2300,
  },
  {
    SummaryID: 2,
    BranchName: "Uptown Fitness",
    CashSales: 2000,
    GCashSales: 700,
    BPISales: 500,
    TotalRevenue: 3200,
  },
];

export default function BranchManagement() {
  const theme = useTheme();

  // Overview Cards Data (for example purposes)
  const [totalBranches] = useState(
    sampleBranches.filter((b) => b.Status === "Active").length
  );
  const [totalRevenue] = useState(5500);
  const [membersPerBranch] = useState(250);
  const [pendingMaintenance] = useState(5);

  // Tabs: 0 = Branch Directory, 1 = Staff Assignment, 2 = Maintenance Log, 3 = Financial Summary
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Date Filters
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal states for adding new items
  const [isAddBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    BranchName: "",
    Location: "",
    Status: "Active",
    Contact: "",
  });
  const [isAddStaffAssignOpen, setAddStaffAssignOpen] = useState(false);
  const [newStaffAssign, setNewStaffAssign] = useState({
    BranchName: "",
    StaffName: "",
    Role: "",
    Contact: "",
  });

  // Modal states for editing items
  const [isEditBranchOpen, setEditBranchOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [isEditStaffAssignOpen, setEditStaffAssignOpen] = useState(false);
  const [editStaffAssign, setEditStaffAssign] = useState(null);
  const [isEditMaintenanceOpen, setEditMaintenanceOpen] = useState(false);
  const [editMaintenance, setEditMaintenance] = useState(null);
  const [isEditFinancialOpen, setEditFinancialOpen] = useState(false);
  const [editFinancial, setEditFinancial] = useState(null);

  // -------------------- Date Filter Handlers --------------------
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

  // -------------------- Export Handlers --------------------
  const handleExportMenuOpen = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);

  // CSV Headers
  const branchCSVHeaders = [
    { label: "Branch ID", key: "BranchID" },
    { label: "Branch Name", key: "BranchName" },
    { label: "Location", key: "Location" },
    { label: "Status", key: "Status" },
    { label: "Contact", key: "Contact" },
  ];
  const staffCSVHeaders = [
    { label: "Assignment ID", key: "AssignmentID" },
    { label: "Branch Name", key: "BranchName" },
    { label: "Staff Name", key: "StaffName" },
    { label: "Role", key: "Role" },
    { label: "Contact", key: "Contact" },
  ];
  const maintenanceCSVHeaders = [
    { label: "Log ID", key: "LogID" },
    { label: "Branch Name", key: "BranchName" },
    { label: "Task", key: "Task" },
    { label: "Status", key: "Status" },
    { label: "Due Date", key: "DueDate" },
  ];
  const financialCSVHeaders = [
    { label: "Summary ID", key: "SummaryID" },
    { label: "Branch Name", key: "BranchName" },
    { label: "Cash Sales", key: "CashSales" },
    { label: "GCash Sales", key: "GCashSales" },
    { label: "BPI Sales", key: "BPISales" },
    { label: "Total Revenue", key: "TotalRevenue" },
  ];

  const handleExportCSV = () => handleExportMenuClose();
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text("Branch Directory Export", 14, 10);
      const bodyData = sampleBranches.map((b) => [
        b.BranchID,
        b.BranchName,
        b.Location,
        b.Status,
        b.Contact,
      ]);
      doc.autoTable({
        head: [["Branch ID", "Branch Name", "Location", "Status", "Contact"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("BranchDirectory.pdf");
    } else if (activeTab === 1) {
      doc.text("Staff Assignment Export", 14, 10);
      const bodyData = sampleStaffAssignment.map((s) => [
        s.AssignmentID,
        s.BranchName,
        s.StaffName,
        s.Role,
        s.Contact,
      ]);
      doc.autoTable({
        head: [["Assignment ID", "Branch Name", "Staff Name", "Role", "Contact"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("StaffAssignment.pdf");
    } else if (activeTab === 2) {
      doc.text("Maintenance Log Export", 14, 10);
      const bodyData = sampleMaintenanceLog.map((m) => [
        m.LogID,
        m.BranchName,
        m.Task,
        m.Status,
        m.DueDate,
      ]);
      doc.autoTable({
        head: [["Log ID", "Branch Name", "Task", "Status", "Due Date"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("MaintenanceLog.pdf");
    } else if (activeTab === 3) {
      doc.text("Financial Summary Export", 14, 10);
      const bodyData = sampleFinancialSummary.map((f) => [
        f.SummaryID,
        f.BranchName,
        f.CashSales,
        f.GCashSales,
        f.BPISales,
        f.TotalRevenue,
      ]);
      doc.autoTable({
        head: [
          [
            "Summary ID",
            "Branch Name",
            "Cash Sales",
            "GCash Sales",
            "BPI Sales",
            "Total Revenue",
          ],
        ],
        body: bodyData,
        startY: 20,
      });
      doc.save("FinancialSummary.pdf");
    }
  };

  // -------------------- Column Definitions --------------------
  // Branch Directory Table
  const branchColumns = [
    { field: "BranchID", headerName: "Branch ID", width: 100 },
    { field: "BranchName", headerName: "Branch Name", width: 180 },
    { field: "Location", headerName: "Location", width: 180 },
    {
      field: "Status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <span style={{ color: params.value === "Active" ? "green" : "gray" }}>
          {params.value}
        </span>
      ),
    },
    { field: "Contact", headerName: "Contact", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Branch">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditBranch(params.row);
                setEditBranchOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Branch">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => alert("Delete branch " + params.row.BranchID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="View Branch">
            <Button
              variant="outlined"
              size="small"
              onClick={() => alert("View branch " + params.row.BranchID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Staff Assignment Table
  const staffColumns = [
    { field: "AssignmentID", headerName: "Assignment ID", width: 120 },
    { field: "BranchName", headerName: "Branch Name", width: 180 },
    { field: "StaffName", headerName: "Staff Name", width: 180 },
    { field: "Role", headerName: "Role", width: 140 },
    { field: "Contact", headerName: "Contact", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Assignment">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditStaffAssign(params.row);
                setEditStaffAssignOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Assignment">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() =>
                alert("Delete assignment " + params.row.AssignmentID)
              }
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="View Assignment">
            <Button
              variant="outlined"
              size="small"
              onClick={() => alert("View assignment " + params.row.AssignmentID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Maintenance Log Table
  const maintenanceColumns = [
    { field: "LogID", headerName: "Log ID", width: 100 },
    { field: "BranchName", headerName: "Branch Name", width: 180 },
    { field: "Task", headerName: "Task", width: 200 },
    {
      field: "Status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => {
        let color;
        if (params.value === "Pending") color = "red";
        else if (params.value === "In Progress") color = "goldenrod";
        else if (params.value === "Completed") color = "green";
        return <span style={{ color }}>{params.value}</span>;
      },
    },
    { field: "DueDate", headerName: "Due Date", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Log">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditMaintenance(params.row);
                setEditMaintenanceOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Log">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => alert("Delete log " + params.row.LogID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="View Log">
            <Button
              variant="outlined"
              size="small"
              onClick={() => alert("View log " + params.row.LogID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Financial Summary Table
  const financialColumns = [
    { field: "SummaryID", headerName: "Summary ID", width: 120 },
    { field: "BranchName", headerName: "Branch Name", width: 180 },
    { field: "CashSales", headerName: "Cash Sales", width: 120 },
    { field: "GCashSales", headerName: "GCash Sales", width: 120 },
    { field: "BPISales", headerName: "BPI Sales", width: 120 },
    { field: "TotalRevenue", headerName: "Total Revenue", width: 140 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Summary">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditFinancial(params.row);
                setEditFinancialOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Summary">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => alert("Delete summary " + params.row.SummaryID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="View Summary">
            <Button
              variant="outlined"
              size="small"
              onClick={() => alert("View summary " + params.row.SummaryID)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Decide which table to show based on activeTab
  let tableColumns = [];
  let tableRows = [];
  let exportCSVHeaders = [];
  let exportCSVFilename = "";
  if (activeTab === 0) {
    tableColumns = branchColumns;
    tableRows = sampleBranches;
    exportCSVHeaders = branchCSVHeaders;
    exportCSVFilename = "BranchDirectory.csv";
  } else if (activeTab === 1) {
    tableColumns = staffColumns;
    tableRows = sampleStaffAssignment;
    exportCSVHeaders = staffCSVHeaders;
    exportCSVFilename = "StaffAssignment.csv";
  } else if (activeTab === 2) {
    tableColumns = maintenanceColumns;
    tableRows = sampleMaintenanceLog;
    exportCSVHeaders = maintenanceCSVHeaders;
    exportCSVFilename = "MaintenanceLog.csv";
  } else if (activeTab === 3) {
    tableColumns = financialColumns;
    tableRows = sampleFinancialSummary;
    exportCSVHeaders = financialCSVHeaders;
    exportCSVFilename = "FinancialSummary.csv";
  }

  // Filter table rows based on searchTerm
  const filteredTableRows = tableRows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(searchTerm)
  );

  // -------------------- Handlers for Add Branch & Staff Assignment --------------------
  const handleAddBranchChange = (e) => {
    const { name, value } = e.target;
    setNewBranch({ ...newBranch, [name]: value });
  };
  const handleAddBranch = () => {
    const nextBranchID = sampleBranches.length
      ? Math.max(...sampleBranches.map((b) => b.BranchID)) + 1
      : 1;
    const newRecord = { BranchID: nextBranchID, ...newBranch };
    sampleBranches.push(newRecord);
    setAddBranchOpen(false);
  };

  const handleAddStaffAssignChange = (e) => {
    const { name, value } = e.target;
    setNewStaffAssign({ ...newStaffAssign, [name]: value });
  };
  const handleAddStaffAssign = () => {
    const nextAssignmentID = sampleStaffAssignment.length
      ? Math.max(...sampleStaffAssignment.map((s) => s.AssignmentID)) + 1
      : 1;
    const newRecord = { AssignmentID: nextAssignmentID, ...newStaffAssign };
    sampleStaffAssignment.push(newRecord);
    setAddStaffAssignOpen(false);
  };

  // -------------------- Modal Edit Handlers --------------------
  const handleEditBranchSubmit = () => {
    alert("Branch updated: " + JSON.stringify(editBranch));
    setEditBranchOpen(false);
  };
  const handleEditStaffAssignSubmit = () => {
    alert("Staff Assignment updated: " + JSON.stringify(editStaffAssign));
    setEditStaffAssignOpen(false);
  };
  const handleEditMaintenanceSubmit = () => {
    alert("Maintenance Log updated: " + JSON.stringify(editMaintenance));
    setEditMaintenanceOpen(false);
  };
  const handleEditFinancialSubmit = () => {
    alert("Financial Summary updated: " + JSON.stringify(editFinancial));
    setEditFinancialOpen(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Date Period & From-To Filters */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
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
              p: 2,
              display: "flex",
              alignItems: "center",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <BusinessIcon sx={{ fontSize: 40, mr: 2, color: "steelblue" }} />
            <CardContent>
              <Typography variant="subtitle1">Total Branches</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {totalBranches}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <MonetizationOnIcon sx={{ fontSize: 40, mr: 2, color: "green" }} />
            <CardContent>
              <Typography variant="subtitle1">Total Revenue</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                ₱ {totalRevenue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <GroupIcon sx={{ fontSize: 40, mr: 2, color: "purple" }} />
            <CardContent>
              <Typography variant="subtitle1">Members Per Branch</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {membersPerBranch}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <BuildIcon sx={{ fontSize: 40, mr: 2, color: "orangered" }} />
            <CardContent>
              <Typography variant="subtitle1">Pending Maintenance</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {pendingMaintenance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Title & Tabs */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Branch Management
        </Typography>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <Tab label="Branch Directory" icon={<BusinessIcon />} />
          <Tab label="Staff Assignment" icon={<PeopleIcon />} />
          <Tab label="Maintenance Log" icon={<BuildIcon />} />
          <Tab label="Financial Summary" icon={<MonetizationOnIcon />} />
        </Tabs>
      </Box>

      {/* Search, Export & Add Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          placeholder="Search..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          sx={{ width: "100%", maxWidth: 300 }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportMenuOpen}
            sx={{ textTransform: "none" }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <MenuItem onClick={handleExportCSV}>
              <CSVLink
                data={filteredTableRows}
                headers={exportCSVHeaders}
                filename={exportCSVFilename}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Export CSV
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
          </Menu>
          {activeTab === 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddBranchOpen(true)}
            >
              Add Branch
            </Button>
          )}
          {activeTab === 1 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddStaffAssignOpen(true)}
            >
              Add Staff Assignment
            </Button>
          )}
        </Box>
      </Box>

      {/* Main DataGrid */}
      <Paper elevation={2} sx={{ width: "100%", height: 420 }}>
        <DataGrid
          rows={filteredTableRows}
          columns={tableColumns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          getRowId={(row) => {
            if (activeTab === 0) return row.BranchID;
            if (activeTab === 1) return row.AssignmentID;
            if (activeTab === 2) return row.LogID;
            if (activeTab === 3) return row.SummaryID;
            return row.id;
          }}
        />
      </Paper>

      {/* -------------------- Add/Edit Modal Forms -------------------- */}

      {/* Add Branch Dialog */}
      <Dialog open={isAddBranchOpen} onClose={() => setAddBranchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Branch</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Branch Name"
            name="BranchName"
            value={newBranch.BranchName}
            onChange={handleAddBranchChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Location"
            name="Location"
            value={newBranch.Location}
            onChange={handleAddBranchChange}
            variant="outlined"
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Status</InputLabel>
            <Select
              name="Status"
              value={newBranch.Status}
              onChange={handleAddBranchChange}
              label="Status"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Deactivated">Deactivated</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Contact"
            name="Contact"
            value={newBranch.Contact}
            onChange={handleAddBranchChange}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBranchOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddBranch} variant="contained" color="primary">
            Add Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditBranchOpen} onClose={() => setEditBranchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Branch</DialogTitle>
        <DialogContent>
          {editBranch && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Branch Name"
                name="BranchName"
                value={editBranch.BranchName}
                onChange={(e) =>
                  setEditBranch({ ...editBranch, BranchName: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Location"
                name="Location"
                value={editBranch.Location}
                onChange={(e) =>
                  setEditBranch({ ...editBranch, Location: e.target.value })
                }
                variant="outlined"
              />
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  name="Status"
                  value={editBranch.Status}
                  onChange={(e) =>
                    setEditBranch({ ...editBranch, Status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Deactivated">Deactivated</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="dense"
                label="Contact"
                name="Contact"
                value={editBranch.Contact}
                onChange={(e) =>
                  setEditBranch({ ...editBranch, Contact: e.target.value })
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBranchOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditBranchSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Staff Assignment Dialog */}
      <Dialog open={isAddStaffAssignOpen} onClose={() => setAddStaffAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Staff Assignment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Branch Name"
            name="BranchName"
            value={newStaffAssign.BranchName}
            onChange={handleAddStaffAssignChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Staff Name"
            name="StaffName"
            value={newStaffAssign.StaffName}
            onChange={handleAddStaffAssignChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Role"
            name="Role"
            value={newStaffAssign.Role}
            onChange={handleAddStaffAssignChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Contact"
            name="Contact"
            value={newStaffAssign.Contact}
            onChange={handleAddStaffAssignChange}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStaffAssignOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddStaffAssign} variant="contained" color="primary">
            Add Staff Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Assignment Dialog */}
      <Dialog open={isEditStaffAssignOpen} onClose={() => setEditStaffAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Assignment</DialogTitle>
        <DialogContent>
          {editStaffAssign && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Branch Name"
                name="BranchName"
                value={editStaffAssign.BranchName}
                onChange={(e) =>
                  setEditStaffAssign({ ...editStaffAssign, BranchName: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Staff Name"
                name="StaffName"
                value={editStaffAssign.StaffName}
                onChange={(e) =>
                  setEditStaffAssign({ ...editStaffAssign, StaffName: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Role"
                name="Role"
                value={editStaffAssign.Role}
                onChange={(e) =>
                  setEditStaffAssign({ ...editStaffAssign, Role: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Contact"
                name="Contact"
                value={editStaffAssign.Contact}
                onChange={(e) =>
                  setEditStaffAssign({ ...editStaffAssign, Contact: e.target.value })
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStaffAssignOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditStaffAssignSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Maintenance Log Dialog */}
      <Dialog open={isEditMaintenanceOpen} onClose={() => setEditMaintenanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Maintenance Log</DialogTitle>
        <DialogContent>
          {editMaintenance && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Branch Name"
                name="BranchName"
                value={editMaintenance.BranchName}
                onChange={(e) =>
                  setEditMaintenance({ ...editMaintenance, BranchName: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Task"
                name="Task"
                value={editMaintenance.Task}
                onChange={(e) =>
                  setEditMaintenance({ ...editMaintenance, Task: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Status"
                name="Status"
                value={editMaintenance.Status}
                onChange={(e) =>
                  setEditMaintenance({ ...editMaintenance, Status: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Due Date"
                name="DueDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editMaintenance.DueDate}
                onChange={(e) =>
                  setEditMaintenance({ ...editMaintenance, DueDate: e.target.value })
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMaintenanceOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditMaintenanceSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Financial Summary Dialog */}
      <Dialog open={isEditFinancialOpen} onClose={() => setEditFinancialOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Financial Summary</DialogTitle>
        <DialogContent>
          {editFinancial && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Branch Name"
                name="BranchName"
                value={editFinancial.BranchName}
                onChange={(e) =>
                  setEditFinancial({ ...editFinancial, BranchName: e.target.value })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Cash Sales"
                name="CashSales"
                type="number"
                value={editFinancial.CashSales}
                onChange={(e) =>
                  setEditFinancial({ ...editFinancial, CashSales: Number(e.target.value) })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="GCash Sales"
                name="GCashSales"
                type="number"
                value={editFinancial.GCashSales}
                onChange={(e) =>
                  setEditFinancial({ ...editFinancial, GCashSales: Number(e.target.value) })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="BPI Sales"
                name="BPISales"
                type="number"
                value={editFinancial.BPISales}
                onChange={(e) =>
                  setEditFinancial({ ...editFinancial, BPISales: Number(e.target.value) })
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Total Revenue"
                name="TotalRevenue"
                type="number"
                value={editFinancial.TotalRevenue}
                onChange={(e) =>
                  setEditFinancial({ ...editFinancial, TotalRevenue: Number(e.target.value) })
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFinancialOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditFinancialSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
