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
  Divider,
  Menu,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid } from "@mui/x-data-grid";
import PeopleIcon from "@mui/icons-material/People";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
// Icons for the Overview Cards
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import AddNewMemberLayout from "../../Layouts/AddNewMemberLayout";


// --------- For CSV Export ---------
import { CSVLink } from "react-csv";

// --------- For PDF Export ---------
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------------------- SAMPLE DATA ----------------------
const sampleMemberships = [
  {
    id: 1, // Add this line
    MemberID: 1,
    FullName: "John Doe",
    Email: "john.doe@example.com",
    Phone: "123-456-7890",
    PlanID: 1,
    MembershipCardNumber: "CARD-1001",
    MembershipCardIssued: true,
    MembershipStatus: "Active",
    MembershipStartDate: "2023-01-01",
    MembershipEndDate: "2023-12-31",
    Biometrics: "Fingerprint",
    FreeSessions: 5,
    Notes: "First time member",
  },
  {
    id: 2, // Add this line
    MemberID: 2,
    FullName: "Jane Smith",
    Email: "jane.smith@example.com",
    Phone: "987-654-3210",
    PlanID: 2,
    MembershipCardNumber: "CARD-1002",
    MembershipCardIssued: false,
    MembershipStatus: "Expired",
    MembershipStartDate: "2022-01-01",
    MembershipEndDate: "2022-12-31",
    Biometrics: "Facial",
    FreeSessions: 2,
    Notes: "Pending renewal",
  },
];

const sampleFreezes = [
  {
    FreezeID: 1,
    MemberID: 1,
    FreezeStartDate: "2023-05-01",
    FreezeEndDate: "2023-05-15",
    Reason: "Vacation",
    ApprovalStatus: "Approved",
  },
  {
    FreezeID: 2,
    MemberID: 2,
    FreezeStartDate: "2023-06-01",
    FreezeEndDate: "2023-06-10",
    Reason: "Medical",
    ApprovalStatus: "Pending",
  },
];

const sampleRenewals = [
  {
    RenewalID: 1,
    MemberID: 1,
    RenewalDate: "2023-12-01",
    PlanID: 1,
    RenewalAmount: 1200,
    ProcessedBy: "Admin1",
  },
  {
    RenewalID: 2,
    MemberID: 2,
    RenewalDate: "2023-11-15",
    PlanID: 2,
    RenewalAmount: 900,
    ProcessedBy: "Staff2",
  },
];

const sampleLogs = [
  {
    LogID: 1,
    UserID: 1,
    Action: "Updated membership status",
    Timestamp: "2023-02-10 10:15:00",
    Details: "Changed status from expired to active",
  },
  {
    LogID: 2,
    UserID: 2,
    Action: "Payment processed",
    Timestamp: "2023-02-11 09:00:00",
    Details: "Renewal payment confirmed for MemberID 2",
  },
];

// Updated sampleWalkIns with no ModeOfPayment or AmountPaid yet
const sampleWalkIns = [
  {
    WalkInID: 1,
    FullName: "Alice Brown",
    Phone: "123-456-7890",
    VisitDate: "2023-12-15",
    VisitTime: "10:30 AM",
    Purpose: "Trial Session",
    PaymentID: null,
    // New fields below:
    ModeOfPayment: "",
    AmountPaid: 0,
    Remarks: "Interested in membership.",
    CreatedAt: "2023-12-15 10:00:00",
    UpdatedAt: "2023-12-15 10:30:00",
  },
  {
    WalkInID: 2,
    FullName: "Charlie Green",
    Phone: "987-654-3210",
    VisitDate: "2023-12-16",
    VisitTime: "02:00 PM",
    Purpose: "Facility Booking",
    PaymentID: 101,
    // New fields below:
    ModeOfPayment: "GCash",
    AmountPaid: 150,
    Remarks: "Booked a badminton court.",
    CreatedAt: "2023-12-16 01:45:00",
    UpdatedAt: "2023-12-16 02:00:00",
  },
];

