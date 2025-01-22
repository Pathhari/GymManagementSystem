import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Divider,
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

import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function BranchManagement() {
  const theme = useTheme();

  

  // 1) Add these states
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 2) Keep the rest of your code the same
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [financials, setFinancials] = useState([]);

  // ==================== Lifecycle: Load data once on mount ====================
  useEffect(() => { 
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1) Branch Directory
      const branchRes = await axios.get("/owner/branches");
      setBranches(branchRes.data.branches || []);

      // 2) Staff (for Staff Assignment tab)
      const staffRes = await axios.get("/staff/index-json"); // or "/staff/json"
      setStaff(staffRes.data|| []);

      // 3) Maintenance Logs
      // This route is assumed; you may need to define or rename it:
      // e.g. GET /operations/maintenance-logs => { logs: [...] }
      const maintRes = await axios.get("/operations/maintenance-logs");
      setMaintenanceLogs(maintRes.data.logs || []);

      // 4) Financial Summaries
      // Also assumed: GET /finance/summary => { summaries: [...] }
      const finRes = await axios.get("/finance/summary");
      setFinancials(finRes.data.summaries || []);
    } catch (err) {
      console.error("Failed to load data from server:", err);
    }
  };

  // ==================== Overview Card Counts (example placeholders) ====================
  const totalBranches = branches.filter((b) => b.Status === "Active").length;
  // For demonstration
  const [totalRevenue] = useState(5500);
  const [membersPerBranch] = useState(250);
  const [pendingMaintenance] = useState(5);

  // ==================== Tab & Search & Export ====================
  // 0 = Branch Directory, 1 = Staff Assignment, 2 = Maintenance Log, 3 = Financial
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const handleTabChange = (e, newVal) => {
    setActiveTab(newVal);
    setSearchTerm("");
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleExportMenuOpen = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);

  // ==================== ADD: Branch & Staff ====================
  const [isAddBranchOpen, setAddBranchOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    BranchName: "",
    Location: "",
    Status: "Active",
    Contact: "",
  });

  const [isAddStaffOpen, setAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    FullName: "",
    Role: "Staff",
    Email: "",
    Phone: "",
    // etc.
  });

  // ==================== EDIT: Branch, Staff, Maintenance, Financial ====================
  const [isEditBranchOpen, setEditBranchOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);

  const [isEditStaffOpen, setEditStaffOpen] = useState(false);
  const [editStaffData, setEditStaffData] = useState(null);

  const [isEditMaintenanceOpen, setEditMaintenanceOpen] = useState(false);
  const [editMaintenance, setEditMaintenance] = useState(null);

  const [isEditFinancialOpen, setEditFinancialOpen] = useState(false);
  const [editFinancial, setEditFinancial] = useState(null);

  // ==================== VIEW: Branch, Staff, Maintenance, Financial ====================
  const [isViewBranchOpen, setViewBranchOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState(null);

  const [isViewStaffOpen, setViewStaffOpen] = useState(false);
  const [viewStaffData, setViewStaffData] = useState(null);

  const [isViewMaintenanceOpen, setViewMaintenanceOpen] = useState(false);
  const [viewMaintenanceData, setViewMaintenanceData] = useState(null);

  const [isViewFinancialOpen, setViewFinancialOpen] = useState(false);
  const [viewFinancialData, setViewFinancialData] = useState(null);

  // ==================== Branch CRUD (Create / Edit / Delete) ====================
  const handleCreateBranch = async () => {
    try {
      await axios.post("/owner/branches", {
        BranchName: newBranch.BranchName,
        Location: newBranch.Location,
        Status: newBranch.Status,
        Contact: newBranch.Contact,
      });
      setAddBranchOpen(false);
      setNewBranch({ BranchName: "", Location: "", Status: "Active", Contact: "" });
      fetchData();
    } catch (err) {
      console.error("Failed to create branch:", err);
    }
  };

  const handleUpdateBranch = async () => {
    try {
      if (!editBranch?.BranchID) return;
      await axios.put(`/owner/branches/${editBranch.BranchID}`, {
        BranchName: editBranch.BranchName,
        Location: editBranch.Location,
        Status: editBranch.Status,
        Contact: editBranch.Contact,
      });
      setEditBranchOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update branch:", err);
    }
  };

  const handleDeleteBranch = async (branchID) => {
    if (!window.confirm("Delete this branch?")) return;
    try {
      await axios.delete(`/owner/branches/${branchID}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete branch:", err);
    }
  };

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // ==================== Staff CRUD (Create / Edit / Delete) ====================
  const handleCreateStaff = async () => {
    try {
      await axios.post("/staff", {
        FullName: newStaff.FullName,
        Role: newStaff.Role,
        Email: newStaff.Email,
        Phone: newStaff.Phone,
      });
      setAddStaffOpen(false);
      setNewStaff({ FullName: "", Role: "Staff", Email: "", Phone: "" });
      fetchData();
    } catch (err) {
      console.error("Failed to create staff:", err);
    }
  };

  async function handleUpdateStaff() {
    try {
      const staffID = editStaffData.StaffID;
  
      // Build a payload object with the fields you want to update.
      // If you support multiple branches in a pivot table, include an array BranchIDs.
      // Otherwise, if it's one-branch-only, use BranchID.
      const payload = {
        FullName:     editStaffData.FullName,
        Role:         editStaffData.Role,
        Email:        editStaffData.Email,
        Phone:        editStaffData.Phone,
        DateHired:    editStaffData.DateHired,
        DailyRate:    editStaffData.DailyRate,
        HourlyRate:   editStaffData.HourlyRate,
        OvertimeRate: editStaffData.OvertimeRate,
        Notes:        editStaffData.Notes,
        
        // For multi-branch pivot:
        BranchIDs:    editStaffData.BranchIDs || [],
        
        // If single branch:
        // BranchID:   editStaffData.BranchID
      };
  
      // Make the PUT request
      const response = await axios.put(`/staff/${staffID}`, payload);
  
      // If your back end returns updated data in response.data.staff:
      const updatedStaff = response.data.staff;
  
      // Update local 'staff' array
      setStaff((prev) =>
        prev.map((s) => (s.StaffID === staffID ? updatedStaff : s))
      );
  
      // If you also have a filteredStaff or other arrays, update them too:
      // setFilteredStaff(prev =>
      //   prev.map(s => (s.StaffID === staffID ? updatedStaff : s))
      // );
  
      // Close the edit dialog
      setEditStaffOpen(false);
    } catch (error) {
      console.error("Failed to update staff:", error);
    }
  }
  

  const handleDeleteStaff = async (staffID) => {
    if (!window.confirm("Delete this staff record?")) return;
    try {
      await axios.delete(`/staff/${staffID}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete staff record:", err);
    }
  };

  // ==================== Maintenance CRUD ====================
  // Adjust if your route is different, e.g. /operations/maintenance-logs
  const handleUpdateMaintenance = async () => {
    try {
      if (!editMaintenance?.MaintenanceLogID) return;
      await axios.put(`/operations/maintenance-logs/${editMaintenance.MaintenanceLogID}`, {
        Task: editMaintenance.Task,
        Status: editMaintenance.Status,
        DueDate: editMaintenance.DueDate,
        // etc. if you have more fields
      });
      setEditMaintenanceOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update maintenance:", err);
    }
  };

  const handleDeleteMaintenance = async (logID) => {
    if (!window.confirm("Delete this maintenance log?")) return;
    try {
      await axios.delete(`/operations/maintenance-logs/${logID}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete maintenance log:", err);
    }
  };

  // ==================== Financial CRUD ====================
  // Suppose your route is /finance/summary
  const handleUpdateFinancial = async () => {
    try {
      if (!editFinancial?.SummaryID) return;
      await axios.put(`/finance/summary/${editFinancial.SummaryID}`, {
        BranchName: editFinancial.BranchName,
        CashSales: editFinancial.CashSales,
        GCashSales: editFinancial.GCashSales,
        BPISales: editFinancial.BPISales,
        TotalRevenue: editFinancial.TotalRevenue,
      });
      setEditFinancialOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update financial summary:", err);
    }
  };

  const handleDeleteFinancial = async (summaryID) => {
    if (!window.confirm("Delete this financial summary?")) return;
    try {
      await axios.delete(`/finance/summary/${summaryID}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete financial summary:", err);
    }
  };

  // ==================== Column definitions & CSV/PDF ====================
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
    { field: "Contact", headerName: "Contact", width: 130 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Branch">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewBranch(params.row);
                setViewBranchOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Branch">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditBranch({ ...params.row });
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
              onClick={() => handleDeleteBranch(params.row.BranchID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const staffColumns = [
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "FullName", headerName: "Name", width: 160 },
    { field: "Role", headerName: "Role", width: 120 },
    { field: "Email", headerName: "Email", width: 180 },
    { field: "Phone", headerName: "Phone", width: 130 },
    {
      field: "DateHired",
      headerName: "Hired",
      width: 100,
    },
    {
      field: "DailyRate",
      headerName: "Daily",
      width: 80,
      // Optional custom render to format currency:
      renderCell: (params) => {
        let rate = params.value;
        if (typeof rate !== "number") {
          rate = Number(rate) || 0;
        }
        return `₱${rate.toFixed(2)}`;
      },

    },
    {
      field: "HourlyRate",
      headerName: "Hourly",
      width: 80,
      renderCell: (params) => {
        let rate = params.value;
        if (typeof rate !== "number") {
          rate = Number(rate) || 0;
        }
        return `₱${rate.toFixed(2)}`;
      },
      
    },
    {
      field: "OvertimeRate",
      headerName: "Overtime",
      width: 90,
      renderCell: (params) => {
        let rate = params.value;
        if (typeof rate !== "number") {
          rate = Number(rate) || 0;
        }
        return `₱${rate.toFixed(2)}`;
      },
      
    },
    // If each staff has a single `branch` relationship:
    // (If many-to-many, see the note below)
    {
      field: "branches",
      headerName: "Branches",
      width: 180,
      renderCell: (params) => {
        // An array of branches
        const branchArray = params.row.branches || [];
        return branchArray.length
          ? branchArray.map((b) => b.BranchName).join(", ")
          : "—";
      },
    },
    // Actions
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Staff">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewStaffData(params.row);
                setViewStaffOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Staff">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditStaffData({ ...params.row });
                setEditStaffOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Staff">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => handleDeleteStaff(params.row.StaffID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const maintColumns = [
    { field: "MaintenanceLogID", headerName: "Log ID", width: 100 },
    { field: "Task", headerName: "Task", width: 180 },
    { field: "Status", headerName: "Status", width: 130 },
    { field: "DueDate", headerName: "Due Date", width: 130 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Log">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewMaintenanceData(params.row);
                setViewMaintenanceOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Log">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditMaintenance({ ...params.row });
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
              onClick={() => handleDeleteMaintenance(params.row.MaintenanceLogID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const financialColumns = [
    { field: "SummaryID", headerName: "Summary ID", width: 100 },
    { field: "BranchName", headerName: "Branch Name", width: 150 },
    { field: "CashSales", headerName: "Cash Sales", width: 130 },
    { field: "GCashSales", headerName: "GCash Sales", width: 130 },
    { field: "BPISales", headerName: "BPI Sales", width: 130 },
    { field: "TotalRevenue", headerName: "Total Revenue", width: 130 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Financial">
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={() => {
                setViewFinancialData(params.row);
                setViewFinancialOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Summary">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditFinancial({ ...params.row });
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
              onClick={() => handleDeleteFinancial(params.row.SummaryID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Pick columns & rows based on active tab
  let tableColumns = [];
  let tableRows = [];
  let csvHeaders = [];
  let csvFilename = "";
  if (activeTab === 0) {
    tableColumns = branchColumns;
    tableRows = branches;
    csvHeaders = [
      { label: "BranchID", key: "BranchID" },
      { label: "BranchName", key: "BranchName" },
      { label: "Location", key: "Location" },
      { label: "Status", key: "Status" },
      { label: "Contact", key: "Contact" },
    ];
    csvFilename = "BranchDirectory.csv";
  } else if (activeTab === 1) {
    tableColumns = staffColumns;
    tableRows = staff;
    csvHeaders = [
      { label: "StaffID", key: "StaffID" },
      { label: "FullName", key: "FullName" },
      { label: "Role", key: "Role" },
      { label: "Email", key: "Email" },
      { label: "Phone", key: "Phone" },
    ];
    csvFilename = "StaffAssignment.csv";
  } else if (activeTab === 2) {
    tableColumns = maintColumns;
    tableRows = maintenanceLogs;
    csvHeaders = [
      { label: "MaintenanceLogID", key: "MaintenanceLogID" },
      { label: "Task", key: "Task" },
      { label: "Status", key: "Status" },
      { label: "DueDate", key: "DueDate" },
    ];
    csvFilename = "MaintenanceLog.csv";
  } else if (activeTab === 3) {
    tableColumns = financialColumns;
    tableRows = financials;
    csvHeaders = [
      { label: "SummaryID", key: "SummaryID" },
      { label: "BranchName", key: "BranchName" },
      { label: "CashSales", key: "CashSales" },
      { label: "GCashSales", key: "GCashSales" },
      { label: "BPISales", key: "BPISales" },
      { label: "TotalRevenue", key: "TotalRevenue" },
    ];
    csvFilename = "FinancialSummary.csv";
  }

  // Filter rows by searchTerm
  const filteredRows = tableRows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(searchTerm)
  );

  // ==================== PDF Export logic ====================
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();

    if (activeTab === 0) {
      doc.text("Branch Directory Export", 14, 10);
      const body = branches.map((b) => [b.BranchID, b.BranchName, b.Location, b.Status, b.Contact]);
      doc.autoTable({
        head: [["ID", "Name", "Location", "Status", "Contact"]],
        body,
        startY: 20,
      });
      doc.save("BranchDirectory.pdf");
    } else if (activeTab === 1) {
      doc.text("Staff Export", 14, 10);
      const body = staff.map((s) => [s.StaffID, s.FullName, s.Role, s.Email, s.Phone]);
      doc.autoTable({
        head: [["ID", "FullName", "Role", "Email", "Phone"]],
        body,
        startY: 20,
      });
      doc.save("StaffAssignment.pdf");
    } else if (activeTab === 2) {
      doc.text("Maintenance Log Export", 14, 10);
      const body = maintenanceLogs.map((m) => [
        m.MaintenanceLogID,
        m.Task,
        m.Status,
        m.DueDate,
      ]);
      doc.autoTable({
        head: [["LogID", "Task", "Status", "DueDate"]],
        body,
        startY: 20,
      });
      doc.save("MaintenanceLog.pdf");
    } else if (activeTab === 3) {
      doc.text("Financial Summary Export", 14, 10);
      const body = financials.map((f) => [
        f.SummaryID,
        f.BranchName,
        f.CashSales,
        f.GCashSales,
        f.BPISales,
        f.TotalRevenue,
      ]);
      doc.autoTable({
        head: [
          ["SummaryID", "Branch", "CashSales", "GCashSales", "BPISales", "TotalRevenue"],
        ],
        body,
        startY: 20,
      });
      doc.save("FinancialSummary.pdf");
    }
  };

  // ==================== Render ====================
  return (
    <Box sx={{ p: 4 }}>
      {/* Date Period & Filters */}
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
          <Select
            value={timePeriod}
            label="Time Period"
            onChange={(e) => setTimePeriod(e.target.value)}
          >
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

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: "flex", alignItems: "center", backgroundColor: theme.palette.background.paper }}>
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
          <Card sx={{ p: 2, display: "flex", alignItems: "center", backgroundColor: theme.palette.background.paper }}>
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
          <Card sx={{ p: 2, display: "flex", alignItems: "center", backgroundColor: theme.palette.background.paper }}>
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
          <Card sx={{ p: 2, display: "flex", alignItems: "center", backgroundColor: theme.palette.background.paper }}>
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
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Branch Directory" icon={<BusinessIcon />} />
          <Tab label="Staff Assignment" icon={<PeopleIcon />} />
          <Tab label="Maintenance Log" icon={<BuildIcon />} />
          <Tab label="Financial Summary" icon={<MonetizationOnIcon />} />
        </Tabs>
      </Box>

      {/* Search, Export, & Add Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          placeholder="Search..."
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
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
            <MenuItem>
              <CSVLink
                data={filteredRows}
                headers={csvHeaders}
                filename={csvFilename}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Export CSV
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
          </Menu>
          {activeTab === 0 && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddBranchOpen(true)}>
              Add Branch
            </Button>
          )}
          {activeTab === 1 && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddStaffOpen(true)}>
              Add Staff
            </Button>
          )}
        </Box>
      </Box>

      {/* Main DataGrid */}
      <Paper elevation={2} sx={{ width: "100%", height: 420 }}>
      <DataGrid
          rows={filteredRows}
          columns={tableColumns}
          getRowId={(row) => {
            if (activeTab === 0) return row.BranchID;
            if (activeTab === 1) return row.StaffID;
            if (activeTab === 2) return row.MaintenanceLogID;
            if (activeTab === 3) return row.SummaryID;
          }}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
        />
      </Paper>

      {/* ===================== DIALOGS ===================== */}

      {/* 1) ADD BRANCH */}
      <Dialog open={isAddBranchOpen} onClose={() => setAddBranchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Branch</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="dense"
            label="Branch Name"
            value={newBranch.BranchName}
            onChange={(e) => setNewBranch({ ...newBranch, BranchName: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Location"
            value={newBranch.Location}
            onChange={(e) => setNewBranch({ ...newBranch, Location: e.target.value })}
          />
          <FormControl margin="dense" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newBranch.Status}
              label="Status"
              onChange={(e) => setNewBranch({ ...newBranch, Status: e.target.value })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Deactivated">Deactivated</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Contact"
            value={newBranch.Contact}
            onChange={(e) => setNewBranch({ ...newBranch, Contact: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBranchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBranch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2) EDIT BRANCH */}
      <Dialog open={isEditBranchOpen} onClose={() => setEditBranchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Branch</DialogTitle>
        <DialogContent dividers>
          {editBranch && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Branch Name"
                value={editBranch.BranchName}
                onChange={(e) => setEditBranch({ ...editBranch, BranchName: e.target.value })}
              />
              <TextField
                label="Location"
                value={editBranch.Location}
                onChange={(e) => setEditBranch({ ...editBranch, Location: e.target.value })}
              />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editBranch.Status || "Active"}
                  label="Status"
                  onChange={(e) => setEditBranch({ ...editBranch, Status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Deactivated">Deactivated</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Contact"
                value={editBranch.Contact || ""}
                onChange={(e) => setEditBranch({ ...editBranch, Contact: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBranchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateBranch}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3) VIEW BRANCH */}
      <Dialog open={isViewBranchOpen} onClose={() => setViewBranchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Branch Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewBranch && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Branch ID:
                  </Typography>
                  <Typography>{viewBranch.BranchID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography>{viewBranch.BranchName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Location:
                  </Typography>
                  <Typography>{viewBranch.Location}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Typography>{viewBranch.Status}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Contact:
                  </Typography>
                  <Typography>{viewBranch.Contact}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewBranchOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4) ADD STAFF */}
      <Dialog open={isAddStaffOpen} onClose={() => setAddStaffOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Staff</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Full Name"
            fullWidth
            margin="dense"
            value={newStaff.FullName}
            onChange={(e) => setNewStaff({ ...newStaff, FullName: e.target.value })}
          />
          <TextField
            label="Role"
            fullWidth
            margin="dense"
            value={newStaff.Role}
            onChange={(e) => setNewStaff({ ...newStaff, Role: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={newStaff.Email}
            onChange={(e) => setNewStaff({ ...newStaff, Email: e.target.value })}
          />
          <TextField
            label="Phone"
            fullWidth
            margin="dense"
            value={newStaff.Phone}
            onChange={(e) => setNewStaff({ ...newStaff, Phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStaffOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateStaff}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5) EDIT STAFF */}
      <Dialog open={isEditStaffOpen} onClose={() => setEditStaffOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff</DialogTitle>
        <DialogContent dividers>
          {editStaffData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Full Name"
                value={editStaffData.FullName || ""}
                onChange={(e) => setEditStaffData({ ...editStaffData, FullName: e.target.value })}
              />
              <TextField
                label="Role"
                value={editStaffData.Role || ""}
                onChange={(e) => setEditStaffData({ ...editStaffData, Role: e.target.value })}
              />
              <TextField
                label="Email"
                value={editStaffData.Email || ""}
                onChange={(e) => setEditStaffData({ ...editStaffData, Email: e.target.value })}
              />
              <TextField
                label="Phone"
                value={editStaffData.Phone || ""}
                onChange={(e) => setEditStaffData({ ...editStaffData, Phone: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStaffOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStaff}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6) VIEW STAFF */}
      <Dialog open={isViewStaffOpen} onClose={() => setViewStaffOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Staff Details</DialogTitle>
        <DialogContent dividers>
          {viewStaffData && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Staff ID:
                  </Typography>
                  <Typography>{viewStaffData.StaffID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    FullName:
                  </Typography>
                  <Typography>{viewStaffData.FullName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Role:
                  </Typography>
                  <Typography>{viewStaffData.Role}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography>{viewStaffData.Email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography>{viewStaffData.Phone}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewStaffOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7) EDIT MAINTENANCE */}
      <Dialog open={isEditMaintenanceOpen} onClose={() => setEditMaintenanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Maintenance Log</DialogTitle>
        <DialogContent dividers>
          {editMaintenance && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Task"
                value={editMaintenance.Task || ""}
                onChange={(e) => setEditMaintenance({ ...editMaintenance, Task: e.target.value })}
              />
              <TextField
                label="Status"
                value={editMaintenance.Status || ""}
                onChange={(e) => setEditMaintenance({ ...editMaintenance, Status: e.target.value })}
              />
              <TextField
                label="Due Date"
                type="date"
                value={editMaintenance.DueDate || ""}
                onChange={(e) => setEditMaintenance({ ...editMaintenance, DueDate: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMaintenanceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateMaintenance}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8) VIEW MAINTENANCE */}
      <Dialog open={isViewMaintenanceOpen} onClose={() => setViewMaintenanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Maintenance Log Details</DialogTitle>
        <DialogContent dividers>
          {viewMaintenanceData && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    LogID:
                  </Typography>
                  <Typography>{viewMaintenanceData.MaintenanceLogID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Task:
                  </Typography>
                  <Typography>{viewMaintenanceData.Task}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Typography>{viewMaintenanceData.Status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Due Date:
                  </Typography>
                  <Typography>{viewMaintenanceData.DueDate}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewMaintenanceOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 9) EDIT FINANCIAL */}
      <Dialog open={isEditFinancialOpen} onClose={() => setEditFinancialOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Financial Summary</DialogTitle>
        <DialogContent dividers>
          {editFinancial && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Branch Name"
                value={editFinancial.BranchName || ""}
                onChange={(e) => setEditFinancial({ ...editFinancial, BranchName: e.target.value })}
              />
              <TextField
                label="Cash Sales"
                type="number"
                value={editFinancial.CashSales || 0}
                onChange={(e) => setEditFinancial({ ...editFinancial, CashSales: Number(e.target.value) })}
              />
              <TextField
                label="GCash Sales"
                type="number"
                value={editFinancial.GCashSales || 0}
                onChange={(e) => setEditFinancial({ ...editFinancial, GCashSales: Number(e.target.value) })}
              />
              <TextField
                label="BPI Sales"
                type="number"
                value={editFinancial.BPISales || 0}
                onChange={(e) => setEditFinancial({ ...editFinancial, BPISales: Number(e.target.value) })}
              />
              <TextField
                label="Total Revenue"
                type="number"
                value={editFinancial.TotalRevenue || 0}
                onChange={(e) => setEditFinancial({ ...editFinancial, TotalRevenue: Number(e.target.value) })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFinancialOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateFinancial}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 10) VIEW FINANCIAL */}
      <Dialog open={isViewFinancialOpen} onClose={() => setViewFinancialOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Financial Summary Details</DialogTitle>
        <DialogContent dividers>
          {viewFinancialData && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    SummaryID:
                  </Typography>
                  <Typography>{viewFinancialData.SummaryID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Branch:
                  </Typography>
                  <Typography>{viewFinancialData.BranchName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    CashSales:
                  </Typography>
                  <Typography>₱{viewFinancialData.CashSales}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    GCashSales:
                  </Typography>
                  <Typography>₱{viewFinancialData.GCashSales}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    BPISales:
                  </Typography>
                  <Typography>₱{viewFinancialData.BPISales}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    TotalRevenue:
                  </Typography>
                  <Typography>₱{viewFinancialData.TotalRevenue}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewFinancialOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
