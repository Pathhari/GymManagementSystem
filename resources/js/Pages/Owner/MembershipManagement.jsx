import React, { useState, useEffect } from "react";
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
  Divider,
  Menu,
  Snackbar, 
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import WarningIcon from "@mui/icons-material/Warning";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

/* If you have a specialized layout for adding a new member: */
import AddNewMemberLayout from "../../Layouts/AddNewMemberLayout";
// NEW IMPORT:
import ManagePlansLayout from "../../Layouts/ManagePlansLayout";

export default function MembershipManagement() {
  const [membershipRecords, setMembershipRecords] = useState([]);
  const [walkInRecords, setWalkInRecords] = useState([]);
  const [renewalRecords, setRenewalRecords] = useState([]);
  const [freezeRecords, setFreezeRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isManagePlansOpen, setManagePlansOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

    // Utility to open the snackbar with a custom message
    const showSuccessMessage = (msg) => {
      setSnackMessage(msg);
      setSnackOpen(true);
    };

  useEffect(() => {
    axios
      .get("/membership/members")
      .then((res) => {
        const data = res.data;
        setMembershipRecords(data.members || []);
        setWalkInRecords(data.walkIns || []);
        setRenewalRecords(data.renewals || []);
        setFreezeRecords(data.freezes || []);
        setActivityLogs(data.logs || []);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  // When a new member is created, add them to membershipRecords
  // so the table updates immediately
  function handleNewMemberCreated(newMember) {
    setMembershipRecords((prev) => [newMember, ...prev]);
    showSuccessMessage("New member added successfully!");  
  }


  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  const applySearchFilter = (arr) =>
    arr.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm))
    );

  const [selectedMembership, setSelectedMembership] = useState(null);
  const [isViewMembershipOpen, setViewMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setEditMembershipOpen] = useState(false);

  const handleViewMembership = (row) => {
    setSelectedMembership(row);
    setViewMembershipOpen(true);
  };
  const handleEditMembership = (row) => {
    setSelectedMembership({ ...row });
    setEditMembershipOpen(true);
  };
  const handleEditMembershipSubmit = async () => {
    if (!selectedMembership) return;
    try {
      const memberID = selectedMembership.MemberID;
      await axios.put(`/membership/members/${memberID}`, {
        FullName: selectedMembership.FullName,
        Email: selectedMembership.Email,
        Phone: selectedMembership.Phone,
        PlanID: selectedMembership.PlanID,
        MembershipCardNumber: selectedMembership.MembershipCardNumber,
        MembershipCardIssued: selectedMembership.MembershipCardIssued,
        MembershipStatus: selectedMembership.MembershipStatus,
        MembershipStartDate: selectedMembership.MembershipStartDate,
        MembershipEndDate: selectedMembership.MembershipEndDate,
        Biometrics: selectedMembership.Biometrics,
        FreeSessions: selectedMembership.FreeSessions,
        Notes: selectedMembership.Notes,
      });
      setMembershipRecords((prev) =>
        prev.map((m) => (m.MemberID === memberID ? selectedMembership : m))
      );
      setEditMembershipOpen(false);
    } catch (err) {
      console.error("Error updating membership:", err);
      alert("Update error. Check console for details.");
    }
  };
  const handleDeleteMembership = async (memberID) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await axios.delete(`/membership/members/${memberID}`);
      setMembershipRecords((prev) => prev.filter((m) => m.MemberID !== memberID));
    } catch (err) {
      console.error("Error deleting membership:", err);
      alert("Delete error. Check console for details.");
    }
  };
  const [isAddMembershipLayoutVisible, setAddMembershipLayoutVisible] = useState(false);

  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);

  const handleViewWalkIn = (row) => {
    setSelectedWalkIn(row);
    setViewWalkInOpen(true);
  };
  const handleEditWalkIn = (row) => {
    setSelectedWalkIn({ ...row });
    setEditWalkInOpen(true);
  };
  const handleEditWalkInSubmit = async () => {
    if (!selectedWalkIn) return;
    try {
      await axios.put(`/operations/walk-ins/${selectedWalkIn.WalkInID}`, {
        FullName: selectedWalkIn.FullName,
        VisitDate: selectedWalkIn.VisitDate,
        PaymentID: selectedWalkIn.PaymentID,
        PaymentMethod: selectedWalkIn.PaymentMethod,
        AmountPaid: selectedWalkIn.AmountPaid,
        Notes: selectedWalkIn.Notes,
      });
      setWalkInRecords((prev) =>
        prev.map((w) => (w.WalkInID === selectedWalkIn.WalkInID ? selectedWalkIn : w))
      );
      setEditWalkInOpen(false);
    } catch (err) {
      console.error("Error updating walk-in:", err);
      alert("Update error. Check console for details.");
    }
  };
  const handleDeleteWalkIn = async (walkInID) => {
    if (!window.confirm("Delete this walk-in?")) return;
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
      setWalkInRecords((prev) => prev.filter((w) => w.WalkInID !== walkInID));
    } catch (err) {
      console.error("Error deleting walk-in:", err);
      alert("Delete error. Check console for details.");
    }
  };
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    PaymentID: "",
    PaymentMethod: "",
    AmountPaid: 0,
    Notes: "",
  });
  const handleAddWalkInChange = (e) => {
    setNewWalkIn((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAddWalkIn = async () => {
    try {
      await axios.post(`/operations/walk-ins`, {
        FullName: newWalkIn.FullName,
        VisitDate: newWalkIn.VisitDate,
        PaymentID: newWalkIn.PaymentID,
        PaymentMethod: newWalkIn.PaymentMethod,
        AmountPaid: newWalkIn.AmountPaid,
        Notes: newWalkIn.Notes,
      });
      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        PaymentID: "",
        PaymentMethod: "",
        AmountPaid: 0,
        Notes: "",
      });
      setAddWalkInOpen(false);
    } catch (err) {
      console.error("Error creating walk-in:", err);
      alert("Create error. Check console for details.");
    }
  };

  const [selectedFreeze, setSelectedFreeze] = useState(null);
  const [isViewFreezeOpen, setViewFreezeOpen] = useState(false);
  const [isEditFreezeOpen, setEditFreezeOpen] = useState(false);

  const handleViewFreeze = (row) => {
    setSelectedFreeze(row);
    setViewFreezeOpen(true);
  };
  const handleEditFreeze = (row) => {
    setSelectedFreeze({ ...row });
    setEditFreezeOpen(true);
  };
  const handleEditFreezeSubmit = () => {
    setEditFreezeOpen(false);
  };
  const handleDeleteFreeze = (freezeID) => {};

  const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeForm, setFreezeForm] = useState({
    MemberID: "",
    FreezeStartDate: "",
    FreezeEndDate: "",
    Reason: "",
  });
  const handleOpenFreezeModal = (memberID) => {
    setFreezeForm({
      MemberID: memberID,
      FreezeStartDate: "",
      FreezeEndDate: "",
      Reason: "",
    });
    setFreezeModalOpen(true);
  };
  const handleFreezeFormChange = (e) => {
    setFreezeForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmitFreeze = async () => {
    try {
      await axios.post(`/membership/freezes`, freezeForm);
      setFreezeModalOpen(false);
    } catch (err) {
      console.error("Error freezing membership:", err);
      alert("Freeze error. Check console for details.");
    }
  };

  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [isViewRenewalOpen, setViewRenewalOpen] = useState(false);
  const [isEditRenewalOpen, setEditRenewalOpen] = useState(false);

  const handleViewRenewal = (row) => {
    setSelectedRenewal(row);
    setViewRenewalOpen(true);
  };
  const handleEditRenewal = (row) => {
    setSelectedRenewal({ ...row });
    setEditRenewalOpen(true);
  };
  const handleEditRenewalSubmit = () => {
    setEditRenewalOpen(false);
  };
  const handleDeleteRenewal = (renewalID) => {};

  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewLogOpen, setViewLogOpen] = useState(false);
  const handleViewLog = (row) => {
    setSelectedLog(row);
    setViewLogOpen(true);
  };
  const handleDeleteLog = (logID) => {};

  const totalMembers = membershipRecords.length;
  const expiredMemberships = membershipRecords.filter(
    (m) => m.MembershipStatus === "Expired"
  ).length;
  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 30);
  const upcomingExpirations = membershipRecords.filter((m) => {
    const endDate = new Date(m.MembershipEndDate);
    return endDate > today && endDate <= next30;
  }).length;

  const membershipColumns = [
    { field: "MemberID", headerName: "Member ID", width: 100 },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "Email", headerName: "Email", width: 160 },
    { field: "Phone", headerName: "Phone", width: 130 },
    { field: "PlanID", headerName: "Plan ID", width: 90 },
    { field: "MembershipCardNumber", headerName: "Card #", width: 130 },
    {
      field: "MembershipCardIssued",
      headerName: "Issued",
      width: 80,
      renderCell: (params) => (
        <span style={{ color: params.value ? "limegreen" : "red" }}>
          {params.value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      field: "MembershipStatus",
      headerName: "Status",
      width: 110,
      renderCell: (params) => {
        const now = new Date();
        const memberID = params.row.MemberID;
        const isFrozen = freezeRecords.some((f) => {
          const s = new Date(f.FreezeStartDate);
          const e = new Date(f.FreezeEndDate);
          return f.MemberID === memberID && now >= s && now <= e;
        });
        if (isFrozen) return <span style={{ color: "blue" }}>Frozen</span>;
        if (params.value === "Active") return <span style={{ color: "limegreen" }}>Active</span>;
        if (params.value === "Expired") return <span style={{ color: "orange" }}>Expired</span>;
        return <span>{params.value || "N/A"}</span>;
      },
    },
    { field: "MembershipStartDate", headerName: "Start", width: 100 },
    { field: "MembershipEndDate", headerName: "End", width: 100 },
    { field: "Biometrics", headerName: "Bio", width: 80 },
    { field: "FreeSessions", headerName: "Free", width: 70 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
              onClick={() => handleViewMembership(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
              onClick={() => handleEditMembership(params.row)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Freeze">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#00acc1", color: "#fff", minWidth: 40 }}
              onClick={() => handleOpenFreezeModal(params.row.MemberID)}
            >
              <AcUnitIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
              onClick={() => handleDeleteMembership(params.row.MemberID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const walkInColumns = [
    { field: "WalkInID", headerName: "Walk-In ID", width: 100 },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "VisitDate", headerName: "Visit Date", width: 160 },
    { field: "PaymentID", headerName: "PayID", width: 90 },
    { field: "PaymentMethod", headerName: "Method", width: 100 },
    { field: "AmountPaid", headerName: "Amount", width: 100 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
              onClick={() => handleViewWalkIn(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
              onClick={() => handleEditWalkIn(params.row)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
              onClick={() => handleDeleteWalkIn(params.row.WalkInID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const renewalColumns = [
    { field: "RenewalID", headerName: "Renewal ID", width: 100 },
    { field: "MemberID", headerName: "Member ID", width: 100 },
    { field: "RenewalDate", headerName: "Renewal Date", width: 130 },
    { field: "PlanID", headerName: "Plan ID", width: 90 },
    { field: "RenewalAmount", headerName: "Amount", width: 100 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
            onClick={() => handleViewRenewal(params.row)}
          >
            <VisibilityIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
            onClick={() => handleEditRenewal(params.row)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
            onClick={() => handleDeleteRenewal(params.row.RenewalID)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const freezeColumns = [
    { field: "FreezeID", headerName: "Freeze ID", width: 100 },
    { field: "MemberID", headerName: "Member ID", width: 100 },
    { field: "FreezeStartDate", headerName: "Start Date", width: 130 },
    { field: "FreezeEndDate", headerName: "End Date", width: 130 },
    { field: "Reason", headerName: "Reason", width: 150 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
            onClick={() => handleViewFreeze(params.row)}
          >
            <VisibilityIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
            onClick={() => handleEditFreeze(params.row)}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
            onClick={() => handleDeleteFreeze(params.row.FreezeID)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const logColumns = [
    { field: "LogID", headerName: "Log ID", width: 100 },
    { field: "UserID", headerName: "User ID", width: 100 },
    { field: "Action", headerName: "Action", width: 160 },
    { field: "Timestamp", headerName: "Timestamp", width: 160 },
    { field: "Details", headerName: "Details", width: 220 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
            onClick={() => handleViewLog(params.row)}
          >
            <VisibilityIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
            onClick={() => handleDeleteLog(params.row.LogID)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const filteredMemberships = applySearchFilter(membershipRecords);
  const filteredWalkIns = applySearchFilter(walkInRecords);
  const filteredRenewals = applySearchFilter(renewalRecords);
  const filteredFreezes = applySearchFilter(freezeRecords);
  const filteredLogs = applySearchFilter(activityLogs);

  let rows = [];
  let columns = [];

  if (activeTab === 0) {
    rows = filteredMemberships;
    columns = membershipColumns;
  } else if (activeTab === 1) {
    rows = filteredWalkIns;
    columns = walkInColumns;
  } else if (activeTab === 2) {
    rows = filteredRenewals;
    columns = renewalColumns;
  } else if (activeTab === 3) {
    rows = filteredFreezes;
    columns = freezeColumns;
  } else {
    rows = filteredLogs;
    columns = logColumns;
  }

  const getRowId = (row) => {
    if (activeTab === 0) return row.MemberID;
    if (activeTab === 1) return row.WalkInID;
    if (activeTab === 2) return row.RenewalID;
    if (activeTab === 3) return row.FreezeID;
    return row.LogID;
  };

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (e) => setExportAnchorEl(e.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);

  const handleExportCSV = () => {
    handleExportMenuClose();
  };
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text("Memberships Export", 14, 10);
      const bodyData = rows.map((m) => [m.MemberID, m.FullName, m.Email]);
      doc.autoTable({
        head: [["ID", "FullName", "Email"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Memberships.pdf");
    } else if (activeTab === 1) {
      // ...
    }
  };

  let csvData = rows;
  let csvHeaders = [
    { label: "MemberID", key: "MemberID" },
    { label: "FullName", key: "FullName" },
    { label: "Email", key: "Email" },
  ];
  let csvFilename = "Data.csv";
  if (activeTab === 0) {
    csvFilename = "Memberships.csv";
  } else if (activeTab === 1) {
    csvFilename = "WalkIns.csv";
  }

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 2, display: "flex" }}>
            <GroupsIcon sx={{ fontSize: 40, color: "gray", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Total Members</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: "bold" }}>{totalMembers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 2, display: "flex" }}>
            <DirectionsWalkIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Walk-Ins</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: "bold" }}>
                {walkInRecords.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 2, display: "flex" }}>
            <WarningIcon sx={{ fontSize: 40, color: "red", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Expired</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: "bold" }}>
                {expiredMemberships}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 2, display: "flex" }}>
            <EventAvailableIcon sx={{ fontSize: 40, color: "blue", mr: 2 }} />
            <CardContent>
              <Typography variant="h6">Expiring Soon</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: "bold" }}>
                {upcomingExpirations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Membership Management</Typography>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<PeopleIcon />} label="Memberships" />
          <Tab icon={<PeopleIcon />} label="Walk-Ins" />
          <Tab icon={<AutorenewIcon />} label="Renewals" />
          <Tab icon={<AcUnitIcon />} label="Freezes" />
          <Tab icon={<HistoryIcon />} label="Activity Logs" />
        </Tabs>
      </Box>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 300, maxWidth: "100%" }}
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
              open={openExportMenu}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <MenuItem onClick={handleExportCSV}>
                <CSVLink
                  data={csvData}
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddMembershipLayoutVisible(true)}
              >
                Add Member
              </Button>
            )}
            {activeTab === 1 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddWalkInOpen(true)}
              >
                Add Walk-In
              </Button>
            )}
          </Box>
        </Box>
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {/* Example: a button to open ManagePlansLayout */}
          <Button variant="contained" color="secondary" onClick={() => setManagePlansOpen(true)}>
            Manage Plans
          </Button>
        </Box>
         </Paper>

        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </div>
      </Paper>

      {isAddMembershipLayoutVisible && (
        <AddNewMemberLayout onClose={() => setAddMembershipLayoutVisible(false)} 
        onMemberCreated={handleNewMemberCreated}
        />
      )}

      {isManagePlansOpen && (
        <ManagePlansLayout onClose={() => setManagePlansOpen(false)} />
      )}
      
      <Dialog
        open={isAddWalkInOpen}
        onClose={() => setAddWalkInOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Walk-In</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            name="FullName"
            fullWidth
            margin="dense"
            value={newWalkIn.FullName}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Visit Date"
            name="VisitDate"
            type="datetime-local"
            fullWidth
            margin="dense"
            value={newWalkIn.VisitDate}
            onChange={handleAddWalkInChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Payment ID"
            name="PaymentID"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentID}
            onChange={handleAddWalkInChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="PaymentMethod"
              value={newWalkIn.PaymentMethod}
              onChange={handleAddWalkInChange}
              label="Payment Method"
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
              <MenuItem value="BPI">BPI</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Amount Paid"
            name="AmountPaid"
            type="number"
            fullWidth
            margin="dense"
            value={newWalkIn.AmountPaid}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Notes"
            name="Notes"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={newWalkIn.Notes}
            onChange={handleAddWalkInChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWalkIn}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewWalkInOpen}
        onClose={() => setViewWalkInOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Walk-In Details</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box sx={{ p: 2 }}>
              {/* Show fields from selectedWalkIn */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewWalkInOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditWalkInOpen}
        onClose={() => setEditWalkInOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Walk-In</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <>
              {/* Similar fields. Just fill from selectedWalkIn */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditWalkInSubmit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewMembershipOpen}
        onClose={() => setViewMembershipOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Membership Details</DialogTitle>
        <DialogContent dividers>
          {selectedMembership && (
            <Box sx={{ p: 2 }}>
              {/* Show membership fields from selectedMembership */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewMembershipOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditMembershipOpen}
        onClose={() => setEditMembershipOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Membership</DialogTitle>
        <DialogContent dividers>
          {selectedMembership && (
            <>
              {/* Form fields for editing membership */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMembershipOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditMembershipSubmit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isFreezeModalOpen} onClose={() => setFreezeModalOpen(false)}>
        <DialogTitle>Freeze Membership</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            type="date"
            name="FreezeStartDate"
            InputLabelProps={{ shrink: true }}
            value={freezeForm.FreezeStartDate}
            onChange={handleFreezeFormChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="End Date"
            type="date"
            name="FreezeEndDate"
            InputLabelProps={{ shrink: true }}
            value={freezeForm.FreezeEndDate}
            onChange={handleFreezeFormChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Reason"
            name="Reason"
            value={freezeForm.Reason}
            onChange={handleFreezeFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreezeModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitFreeze}>
            Submit Freeze
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewFreezeOpen}
        onClose={() => setViewFreezeOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Freeze Details</DialogTitle>
        <DialogContent dividers>
          {selectedFreeze && (
            <Box sx={{ p: 2 }}>{/* Show fields */}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewFreezeOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditFreezeOpen} onClose={() => setEditFreezeOpen(false)}>
        <DialogTitle>Edit Freeze</DialogTitle>
        <DialogContent>
          {selectedFreeze && (
            <>
              {/* No real update route */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFreezeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditFreezeSubmit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewRenewalOpen}
        onClose={() => setViewRenewalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Renewal Details</DialogTitle>
        <DialogContent dividers>
          {selectedRenewal && (
            <Box sx={{ p: 2 }}>{/* Show fields */}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewRenewalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditRenewalOpen} onClose={() => setEditRenewalOpen(false)}>
        <DialogTitle>Edit Renewal</DialogTitle>
        <DialogContent>
          {selectedRenewal && (
            <>
              {/* No real update route */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRenewalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRenewalSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isViewLogOpen} onClose={() => setViewLogOpen(false)}>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <>
              {/* Show fields */}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewLogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </Box>
  );
}