export default function MembershipManagement() {
  // ------------------- STATES: MEMBERSHIP TAB -------------------
  const [membershipRecords, setMembershipRecords] = useState(sampleMemberships);
  const [filteredMemberships, setFilteredMemberships] = useState(sampleMemberships);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [isAddMembershipLayoutVisible, setAddMembershipLayoutVisible] = useState(false);

  // Modals for Membership
  const [isViewMembershipOpen, setViewMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setEditMembershipOpen] = useState(false);

  // For adding a new membership
  const [newMembership, setNewMembership] = useState({
    FullName: "",
    Email: "",
    Phone: "",
    PlanID: 0,
    MembershipCardNumber: "",
    MembershipCardIssued: false,
    MembershipStatus: "",
    MembershipStartDate: "",
    MembershipEndDate: "",
    Biometrics: "",
    FreeSessions: 0,
    Notes: "",
  });
  const [errors, setErrors] = useState({});

  // ------------------- STATES: WALK-INS TAB -------------------
  const [walkInRecords, setWalkInRecords] = useState(sampleWalkIns);
  const [filteredWalkIns, setFilteredWalkIns] = useState(sampleWalkIns);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);
  // Updated state to include new fields ModeOfPayment and AmountPaid
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    Phone: "",
    VisitDate: "",
    VisitTime: "",
    Purpose: "",
    PaymentID: null,
    ModeOfPayment: "", // New field (Enum: "GCash", "Cash", "BPI")
    AmountPaid: 0,     // New field (Decimal)
    Remarks: "",
  });

  // ------------------- STATES: FREEZES TAB --------------------
  const [freezeRecords, setFreezeRecords] = useState(sampleFreezes);
  const [filteredFreezes, setFilteredFreezes] = useState(sampleFreezes);
  const [selectedFreeze, setSelectedFreeze] = useState(null);
  const [isViewFreezeOpen, setViewFreezeOpen] = useState(false);
  const [isEditFreezeOpen, setEditFreezeOpen] = useState(false);

  // ------------------- STATES: RENEWALS TAB -------------------
  const [renewalRecords, setRenewalRecords] = useState(sampleRenewals);
  const [filteredRenewals, setFilteredRenewals] = useState(sampleRenewals);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [isViewRenewalOpen, setViewRenewalOpen] = useState(false);
  const [isEditRenewalOpen, setEditRenewalOpen] = useState(false);

  // ------------------- STATES: LOGS TAB -----------------------
  const [activityLogs, setActivityLogs] = useState(sampleLogs);
  const [filteredLogs, setFilteredLogs] = useState(sampleLogs);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewLogOpen, setViewLogOpen] = useState(false);

  // ------------------- TABS & SEARCH --------------------------
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // -------------- TIME PERIOD + DATE FILTERS --------------
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // -------------- NEW: BRANCH FILTER --------------
  const [branch, setBranch] = useState("all");
  // Dummy branch options. Replace with real data when ready.
  const branchOptions = [
    { value: "all", label: "All Branches" },
    { value: "branch1", label: "Branch 1" },
    { value: "branch2", label: "Branch 2" },
    { value: "branch3", label: "Branch 3" },
  ];

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
    // Insert your filtering logic if desired
  };
  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
    // Insert your filtering logic if desired
  };
  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
    // Insert your filtering logic if desired
  };
  // Handle Branch Filter Change
  const handleBranchChange = (e) => {
    setBranch(e.target.value);
    // Insert branch-based filtering logic if desired
  };

  // ------------------- ADD MEMBERSHIP -------------------------
  const handleAddMembershipChange = (e) => {
    const { name, value } = e.target;
    setNewMembership({ ...newMembership, [name]: value });
  };

  const handleAddMembership = () => {
    if (!newMembership.FullName || !newMembership.Email) {
      setErrors({
        FullName: newMembership.FullName ? "" : "Required",
        Email: newMembership.Email ? "" : "Required",
      });
      return;
    }
    const nextID = membershipRecords.length
      ? Math.max(...membershipRecords.map((m) => m.MemberID)) + 1
      : 1;

    const newRecord = {
      MemberID: nextID,
      ...newMembership,
      PlanID: Number(newMembership.PlanID) || 0,
      MembershipCardIssued: newMembership.MembershipCardIssued === "true" || false,
    };

    const updated = [...membershipRecords, newRecord];
    setMembershipRecords(updated);
    setFilteredMemberships(updated);

    // Reset form and close dialog
    setNewMembership({
      FullName: "",
      Email: "",
      Phone: "",
      PlanID: 0,
      MembershipCardNumber: "",
      MembershipCardIssued: false,
      MembershipStatus: "",
      MembershipStartDate: "",
      MembershipEndDate: "",
      Biometrics: "",
      FreeSessions: 0,
      Notes: "",
    });
    setErrors({});
    setAddMembershipOpen(false);
  };

  // ------------------- MEMBERSHIP: VIEW, EDIT, Freeze, DELETE ---------
  const handleViewMembership = (record) => {
    setSelectedMembership(record);
    setViewMembershipOpen(true);
  };

  const handleEditMembership = (record) => {
    setSelectedMembership(record);
    setEditMembershipOpen(true);
  };

  const handleDeleteMembership = (memberID) => {
    const updated = membershipRecords.filter((m) => m.MemberID !== memberID);
    setMembershipRecords(updated);
    setFilteredMemberships(updated);
  };

  const handleEditMembershipSubmit = () => {
    setMembershipRecords((prev) =>
      prev.map((m) => (m.MemberID === selectedMembership.MemberID ? selectedMembership : m))
    );
    setFilteredMemberships((prev) =>
      prev.map((m) => (m.MemberID === selectedMembership.MemberID ? selectedMembership : m))
    );
    setEditMembershipOpen(false);
  };

  // Add these states for Freeze Modal
  const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeForm, setFreezeForm] = useState({
    MemberID: null,
    FreezeStartDate: "",
    FreezeEndDate: "",
    Reason: "",
    Notes: "",
  });

  const handleOpenFreezeModal = (memberID) => {
    setFreezeForm({
      MemberID: memberID,
      FreezeStartDate: "",
      FreezeEndDate: "",
      Reason: "",
      Notes: "",
    });
    setFreezeModalOpen(true);
  };

  const handleFreezeFormChange = (e) => {
    const { name, value } = e.target;
    setFreezeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFreeze = () => {
    const newFreeze = {
      FreezeID: freezeRecords.length ? Math.max(...freezeRecords.map((f) => f.FreezeID)) + 1 : 1,
      MemberID: freezeForm.MemberID,
      FreezeStartDate: freezeForm.FreezeStartDate,
      FreezeEndDate: freezeForm.FreezeEndDate,
      Reason: freezeForm.Reason,
      ApprovalStatus: "Pending",
      Notes: freezeForm.Notes,
    };

    setFreezeRecords((prev) => [...prev, newFreeze]);
    setFilteredFreezes((prev) => [...prev, newFreeze]);
    setFreezeModalOpen(false);
  };

  // ------------------- FREEZES: VIEW, EDIT, DELETE ------------
  const handleViewFreeze = (record) => {
    setSelectedFreeze(record);
    setViewFreezeOpen(true);
  };

  const handleEditFreeze = (record) => {
    setSelectedFreeze(record);
    setEditFreezeOpen(true);
  };

  const handleDeleteFreeze = (freezeID) => {
    const updated = freezeRecords.filter((f) => f.FreezeID !== freezeID);
    setFreezeRecords(updated);
    setFilteredFreezes(updated);
  };

  const handleEditFreezeSubmit = () => {
    setFreezeRecords((prev) =>
      prev.map((f) => (f.FreezeID === selectedFreeze.FreezeID ? selectedFreeze : f))
    );
    setFilteredFreezes((prev) =>
      prev.map((f) => (f.FreezeID === selectedFreeze.FreezeID ? selectedFreeze : f))
    );
    setEditFreezeOpen(false);
  };

  // ------------------- RENEWALS: VIEW, EDIT, DELETE -----------
  const handleViewRenewal = (record) => {
    setSelectedRenewal(record);
    setViewRenewalOpen(true);
  };

  const handleEditRenewal = (record) => {
    setSelectedRenewal(record);
    setEditRenewalOpen(true);
  };

  const handleDeleteRenewal = (renewalID) => {
    const updated = renewalRecords.filter((r) => r.RenewalID !== renewalID);
    setRenewalRecords(updated);
    setFilteredRenewals(updated);
  };

  const handleEditRenewalSubmit = () => {
    setRenewalRecords((prev) =>
      prev.map((r) => (r.RenewalID === selectedRenewal.RenewalID ? selectedRenewal : r))
    );
    setFilteredRenewals((prev) =>
      prev.map((r) => (r.RenewalID === selectedRenewal.RenewalID ? selectedRenewal : r))
    );
    setEditRenewalOpen(false);
  };

  // ------------------- LOGS: VIEW, DELETE (no Edit) -----------
  const handleViewLog = (record) => {
    setSelectedLog(record);
    setViewLogOpen(true);
  };

  const handleDeleteLog = (logID) => {
    const updated = activityLogs.filter((l) => l.LogID !== logID);
    setActivityLogs(updated);
    setFilteredLogs(updated);
  };

  // ------------------- SEARCH & TAB SWITCHING -----------------
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (activeTab === 0) {
      const filtered = membershipRecords.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value))
      );
      setFilteredMemberships(filtered);
    } else if (activeTab === 1) {
      // Walk-Ins tab search
      const filtered = walkInRecords.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value))
      );
      setFilteredWalkIns(filtered);
    } else if (activeTab === 2) {
      const filtered = renewalRecords.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value))
      );
      setFilteredRenewals(filtered);
    } else if (activeTab === 3) {
      const filtered = freezeRecords.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value))
      );
      setFilteredFreezes(filtered);
    } else {
      const filtered = activityLogs.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value))
      );
      setFilteredLogs(filtered);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");

    if (newValue === 0) {
      setFilteredMemberships(membershipRecords);
    } else if (newValue === 1) {
      setFilteredWalkIns(walkInRecords);
    } else if (newValue === 2) {
      setFilteredRenewals(renewalRecords);
    } else if (newValue === 3) {
      setFilteredFreezes(freezeRecords);
    } else {
      setFilteredLogs(activityLogs);
    }
  };

  // ------------------- Overview Cards: 4 Metrics -------------------
  const totalMembers = membershipRecords.length;
  const activeMembers = membershipRecords.filter(
    (m) => m.MembershipStatus === "Active"
  ).length;
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
      width: 120,
      renderCell: (params) => {
        const memberID = params.row.MemberID;
        const isFreezed = freezeRecords.some((freeze) => {
          const freezeStart = new Date(freeze.FreezeStartDate);
          const freezeEnd = new Date(freeze.FreezeEndDate);
          const today = new Date();
          return freeze.MemberID === memberID && today >= freezeStart && today <= freezeEnd;
        });
        return (
          <span style={{ color: isFreezed ? "blue" : params.value === "Active" ? "limegreen" : "orange" }}>
            {isFreezed ? "Freezed" : params.value}
          </span>
        );
      },
    },
    { field: "MembershipStartDate", headerName: "Start", width: 100 },
    { field: "MembershipEndDate", headerName: "End", width: 100 },
    { field: "Biometrics", headerName: "Biometrics", width: 120 },
    { field: "FreeSessions", headerName: "Free", width: 70 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 300,
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
                padding: "6px",
              }}
              onClick={() => handleViewMembership(params.row)}
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
                padding: "6px",
              }}
              onClick={() => handleEditMembership(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Freeze">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#00acc1",
                color: "#fff",
                "&:hover": { backgroundColor: "#008394" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleOpenFreezeModal(params.row.MemberID)}
            >
              <AcUnitIcon />
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
                padding: "6px",
              }}
              onClick={() => handleDeleteMembership(params.row.MemberID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ------------------- WALK-INS: COLUMNS & ACTIONS -------------------
  const walkInColumns = [
    { field: "WalkInID", headerName: "Walk-In ID", width: 100 },
    { field: "FullName", headerName: "Full Name", width: 150 },
    { field: "Phone", headerName: "Phone", width: 130 },
    { field: "VisitDate", headerName: "Visit Date", width: 120 },
    { field: "VisitTime", headerName: "Visit Time", width: 120 },
    { field: "Purpose", headerName: "Purpose", width: 150 },
    { field: "PaymentID", headerName: "Payment ID", width: 100 },
    { field: "ModeOfPayment", headerName: "Mode of Payment", width: 150 },
    { field: "AmountPaid", headerName: "Amount Paid", width: 120 },
    { field: "Remarks", headerName: "Remarks", width: 200 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 300,
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
                padding: "6px",
              }}
              onClick={() => handleViewWalkIn(params.row)}
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
                padding: "6px",
              }}
              onClick={() => handleEditWalkIn(params.row)}
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
                padding: "6px",
              }}
              onClick={() => handleDeleteWalkIn(params.row.WalkInID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleAddWalkInChange = (e) => {
    const { name, value } = e.target;
    setNewWalkIn((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddWalkIn = () => {
    const nextID = walkInRecords.length
      ? Math.max(...walkInRecords.map((w) => w.WalkInID)) + 1
      : 1;

    const newRecord = {
      WalkInID: nextID,
      ...newWalkIn,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    setWalkInRecords((prev) => [...prev, newRecord]);
    setFilteredWalkIns((prev) => [...prev, newRecord]);
    setNewWalkIn({
      FullName: "",
      Phone: "",
      VisitDate: "",
      VisitTime: "",
      Purpose: "",
      PaymentID: null,
      ModeOfPayment: "",
      AmountPaid: 0,
      Remarks: "",
    });
    setAddWalkInOpen(false);
  };

  const handleViewWalkIn = (record) => {
    setSelectedWalkIn(record);
    setViewWalkInOpen(true);
  };

  const handleEditWalkIn = (record) => {
    setSelectedWalkIn(record);
    setEditWalkInOpen(true);
  };

  const handleEditWalkInSubmit = () => {
    setWalkInRecords((prev) =>
      prev.map((w) =>
        w.WalkInID === selectedWalkIn.WalkInID ? { ...selectedWalkIn } : w
      )
    );
    setFilteredWalkIns((prev) =>
      prev.map((w) =>
        w.WalkInID === selectedWalkIn.WalkInID ? { ...selectedWalkIn } : w
      )
    );
    setEditWalkInOpen(false);
  };

  const handleDeleteWalkIn = (walkInID) => {
    const updated = walkInRecords.filter((w) => w.WalkInID !== walkInID);
    setWalkInRecords(updated);
    setFilteredWalkIns(updated);
  };

  const renewalColumns = [
    { field: "RenewalID", headerName: "Renewal ID", width: 110 },
    { field: "MemberID", headerName: "Member ID", width: 100 },
    { field: "RenewalDate", headerName: "Renewal Date", width: 130 },
    { field: "PlanID", headerName: "Plan ID", width: 90 },
    { field: "RenewalAmount", headerName: "Amount", width: 100 },
    { field: "ProcessedBy", headerName: "Processed By", width: 130 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#4caf50",
              color: "#fff",
              "&:hover": { backgroundColor: "#43a047" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleViewRenewal(params.row)}
          >
            <VisibilityIcon />
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#2196f3",
              color: "#fff",
              "&:hover": { backgroundColor: "#1976d2" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleEditRenewal(params.row)}
          >
            <EditIcon />
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#f44336",
              color: "#fff",
              "&:hover": { backgroundColor: "#d32f2f" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleDeleteRenewal(params.row.RenewalID)}
          >
            <DeleteIcon />
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
    {
      field: "ApprovalStatus",
      headerName: "Approval",
      width: 100,
      renderCell: (params) => (
        <span style={{ color: params.value === "Approved" ? "limegreen" : "orange" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 280,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#4caf50",
              color: "#fff",
              "&:hover": { backgroundColor: "#43a047" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleViewFreeze(params.row)}
          >
            <VisibilityIcon />
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#2196f3",
              color: "#fff",
              "&:hover": { backgroundColor: "#1976d2" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleEditFreeze(params.row)}
          >
            <EditIcon />
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#f44336",
              color: "#fff",
              "&:hover": { backgroundColor: "#d32f2f" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleDeleteFreeze(params.row.FreezeID)}
          >
            <DeleteIcon />
          </Button>
        </Box>
      ),
    },
  ];

  const logColumns = [
    { field: "LogID", headerName: "Log ID", width: 80 },
    { field: "UserID", headerName: "User ID", width: 80 },
    { field: "Action", headerName: "Action", width: 160 },
    { field: "Timestamp", headerName: "Timestamp", width: 160 },
    { field: "Details", headerName: "Details", width: 200 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
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
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#f44336",
              color: "#fff",
              "&:hover": { backgroundColor: "#d32f2f" },
              minWidth: "40px",
              padding: "6px",
            }}
            onClick={() => handleDeleteLog(params.row.LogID)}
          >
            <DeleteIcon />
          </Button>
        </Box>
      ),
    },
  ];

  const columns =
    activeTab === 0
      ? membershipColumns
      : activeTab === 1
      ? walkInColumns
      : activeTab === 2
      ? renewalColumns
      : activeTab === 3
      ? freezeColumns
      : logColumns;

  const getRowId = (row) => {
    if (activeTab === 0) return row.MemberID;
    if (activeTab === 1) return row.WalkInID;
    if (activeTab === 2) return row.RenewalID;
    if (activeTab === 3) return row.FreezeID;
    return row.LogID;
  };

  const rows =
    activeTab === 0
      ? filteredMemberships
      : activeTab === 1
      ? filteredWalkIns
      : activeTab === 2
      ? filteredRenewals
      : activeTab === 3
      ? filteredFreezes
      : filteredLogs;

  // ==================================================================
  // ======================= EXPORT FUNCTIONALITY ======================
  // ==================================================================

  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const membershipCSVHeaders = [
    { label: "Member ID", key: "MemberID" },
    { label: "Full Name", key: "FullName" },
    { label: "Email", key: "Email" },
    { label: "Phone", key: "Phone" },
    { label: "PlanID", key: "PlanID" },
    { label: "MembershipCardNumber", key: "MembershipCardNumber" },
    { label: "MembershipCardIssued", key: "MembershipCardIssued" },
    { label: "MembershipStatus", key: "MembershipStatus" },
    { label: "MembershipStartDate", key: "MembershipStartDate" },
    { label: "MembershipEndDate", key: "MembershipEndDate" },
    { label: "Biometrics", key: "Biometrics" },
    { label: "FreeSessions", key: "FreeSessions" },
    { label: "Notes", key: "Notes" },
  ];

  const renewalCSVHeaders = [
    { label: "RenewalID", key: "RenewalID" },
    { label: "MemberID", key: "MemberID" },
    { label: "RenewalDate", key: "RenewalDate" },
    { label: "PlanID", key: "PlanID" },
    { label: "RenewalAmount", key: "RenewalAmount" },
    { label: "ProcessedBy", key: "ProcessedBy" },
  ];

  const freezeCSVHeaders = [
    { label: "FreezeID", key: "FreezeID" },
    { label: "MemberID", key: "MemberID" },
    { label: "FreezeStartDate", key: "FreezeStartDate" },
    { label: "FreezeEndDate", key: "FreezeEndDate" },
    { label: "Reason", key: "Reason" },
    { label: "ApprovalStatus", key: "ApprovalStatus" },
  ];

  const logsCSVHeaders = [
    { label: "LogID", key: "LogID" },
    { label: "UserID", key: "UserID" },
    { label: "Action", key: "Action" },
    { label: "Timestamp", key: "Timestamp" },
    { label: "Details", key: "Details" },
  ];

  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text("Memberships Export", 14, 10);
      const bodyData = filteredMemberships.map((m) => [
        m.MemberID,
        m.FullName,
        m.Email,
        m.Phone,
        m.PlanID,
        m.MembershipCardNumber,
        m.MembershipCardIssued ? "Yes" : "No",
        m.MembershipStatus,
        m.MembershipStartDate,
        m.MembershipEndDate,
        m.Biometrics,
        m.FreeSessions,
        m.Notes,
      ]);
      doc.autoTable({
        head: [
          [
            "MemberID",
            "Full Name",
            "Email",
            "Phone",
            "PlanID",
            "Card #",
            "Issued?",
            "Status",
            "Start",
            "End",
            "Biometrics",
            "Free?",
            "Notes",
          ],
        ],
        body: bodyData,
        startY: 20,
      });
      doc.save("Memberships.pdf");
    } else if (activeTab === 2) {
      doc.text("Renewals Export", 14, 10);
      const bodyData = filteredRenewals.map((r) => [
        r.RenewalID,
        r.MemberID,
        r.RenewalDate,
        r.PlanID,
        r.RenewalAmount,
        r.ProcessedBy,
      ]);
      doc.autoTable({
        head: [["ID", "MemberID", "Date", "PlanID", "Amount", "ProcessedBy"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Renewals.pdf");
    } else if (activeTab === 3) {
      doc.text("Freezes Export", 14, 10);
      const bodyData = filteredFreezes.map((f) => [
        f.FreezeID,
        f.MemberID,
        f.FreezeStartDate,
        f.FreezeEndDate,
        f.Reason,
        f.ApprovalStatus,
      ]);
      doc.autoTable({
        head: [["ID", "MemberID", "Start", "End", "Reason", "Status"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Freezes.pdf");
    } else {
      doc.text("Logs Export", 14, 10);
      const bodyData = filteredLogs.map((l) => [
        l.LogID,
        l.UserID,
        l.Action,
        l.Timestamp,
        l.Details,
      ]);
      doc.autoTable({
        head: [["LogID", "UserID", "Action", "Timestamp", "Details"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Logs.pdf");
    }
  };

  let csvData = [];
  let csvHeaders = [];
  let csvFilename = "";
  if (activeTab === 0) {
    csvData = filteredMemberships;
    csvHeaders = membershipCSVHeaders;
    csvFilename = "Memberships.csv";
  } else if (activeTab === 2) {
    csvData = filteredRenewals;
    csvHeaders = renewalCSVHeaders;
    csvFilename = "Renewals.csv";
  } else if (activeTab === 3) {
    csvData = filteredFreezes;
    csvHeaders = freezeCSVHeaders;
    csvFilename = "Freezes.csv";
  } else if (activeTab === 4) {
    csvData = filteredLogs;
    csvHeaders = logsCSVHeaders;
    csvFilename = "Logs.csv";
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* TIME PERIOD, DATE & BRANCH FILTERS */}
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
            onChange={handleTimePeriodChange}
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
        {/* New Branch Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={branch}
            label="Branch"
            onChange={handleBranchChange}
          >
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Overview Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
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
              <GroupsIcon sx={{ fontSize: 40, color: "gray", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Members
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {totalMembers}
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
              <DirectionsWalkIcon
                sx={{ fontSize: 40, color: "primary", mr: 2 }}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Walk-Ins
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {walkInRecords.length}
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
              <WarningIcon sx={{ fontSize: 40, color: "red", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expired Memberships
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {expiredMemberships}
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
              <EventAvailableIcon sx={{ fontSize: 40, color: "blue", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Expirations
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {upcomingExpirations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Title and Tabs */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Membership Management
        </Typography>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <Tab icon={<PeopleIcon />} label="Memberships" />
          <Tab icon={<PeopleIcon />} label="Walk-Ins" />
          <Tab icon={<AutorenewIcon />} label="Renewals" />
          <Tab icon={<AcUnitIcon />} label="Freezes" />
          <Tab icon={<HistoryIcon />} label="Activity Logs" />
        </Tabs>
      </Box>

      {/* DataGrid & Search */}
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
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
              open={openExportMenu}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <MenuItem onClick={handleExportCSV}>
                <CSVLink
                  data={rows}
                  headers={
                    activeTab === 0
                      ? membershipCSVHeaders
                      : activeTab === 2
                      ? renewalCSVHeaders
                      : activeTab === 3
                      ? freezeCSVHeaders
                      : logsCSVHeaders
                  }
                  filename={
                    activeTab === 0
                      ? "Memberships.csv"
                      : activeTab === 2
                      ? "Renewals.csv"
                      : activeTab === 3
                      ? "Freezes.csv"
                      : "Logs.csv"
                  }
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
               Add New Membership
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
        <div style={{ height: 420, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </div>
      </Paper>

  {/* Add New Membership Layout */}
  {isAddMembershipLayoutVisible && (
        <AddNewMemberLayout
          onClose={() => setAddMembershipLayoutVisible(false)}
        />
      )}
      {/* ========== ADD WALK-IN DIALOG ========== */}
      <Dialog
        open={isAddWalkInOpen}
        onClose={() => setAddWalkInOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Walk-In</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Full Name"
            name="FullName"
            value={newWalkIn.FullName}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Phone"
            name="Phone"
            value={newWalkIn.Phone}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Visit Date"
            name="VisitDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newWalkIn.VisitDate}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Visit Time"
            name="VisitTime"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={newWalkIn.VisitTime}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Purpose"
            name="Purpose"
            value={newWalkIn.Purpose}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Payment ID"
            name="PaymentID"
            value={newWalkIn.PaymentID}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Mode of Payment</InputLabel>
            <Select
              name="ModeOfPayment"
              value={newWalkIn.ModeOfPayment}
              onChange={handleAddWalkInChange}
              label="Mode of Payment"
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
              <MenuItem value="BPI">BPI</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Amount Paid"
            name="AmountPaid"
            type="number"
            value={newWalkIn.AmountPaid}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Remarks"
            name="Remarks"
            multiline
            rows={3}
            value={newWalkIn.Remarks}
            onChange={handleAddWalkInChange}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWalkIn}>
            Add Walk-In
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== VIEW WALK-IN DIALOG ========== */}
      <Dialog
  open={isViewWalkInOpen}
  onClose={() => setViewWalkInOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Typography variant="h6" color="primary">
      Walk-In Details
    </Typography>
  </DialogTitle>
  <DialogContent dividers>
    {selectedWalkIn && (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              <strong>Visitor Information</strong>
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Full Name:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.FullName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Phone:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.Phone}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Visit Date:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.VisitDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Visit Time:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.VisitTime}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Purpose:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.Purpose}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Payment ID:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.PaymentID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Mode of Payment:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.ModeOfPayment}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Amount Paid:
            </Typography>
            <Typography variant="body1">${selectedWalkIn.AmountPaid}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Remarks:
            </Typography>
            <Typography variant="body1">{selectedWalkIn.Remarks}</Typography>
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewWalkInOpen(false)}
      variant="contained"
      color="primary"
    >
      Close
    </Button>
  </DialogActions>
</Dialog>



      {/* ========== EDIT WALK-IN DIALOG ========== */}
      <Dialog
        open={isEditWalkInOpen}
        onClose={() => setEditWalkInOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Walk-In</DialogTitle>
        <DialogContent>
          {selectedWalkIn && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Full Name"
                value={selectedWalkIn.FullName}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    FullName: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Phone"
                value={selectedWalkIn.Phone}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    Phone: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Visit Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={selectedWalkIn.VisitDate}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    VisitDate: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Visit Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={selectedWalkIn.VisitTime}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    VisitTime: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Purpose"
                value={selectedWalkIn.Purpose}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    Purpose: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Payment ID"
                value={selectedWalkIn.PaymentID}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    PaymentID: e.target.value,
                  }))
                }
                variant="outlined"
              />
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Mode of Payment</InputLabel>
                <Select
                  name="ModeOfPayment"
                  value={selectedWalkIn.ModeOfPayment}
                  onChange={(e) =>
                    setSelectedWalkIn((prev) => ({
                      ...prev,
                      ModeOfPayment: e.target.value,
                    }))
                  }
                  label="Mode of Payment"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="GCash">GCash</MenuItem>
                  <MenuItem value="BPI">BPI</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="dense"
                label="Amount Paid"
                type="number"
                value={selectedWalkIn.AmountPaid}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    AmountPaid: parseFloat(e.target.value) || 0,
                  }))
                }
                variant="outlined"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Remarks"
                multiline
                rows={3}
                value={selectedWalkIn.Remarks}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({
                    ...prev,
                    Remarks: e.target.value,
                  }))
                }
                variant="outlined"
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

      {/* ========== VIEW MEMBERSHIP DIALOG ========== */}
      <Dialog
  open={isViewMembershipOpen}
  onClose={() => setViewMembershipOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Typography variant="h6" color="primary">
      Membership Details
    </Typography>
  </DialogTitle>
  <DialogContent dividers>
    {selectedMembership && (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Personal Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              <strong>Personal Information</strong>
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Member ID:
            </Typography>
            <Typography variant="body1">{selectedMembership.MemberID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Full Name:
            </Typography>
            <Typography variant="body1">{selectedMembership.FullName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Email:
            </Typography>
            <Typography variant="body1">{selectedMembership.Email}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Phone:
            </Typography>
            <Typography variant="body1">{selectedMembership.Phone}</Typography>
          </Grid>
          <Divider sx={{ my: 1 }} />

          {/* Membership Information Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              <strong>Membership Information</strong>
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Plan ID:
            </Typography>
            <Typography variant="body1">{selectedMembership.PlanID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Membership Card #:
            </Typography>
            <Typography variant="body1">{selectedMembership.MembershipCardNumber}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Card Issued?:
            </Typography>
            <Typography variant="body1">
              {selectedMembership.MembershipCardIssued ? "Yes" : "No"}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Status:
            </Typography>
            <Typography variant="body1">{selectedMembership.MembershipStatus}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Start Date:
            </Typography>
            <Typography variant="body1">{selectedMembership.MembershipStartDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              End Date:
            </Typography>
            <Typography variant="body1">{selectedMembership.MembershipEndDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Biometrics:
            </Typography>
            <Typography variant="body1">{selectedMembership.Biometrics}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Free Sessions:
            </Typography>
            <Typography variant="body1">{selectedMembership.FreeSessions}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Notes:
            </Typography>
            <Typography variant="body1">{selectedMembership.Notes}</Typography>
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewMembershipOpen(false)}
      variant="contained"
      color="primary"
    >
      Close
    </Button>
  </DialogActions>
</Dialog>


      {/* ========== EDIT MEMBERSHIP DIALOG ========== */}
      <Dialog open={isEditMembershipOpen} onClose={() => setEditMembershipOpen(false)}>
        <DialogTitle>Edit Membership</DialogTitle>
        <DialogContent>
          {selectedMembership && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                value={selectedMembership.FullName}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                value={selectedMembership.Email}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, Email: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Phone"
                value={selectedMembership.Phone}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, Phone: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Plan ID"
                value={selectedMembership.PlanID}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, PlanID: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Membership Card Number"
                value={selectedMembership.MembershipCardNumber}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MembershipCardNumber: e.target.value,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Card Issued? (true/false)"
                value={String(selectedMembership.MembershipCardIssued)}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    MembershipCardIssued: e.target.value === "true",
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Status"
                value={selectedMembership.MembershipStatus}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, MembershipStatus: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Start Date"
                value={selectedMembership.MembershipStartDate}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, MembershipStartDate: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="End Date"
                value={selectedMembership.MembershipEndDate}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, MembershipEndDate: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Biometrics"
                value={selectedMembership.Biometrics}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, Biometrics: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Free Sessions"
                type="number"
                value={selectedMembership.FreeSessions}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({
                    ...prev,
                    FreeSessions: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Notes"
                value={selectedMembership.Notes}
                onChange={(e) =>
                  setSelectedMembership((prev) => ({ ...prev, Notes: e.target.value }))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMembershipOpen(false)}>Cancel</Button>
          <Button onClick={handleEditMembershipSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== FREEZE DIALOG ========== */}
      <Dialog open={isFreezeModalOpen} onClose={() => setFreezeModalOpen(false)}>
        <DialogTitle>Freeze Membership</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            name="FreezeStartDate"
            value={freezeForm.FreezeStartDate}
            onChange={handleFreezeFormChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="End Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            name="FreezeEndDate"
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
          <TextField
            fullWidth
            margin="normal"
            label="Notes (Optional)"
            name="Notes"
            value={freezeForm.Notes}
            onChange={handleFreezeFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreezeModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitFreeze} variant="contained" color="primary">
            Submit Freeze
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== VIEW FREEZE DIALOG ========== */}
      <Dialog
  open={isViewFreezeOpen}
  onClose={() => setViewFreezeOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Typography variant="h6" color="primary">
      Freeze Details
    </Typography>
  </DialogTitle>
  <DialogContent dividers>
    {selectedFreeze && (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Freeze Information Section */}
          <Grid item xs={12}>
            
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Freeze ID:
            </Typography>
            <Typography variant="body1">{selectedFreeze.FreezeID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Member ID:
            </Typography>
            <Typography variant="body1">{selectedFreeze.MemberID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Start Date:
            </Typography>
            <Typography variant="body1">{selectedFreeze.FreezeStartDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              End Date:
            </Typography>
            <Typography variant="body1">{selectedFreeze.FreezeEndDate}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Reason:
            </Typography>
            <Typography variant="body1">{selectedFreeze.Reason}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Approval Status:
            </Typography>
            <Typography variant="body1">{selectedFreeze.ApprovalStatus}</Typography>
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewFreezeOpen(false)}
      variant="contained"
      color="primary"
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* ========== EDIT FREEZE DIALOG ========== */}
      <Dialog open={isEditFreezeOpen} onClose={() => setEditFreezeOpen(false)}>
        <DialogTitle>Edit Freeze</DialogTitle>
        <DialogContent>
          {selectedFreeze && (
            <>
              <TextField fullWidth margin="normal" label="FreezeID" disabled value={selectedFreeze.FreezeID} />
              <TextField
                fullWidth
                margin="normal"
                label="MemberID"
                value={selectedFreeze.MemberID}
                onChange={(e) =>
                  setSelectedFreeze((prev) => ({ ...prev, MemberID: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Freeze Start Date"
                value={selectedFreeze.FreezeStartDate}
                onChange={(e) =>
                  setSelectedFreeze((prev) => ({ ...prev, FreezeStartDate: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Freeze End Date"
                value={selectedFreeze.FreezeEndDate}
                onChange={(e) =>
                  setSelectedFreeze((prev) => ({ ...prev, FreezeEndDate: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Reason"
                value={selectedFreeze.Reason}
                onChange={(e) =>
                  setSelectedFreeze((prev) => ({ ...prev, Reason: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Approval Status"
                value={selectedFreeze.ApprovalStatus}
                onChange={(e) =>
                  setSelectedFreeze((prev) => ({ ...prev, ApprovalStatus: e.target.value }))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFreezeOpen(false)}>Cancel</Button>
          <Button onClick={handleEditFreezeSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== VIEW RENEWAL DIALOG ========== */}
      <Dialog
  open={isViewRenewalOpen}
  onClose={() => setViewRenewalOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Typography variant="h6" color="primary">
      Renewal Details
    </Typography>
  </DialogTitle>
  <DialogContent dividers>
    {selectedRenewal && (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Renewal Information Section */}
          <Grid item xs={12}>
          
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Renewal ID:
            </Typography>
            <Typography variant="body1">{selectedRenewal.RenewalID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Member ID:
            </Typography>
            <Typography variant="body1">{selectedRenewal.MemberID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Renewal Date:
            </Typography>
            <Typography variant="body1">{selectedRenewal.RenewalDate}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Plan ID:
            </Typography>
            <Typography variant="body1">{selectedRenewal.PlanID}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Renewal Amount:
            </Typography>
            <Typography variant="body1">${selectedRenewal.RenewalAmount}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Processed By:
            </Typography>
            <Typography variant="body1">{selectedRenewal.ProcessedBy}</Typography>
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewRenewalOpen(false)}
      variant="contained"
      color="primary"
    >
      Close
    </Button>
  </DialogActions>
</Dialog>


      {/* ========== EDIT RENEWAL DIALOG ========== */}
      <Dialog open={isEditRenewalOpen} onClose={() => setEditRenewalOpen(false)}>
        <DialogTitle>Edit Renewal</DialogTitle>
        <DialogContent>
          {selectedRenewal && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="RenewalID"
                disabled
                value={selectedRenewal.RenewalID}
              />
              <TextField
                fullWidth
                margin="normal"
                label="MemberID"
                value={selectedRenewal.MemberID}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, MemberID: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Renewal Date"
                value={selectedRenewal.RenewalDate}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, RenewalDate: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="PlanID"
                value={selectedRenewal.PlanID}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, PlanID: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Renewal Amount"
                type="number"
                value={selectedRenewal.RenewalAmount}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, RenewalAmount: parseFloat(e.target.value) || 0 }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Processed By"
                value={selectedRenewal.ProcessedBy}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({ ...prev, ProcessedBy: e.target.value }))
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

      {/* ========== VIEW LOG DIALOG ========== */}
      <Dialog open={isViewLogOpen} onClose={() => setViewLogOpen(false)}>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <>
              <Typography gutterBottom>
                <strong>LogID:</strong> {selectedLog.LogID}
              </Typography>
              <Typography gutterBottom>
                <strong>UserID:</strong> {selectedLog.UserID}
              </Typography>
              <Typography gutterBottom>
                <strong>Action:</strong> {selectedLog.Action}
              </Typography>
              <Typography gutterBottom>
                <strong>Timestamp:</strong> {selectedLog.Timestamp}
              </Typography>
              <Typography gutterBottom>
                <strong>Details:</strong> {selectedLog.Details}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewLogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
