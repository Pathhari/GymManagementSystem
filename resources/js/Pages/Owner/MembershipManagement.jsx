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

/* Layouts */
import AddNewMemberLayout from "../../Layouts/AddNewMemberLayout";
import ManagePlansLayout from "../../Layouts/ManagePlansLayout";

export default function MembershipManagement() {
  // Core records
  const [membershipRecords, setMembershipRecords] = useState([]);
  const [walkInRecords, setWalkInRecords] = useState([]);
  const [renewalRecords, setRenewalRecords] = useState([]);
  const [freezeRecords, setFreezeRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // References
  const [plans, setPlans] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [branches, setBranches] = useState([]);

  // UI / State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isManagePlansOpen, setManagePlansOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");

  // Add-member layout
  const [isAddMembershipLayoutVisible, setAddMembershipLayoutVisible] = useState(false);

  // MEMBERSHIP CRUD
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [isViewMembershipOpen, setViewMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setEditMembershipOpen] = useState(false);

  // WALK-IN CRUD
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);

  // “Add Walk-In” dialog
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    PaymentID: "",
    PaymentMethod: "",
    PaymentAmount: 350,
    Notes: "",
  });

  // FREEZE CRUD
  const [selectedFreeze, setSelectedFreeze] = useState(null);
  const [isViewFreezeOpen, setViewFreezeOpen] = useState(false);
  const [isEditFreezeOpen, setEditFreezeOpen] = useState(false);
  const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeForm, setFreezeForm] = useState({
    MemberID: "",
    FreezeStartDate: "",
    FreezeEndDate: "",
    Reason: "",
  });

  // RENEWALS
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [isViewRenewalOpen, setViewRenewalOpen] = useState(false);
  const [isEditRenewalOpen, setEditRenewalOpen] = useState(false);
  const [isAddRenewalOpen, setAddRenewalOpen] = useState(false);
  const [newRenewal, setNewRenewal] = useState({
    MemberID: "",
    PlanID: "",
    RenewalAmount: 0,
    PaymentMethod: "",
    PaymentAmount: "",
    PaymentFor: '["Renewal Fee"]'
  });

  // Logs
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewLogOpen, setViewLogOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    // 1) membership/members
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
      .catch((err) => console.error("Error fetching members:", err));

    // 2) membership/plans
    axios
      .get("/membership/plans")
      .then((res) => setPlans(res.data || []))
      .catch((err) => console.error("Error fetching plans:", err));

    // 3) membership/statuses
    axios
      .get("/membership/statuses")
      .then((res) => setMemberStatuses(res.data || []))
      .catch((err) => console.error("Error fetching statuses:", err));

    // 4) walk-ins
    axios
      .get("/operations/walk-ins")
      .then((res) => setWalkInRecords(res.data))
      .catch((err) => console.error("Error fetching walk-ins:", err));

    // 5) branches
    axios
      .get("/owner/branches")
      .then((res) => {
        setBranches(res.data.branches || []);
      })
      .catch((err) => console.error("Error fetching branches:", err));

    // Periodic refresh for membership
    const intervalId = setInterval(() => {
      axios
        .get("/membership/members")
        .then((res) => setMembershipRecords(res.data.members || []))
        .catch(console.error);
    }, 100000); // 100s

    return () => clearInterval(intervalId);
  }, []);

  // Snackbar helper
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  // Called by AddNewMemberLayout => new member created
  function handleNewMemberCreated(resData) {
    // resData = { member: {...} }
    const memberObj = resData.member;
    setMembershipRecords((prev) => [memberObj, ...prev]);
    showSuccessMessage("New member added successfully!");
  }

  // Searching / filtering
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

  // --------------- MEMBERSHIP HANDLERS ---------------
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

      // Construct FormData
      const formData = new FormData();
      formData.append("FullName", selectedMembership.FullName);
      formData.append("Email", selectedMembership.Email);
      formData.append("Phone", selectedMembership.Phone || "");
      formData.append("PlanID", selectedMembership.PlanID || "");
      formData.append("MembershipCardNumber", selectedMembership.MembershipCardNumber || "");
      formData.append("MembershipCardIssued", selectedMembership.MembershipCardIssued ? "1" : "0");
      formData.append("MemberStatusID", selectedMembership.MemberStatusID);
      formData.append("MembershipStartDate", selectedMembership.MembershipStartDate || "");
      formData.append("MembershipEndDate", selectedMembership.MembershipEndDate || "");
      formData.append("Biometrics", selectedMembership.Biometrics || "");
      formData.append("FreeSessions", selectedMembership.FreeSessions || "0");
      formData.append("Notes", selectedMembership.Notes || "");

      // If a new file was selected, append it
      if (selectedMembership.PhotoFile) {
        formData.append("PhotoFile", selectedMembership.PhotoFile);
      }

      await axios.put(`/membership/members/${memberID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local membershipRecords
      setMembershipRecords((prev) =>
        prev.map((m) => (m.MemberID === memberID ? selectedMembership : m))
      );
      setEditMembershipOpen(false);
      showSuccessMessage("Membership updated!");
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
      showSuccessMessage("Member deleted!");
    } catch (err) {
      console.error("Error deleting membership:", err);
      alert("Delete error. Check console for details.");
    }
  };

  function getStatusNameByID(memberStatusID) {
    const st = memberStatuses.find((s) => s.MemberStatusID === memberStatusID);
    return st ? st.StatusName : "Unknown";
  }

  // --------------- WALK-IN HANDLERS ---------------
  function handleViewWalkIn(row) {
    setSelectedWalkIn(row);
    setViewWalkInOpen(true);
  }

  function handleEditWalkIn(row) {
    setSelectedWalkIn({ ...row });
    setEditWalkInOpen(true);
  }

  async function handleEditWalkInSubmit() {
    if (!selectedWalkIn) return;
    try {
      const walkInID = selectedWalkIn.WalkInID;

      await axios.put(`/operations/walk-ins/${walkInID}`, {
        FullName:      selectedWalkIn.FullName,
        VisitDate:     selectedWalkIn.VisitDate,
        PaymentID:     selectedWalkIn.PaymentID,
        PaymentMethod: selectedWalkIn.PaymentMethod,
        AmountPaid:    selectedWalkIn.AmountPaid,
        Notes:         selectedWalkIn.Notes,
      });

      setWalkInRecords((prev) =>
        prev.map((w) => (w.WalkInID === walkInID ? selectedWalkIn : w))
      );
      setEditWalkInOpen(false);
      showSuccessMessage("Walk-In updated successfully!");
    } catch (err) {
      console.error("Error updating walk-in:", err);
      alert("Update error. Check console for details.");
    }
  }

  async function handleDeleteWalkIn(walkInID) {
    if (!window.confirm("Delete this walk-in?")) return;
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
      setWalkInRecords((prev) => prev.filter((w) => w.WalkInID !== walkInID));
      showSuccessMessage("Walk-In deleted!");
    } catch (err) {
      console.error("Error deleting walk-in:", err);
      alert("Delete error. Check console for details.");
    }
  }

  // “Add New Walk-In”
  function handleAddWalkInChange(e) {
    const { name, value } = e.target;
    setNewWalkIn((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddWalkIn() {
    try {
      await axios.post(`/operations/walk-ins`, {
        FullName:       newWalkIn.FullName,
        VisitDate:      newWalkIn.VisitDate,
        PaymentID:      newWalkIn.PaymentID,
        PaymentMethod:  newWalkIn.PaymentMethod,
        PaymentAmount:  newWalkIn.PaymentAmount,
        PaymentFor: JSON.stringify(["Walk-In Payment"]),
        Notes:          newWalkIn.Notes,
      });

      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        PaymentID: "",
        PaymentMethod: "",
        PaymentAmount: "",
        Notes: "",
      });
      setAddWalkInOpen(false);

      // Re-fetch
      const refreshed = await axios.get("/operations/walk-ins");
      setWalkInRecords(refreshed.data);

      showSuccessMessage("Walk-In created successfully!");
    } catch (err) {
      console.error("Error creating walk-in:", err);
      alert("Create error. Check console for details.");
    }
  }

  // --------------- FREEZE HANDLERS ---------------
  function handleOpenFreezeModal(memberID) {
    setFreezeForm({
      MemberID: memberID,
      FreezeStartDate: "",
      FreezeEndDate: "",
      Reason: "",
    });
    setFreezeModalOpen(true);
  }

  function handleFreezeFormChange(e) {
    const { name, value } = e.target;
    setFreezeForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmitFreeze() {
    try {
      const res = await axios.post("/membership/freezes", freezeForm);
      const newFreeze = res.data;
      setFreezeRecords((prev) => [newFreeze, ...prev]);

      // Re-fetch membership
      const refreshed = await axios.get("/membership/members");
      setMembershipRecords(refreshed.data.members || []);

      setFreezeModalOpen(false);
      showSuccessMessage("Freeze created successfully. Member is now Frozen!");
    } catch (err) {
      console.error("Error creating freeze:", err);
      alert("Error. Check console for details.");
    }
  }

  function handleViewFreeze(freezeRow) {
    setSelectedFreeze(freezeRow);
    setViewFreezeOpen(true);
  }

  function handleEditFreeze(freezeRow) {
    setSelectedFreeze({ ...freezeRow });
    setEditFreezeOpen(true);
  }

  function handleEditFreezeChange(e) {
    const { name, value } = e.target;
    setSelectedFreeze((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEditFreezeSubmit() {
    if (!selectedFreeze) return;
    try {
      const freezeID = selectedFreeze.FreezeID;
      const res = await axios.put(`/membership/freezes/${freezeID}`, {
        FreezeStartDate: selectedFreeze.FreezeStartDate,
        FreezeEndDate:   selectedFreeze.FreezeEndDate,
        Reason:          selectedFreeze.Reason,
      });
      const updatedFreeze = res.data;

      setFreezeRecords((prev) =>
        prev.map((f) => (f.FreezeID === freezeID ? updatedFreeze : f))
      );
      setEditFreezeOpen(false);
      alert("Freeze updated successfully!");
    } catch (err) {
      console.error("Error updating freeze:", err);
      alert("Error. Check console for details.");
    }
  }

  async function handleDeleteFreeze(freezeID) {
    if (!window.confirm("Delete this freeze record?")) return;
    try {
      await axios.delete(`/membership/freezes/${freezeID}`);
      setFreezeRecords((prev) => prev.filter((f) => f.FreezeID !== freezeID));
      alert("Freeze deleted!");
    } catch (err) {
      console.error("Error deleting freeze:", err);
      alert("Error. Check console for details.");
    }
  }

  // --------------- RENEWAL HANDLERS ---------------
  function handleOpenRenewalDialog(memberRow) {
    // You can default PaymentMethod, PaymentFor, etc. if needed
    setNewRenewal({
      MemberID: memberRow.MemberID,
      PlanID: "",
      RenewalAmount: 0,
      PaymentMethod: "",
      PaymentAmount: "",
      PaymentFor: '["Renewal Fee"]',
    });
    setAddRenewalOpen(true);
  }

  function handleAddRenewalChange(e) {
    const { name, value } = e.target;
    setNewRenewal((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddRenewal() {
    try {
      const body = {
        MemberID:      newRenewal.MemberID,
        PlanID:        newRenewal.PlanID,
        RenewalAmount: newRenewal.RenewalAmount,
        PaymentMethod: newRenewal.PaymentMethod,
        PaymentAmount: newRenewal.PaymentAmount,
        PaymentFor:    newRenewal.PaymentFor,
      };

      const res = await axios.post("/membership/renewals", body);
      // The back end might return { renewal, invoice, payment }
      // but for the DataGrid we only push the renewal object
      const created = res.data.renewal ?? res.data; 
      // If your storeRenewal returns: { renewal: {...}, invoice: {...}, payment: {...} }

      // Add renewal to local state
      setRenewalRecords((prev) => [created, ...prev]);

      // Reset
      setNewRenewal({
        MemberID: "",
        PlanID: "",
        RenewalAmount: 0,
        PaymentMethod: "",
        PaymentAmount: "",
        PaymentFor: '["Renewal Fee"]',
      });
      setAddRenewalOpen(false);

      showSuccessMessage("Renewal created successfully!");
    } catch (err) {
      console.error("Error creating renewal:", err);
      alert("Create error. Check console for details.");
    }
  }

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
    // If you have an update route for renewal, call it here
  };
  const handleDeleteRenewal = async (renewalID) => {
    if (!window.confirm("Delete this renewal?")) return;
    try {
      await axios.delete(`/membership/renewals/${renewalID}`);
      setRenewalRecords((prev) => prev.filter((r) => r.RenewalID !== renewalID));
      showSuccessMessage("Renewal deleted!");
    } catch (err) {
      console.error("Error deleting renewal:", err);
      alert("Delete error. Check console for details.");
    }
  };

  // LOGS
  function handleViewLog(row) {
    setSelectedLog(row);
    setViewLogOpen(true);
  }
  function handleDeleteLog(logID) {
    // ...
  }

  // METRICS
  const totalMembers = membershipRecords.length;
  const expiredMemberships = membershipRecords.filter((m) => {
    if (!m?.MemberStatusID) return false;
    return getStatusNameByID(m.MemberStatusID) === "Expired";
  }).length;

  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 30);

  const upcomingExpirations = membershipRecords.filter((m) => {
    if (!m?.MembershipEndDate) return false;
    const endDate = new Date(m.MembershipEndDate);
    return endDate > today && endDate <= next30;
  }).length;

  // DataGrid columns
  const membershipColumns = [
    {
      field: "StartedBranchID",
      headerName: "Branch",
      width: 130,
      renderCell: (params) => {
        const startedBranchId = params.value;
        const br = branches.find((b) => b.BranchID === startedBranchId);
        return br ? br.BranchName : "N/A";
      },
    },
    { field: "FullName", headerName: "Full Name", width: 150 },
    { field: "Email", headerName: "Email", width: 170 },
    { field: "Phone", headerName: "Phone", width: 130 },
    {
      field: "PlanID",
      headerName: "Plan",
      width: 120,
      renderCell: (params) => {
        const pid = Number(params.value);
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "Unknown";
      },
    },
    {
      field: "MemberStatusID",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const msid = params.value;
        const stName = getStatusNameByID(msid);
        return <span>{stName}</span>;
      },
    },
    { field: "MembershipEndDate", headerName: "Ends", width: 100 },
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
          <Tooltip title="Renew">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#ff9800", color: "#fff", minWidth: 40 }}
              onClick={() => handleOpenRenewalDialog(params.row)}
            >
              <AutorenewIcon fontSize="small" />
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
    { field: "PaymentID", headerName: "Payment ID", width: 110 },
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
    {
      field: "MemberID",
      headerName: "Member Name",
      width: 160,
      renderCell: (params) => {
        const memberId = Number(params.value);
        const member = membershipRecords.find((m) => m.MemberID === memberId);
        return member ? member.FullName : "N/A";
      },
    },
    { field: "RenewalDate", headerName: "Renewal Date", width: 120 },
    {
      field: "PlanID",
      headerName: "Plan",
      width: 120,
      renderCell: (params) => {
        const pid = Number(params.value);
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "Unknown";
      },
    },
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
    {
      field: "MemberName",
      headerName: "Member Name",
      width: 160,
      renderCell: (params) => {
        const member = membershipRecords.find(
          (m) => m.MemberID === params.row.MemberID
        );
        return member ? member.FullName : "Unknown";
      },
    },
    { field: "FreezeStartDate", headerName: "Start Date", width: 130 },
    { field: "FreezeEndDate", headerName: "End Date", width: 130 },
    { field: "Reason", headerName: "Reason", width: 150 },
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

  // Filter rows by tab
  function getFilteredData() {
    const applyBranchAndSearch = (arr) =>
      arr.filter((item) => {
        const branchMatches =
          branchFilter === "all" || String(item.StartedBranchID) === branchFilter;
        const searchMatches = Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm)
        );
        return branchMatches && searchMatches;
      });

    if (activeTab === 0) return applyBranchAndSearch(membershipRecords);
    if (activeTab === 1) return applySearchFilter(walkInRecords);
    if (activeTab === 2) return applySearchFilter(renewalRecords);
    if (activeTab === 3) return applySearchFilter(freezeRecords);
    return applySearchFilter(activityLogs);
  }

  const rows = getFilteredData();
  let columns = [];
  if (activeTab === 0) columns = membershipColumns;
  else if (activeTab === 1) columns = walkInColumns;
  else if (activeTab === 2) columns = renewalColumns;
  else if (activeTab === 3) columns = freezeColumns;
  else columns = logColumns;

  // Unique ID for each tab
  const getRowId = (row) => {
    if (activeTab === 0) return row.MemberID;
    if (activeTab === 1) return row.WalkInID;
    if (activeTab === 2) return row.RenewalID; // Must have 'RenewalID'
    if (activeTab === 3) return row.FreezeID;
    return row.LogID; 
  };

  // Export logic
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
    }
    // else if other tabs...
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
      {/* Key Metrics Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Members */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              boxShadow: 2,
            }}
          >
            <GroupsIcon sx={{ fontSize: 30, color: "gray", mr: 1.5 }} />
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="body2">Total Members</Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {totalMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Walk-Ins */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              boxShadow: 2,
            }}
          >
            <DirectionsWalkIcon sx={{ fontSize: 30, color: "primary.main", mr: 1.5 }} />
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="body2">Walk-Ins</Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {walkInRecords.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expired */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              boxShadow: 2,
            }}
          >
            <WarningIcon sx={{ fontSize: 30, color: "red", mr: 1.5 }} />
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="body2">Expired</Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {expiredMemberships}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expiring Soon */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "text.primary",
              color: "background.paper",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              boxShadow: 2,
            }}
          >
            <EventAvailableIcon sx={{ fontSize: 30, color: "blue", mr: 1.5 }} />
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="body2">Expiring Soon</Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {upcomingExpirations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Membership Management</Typography>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<PeopleIcon />} label="Memberships" />
          <Tab icon={<PeopleIcon />} label="Walk-Ins" />
          <Tab icon={<AutorenewIcon />} label="Renewals" />
          <Tab icon={<AcUnitIcon />} label="Freezes" />
        </Tabs>
      </Box>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ width: 150, mr: 2 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.BranchID} value={String(b.BranchID)}>
                  {b.BranchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 350, maxWidth: "100%" }}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
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

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button variant="outlined" onClick={() => setManagePlansOpen(true)}>
                Manage Plans
              </Button>
            </Box>

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
            {activeTab === 2 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddRenewalOpen(true)}
              >
                Add Renewal
              </Button>
            )}
          </Box>
        </Box>

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

      {/* Add Member Layout */}
      {isAddMembershipLayoutVisible && (
        <AddNewMemberLayout
          onClose={() => setAddMembershipLayoutVisible(false)}
          onMemberCreated={handleNewMemberCreated}
        />
      )}

      {/* Manage Plans Layout */}
      {isManagePlansOpen && <ManagePlansLayout onClose={() => setManagePlansOpen(false)} />}

 {/* ADD Walk-In Dialog */}
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

    {/* Payment Method */}
    <FormControl fullWidth margin="dense">
      <InputLabel>Payment Method</InputLabel>
      <Select
        name="PaymentMethod"
        label="Payment Method"
        value={newWalkIn.PaymentMethod}
        onChange={handleAddWalkInChange}
      >
        <MenuItem value="">-- Select Method --</MenuItem>
        <MenuItem value="W-In Cash">W-In Cash</MenuItem>
        <MenuItem value="W-In BDO">W-In BDO</MenuItem>
        <MenuItem value="W-In BPI">W-In BPI</MenuItem>
        <MenuItem value="W-In GCash">W-In GCash</MenuItem>
      </Select>
    </FormControl>

    {/* Payment Amount */}
    <TextField
      label="Payment Amount"
      name="PaymentAmount"
      type="number"
      fullWidth
      margin="dense"
      value={newWalkIn.PaymentAmount}
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


      {/* VIEW WALK-IN */}
      <Dialog open={isViewWalkInOpen} onClose={() => setViewWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Walk-In Details</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box sx={{ p: 2 }}>
              <Typography>Name: {selectedWalkIn.FullName}</Typography>
              <Typography>Visit Date: {selectedWalkIn.VisitDate}</Typography>
              <Typography>Payment ID: {selectedWalkIn.PaymentID}</Typography>
              <Typography>Payment Method: {selectedWalkIn.PaymentMethod || "N/A"}</Typography>
              <Typography>Payment Amount: {selectedWalkIn.AmountPaid || "N/A"}</Typography>
              <Typography>Notes: {selectedWalkIn.Notes}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewWalkInOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT WALK-IN */}
      <Dialog open={isEditWalkInOpen} onClose={() => setEditWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Walk-In</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <>
              <TextField
                label="Full Name"
                name="FullName"
                fullWidth
                margin="dense"
                value={selectedWalkIn.FullName}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                label="Visit Date"
                name="VisitDate"
                type="datetime-local"
                fullWidth
                margin="dense"
                value={selectedWalkIn.VisitDate}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, VisitDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Payment ID"
                name="PaymentID"
                fullWidth
                margin="dense"
                value={selectedWalkIn.PaymentID || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, PaymentID: e.target.value }))
                }
              />
              <TextField
                label="Payment Method"
                name="PaymentMethod"
                fullWidth
                margin="dense"
                value={selectedWalkIn.PaymentMethod || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, PaymentMethod: e.target.value }))
                }
              />
              <TextField
                label="Payment Amount"
                name="AmountPaid"
                type="number"
                fullWidth
                margin="dense"
                value={selectedWalkIn.AmountPaid || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, AmountPaid: e.target.value }))
                }
              />
              <TextField
                label="Notes"
                name="Notes"
                fullWidth
                margin="dense"
                multiline
                rows={3}
                value={selectedWalkIn.Notes || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, Notes: e.target.value }))
                }
              />
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

      {/* VIEW Membership */}
      <Dialog
        open={isViewMembershipOpen}
        onClose={() => setViewMembershipOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Membership Details</DialogTitle>
        <DialogContent dividers>
          {selectedMembership && (
            <Box sx={{ p: 2 }}>
              {selectedMembership.PhotoPath ? (
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <img
                    src={`/storage/${selectedMembership.PhotoPath}`}
                    alt="Member"
                    style={{ maxWidth: "150px", borderRadius: "8px" }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" align="center" sx={{ color: "gray" }}>
                  No photo available.
                </Typography>
              )}
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Typography>Name: {selectedMembership.FullName}</Typography>
              <Typography>Email: {selectedMembership.Email}</Typography>
              <Typography>Phone: {selectedMembership.Phone || "—"}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Membership Info
              </Typography>
              <Typography>Plan: {selectedMembership.PlanID}</Typography>
              <Typography>
                Status: {getStatusNameByID(selectedMembership.MemberStatusID)}
              </Typography>
              <Typography>
                Start Date: {selectedMembership.MembershipStartDate || "—"}
              </Typography>
              <Typography>
                End Date: {selectedMembership.MembershipEndDate || "—"}
              </Typography>
              <Typography>
                Free Sessions: {selectedMembership.FreeSessions || 0}
              </Typography>
              <Typography>
                Card Number: {selectedMembership.MembershipCardNumber || "—"}
              </Typography>
              <Typography>
                Card Issued? {selectedMembership.MembershipCardIssued ? "Yes" : "No"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography>
                {selectedMembership.Notes?.length
                  ? selectedMembership.Notes
                  : "No notes available."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewMembershipOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT Membership */}
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
              <TextField
                label="Full Name"
                fullWidth
                margin="dense"
                value={selectedMembership.FullName}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                label="Phone"
                fullWidth
                margin="dense"
                value={selectedMembership.Phone || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, Phone: e.target.value }))
                }
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Plan</InputLabel>
                <Select
                  label="Plan"
                  value={selectedMembership.PlanID || ""}
                  onChange={(e) =>
                    setSelectedMembership((prev) => ({ ...prev, PlanID: e.target.value }))
                  }
                >
                  {plans.map((plan) => (
                    <MenuItem key={plan.PlanID} value={plan.PlanID}>
                      {plan.PlanName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Membership Card Number"
                fullWidth
                margin="dense"
                value={selectedMembership.MembershipCardNumber || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MembershipCardNumber: e.target.value,
                  }))
                }
              />

              <TextField
                label="Membership Status"
                fullWidth
                margin="dense"
                value={selectedMembership.MemberStatusID || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MemberStatusID: e.target.value,
                  }))
                }
              />

              <TextField
                label="Start Date"
                type="date"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                value={selectedMembership.MembershipStartDate || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MembershipStartDate: e.target.value,
                  }))
                }
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                value={selectedMembership.MembershipEndDate || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MembershipEndDate: e.target.value,
                  }))
                }
              />

              <TextField
                label="Free Sessions"
                type="number"
                fullWidth
                margin="dense"
                value={selectedMembership.FreeSessions || 0}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    FreeSessions: e.target.value,
                  }))
                }
              />

              <TextField
                label="Notes"
                fullWidth
                margin="dense"
                multiline
                rows={2}
                value={selectedMembership.Notes || ""}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    Notes: e.target.value,
                  }))
                }
              />

              <Box sx={{ mt: 2 }}>
                <Button variant="contained" component="label">
                  Upload Biometric/Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedMembership((prev) => ({
                          ...prev,
                          PhotoFile: e.target.files[0],
                        }));
                      }
                    }}
                  />
                </Button>
              </Box>
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

      {/* CREATE Freeze */}
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

      {/* VIEW Freeze */}
      <Dialog open={isViewFreezeOpen} onClose={() => setViewFreezeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Freeze Details</DialogTitle>
        <DialogContent dividers>
          {selectedFreeze && (
            <Box sx={{ p: 2 }}>
              <Typography>MemberID: {selectedFreeze.MemberID}</Typography>
              <Typography>Start: {selectedFreeze.FreezeStartDate}</Typography>
              <Typography>End: {selectedFreeze.FreezeEndDate}</Typography>
              <Typography>Reason: {selectedFreeze.Reason}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewFreezeOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT Freeze */}
      <Dialog open={isEditFreezeOpen} onClose={() => setEditFreezeOpen(false)}>
        <DialogTitle>Edit Freeze</DialogTitle>
        <DialogContent>
          {selectedFreeze && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Start Date"
                type="date"
                name="FreezeStartDate"
                InputLabelProps={{ shrink: true }}
                value={selectedFreeze.FreezeStartDate || ""}
                onChange={handleEditFreezeChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="End Date"
                type="date"
                name="FreezeEndDate"
                InputLabelProps={{ shrink: true }}
                value={selectedFreeze.FreezeEndDate || ""}
                onChange={handleEditFreezeChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Reason"
                name="Reason"
                value={selectedFreeze.Reason || ""}
                onChange={handleEditFreezeChange}
              />
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

      {/* VIEW Renewal */}
      <Dialog open={isViewRenewalOpen} onClose={() => setViewRenewalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Renewal Details</DialogTitle>
        <DialogContent dividers>
          {selectedRenewal && (
            <Box sx={{ p: 2 }}>
              <Typography>RenewalID: {selectedRenewal.RenewalID}</Typography>
              <Typography>MemberID: {selectedRenewal.MemberID}</Typography>
              <Typography>Renewal Date: {selectedRenewal.RenewalDate}</Typography>
              <Typography>PlanID: {selectedRenewal.PlanID}</Typography>
              <Typography>Amount: {selectedRenewal.RenewalAmount}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewRenewalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD Renewal */}
      <Dialog open={isAddRenewalOpen} onClose={() => setAddRenewalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Renewal</DialogTitle>
        <DialogContent>
          {/* MemberID */}
          <TextField
            label="Member ID"
            name="MemberID"
            type="number"
            fullWidth
            margin="dense"
            value={newRenewal.MemberID}
            onChange={handleAddRenewalChange}
          />
          {/* PlanID */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Plan</InputLabel>
            <Select
              name="PlanID"
              label="Plan"
              value={newRenewal.PlanID}
              onChange={(e) => {
                const selectedPlanID = e.target.value;
                setNewRenewal((prev) => ({ ...prev, PlanID: selectedPlanID }));

                // auto-fill RenewalAmount from plan’s Price:
                const planObj = plans.find((p) => p.PlanID === selectedPlanID);
                if (planObj) {
                  setNewRenewal((prev) => ({
                    ...prev,
                    PlanID: selectedPlanID,
                    RenewalAmount: planObj.Price,
                  }));
                }
              }}
            >
              {plans.map((p) => (
                <MenuItem key={p.PlanID} value={p.PlanID}>
                  {p.PlanName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* RenewalAmount */}
          <TextField
            label="Renewal Amount"
            name="RenewalAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newRenewal.RenewalAmount}
            onChange={handleAddRenewalChange}
          />

          {/* Payment fields */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="PaymentMethod"
              label="Payment Method"
              value={newRenewal.PaymentMethod}
              onChange={handleAddRenewalChange}
            >
              <MenuItem value="">-- Select Method --</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="BDO">BDO</MenuItem>
              <MenuItem value="BPI">BPI</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Payment Amount"
            name="PaymentAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newRenewal.PaymentAmount}
            onChange={handleAddRenewalChange}
          />

          <TextField
            label="PaymentFor (JSON array)"
            name="PaymentFor"
            fullWidth
            margin="dense"
            value={newRenewal.PaymentFor}
            onChange={handleAddRenewalChange}
            helperText='e.g. ["Renewal Fee"]'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRenewalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddRenewal}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT Renewal */}
      <Dialog open={isEditRenewalOpen} onClose={() => setEditRenewalOpen(false)}>
        <DialogTitle>Edit Renewal</DialogTitle>
        <DialogContent>
          {selectedRenewal && (
            <>
              <TextField
                label="Renewal Amount"
                fullWidth
                margin="dense"
                type="number"
                value={selectedRenewal.RenewalAmount}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, RenewalAmount: e.target.value }))
                }
              />
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

      {/* VIEW Log */}
      <Dialog open={isViewLogOpen} onClose={() => setViewLogOpen(false)}>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <>
              <Typography>Log ID: {selectedLog.LogID}</Typography>
              <Typography>User ID: {selectedLog.UserID}</Typography>
              <Typography>Action: {selectedLog.Action}</Typography>
              <Typography>Timestamp: {selectedLog.Timestamp}</Typography>
              <Typography>Details: {selectedLog.Details}</Typography>
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
