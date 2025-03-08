import React, { useState, useEffect, useRef } from "react";
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
  InputAdornment,
  Stack,
  IconButton,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import '@fontsource/roboto';
import Webcam from "react-webcam";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import GroupsIcon from "@mui/icons-material/Groups";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import WarningIcon from "@mui/icons-material/Warning";
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import NotesIcon from "@mui/icons-material/Notes";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DescriptionIcon from '@mui/icons-material/Description';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { format } from "date-fns";

import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

/* Layouts */
import AddNewMemberLayout from "../../Layouts/AddNewMemberLayout";
import ManagePlansLayout from "../../Layouts/ManagePlansLayout";

export default function MembershipManagement() {
  const theme = useTheme();

  // ─────────────────────────────────────────────────────────
  // Staff: holds logged-in staff details (StaffID, BranchID, etc.)
  const [staff, setStaff] = useState(null);

  // Date filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Membership data
  const [membershipRecords, setMembershipRecords] = useState([]);
  const [walkInRecords, setWalkInRecords] = useState([]);
  const [renewalRecords, setRenewalRecords] = useState([]);
  const [freezeRecords, setFreezeRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Plans, statuses, branches
  const [plans, setPlans] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [branches, setBranches] = useState({});

  // Searching / filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  // For staff, default branch filter will be set to the staff's branch once loaded.
  const [branchFilter, setBranchFilter] = useState("all");
  const [validationErrors, setValidationErrors] = useState({});

  // Sub-tab for memberships
  const [membershipSubTab, setMembershipSubTab] = useState(0);
  const membershipFilters = [
    { label: "All" },
    { label: "Expired" },
    { label: "Expiring Soon" },
    { label: "Active" },
    { label: "Frozen" },
    { label: "On Hold" },
    { label: "Terminated" },
    { label: "New" },
  ];

  // Modals & Dialogs
  const [isAddMembershipLayoutVisible, setAddMembershipLayoutVisible] = useState(false);
  const [isManagePlansOpen, setManagePlansOpen] = useState(false);
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [isAddMonthlyClientOpen, setAddMonthlyClientOpen] = useState(false);
  const [isViewMembershipOpen, setViewMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setEditMembershipOpen] = useState(false);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
  const [isViewFreezeOpen, setViewFreezeOpen] = useState(false);
  const [isEditFreezeOpen, setEditFreezeOpen] = useState(false);
  const [isUnfreezeDialogOpen, setUnfreezeDialogOpen] = useState(false);
  const [isViewRenewalOpen, setViewRenewalOpen] = useState(false);
  const [isEditRenewalOpen, setEditRenewalOpen] = useState(false);
  const [isAddRenewalOpen, setAddRenewalOpen] = useState(false);
  const [isViewMonthlyClientOpen, setViewMonthlyClientOpen] = useState(false);
  const [isEditMonthlyClientOpen, setEditMonthlyClientOpen] = useState(false);

  const [selectedRenewal, setSelectedRenewal] = useState(null);

const [isViewLogOpen, setViewLogOpen] = useState(false);

const [filterExpired, setFilterExpired] = useState(false);
const [filterExpiring, setFilterExpiring] = useState(false);

  // Data for renewals, walk-ins, monthly clients, logs, etc.
  const [newRenewal, setNewRenewal] = useState({
    MemberID: "",
    NewEndDate: "",
    RenewalAmount: 0,
    PaymentFor: '["Membership Renewal"]',
  });
  const [renewalPayments, setRenewalPayments] = useState([{ PaymentMethod: "", PaymentAmount: "" }]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    PaymentID: "",
    PaymentMethod: "",
    PaymentAmount: 350,
    Notes: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [monthlyClientRecords, setMonthlyClientRecords] = useState([]);
  const [newMonthlyClient, setNewMonthlyClient] = useState({
    FullName: "",
    Email: "",
    Phone: "",
    StartDate: "",
    BranchID: "",
    MonthsToPayUpfront: 1,
  });
  const [monthlyClientPayments, setMonthlyClientPayments] = useState([{ PaymentMethod: "", PaymentAmount: "" }]);
  const [selectedMonthlyClient, setSelectedMonthlyClient] = useState(null);
  const [memberVisitLogs, setMemberVisitLogs] = useState([]);
  const [monthlyClientAttendances, setMonthlyClientAttendances] = useState([]);

  // Freeze
  const [freezeForm, setFreezeForm] = useState({
    MemberID: "",
    FreezeStartDate: "",
    FreezeEndDate: "",
    Reason: "",
  });
  const [selectedFreeze, setSelectedFreeze] = useState(null);
  const [freezeToUnfreeze, setFreezeToUnfreeze] = useState(null);

  // Delete Dialog info
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ type: "", id: null });

  // Snackbars
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  // Webcam
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [openWebcam, setOpenWebcam] = useState(false);

  // Export variables
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFilename, setCsvFilename] = useState("export.csv");
  // ─────────────────────────────────────────────────────────
  // Fetch logged-in staff details
  useEffect(() => {
    axios.get("/staff/get-logged-in-staff")
      .then(res => {
        setStaff(res.data);
        // For staff view, set branchFilter automatically
        setBranchFilter(String(res.data.BranchID));
      })
      .catch(err => console.error("Error fetching staff details:", err));
  }, []);

  // Once staff data is available, fetch membership, walk-ins, renewals, freezes, logs, etc.
  useEffect(() => {
    if (!staff) return; // Wait until staff is loaded
  
    axios.get("/membership/members", { params: { branchId: staff.BranchID } })
    .then((res) => {
      const data = res.data;
      setMembershipRecords(data.members || []);
      setWalkInRecords(data.walkIns || []);
      setRenewalRecords(data.renewals || []);
      setFreezeRecords(data.freezes || []);
      setActivityLogs(data.logs || []);
    })
    .catch((err) => console.error("Error fetching members:", err));

    axios
      .get("/membership/plans", { params: { branchId: staff.BranchID } })
      .then((res) => setPlans(res.data || []))
      .catch((err) => console.error("Error fetching plans:", err));

    axios
      .get("/membership/statuses", { params: { branchId: staff.BranchID } })
      .then((res) => setMemberStatuses(res.data || []))
      .catch((err) => console.error("Error fetching statuses:", err));

    axios
      .get("/operations/walk-ins", { params: { branchId: staff.BranchID } })
      .then((res) => setWalkInRecords(res.data))
      .catch((err) => console.error("Error fetching walk-ins:", err));

    // Fetch Monthly Clients (staff endpoint)
    axios
      .get("/monthly-clients", { params: { branchId: staff.BranchID } })
      .then((res) => {
        setMonthlyClientRecords(res.data || []);
      })
      .catch((err) => console.error("Error fetching monthly clients:", err));

    // Fetch branches for display (using owner endpoint if needed)
    axios
      .get("/owner/branches")
      .then((res) => {
        const branchArray = res.data.branches || [];
        const branchMap = {};
        branchArray.forEach((branch) => {
          branchMap[branch.BranchID] = branch.BranchName;
        });
        setBranches(branchMap);
      })
      .catch((err) => console.error("Error fetching branches:", err));

    // Auto-refresh membershipRecords every 100 seconds
    const intervalId = setInterval(() => {
      axios
        .get("/membership/members", { params: { branchId: staff.BranchID } })
        .then((res) => setMembershipRecords(res.data.members || []))
        .catch(console.error);
    }, 100000);

    // For additional tabs (e.g., Member Visit Logs, Monthly Client Attendance)
    // you can add additional effects below.
    return () => clearInterval(intervalId);
  }, [staff]);

  function getMembershipRecordsByBranch() {
    // If "all" is selected, or if backend filtering is working,
    // simply return the membershipRecords.
    if (branchFilter === "all") return membershipRecords;
    return membershipRecords.filter((m) => {
      const memberBranch = (m.StartedBranchID || m.BranchID || "").toString();
      return memberBranch === branchFilter;
    });
  }
  

  useEffect(() => {
    const fetchDataForTab = async () => {
      try {
        if (activeTab === 5) {
          // Member Visit Logs => GET /operations/visits
          // (assuming your route is /operations/visits -> indexVisits)
          const res = await axios.get("/operations/visits");
          // returns { visits: [ ... ] }
          setMemberVisitLogs(res.data.visits || []);
        } else if (activeTab === 6) {
          // Monthly Client Attendance => you need an endpoint that returns
          // either a global list or you can fetch them per client. Example:
          const res = await axios.get("/monthly-clients/attendances-all");
          // or a custom route you wrote => setMonthlyClientAttendances(res.data.attendances || []);
          setMonthlyClientAttendances(res.data.attendances || []);
        }
      } catch (error) {
        console.error("Error fetching tab data:", error);
      }
    };
  
    fetchDataForTab();
  }, [activeTab]);
  
  

  // ─────────────────────────────────────────────────────────
  // Snack helper
  // ─────────────────────────────────────────────────────────
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Format helpers
  // ─────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    return `₱${parseInt(value).toLocaleString("en-PH")}`;
  };

  // ─────────────────────────────────────────────────────────
  // Photo: Webcam + Upload
  // ─────────────────────────────────────────────────────────
  const dataURLToFile = (dataURL, filename) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setSelectedMembership((prev) => ({
        ...prev,
        PhotoFile: dataURLToFile(imageSrc, "captured_photo.jpg"),
      }));
      setOpenWebcam(false);
    }
  };
  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedMembership((prev) => ({
        ...prev,
        PhotoFile: e.target.files[0],
      }));
      setCapturedImage(null);
    }
  };
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  // ─────────────────────────────────────────────────────────
  // Tab and search handlers
  // ─────────────────────────────────────────────────────────
  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
    if (newValue !== 0) {
      setFilterExpiring(false);
      setFilterExpired(false);
    }
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // ─────────────────────────────────────────────────────────
  // Basic getStatusNameByID
  // ─────────────────────────────────────────────────────────
  function getStatusNameByID(memberStatusID) {
    const st = memberStatuses.find((s) => s.MemberStatusID === memberStatusID);
    return st ? st.StatusName : "Unknown";
  }

  // ─────────────────────────────────────────────────────────
  // Date Range Filter Helper
  // ─────────────────────────────────────────────────────────
  function filterByDateRange(recordsArray, getDateField) {
    if (!startDate && !endDate) return recordsArray; // no filter
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return recordsArray.filter((rec) => {
      const dateValue = getDateField(rec);
      if (!dateValue) return false;
      const recDate = new Date(dateValue);

      if (start && end) {
        return recDate >= start && recDate <= end;
      }
      if (start && !end) {
        return recDate >= start;
      }
      if (!start && end) {
        return recDate <= end;
      }
      return true;
    });
  }
  // ─────────────────────────────────────────────────────────
// MEMBERSHIP CRUD (Staffified)
// ─────────────────────────────────────────────────────────
function handleNewMemberCreated(resData) {
  const memberObj = resData.member;
  setMembershipRecords((prev) => [memberObj, ...prev]);
  showSuccessMessage("New member added successfully!");
}

function handleViewMembership(row) {
  setSelectedMembership(row);
  setViewMembershipOpen(true);
}

function handleEditMembership(row) {
  setSelectedMembership({ ...row });
  setEditMembershipOpen(true);
}

async function handleEditMembershipSubmit() {
  if (!selectedMembership) return;
  try {
    const memberID = selectedMembership.MemberID;
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
    // Automatically attach the staff's branch
    if (staff) {
      formData.append("BranchID", staff.BranchID);
    }
    if (selectedMembership.PhotoFile) {
      formData.append("PhotoFile", selectedMembership.PhotoFile);
    }

    await axios.post(`/staff/membership/members/${memberID}`, formData, {
      params: { _method: "PUT" },
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Update local state
    setMembershipRecords((prev) =>
      prev.map((m) => (m.MemberID === memberID ? selectedMembership : m))
    );
    setEditMembershipOpen(false);
    showSuccessMessage("Membership updated!");
  } catch (err) {
    console.error("Error updating membership:", err);
    alert("Update error. Check console for details.");
  }
}

async function handleDeleteMembership(memberID) {
  try {
    await axios.delete(`/staff/membership/members/${memberID}`);
    setMembershipRecords((prev) => prev.filter((m) => m.MemberID !== memberID));
    showSuccessMessage("Member deleted!");
  } catch (err) {
    console.error("Error deleting membership:", err);
    alert("Delete error. Check console for details.");
  }
}

// ─────────────────────────────────────────────────────────
// WALK‑IN CRUD (Staffified)
// ─────────────────────────────────────────────────────────
const handleOpenAddWalkIn = () => {
  setNewWalkIn({
    FullName: "",
    VisitDate: "",
    PaymentID: "",
    PaymentMethod: "",
    PaymentAmount: 350,
    Notes: "",
  });
  setAddWalkInOpen(true);
};

const handleCloseWalkInDialog = () => {
  setAddWalkInOpen(false);
  setNewWalkIn({
    FullName: "",
    VisitDate: "",
    PaymentID: "",
    PaymentMethod: "",
    PaymentAmount: 350,
    Notes: "",
  });
};

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
    await axios.put(`/staff/operations/walk-ins/${walkInID}`, {
      FullName: selectedWalkIn.FullName,
      VisitDate: selectedWalkIn.VisitDate,
      PaymentID: selectedWalkIn.PaymentID,
      PaymentMethod: selectedWalkIn.PaymentMethod,
      AmountPaid: selectedWalkIn.AmountPaid,
      Notes: selectedWalkIn.Notes,
      // Optionally add BranchID/StaffID if needed:
      BranchID: staff ? staff.BranchID : "",
      StaffID: staff ? staff.StaffID : "",
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
  try {
    await axios.delete(`/staff/operations/walk-ins/${walkInID}`);
    setWalkInRecords((prev) => prev.filter((w) => w.WalkInID !== walkInID));
    showSuccessMessage("Walk-In deleted!");
  } catch (err) {
    console.error("Error deleting walk-in:", err);
    alert("Delete error. Check console for details.");
  }
}

function handleAddWalkInChange(e) {
  const { name, value } = e.target;
  setNewWalkIn((prev) => ({ ...prev, [name]: value }));
}

const validateWalkIn = () => {
  let errors = {};
  if (!newWalkIn.FullName.trim()) {
    errors.FullName = "Full Name is required.";
  }
  if (!newWalkIn.VisitDate) {
    errors.VisitDate = "Visit Date is required.";
  }
  if (!newWalkIn.PaymentMethod) {
    errors.PaymentMethod = "Please select a Payment Method.";
  }
  if (!newWalkIn.PaymentAmount || newWalkIn.PaymentAmount <= 0) {
    errors.PaymentAmount = "Payment Amount must be greater than zero.";
  }
  return errors;
};

const handleOpenConfirmation = () => {
  const errors = validateWalkIn();
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  setValidationErrors({});
  setOpenConfirmation(true);
};

const handleAddWalkIn = async () => {
  const errors = validateWalkIn();
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  try {
    const res = await axios.post(`/operations/walk-ins`, {
      FullName: newWalkIn.FullName,
      VisitDate: newWalkIn.VisitDate,
      PaymentID: newWalkIn.PaymentID,
      PaymentMethod: newWalkIn.PaymentMethod,
      PaymentAmount: newWalkIn.PaymentAmount || 350,
      PaymentFor: JSON.stringify(["Walk-In Payment"]),
      Notes: newWalkIn.Notes,
      // Automatically attach staff BranchID and StaffID
      BranchID: staff ? staff.BranchID : "",
      StaffID: staff ? staff.StaffID : "",
    });
    const newWalkInRecord = res.data;
    setWalkInRecords((prev) => [newWalkInRecord, ...prev]);
    setNewWalkIn({
      FullName: "",
      VisitDate: "",
      PaymentID: "",
      PaymentMethod: "",
      PaymentAmount: 350,
      Notes: "",
    });
    setValidationErrors({});
    setAddWalkInOpen(false);
    showSuccessMessage("Walk-In created successfully!");
  } catch (err) {
    console.error("Error creating walk-in:", err);
    alert("Create error. Check console for details.");
  }
};


// ─────────────────────────────────────────────────────────
// FREEZE CRUD (Staffified)
// ─────────────────────────────────────────────────────────
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
    // Optionally, you can add the staff's BranchID here
    const payload = { ...freezeForm };
    if (staff) {
      payload.BranchID = staff.BranchID;
    }
    const res = await axios.post("/staff/membership/freezes", payload);
    const newFreeze = res.data;
    setFreezeRecords((prev) => [newFreeze, ...prev]);
    // Refresh membership list using staff endpoint
    const refreshed = await axios.get("/staff/membership/members", { params: { branchId: staff.BranchID } });
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
    const res = await axios.put(`/staff/membership/freezes/${freezeID}`, {
      FreezeStartDate: selectedFreeze.FreezeStartDate,
      FreezeEndDate: selectedFreeze.FreezeEndDate,
      Reason: selectedFreeze.Reason,
      // Optionally include BranchID if required
      BranchID: staff ? staff.BranchID : "",
    });
    const updatedFreeze = res.data;
    setFreezeRecords((prev) =>
      prev.map((f) => (f.FreezeID === freezeID ? updatedFreeze : f))
    );
    setEditFreezeOpen(false);
    showSuccessMessage("Freeze updated successfully!");
  } catch (err) {
    console.error("Error updating freeze:", err);
    alert("Error. Check console for details.");
  }
}

const openUnfreezeDialog = (type, freezeID) => {
  if (type === "freeze") {
    setFreezeToUnfreeze(freezeID);
    setUnfreezeDialogOpen(true);
  }
};

const handleUnfreezeMember = async () => {
  if (!freezeToUnfreeze) return;
  try {
    await axios.delete(`/staff/membership/freezes/${freezeToUnfreeze}`);
    setFreezeRecords((prev) => prev.filter((f) => f.FreezeID !== freezeToUnfreeze));
    const refreshed = await axios.get("/staff/membership/members", { params: { branchId: staff.BranchID } });
    setMembershipRecords(refreshed.data.members || []);
    setUnfreezeDialogOpen(false);
    showSuccessMessage("Member successfully unfrozen!");
  } catch (err) {
    console.error("Error unfreezing member:", err);
    alert("Error. Check console for details.");
  }
};

async function handleDeleteFreeze(freezeID) {
  try {
    await axios.delete(`/staff/membership/freezes/${freezeID}`);
    setFreezeRecords((prev) => prev.filter((f) => f.FreezeID !== freezeID));
    showSuccessMessage("Freeze deleted successfully!");
  } catch (err) {
    console.error("Error deleting freeze:", err);
    alert("Error. Check console for details.");
  }
}

// ─────────────────────────────────────────────────────────
// RENEWAL CRUD (Staffified)
// ─────────────────────────────────────────────────────────
const getMemberByID = (memberID) =>
  membershipRecords.find((m) => m.MemberID === memberID);

const getPlanPriceForMember = (member) => {
  if (!member?.PlanID) return 0;
  const plan = plans.find((p) => p.PlanID === member.PlanID);
  return plan?.Price || 0;
};

function monthsBetweenDates(start, end) {
  if (end <= start) return 0;
  const yearDiff = end.getFullYear() - start.getFullYear();
  let monthDiff = end.getMonth() - start.getMonth();
  let totalMonths = yearDiff * 12 + monthDiff;
  if (totalMonths < 0) totalMonths = 0;
  return totalMonths;
}

function getRenewalStartDate(member) {
  if (!member) return new Date();
  if (member.MemberStatusID === 4 || member.MemberStatusID === 5) {
    // Terminated or Expired => start from today
    return new Date();
  } else {
    if (!member.MembershipEndDate) return new Date();
    return new Date(member.MembershipEndDate);
  }
}

function handleOpenRenewalDialog(memberRow) {
  setNewRenewal({
    MemberID: memberRow.MemberID,
    NewEndDate: "",
    RenewalAmount: 0,
    PaymentFor: '["Membership Renewal"]',
  });
  setRenewalPayments([{ PaymentMethod: "", PaymentAmount: "" }]);
  setValidationErrors({});
  setAddRenewalOpen(true);
}

// Auto-calculate renewal amount when NewEndDate changes
useEffect(() => {
  const member = getMemberByID(newRenewal.MemberID);
  if (!member) return;
  if (!newRenewal.NewEndDate) return;

  const dtChosen = new Date(newRenewal.NewEndDate);
  if (isNaN(dtChosen.getTime())) return;

  const dtStart = getRenewalStartDate(member);
  const diffMonths = monthsBetweenDates(dtStart, dtChosen);
  const monthlyPrice = getPlanPriceForMember(member);
  const total = diffMonths * monthlyPrice;

  setNewRenewal((prev) => ({
    ...prev,
    RenewalAmount: total,
  }));
}, [newRenewal.MemberID, newRenewal.NewEndDate]);

const validateRenewal = () => {
  let errors = {};
  if (!newRenewal.NewEndDate) {
    errors.NewEndDate = "Please select the new membership end date.";
  }
  if (!newRenewal.RenewalAmount || Number(newRenewal.RenewalAmount) <= 0) {
    errors.RenewalAmount = "Please enter a valid renewal amount.";
  }
  if (!renewalPayments.length) {
    errors.Payments = "At least one payment row is required.";
  } else {
    renewalPayments.forEach((p, idx) => {
      if (!p.PaymentMethod) {
        errors[`Payments.${idx}.PaymentMethod`] = "Method is required.";
      }
      if (!p.PaymentAmount || Number(p.PaymentAmount) <= 0) {
        errors[`Payments.${idx}.PaymentAmount`] = "Must be > 0";
      }
    });
  }
  const totalPaid = renewalPayments.reduce(
    (sum, p) => sum + Number(p.PaymentAmount || 0),
    0
  );
  if (totalPaid < newRenewal.RenewalAmount) {
    errors.totalPaid = "The sum of payments is less than the renewal amount.";
  }
  return errors;
};

async function handleAddRenewal() {
  const errors = validateRenewal();
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors);
    return;
  }
  try {
    const body = {
      MemberID: newRenewal.MemberID,
      NewEndDate: newRenewal.NewEndDate,
      RenewalAmount: Number(newRenewal.RenewalAmount),
      PaymentFor: newRenewal.PaymentFor,
      Payments: renewalPayments,
      // Optionally attach branch and staff info if your backend requires them
      BranchID: staff ? staff.BranchID : "",
      StaffID: staff ? staff.StaffID : "",
    };
    const res = await axios.post("/staff/membership/renewals", body);
    const { renewal, member } = res.data;

    setRenewalRecords((prev) => [renewal, ...prev]);
    setMembershipRecords((prev) =>
      prev.map((m) => (m.MemberID === member.MemberID ? member : m))
    );

    setNewRenewal({
      MemberID: "",
      NewEndDate: "",
      RenewalAmount: 0,
      PaymentFor: '["Membership Renewal"]',
    });
    setRenewalPayments([{ PaymentMethod: "", PaymentAmount: "" }]);
    setValidationErrors({});
    setAddRenewalOpen(false);
    showSuccessMessage("Renewal created successfully!");
  } catch (err) {
    console.error("Error creating renewal:", err);
    alert("Create error. Check console for details.");
  }
}

function handleViewRenewal(row) {
  setSelectedRenewal(row);
  setViewRenewalOpen(true);
}

function handleEditRenewal(row) {
  setSelectedRenewal({ ...row });
  setEditRenewalOpen(true);
}

function handleEditRenewalSubmit() {
  // Implement update if you have an endpoint
  setEditRenewalOpen(false);
}

async function handleDeleteRenewal(renewalID) {
  try {
    await axios.delete(`/staff/membership/renewals/${renewalID}`);
    setRenewalRecords((prev) => prev.filter((r) => r.RenewalID !== renewalID));
    showSuccessMessage("Renewal deleted!");
  } catch (err) {
    console.error("Error deleting renewal:", err);
    alert("Delete error. Check console for details.");
  }
}

  // ─────────────────────────────────────────────────────────
  // LOGS
  // ─────────────────────────────────────────────────────────
  function handleViewLog(row) {
    setSelectedLog(row);
    setViewLogOpen(true);
  }
  async function handleDeleteLog(logID) {
    // If needed, implement an endpoint for logs
  }

  // ─────────────────────────────────────────────────────────
// MONTHLY CLIENTS: Add / View / Edit / Delete (Staffified)
// ─────────────────────────────────────────────────────────
async function handleAddMonthlyClientSubmit() {
  try {
    if (!newMonthlyClient.FullName.trim()) {
      alert("Full Name is required.");
      return;
    }
    // Build request body and automatically attach the staff's BranchID
    const payload = {
      ...newMonthlyClient,
      BranchID: staff ? staff.BranchID : newMonthlyClient.BranchID,
      Payments: monthlyClientPayments.map((p) => ({
        PaymentMethod: p.PaymentMethod,
        PaymentAmount: Number(p.PaymentAmount) || 0,
      })),
    };

    const res = await axios.post("/staff/monthly-clients", payload);
    const created = res.data.monthlyClient || res.data;

    setMonthlyClientRecords((prev) => [created, ...prev]);
    // Reset form; automatically set BranchID for staff view
    setNewMonthlyClient({
      FullName: "",
      Email: "",
      Phone: "",
      StartDate: "",
      BranchID: staff ? staff.BranchID : "",
      MonthsToPayUpfront: 1,
    });
    setMonthlyClientPayments([{ PaymentMethod: "", PaymentAmount: "" }]);
    setAddMonthlyClientOpen(false);

    showSuccessMessage("Monthly client created successfully!");
  } catch (err) {
    console.error("Error creating monthly client:", err);
    alert("Error creating monthly client. Check console for details.");
  }
}

function handleViewMonthlyClient(row) {
  setSelectedMonthlyClient(row);
  setViewMonthlyClientOpen(true);
}

function handleEditMonthlyClient(row) {
  setSelectedMonthlyClient({ ...row });
  setEditMonthlyClientOpen(true);
}

async function handleEditMonthlyClientSubmit() {
  if (!selectedMonthlyClient) return;
  try {
    const { MonthlyClientID } = selectedMonthlyClient;
    // Build payload and attach the staff's BranchID automatically
    const payload = {
      ...selectedMonthlyClient,
      BranchID: staff ? staff.BranchID : selectedMonthlyClient.BranchID,
    };

    await axios.put(`/staff/monthly-clients/${MonthlyClientID}`, payload);

    setMonthlyClientRecords((prev) =>
      prev.map((c) =>
        c.MonthlyClientID === MonthlyClientID ? selectedMonthlyClient : c
      )
    );
    setEditMonthlyClientOpen(false);
    showSuccessMessage("Monthly Client updated!");
  } catch (err) {
    console.error("Error updating monthly client:", err);
    alert("Error updating monthly client. Check console for details.");
  }
}

async function handleDeleteMonthlyClient(clientID) {
  try {
    await axios.delete(`/staff/monthly-clients/${clientID}`);
    setMonthlyClientRecords((prev) =>
      prev.filter((c) => c.MonthlyClientID !== clientID)
    );
    showSuccessMessage("Monthly Client deleted!");
  } catch (err) {
    console.error("Error deleting monthly client:", err);
    alert("Delete error. Check console for details.");
  }
}

// ─────────────────────────────────────────────────────────
// 2) HELPER: Filter walk‑ins by branch (staffified)
// ─────────────────────────────────────────────────────────
function getWalkInRecordsByBranch() {
  if (branchFilter === "all") return walkInRecords;
  // Walk‑in records are assumed to include a BranchID field.
  return walkInRecords.filter((w) => String(w.BranchID) === branchFilter);
}

// ─────────────────────────────────────────────────────────
// Key Metrics (staffified, branch‑filtered)
// ─────────────────────────────────────────────────────────
const filteredMemberships = getMembershipRecordsByBranch();
const filteredWalkIns = getWalkInRecordsByBranch();

const totalMembers = filteredMemberships.length;

// "Today's Walk‑Ins"
function getTodayWalkIns() {
  const todayDate = new Date().toISOString().split("T")[0];
  return filteredWalkIns.filter((walkIn) => {
    const walkInDate = new Date(walkIn.VisitDate).toISOString().split("T")[0];
    return walkInDate === todayDate;
  }).length;
}

// Expired Memberships
const expiredMemberships = filteredMemberships.filter(
  (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired"
).length;

// Expiring Soon (within the next 7 days)
const todayDate = new Date();
const next7 = new Date();
next7.setDate(todayDate.getDate() + 7);
const upcomingExpirations = filteredMemberships.filter((m) => {
  if (!m?.MembershipEndDate) return false;
  const endDate = new Date(m.MembershipEndDate);
  return endDate > todayDate && endDate <= next7;
}).length;


  // ─────────────────────────────────────────────────────────
  // DataGrid Columns
  // ─────────────────────────────────────────────────────────
  const membershipColumns = [
    {
      field: "Branch",
      headerName: "Branch",
      width: 180,
      renderCell: (params) => {
        // Use the branch from StartedBranchID (or fallback to BranchID)
        const branchId = (params.row.StartedBranchID || params.row.BranchID || "").toString();
        return branches[branchId] || "—";
      },
    },
    {
      field: "FullName",
      headerName: "Full Name",
      width: 150,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "Email",
      headerName: "Email",
      width: 170,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "Phone",
      headerName: "Phone",
      width: 130,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "PlanID",
      headerName: "Plan",
      width: 180,
      renderCell: (params) => {
        const pid = Number(params.value);
        if (!pid) return "—";
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "—";
      },
    },
    {
      field: "MemberStatusID",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const msid = params.value;
        const stName = getStatusNameByID(msid) ?? "—";
        const getStatusColor = (status) => {
          switch (status?.toLowerCase()) {
            case "active":
              return "#4caf50";
            case "expired":
              return "#f44336";
            case "frozen":
              return "#2196f3";
            default:
              return "#757575";
          }
        };
        return (
          <span style={{ color: getStatusColor(stName), fontWeight: "bold" }}>
            {stName}
          </span>
        );
      },
    },
    {
      field: "MembershipEndDate",
      headerName: "Ends",
      width: 150,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : "—",
    },
    {
      field: "Notes",
      headerName: "Remarks",
      width: 150,
      renderCell: (params) => params.value ?? "—",
    },
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
              onClick={() => openDeleteDialog("membership", params.row.MemberID)}
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
    {
      field: "WalkInID",
      headerName: "Walk-In ID",
      width: 100,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "FullName",
      headerName: "Full Name",
      width: 160,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "VisitDate",
      headerName: "Visit Date",
      width: 300,
      renderCell: (params) =>
        params.value ? formatDateTime(params.value) : "—",
    },
    {
      field: "PaymentID",
      headerName: "Payment ID",
      width: 110,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "Notes",
      headerName: "Notes",
      width: 150,
      renderCell: (params) => params.value ?? "—",
    },
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
              onClick={() => openDeleteDialog("walkin", params.row.WalkInID)}
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
        if (!memberId) return "—";
        const member = membershipRecords.find((m) => m.MemberID === memberId);
        return member ? member.FullName : "—";
      },
    },
    {
      field: "RenewalDate",
      headerName: "Renewal Date",
      width: 150,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : "—",
    },
    {
      field: "PlanID",
      headerName: "Plan",
      width: 280,
      renderCell: (params) => {
        const pid = Number(params.value);
        if (!pid) return "—";
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "—";
      },
    },
    {
      field: "RenewalAmount",
      headerName: "Amount",
      width: 100,
      renderCell: (params) => formatCurrency(params.value),
    },
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
            onClick={() => openDeleteDialog("renewal", params.row.RenewalID)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];
  const freezeColumns = [
    {
      field: "StartedBranchID",
      headerName: "Branch",
      width: 180,
      renderCell: (params) => branches[params.value] || "—",
    },
    {
      field: "MemberName",
      headerName: "Member Name",
      width: 160,
      renderCell: (params) => {
        if (!params.row.MemberID) return "—";
        const member = membershipRecords.find((m) => m.MemberID === params.row.MemberID);
        return member ? member.FullName : "—";
      },
    },
    {
      field: "FreezeStartDate",
      headerName: "Start Date",
      width: 180,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : "—",
    },
    {
      field: "FreezeEndDate",
      headerName: "End Date",
      width: 180,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : "—",
    },
    {
      field: "Reason",
      headerName: "Reason",
      width: 150,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 240,
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
            onClick={() => openUnfreezeDialog("freeze", params.row.FreezeID)}
          >
            <AcUnitIcon fontSize="small" />
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
            onClick={() => openDeleteDialog("log", params.row.LogID)}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const monthlyClientColumns = [
    {
      field: "BranchID",
      headerName: "Branch",
      width: 150,
      renderCell: (params) => branches[params.value] || "—",
    },
    {
      field: "FullName",
      headerName: "Full Name",
      width: 200,
    },
    {
      field: "Email",
      headerName: "Email",
      width: 200,
    },
    {
      field: "Phone",
      headerName: "Phone",
      width: 130,
    },
    {
      field: "StartDate",
      headerName: "Start Date",
      width: 130,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
    {
      field: "EndDate",
      headerName: "End Date",
      width: 130,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
    {
      field: "IsActive",
      headerName: "Active?",
      width: 90,
      renderCell: (params) =>
        params.value ? (
          <span style={{ color: "#4caf50", fontWeight: "bold" }}>Yes</span>
        ) : (
          <span style={{ color: "#f44336", fontWeight: "bold" }}>No</span>
        ),
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 320,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
              onClick={() => handleViewMonthlyClient(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
              onClick={() => handleEditMonthlyClient(params.row)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
              onClick={() => openDeleteDialog("monthlyClient", params.row.MonthlyClientID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const memberVisitLogColumns = [
    { field: "MemberVisitID", headerName: "Visit ID", width: 120 },
    { field: "FullName", headerName: "Member Name", flex: 1 },
    { field: "VisitDate", headerName: "Date", width: 140,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString() },
    { field: "VisitTime", headerName: "Time", width: 120,
      valueFormatter: ({ value }) => new Date(`1970-01-01T${value}`).toLocaleTimeString() },
    { field: "CheckInMethod", headerName: "Check-in Method", width: 180 },
    { field: "BranchName", headerName: "Branch", width: 150 },
    { field: "Remarks", headerName: "Remarks", width: 250 },
  ];
  
  
  const monthlyAttendanceColumns = [
    { field: "MonthlyClientAttendanceID", headerName: "ID", width: 100 },
    { field: "FullName", headerName: "Monthly Client", width: 200 },
    { field: "VisitDateTime", headerName: "Visit Date & Time", width: 200,
      valueFormatter: ({ value }) => new Date(value).toLocaleString() },
    { field: "Notes", headerName: "Notes", width: 250 },
  ];


// ─────────────────────────────────────────────────────────
// getFilteredData (for the DataGrid below) (staffified)
// ─────────────────────────────────────────────────────────
function getFilteredData() {
  const applyBranchAndSearch = (arr) =>
    arr.filter((item) => {
      // Since branchFilter is preset in a staff view, this check ensures
      // that each item belongs to the staff's branch.
      const branchMatches =
        branchFilter === "all" ||
        String(item.StartedBranchID || item.BranchID) === branchFilter;
      const searchMatches = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm)
      );
      return branchMatches && searchMatches;
    });

  // MEMBERSHIPS (activeTab=0)
  if (activeTab === 0) {
    let data = membershipRecords.slice();
    switch (membershipSubTab) {
      case 1: // Expired
        data = data.filter(
          (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired"
        );
        break;
      case 2: // Expiring Soon
        const today = new Date();
        const next7 = new Date();
        next7.setDate(today.getDate() + 7);
        data = data.filter((m) => {
          if (!m.MembershipEndDate) return false;
          const endDate = new Date(m.MembershipEndDate);
          return endDate > today && endDate <= next7;
        });
        break;
      case 3: // Active
        data = data.filter((m) => m.MemberStatusID === 1);
        break;
      case 4: // Frozen
        data = data.filter((m) => m.MemberStatusID === 2);
        break;
      case 5: // On Hold
        data = data.filter((m) => m.MemberStatusID === 3);
        break;
      case 6: // Terminated
        data = data.filter((m) => m.MemberStatusID === 4);
        break;
      case 7: // New
        data = data.filter((m) => m.MemberStatusID === 6);
        break;
      default:
        break;
    }
    data = applyBranchAndSearch(data);
    data = filterByDateRange(data, (m) => m.MembershipStartDate);
    return data;
  }

  if (activeTab === 1) {
    // Walk-Ins
    let data = walkInRecords.slice();
    data = applyBranchAndSearch(data);
    return data;
  }
  if (activeTab === 2) {
    // Renewals: ensure branch info is visible for filtering
    let data = renewalRecords.map((r) => {
      const m = membershipRecords.find((mem) => mem.MemberID === r.MemberID);
      return {
        ...r,
        // Use branch information from membership record
        StartedBranchID: m?.StartedBranchID || m?.BranchID,
      };
    });
    data = applyBranchAndSearch(data);
    return data;
  }
  if (activeTab === 3) {
    // Freezes
    let data = freezeRecords.slice();
    data = applyBranchAndSearch(data);
    return data;
  }
  if (activeTab === 4) {
    // Monthly Clients
    let data = monthlyClientRecords.slice();
    data = applyBranchAndSearch(data);
    data = filterByDateRange(data, (c) => c.VisitDate);
    return data;
  }

  // Activity Logs fallback
  return activityLogs.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm)
    )
  );
}

// ─────────────────────────────────────────────────────────
// DataGrid rows + columns (staffified)
// ─────────────────────────────────────────────────────────
const rows = getFilteredData();
let columns = [];
if (activeTab === 0) columns = membershipColumns;
else if (activeTab === 1) columns = walkInColumns;
else if (activeTab === 2) columns = renewalColumns;
else if (activeTab === 3) columns = freezeColumns;
else if (activeTab === 4) columns = monthlyClientColumns;
else columns = logColumns;

const getRowId = (row) => {
  if (activeTab === 0) return row.MemberID;
  if (activeTab === 1) return row.WalkInID;
  if (activeTab === 2) return row.RenewalID;
  if (activeTab === 3) return row.FreezeID;
  if (activeTab === 4) return row.MonthlyClientID;
  if (activeTab === 5) return row.MemberVisitID;         // new
  if (activeTab === 6) return row.MonthlyClientAttendanceID; // new
  return row.LogID;
};

  // ─────────────────────────────────────────────────────────
  // Export logic
  // ─────────────────────────────────────────────────────────
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (e) => setExportAnchorEl(e.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);


  const handleExportCSV = () => {
    handleExportMenuClose();
    let headers = [];
    let data = [];
    let filename = "";

    // Different exports per tab
    if (activeTab === 0) {
      headers = [
        { label: "Member ID", key: "MemberID" },
        { label: "Full Name", key: "FullName" },
        { label: "Email", key: "Email" },
        { label: "Phone", key: "Phone" },
        { label: "Plan", key: "PlanID" },
        { label: "Status", key: "MemberStatusID" },
        { label: "Start Date", key: "MembershipStartDate" },
        { label: "End Date", key: "MembershipEndDate" },
        { label: "Free Sessions", key: "FreeSessions" },
        { label: "Notes", key: "Notes" },
      ];
      data = rows.map((m) => ({
        MemberID: m.MemberID,
        FullName: m.FullName,
        Email: m.Email,
        Phone: m.Phone || "—",
        PlanID: plans.find((p) => p.PlanID === m.PlanID)?.PlanName || "Unknown",
        MemberStatusID: getStatusNameByID(m.MemberStatusID),
        MembershipStartDate: formatDate(m.MembershipStartDate),
        MembershipEndDate: formatDate(m.MembershipEndDate),
        FreeSessions: m.FreeSessions || "0",
        Notes: m.Notes || "—",
      }));
      filename = "Memberships.csv";
    } else if (activeTab === 1) {
      headers = [
        { label: "Walk-In ID", key: "WalkInID" },
        { label: "Full Name", key: "FullName" },
        { label: "Visit Date", key: "VisitDate" },
        { label: "Payment Method", key: "PaymentMethod" },
        { label: "Amount Paid", key: "AmountPaid" },
        { label: "Notes", key: "Notes" },
      ];
      data = rows.map((w) => ({
        WalkInID: w.WalkInID,
        FullName: w.FullName,
        VisitDate: formatDateTime(w.VisitDate),
        PaymentMethod: w.PaymentMethod || "N/A",
        AmountPaid: `₱${parseFloat(w.AmountPaid || 0).toFixed(2)}`,
        Notes: w.Notes || "—",
      }));
      filename = "WalkIns.csv";
    } else if (activeTab === 2) {
      headers = [
        { label: "Renewal ID", key: "RenewalID" },
        { label: "Member ID", key: "MemberID" },
        { label: "Renewal Date", key: "RenewalDate" },
        { label: "Plan", key: "PlanID" },
        { label: "Amount", key: "RenewalAmount" },
      ];
      data = rows.map((r) => ({
        RenewalID: r.RenewalID,
        MemberID: r.MemberID,
        RenewalDate: formatDate(r.RenewalDate),
        PlanID: plans.find((p) => p.PlanID === r.PlanID)?.PlanName || "Unknown",
        RenewalAmount: `₱${parseFloat(r.RenewalAmount || 0).toFixed(2)}`,
      }));
      filename = "Renewals.csv";
    } else if (activeTab === 3) {
      headers = [
        { label: "Freeze ID", key: "FreezeID" },
        { label: "Member ID", key: "MemberID" },
        { label: "Start Date", key: "FreezeStartDate" },
        { label: "End Date", key: "FreezeEndDate" },
        { label: "Reason", key: "Reason" },
      ];
      data = rows.map((f) => ({
        FreezeID: f.FreezeID,
        MemberID: f.MemberID,
        FreezeStartDate: formatDate(f.FreezeStartDate),
        FreezeEndDate: formatDate(f.FreezeEndDate),
        Reason: f.Reason || "—",
      }));
      filename = "Freezes.csv";
    } else if (activeTab === 4) {
      // Monthly Clients
      headers = [
        { label: "Client ID", key: "MonthlyClientID" },
        { label: "Full Name", key: "FullName" },
        { label: "Visit Date", key: "VisitDate" },
        { label: "Monthly Fee", key: "MonthlyFee" },
        { label: "Notes", key: "Notes" },
      ];
      data = rows.map((c) => ({
        MonthlyClientID: c.MonthlyClientID,
        FullName: c.FullName,
        VisitDate: formatDate(c.VisitDate),
        MonthlyFee: `₱${parseFloat(c.MonthlyFee || 0).toFixed(2)}`,
        Notes: c.Notes || "—",
      }));
      filename = "MonthlyClients.csv";
    }

    if (data.length === 0) {
      alert("No data available for export!");
      return;
    }

    setCsvHeaders(headers);
    setCsvData(data);
    setCsvFilename(filename);
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const coverPage = "/imgs/coverpage2.png";
    let tableHeaders = [];
    let tableBody = [];
    let title = "";

    // Prepare data
    if (activeTab === 0) {
      title = "Memberships Report";
      tableHeaders = [
        "ID",
        "Full Name",
        "Email",
        "Plan",
        "Status",
        "Start Date",
        "End Date",
        "Notes",
      ];
      tableBody = rows.map((m) => [
        m.MemberID,
        m.FullName,
        m.Email,
        plans.find((p) => p.PlanID === m.PlanID)?.PlanName || "Unknown",
        getStatusNameByID(m.MemberStatusID),
        formatDate(m.MembershipStartDate),
        formatDate(m.MembershipEndDate),
        m.Notes || "—",
      ]);
    } else if (activeTab === 1) {
      title = "Walk-In Report";
      tableHeaders = [
        "ID",
        "Name",
        "Visit Date",
        "Payment Method",
        "Amount Paid",
        "Notes",
      ];
      tableBody = rows.map((w) => [
        w.WalkInID,
        w.FullName,
        formatDateTime(w.VisitDate),
        w.PaymentMethod || "N/A",
        Number(w.AmountPaid || 0).toFixed(2),
        w.Notes || "—",
      ]);
    } else if (activeTab === 2) {
      title = "Renewal Report";
      tableHeaders = ["ID", "Member Name", "Renewal Date", "Plan", "Amount"];
      tableBody = rows.map((r) => [
        r.RenewalID,
        membershipRecords.find((m) => m.MemberID === r.MemberID)?.FullName ||
          "Unknown",
        formatDate(r.RenewalDate),
        plans.find((p) => p.PlanID === r.PlanID)?.PlanName || "Unknown",
        parseFloat(r.RenewalAmount || 0).toFixed(2),
      ]);
    } else if (activeTab === 3) {
      title = "Freeze Report";
      tableHeaders = ["ID", "Member Name", "Branch", "Start Date", "End Date", "Reason"];
      tableBody = rows.map((f) => [
        f.FreezeID,
        membershipRecords.find((m) => m.MemberID === f.MemberID)?.FullName ||
          "Unknown",
        branches[f.StartedBranchID] || "Unknown",
        formatDate(f.FreezeStartDate),
        formatDate(f.FreezeEndDate),
        f.Reason || "—",
      ]);
    } else if (activeTab === 4) {
      title = "Monthly Clients Report";
      tableHeaders = ["ID", "Client Name", "Visit Date", "Fee Paid", "Notes"];
      tableBody = rows.map((c) => [
        c.MonthlyClientID,
        c.FullName,
        formatDate(c.VisitDate),
        `₱${parseFloat(c.MonthlyFee || 0).toFixed(2)}`,
        c.Notes || "—",
      ]);
    }

    tableBody.sort((a, b) => a[0] - b[0]);

    // Cover page
    doc.addImage(coverPage, "PNG", 0, 0, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text(title, pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(14);
    doc.text(
      "Generated on: " + new Date().toLocaleDateString(),
      pageWidth / 2,
      130,
      { align: "center" }
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: 100,
      theme: "striped",
      headStyles: {
        fillColor: "#050505",
        textColor: "#ffffff",
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        textColor: "#333333",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: "#f5f5f5",
      },
      styles: {
        overflow: "linebreak",
        cellPadding: 5,
        halign: "center",
        valign: "middle",
      },
      margin: { top: 50, left: 20, right: 20, bottom: 20 },
      didParseCell: (data) => {
        if (activeTab === 0 && data.column.index === 4) {
          const statusText = data.cell.raw;
          const statusColor = (status) => {
            switch (status?.toLowerCase()) {
              case "active":
                return "#4caf50";
              case "expired":
                return "#f44336";
              case "frozen":
                return "#2196f3";
              default:
                return "#000000";
            }
          };
          data.cell.styles.textColor = statusColor(statusText);
        }
      },
    });

    const pdfFilename =
      activeTab === 0
        ? "MembershipList.pdf"
        : activeTab === 1
        ? "WalkInsList.pdf"
        : activeTab === 2
        ? "RenewalsList.pdf"
        : activeTab === 3
        ? "FreezesList.pdf"
        : "MonthlyClientsList.pdf";

    doc.save(pdfFilename);
  };

  // ─────────────────────────────────────────────────────────
  // Open Delete Dialog
  // ─────────────────────────────────────────────────────────
  const openDeleteDialog = (type, id) => {
    setDeleteInfo({ type, id });
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    if (!deleteInfo.id || !deleteInfo.type) return;
    switch (deleteInfo.type) {
      case "membership":
        handleDeleteMembership(deleteInfo.id);
        break;
      case "walkin":
        handleDeleteWalkIn(deleteInfo.id);
        break;
      case "renewal":
        handleDeleteRenewal(deleteInfo.id);
        break;
      case "log":
        handleDeleteLog(deleteInfo.id);
        break;
      case "freeze":
        handleDeleteFreeze(deleteInfo.id);
        break;
      case "monthlyClient":
        handleDeleteMonthlyClient(deleteInfo.id);
        break;
      default:
        break;
    }
  };

  // ─────────────────────────────────────────────────────────
// Within your component:
const memberObject = membershipRecords.find((m) => m.MemberID === newRenewal.MemberID);

const currentEndDateRaw = memberObject?.MembershipEndDate || "";
// For display, convert to "YYYY-MM-DD" (or any format you prefer)
const currentEndDateDisplay = currentEndDateRaw
  ? format(new Date(currentEndDateRaw), "yyyy-MM-dd")
  : "No End Date Set";

// ─────────────────────────────────────────────────────────
// getColumnsForTab: Choose DataGrid columns based on the activeTab
const getColumnsForTab = () => {
  switch (activeTab) {
    case 5: // Member Visit Logs
      return memberVisitLogColumns;
    case 6: // Monthly Client Attendance
      return monthlyAttendanceColumns;
    default:
      return columns; // use the existing (staffified) columns for other tabs
  }
};

// ─────────────────────────────────────────────────────────
// getRowsForTab: Return the appropriate rows for the DataGrid
const getRowsForTab = () => {
  if (activeTab === 5) { // Member Visit Logs
    let data = memberVisitLogs.slice();
    if (branchFilter !== "all") {
      data = data.filter(item => String(item.BranchID) === branchFilter);
    }
    // Apply search filter
    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm))
    );
  } else if (activeTab === 6) { // Monthly Client Attendance
    let data = monthlyClientAttendances.slice();
    if (branchFilter !== "all") {
      data = data.filter(item => String(item.BranchID) === branchFilter);
    }
    return data.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm))
    );
  } else {
    return rows; // For tabs 0-4 and others, use the prefiltered rows
  }
};

return (
  <Box sx={{ p: 4 }}>
    {/* Key Metrics Section */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
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
       <PeopleIcon sx={{ fontSize: 30, color: "#90EE90", mr: 1.5 }} /> 
          <CardContent sx={{ p: 0.5 }}>
            <Typography variant="body2">Active Members</Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {
                filteredMemberships.filter(
                  (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "active"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            cursor: "default", // Change cursor to indicate it's not clickable
            bgcolor: "text.primary",
            color: "background.paper",
            p: 1.5,
            display: "flex",
            alignItems: "center",
            boxShadow: 2,
            ...(filterExpired && { border: "2px solid blue" }),
          }}
        >
          <WarningIcon sx={{ fontSize: 30, color: "red", mr: 1.5 }} />
          <CardContent sx={{ p: 0.5 }}>
            <Typography variant="body2">Expired</Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {
                filteredMemberships.filter(
                  (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
  <Card
    sx={{
      cursor: "default", // Ensure it's not visually clickable
      pointerEvents: "none", // Prevents any interaction
      bgcolor: "text.primary",
      color: "background.paper",
      p: 1.5,
      display: "flex",
      alignItems: "center",
      boxShadow: 2,
      ...(filterExpiring && { border: "2px solid blue" }),
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
        <Tab icon={<GroupsIcon />} label="Monthly Clients" />
        <Tab icon={<HistoryIcon />} label="Member Visit Logs" />  {/* NEW */}
        <Tab icon={<AssignmentTurnedInIcon />} label="Monthly Client Attendance" /> {/* NEW */}
      </Tabs>
    </Box>

    {/* Sub‐Tabs: only if on Memberships */}
    {activeTab === 0 && (
      <Tabs
        value={membershipSubTab}
        onChange={(e, newValue) => setMembershipSubTab(newValue)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 2 }}
      >
        {membershipFilters.map((f, idx) => (
          <Tab key={idx} label={f.label} />
        ))}
      </Tabs>
    )}

    <Paper elevation={2} sx={{ p: 2 }}>
      {/* Toolbar Container */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>

          <Grid item xs>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
              sx={{ maxWidth: 350 }}
            />
          </Grid>
              
          <Grid item>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mr: 1 }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>


          <Grid item sx={{ ml: "auto", display: "flex", gap: 1 }}>
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
            <Button variant="outlined" onClick={() => setManagePlansOpen(true)}>
              Manage Plans and Promotions
            </Button>
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
            {activeTab === 4 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddMonthlyClientOpen(true)}
            >
              Add Monthly Client
            </Button>
            )}
          </Grid>
        </Grid>
      </Box>
      <Box style={{ height: 510, width: "100%", mt: 2 }}>
      <DataGrid
              rows={getRowsForTab()}
              columns={getColumnsForTab()}
              getRowId={getRowId}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
      </Box>
    </Paper>
  
    {isAddMembershipLayoutVisible && (
  <AddNewMemberLayout
    onClose={() => setAddMembershipLayoutVisible(false)}
    onMemberCreated={handleNewMemberCreated}
    role="staff" // or role="owner" depending on who's logged in
  />
)}

    {isManagePlansOpen && <ManagePlansLayout onClose={() => setManagePlansOpen(false)} />}


      {/* ADD Walk-In Dialog */}
<Dialog open={isAddWalkInOpen} onClose={() => setAddWalkInOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h5">
        <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />Add New Walk-In
      </Typography>
      <IconButton onClick={() => setAddWalkInOpen(false)} sx={{ color: "inherit", "&:hover": { color: "red" } }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    <Box sx={{ p: 2 }}>
      <Divider sx={{ mb: 3 }} />
      <form onSubmit={(e) => e.preventDefault()}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Full Name"
            name="FullName"
            fullWidth
            required
            error={!!validationErrors.FullName}
            helperText={validationErrors.FullName}
            value={newWalkIn.FullName}
            onChange={handleAddWalkInChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Visit Date"
            name="VisitDate"
            type="datetime-local"
            fullWidth
            required
            error={!!validationErrors.VisitDate}
            helperText={validationErrors.VisitDate}
            value={newWalkIn.VisitDate}
            onChange={handleAddWalkInChange}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth required error={!!validationErrors.PaymentMethod}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="PaymentMethod"
              value={newWalkIn.PaymentMethod}
              onChange={handleAddWalkInChange}
              input={
                <OutlinedInput
                  label="Payment Method"
                  startAdornment={
                    <InputAdornment position="start">
                      <PaymentIcon />
                    </InputAdornment>
                  }
                />
              }
            >
              <MenuItem value="">-- Select Method --</MenuItem>
              <MenuItem value="W-In Cash">W-In Cash</MenuItem>
              <MenuItem value="W-In BDO">W-In BDO</MenuItem>
              <MenuItem value="W-In BPI">W-In BPI</MenuItem>
              <MenuItem value="W-In GCash">W-In GCash</MenuItem>
            </Select>
            {validationErrors.PaymentMethod && (
              <Typography color="error" variant="caption">
                {validationErrors.PaymentMethod}
              </Typography>
            )}
          </FormControl>
          <TextField
            label="Payment Amount"
            name="PaymentAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentAmount}
            onChange={(e) =>
              setNewWalkIn((prev) => ({ ...prev, PaymentAmount: e.target.value }))
            }
            variant="outlined"
            error={!!validationErrors.PaymentAmount}
            helperText={validationErrors.PaymentAmount}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: "bold" }}>₱</Typography>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Notes"
            name="Notes"
            fullWidth
            multiline
            rows={3}
            value={newWalkIn.Notes}
            onChange={handleAddWalkInChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <StickyNote2Icon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ mt: 4, display: "flex", flexDirection: "row", gap: 3, justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenConfirmation}
            disabled={
              !newWalkIn.FullName.trim() ||
              !newWalkIn.VisitDate ||
              !newWalkIn.PaymentMethod ||
              !newWalkIn.PaymentAmount ||
              isNaN(newWalkIn.PaymentAmount) ||
              Number(newWalkIn.PaymentAmount) <= 0
            }
            sx={{ textTransform: "none" }}
          >
            <SaveIcon sx={{ mr: 1 }} />
            Save Walk-In
          </Button>
        </Box>
      </form>
    </Box>
  </DialogContent>
</Dialog>


<Dialog
        open={openConfirmation}
        onClose={() => setOpenConfirmation(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
      >
        <DialogTitle sx={{ textAlign: "center", p: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <CheckCircleOutlineIcon sx={{ fontSize: 50, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Confirm Submission
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body1">Are you sure you want to add this walk-in?</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, py: 2 }}>
          <Button onClick={() => setOpenConfirmation(false)} sx={{ textTransform: "none" }} style={{ color: "red" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none" }}
            onClick={async () => {
              await handleAddWalkIn(); 
              setOpenConfirmation(false);
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewWalkInOpen}
        onClose={() => setViewWalkInOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <DirectionsWalkIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Walk-in Details
              </Typography>
            </Box>
            <IconButton onClick={() => setViewWalkInOpen(false)} sx={{ "&:hover": { color: theme.palette.error.main } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedWalkIn && (
            <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon color="primary" /> Personal Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedWalkIn.FullName || "—"}
                    sx={{ mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 3,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <EventIcon color="primary" /> Visit Details
                  </Typography>
                  <TextField
                    fullWidth
                    label="Visit Date & Time"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={
                      selectedWalkIn.VisitDate
                        ? new Date(selectedWalkIn.VisitDate).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })
                        : "—"
                    }
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PaymentIcon color="primary" /> Payment Details
                  </Typography>
                  <TextField
                    fullWidth
                    label="Payment Method"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedWalkIn.PaymentMethod || "N/A"}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Payment Amount"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={
                      selectedWalkIn.AmountPaid
                        ? `₱${parseFloat(selectedWalkIn.AmountPaid).toFixed(2)}`
                        : "N/A"
                    }
                    sx={{ mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 3,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <NotesIcon color="primary" /> Notes
                  </Typography>
                  <TextField
                    fullWidth
                    label="Notes"
                    variant="filled"
                    multiline
                    rows={3}
                    InputProps={{ readOnly: true }}
                    value={selectedWalkIn.Notes?.length ? selectedWalkIn.Notes : "No notes available."}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
  open={isEditWalkInOpen}
  onClose={() => setEditWalkInOpen(false)}
  fullWidth
  maxWidth="lg"
  fullScreen={window.innerWidth < 600}
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
      overflow: "hidden",
    },
  }}
>
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <DirectionsWalkIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Edit Walk-in Details
        </Typography>
      </Box>
      <IconButton onClick={() => setEditWalkInOpen(false)} sx={{ "&:hover": { color: theme.palette.error.main } }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent dividers sx={{ p: 4 }}>
    {selectedWalkIn && (
      <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column: Personal & Visit Details */}
          <Grid item xs={6}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonIcon color="primary" /> Personal Information
            </Typography>
            <TextField
              fullWidth
              label="Full Name"
              name="FullName"
              variant="outlined"
              value={selectedWalkIn.FullName || ""}
              onChange={(e) =>
                setSelectedWalkIn((prev) => ({ ...prev, FullName: e.target.value }))
              }
              sx={{ mb: 2 }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mt: 3,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <EventIcon color="primary" /> Visit Details
            </Typography>
            <TextField
              fullWidth
              label="Visit Date & Time"
              name="VisitDate"
              type="datetime-local"
              variant="outlined"
              value={selectedWalkIn.VisitDate || ""}
              onChange={(e) =>
                setSelectedWalkIn((prev) => ({ ...prev, VisitDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Right Column: Payment Details & Notes */}
          <Grid item xs={6}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PaymentIcon color="primary" /> Payment Details
            </Typography>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="PaymentMethod"
                value={selectedWalkIn.PaymentMethod || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, PaymentMethod: e.target.value }))
                }
                label="Payment Method"
              >
                <MenuItem value="">-- Select Payment Method --</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="BDO">BDO</MenuItem>
                <MenuItem value="BPI">BPI</MenuItem>
                <MenuItem value="GCash">GCash</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Payment Amount"
              name="AmountPaid"
              type="number"
              variant="outlined"
              value={selectedWalkIn.AmountPaid || ""}
              onChange={(e) =>
                setSelectedWalkIn((prev) => ({ ...prev, AmountPaid: e.target.value }))
              }
              sx={{ mb: 2 }}
            />

            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mt: 3,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <NotesIcon color="primary" /> Notes
            </Typography>
            <TextField
              fullWidth
              label="Notes"
              name="Notes"
              variant="outlined"
              multiline
              rows={3}
              value={selectedWalkIn.Notes || ""}
              onChange={(e) =>
                setSelectedWalkIn((prev) => ({ ...prev, Notes: e.target.value }))
              }
            />
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleEditWalkInSubmit} // This function should be staffified (using /staff/operations/walk-ins/)
      sx={{
        px: 4,
        py: 1,
        fontSize: "1rem",
        fontWeight: "bold",
        borderRadius: 2,
        textTransform: "none",
      }}
      startIcon={<SaveIcon />}
    >
      Save Changes
    </Button>
  </DialogActions>
</Dialog>
{/* NEW: ADD MONTHLY CLIENT DIALOG (Staffified) */}
<Dialog
  open={isAddMonthlyClientOpen}
  onClose={() => setAddMonthlyClientOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h5">
        <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
        Add New Monthly Client
      </Typography>
      <IconButton
        onClick={() => setAddMonthlyClientOpen(false)}
        sx={{ "&:hover": { color: "red" } }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    {/* Basic Info */}
    <TextField
      label="Full Name"
      fullWidth
      sx={{ my: 1 }}
      value={newMonthlyClient.FullName}
      onChange={(e) =>
        setNewMonthlyClient((prev) => ({ ...prev, FullName: e.target.value }))
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PersonIcon />
          </InputAdornment>
        ),
      }}
    />
    <TextField
      label="Email"
      fullWidth
      type="email"
      sx={{ my: 1 }}
      value={newMonthlyClient.Email}
      onChange={(e) =>
        setNewMonthlyClient((prev) => ({ ...prev, Email: e.target.value }))
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EmailIcon />
          </InputAdornment>
        ),
      }}
    />
    <TextField
      label="Phone"
      fullWidth
      sx={{ my: 1 }}
      value={newMonthlyClient.Phone}
      onChange={(e) =>
        setNewMonthlyClient((prev) => ({ ...prev, Phone: e.target.value }))
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PhoneIcon />
          </InputAdornment>
        ),
      }}
    />
    {/* For staff view, the Branch field is auto‑set & disabled */}
    <FormControl fullWidth sx={{ my: 1 }}>
      <InputLabel>Branch</InputLabel>
      <Select
        value={newMonthlyClient.BranchID || (staff ? staff.BranchID : "")}
        onChange={(e) =>
          setNewMonthlyClient((prev) => ({ ...prev, BranchID: e.target.value }))
        }
        label="Branch"
        disabled={!!staff}
        startAdornment={
          <InputAdornment position="start">
            <GroupsIcon />
          </InputAdornment>
        }
      >
        <MenuItem value="">-- Select Branch --</MenuItem>
        {Object.entries(branches).map(([BranchID, BranchName]) => (
          <MenuItem key={BranchID} value={BranchID}>
            {BranchName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Start Date */}
    <TextField
      label="Start Date"
      type="date"
      fullWidth
      sx={{ my: 1 }}
      value={newMonthlyClient.StartDate}
      onChange={(e) =>
        setNewMonthlyClient((prev) => ({ ...prev, StartDate: e.target.value }))
      }
      InputLabelProps={{ shrink: true }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EventIcon />
          </InputAdornment>
        ),
      }}
    />

    {/* Months To Pay Upfront */}
    <TextField
      label="Months to Pay Upfront"
      type="number"
      fullWidth
      sx={{ my: 1 }}
      value={newMonthlyClient.MonthsToPayUpfront}
      onChange={(e) =>
        setNewMonthlyClient((prev) => ({
          ...prev,
          MonthsToPayUpfront: e.target.value,
        }))
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <DescriptionIcon />
          </InputAdornment>
        ),
      }}
    />

    <Divider sx={{ my: 2 }} />
    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
      Split Payments
    </Typography>
    {monthlyClientPayments.map((pay, idx) => (
      <Box key={idx} sx={{ display: "flex", gap: 2, mb: 1 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Method</InputLabel>
          <Select
            label="Method"
            value={pay.PaymentMethod}
            onChange={(e) =>
              setMonthlyClientPayments((prev) =>
                prev.map((p, i) =>
                  i === idx ? { ...p, PaymentMethod: e.target.value } : p
                )
              )
            }
            startAdornment={
              <InputAdornment position="start">
                <PaymentIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="">-- Select --</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="BDO">BDO</MenuItem>
            <MenuItem value="BPI">BPI</MenuItem>
            <MenuItem value="GCash">GCash</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Amount"
          type="number"
          value={pay.PaymentAmount}
          onChange={(e) =>
            setMonthlyClientPayments((prev) =>
              prev.map((p, i) =>
                i === idx ? { ...p, PaymentAmount: e.target.value } : p
              )
            )
          }
          InputProps={{
            startAdornment: <InputAdornment position="start">₱</InputAdornment>,
          }}
          sx={{ width: 150 }}
        />
        {monthlyClientPayments.length > 1 && (
          <IconButton
            onClick={() =>
              setMonthlyClientPayments((prev) => prev.filter((_, i) => i !== idx))
            }
            color="error"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    ))}
    <Button
      variant="outlined"
      onClick={() =>
        setMonthlyClientPayments((prev) => [...prev, { PaymentMethod: "", PaymentAmount: "" }])
      }
      sx={{ mb: 2 }}
    >
      Add Payment
    </Button>
  </DialogContent>
  <DialogActions sx={{ pr: 3, pb: 2 }}>
    <Button onClick={() => setAddMonthlyClientOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleAddMonthlyClientSubmit}>
      Save
    </Button>
  </DialogActions>
</Dialog>

    
    {/* NEW: VIEW MONTHLY CLIENT DIALOG */}
    <Dialog
      open={isViewMonthlyClientOpen}
      onClose={() => setViewMonthlyClientOpen(false)}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Monthly Client Details</DialogTitle>
      <DialogContent dividers>
        {selectedMonthlyClient && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedMonthlyClient.FullName}
            </Typography>
            <Typography>Email: {selectedMonthlyClient.Email}</Typography>
            <Typography>Phone: {selectedMonthlyClient.Phone}</Typography>
            <Typography>
              StartDate: {selectedMonthlyClient.StartDate ? formatDate(selectedMonthlyClient.StartDate) : "—"}
            </Typography>
            <Typography>
              EndDate: {selectedMonthlyClient.EndDate ? formatDate(selectedMonthlyClient.EndDate) : "—"}
            </Typography>
            <Typography>
              Active?: {selectedMonthlyClient.IsActive ? "Yes" : "No"}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewMonthlyClientOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* NEW: EDIT MONTHLY CLIENT DIALOG */}
    <Dialog
      open={isEditMonthlyClientOpen}
      onClose={() => setEditMonthlyClientOpen(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Edit Monthly Client</DialogTitle>
      <DialogContent dividers>
        {selectedMonthlyClient && (
          <>
            <TextField
              label="Full Name"
              fullWidth
              sx={{ my: 1 }}
              value={selectedMonthlyClient.FullName}
              onChange={(e) =>
                setSelectedMonthlyClient((prev) => ({
                  ...prev,
                  FullName: e.target.value,
                }))
              }
            />
            <TextField
              label="Email"
              fullWidth
              sx={{ my: 1 }}
              value={selectedMonthlyClient.Email}
              onChange={(e) =>
                setSelectedMonthlyClient((prev) => ({
                  ...prev,
                  Email: e.target.value,
                }))
              }
            />
            <TextField
              label="Phone"
              fullWidth
              sx={{ my: 1 }}
              value={selectedMonthlyClient.Phone}
              onChange={(e) =>
                setSelectedMonthlyClient((prev) => ({
                  ...prev,
                  Phone: e.target.value,
                }))
              }
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              sx={{ my: 1 }}
              value={selectedMonthlyClient.StartDate || ""}
              onChange={(e) =>
                setSelectedMonthlyClient((prev) => ({
                  ...prev,
                  StartDate: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              sx={{ my: 1 }}
              value={selectedMonthlyClient.EndDate || ""}
              onChange={(e) =>
                setSelectedMonthlyClient((prev) => ({
                  ...prev,
                  EndDate: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth sx={{ my: 1 }}>
              <InputLabel>Active?</InputLabel>
              <Select
                value={selectedMonthlyClient.IsActive ? "true" : "false"}
                onChange={(e) =>
                  setSelectedMonthlyClient((prev) => ({
                    ...prev,
                    IsActive: e.target.value === "true",
                  }))
                }
                label="Active?"
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditMonthlyClientOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleEditMonthlyClientSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>


      {/* VIEW Membership */}
      <Dialog
        open={isViewMembershipOpen}
        onClose={() => setViewMembershipOpen(false)}
        fullWidth
        maxWidth="xl"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 4,
            p: 3,
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <PersonIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Membership Details
            </Typography>
          </Box>
          <IconButton
            onClick={() => setViewMembershipOpen(false)}
            sx={{ "&:hover": { color: theme.palette.error.main } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedMembership && (
            <Box>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={3} display="flex" justifyContent="center">
                  <Box
                    sx={{
                      width: 250,
                      height: 250,
                      borderRadius: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      bgcolor: "#f9f9f9",
                      border: "1px solid #ddd",
                      boxShadow: 1,
                    }}
                  >
                    {selectedMembership.PhotoPath ? (
                      <Box
                        component="img"
                        src={`/storage/${selectedMembership.PhotoPath}`}
                        alt="Member"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: "gray", textAlign: "center" }}>
                        No photo available.
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <PeopleIcon color="white" /> Personal Information
                      </Typography>
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Name"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon />
                            </InputAdornment>
                          ),
                        }}
                        value={selectedMembership.FullName}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Email"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                        value={selectedMembership.Email}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Phone"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                        value={selectedMembership.Phone || "—"}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <AutorenewIcon color="white" /> Membership Info
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Plan"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <GroupsIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={
                              plans.find((pl) => pl.PlanID === Number(selectedMembership.PlanID))
                                ?.PlanName || "Unknown"
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Status"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WarningIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={getStatusNameByID(selectedMembership.MemberStatusID)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Start Date"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EventAvailableIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={formatDate(selectedMembership.MembershipStartDate)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="End Date"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <HistoryIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={formatDate(selectedMembership.MembershipEndDate)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Free Sessions"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <DirectionsWalkIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={selectedMembership.FreeSessions || 0}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Card Number"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CreditCardIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={selectedMembership.MembershipCardNumber || "—"}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Card Issued?"
                            variant="filled"
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BadgeIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={selectedMembership.MembershipCardIssued ? "Yes" : "No"}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} />
                        <Grid item xs={12} sm={4} />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <NotesIcon color="primary" /> Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="filled"
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <HistoryIcon />
                        </InputAdornment>
                      ),
                    }}
                    value={
                      selectedMembership.Notes?.length
                        ? selectedMembership.Notes
                        : "No notes available."
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

{/* EDIT Membership */}
<Dialog
  open={isEditMembershipOpen}
  onClose={() => setEditMembershipOpen(false)}
  fullWidth
  maxWidth="xl"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
    },
  }}
>
  <Box display="flex" justifyContent="space-between" alignItems="center">
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <PersonIcon sx={{ fontSize: 32, color: "primary.main" }} />
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        Edit Membership
      </Typography>
    </Box>
    <IconButton
      onClick={() => setEditMembershipOpen(false)}
      sx={{ "&:hover": { color: theme.palette.error.main } }}
    >
      <CloseIcon />
    </IconButton>
  </Box>
  <DialogContent dividers sx={{ p: 4 }}>
    {selectedMembership && (
      <Box>
        <Grid container spacing={4}>
          <Grid
            item
            xs={12}
            sm={3}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            {/* Photo Preview */}
            <Box
              sx={{
                width: 250,
                height: 250,
                borderRadius: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "#f9f9f9",
                border: "1px solid #ddd",
                boxShadow: 1,
              }}
            >
              {capturedImage ? (
                <Box
                  component="img"
                  src={capturedImage}
                  alt="Captured"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              ) : selectedMembership.PhotoPath ? (
                <Box
                  component="img"
                  src={`/storage/${selectedMembership.PhotoPath}`}
                  alt="Member"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{ color: "gray", textAlign: "center" }}
                >
                  No photo available.
                </Typography>
              )}
            </Box>

            {/* Upload & Recapture Buttons */}
            <Box display="flex" gap={1}>
              <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
                Upload Photo
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PhotoCameraIcon />}
                onClick={() => setOpenWebcam(true)}
              >
                Recapture
              </Button>
            </Box>
          </Grid>

          {/* Webcam Dialog */}
          <Dialog open={openWebcam} onClose={handleCloseWebcam} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: "center" }}>Capture Profile Picture</DialogTitle>
            <DialogContent
              dividers
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Webcam
                audio={false}
                height={240}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
              />
            </DialogContent>
            <DialogActions sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <IconButton onClick={handleCloseWebcam} sx={{ color: "#FF0000" }}>
                <CloseIcon fontSize="large" />
              </IconButton>
              <IconButton onClick={captureImage} color="primary">
                <CameraAltIcon fontSize="large" />
              </IconButton>
            </DialogActions>
          </Dialog>

          <Grid item xs={12} sm={9}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <PeopleIcon color="white" />
                  Personal Information
                </Typography>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="filled"
                  value={selectedMembership.FullName || ""}
                  onChange={(e) =>
                    setSelectedMembership((prev) => ({
                      ...prev,
                      FullName: e.target.value,
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  variant="filled"
                  value={selectedMembership.Email || ""}
                  onChange={(e) =>
                    setSelectedMembership((prev) => ({
                      ...prev,
                      Email: e.target.value,
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  variant="filled"
                  value={selectedMembership.Phone || ""}
                  onChange={(e) =>
                    setSelectedMembership((prev) => ({
                      ...prev,
                      Phone: e.target.value,
                    }))
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AutorenewIcon color="white" />
                  Membership Info
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl variant="filled" fullWidth>
                      <InputLabel>Plan</InputLabel>
                      <Select
                        value={selectedMembership.PlanID || ""}
                        onChange={(e) =>
                          setSelectedMembership((prev) => ({
                            ...prev,
                            PlanID: e.target.value,
                          }))
                        }
                      >
                        {plans.map((plan) => (
                          <MenuItem key={plan.PlanID} value={plan.PlanID}>
                            {plan.PlanName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl variant="filled" fullWidth>
                      <InputLabel>Membership Status</InputLabel>
                      <Select
                        value={selectedMembership.MemberStatusID || ""}
                        onChange={(e) =>
                          setSelectedMembership((prev) => ({
                            ...prev,
                            MemberStatusID: e.target.value,
                          }))
                        }
                      >
                        {memberStatuses.map((status) => (
                          <MenuItem key={status.MemberStatusID} value={status.MemberStatusID}>
                            {status.StatusName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Start Date"
                      variant="filled"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={selectedMembership.MembershipStartDate || ""}
                      onChange={(e) =>
                        setSelectedMembership((prev) => ({
                          ...prev,
                          MembershipStartDate: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="End Date"
                      variant="filled"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={selectedMembership.MembershipEndDate || ""}
                      onChange={(e) =>
                        setSelectedMembership((prev) => ({
                          ...prev,
                          MembershipEndDate: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Free Sessions"
                      variant="filled"
                      type="number"
                      fullWidth
                      value={selectedMembership.FreeSessions || 0}
                      onChange={(e) =>
                        setSelectedMembership((prev) => ({
                          ...prev,
                          FreeSessions: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Card Number"
                      variant="filled"
                      fullWidth
                      value={selectedMembership.MembershipCardNumber || ""}
                      onChange={(e) =>
                        setSelectedMembership((prev) => ({
                          ...prev,
                          MembershipCardNumber: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl variant="filled" fullWidth>
                      <InputLabel>Card Issued?</InputLabel>
                      <Select
                        value={selectedMembership.MembershipCardIssued ? "Yes" : "No"}
                        onChange={(e) =>
                          setSelectedMembership((prev) => ({
                            ...prev,
                            MembershipCardIssued: e.target.value === "Yes",
                          }))
                        }
                      >
                        <MenuItem value="No">No</MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {/* Empty grid for spacing */}
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {/* Empty grid for spacing */}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mt: 2, mb: 1 }}>
                      Notes
                    </Typography>
                    <TextField
                      label="Notes"
                      variant="filled"
                      fullWidth
                      multiline
                      rows={3}
                      value={selectedMembership.Notes || ""}
                      onChange={(e) =>
                        setSelectedMembership((prev) => ({
                          ...prev,
                          Notes: e.target.value,
                        }))
                      }
                    />
               </Grid>
</Grid>
                           </Grid>
                         </Grid>
                       </Grid>
                     </Grid>
                   </Box>
                 )}
      </DialogContent>
  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleEditMembershipSubmit} // staffified handler
      sx={{
        px: 4,
        py: 1,
        fontSize: "1rem",
        fontWeight: "bold",
        borderRadius: 2,
        textTransform: "none",
      }}
      startIcon={<SaveIcon />}
    >
      Save Changes
    </Button>
  </DialogActions>
</Dialog>


{/* CREATE Freeze (Staffified) */}
<Dialog
  open={isFreezeModalOpen}
  onClose={() => setFreezeModalOpen(false)}
  fullWidth
  maxWidth="sm"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
      overflow: "hidden",
    },
  }}
>
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AcUnitIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Freeze Membership
        </Typography>
      </Box>
      <IconButton
        onClick={() => setFreezeModalOpen(false)}
        sx={{ "&:hover": { color: theme.palette.error.main } }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  <DialogContent dividers>
    <TextField
      fullWidth
      margin="normal"
      label="Start Date"
      type="date"
      name="FreezeStartDate"
      InputLabelProps={{ shrink: true }}
      value={freezeForm.FreezeStartDate}
      onChange={handleFreezeFormChange}
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EventIcon />
          </InputAdornment>
        ),
      }}
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
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EventIcon />
          </InputAdornment>
        ),
      }}
    />
    <TextField
      fullWidth
      margin="normal"
      label="Reason"
      name="Reason"
      value={freezeForm.Reason}
      onChange={handleFreezeFormChange}
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <StickyNote2Icon />
          </InputAdornment>
        ),
      }}
    />
  </DialogContent>

  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleSubmitFreeze}  // This handler should be staffified to use /staff/membership/freezes and attach BranchID.
      disabled={
        !freezeForm.FreezeStartDate ||
        !freezeForm.FreezeEndDate ||
        !freezeForm.Reason.trim()
      }
      sx={{
        px: 4,
        py: 1,
        textTransform: "none",
      }}
      startIcon={<SaveIcon />}
    >
      SUBMIT FREEZE
    </Button>
  </DialogActions>
</Dialog>


      {/* VIEW Freeze */}
      <Dialog
        open={isViewFreezeOpen}
        onClose={() => setViewFreezeOpen(false)}
        fullWidth
        maxWidth="lg" // Landscape format with proper width
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden", // Prevents vertical scrolling
          },
        }}
      >
        {/* Title */}
        <DialogTitle sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AcUnitIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Freeze Details
            </Typography>
          </Box>
          <IconButton
            onClick={() => setViewFreezeOpen(false)}
            sx={{ "&:hover": { color: theme.palette.error.main } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
        {/* Content */}
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedFreeze && (
            <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
              <Grid container spacing={3}>
                {/* Left Column: Member & Freeze Dates */}
                <Grid item xs={6}>
                  {/* Member Information */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon color="primary" /> Member Information
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Member ID"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={selectedFreeze.MemberID || "—"}
                    sx={{ mb: 2 }}
                  />

                  {/* Freeze Period */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mt: 3,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <EventIcon color="primary" /> Freeze Period
                  </Typography>
                  <TextField
                    fullWidth
                    label="Start Date"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={formatDate(selectedFreeze.FreezeStartDate)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="End Date"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={formatDate(selectedFreeze.FreezeEndDate)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* Right Column: Reason */}
                <Grid item xs={6}>
                  {/* Freeze Reason */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <NotesIcon color="primary" /> Freeze Reason
                  </Typography>
                  <TextField
                    fullWidth
                    label="Reason"
                    variant="filled"
                    multiline
                    rows={4}
                    InputProps={{ readOnly: true }}
                    value={selectedFreeze.Reason || "No reason provided."}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
{/* EDIT Freeze (Staffified) */}
<Dialog
  open={isEditFreezeOpen}
  onClose={() => setEditFreezeOpen(false)}
  fullWidth
  maxWidth="sm"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
      overflow: "hidden",
    },
  }}
>
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AcUnitIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Edit Freeze
        </Typography>
      </Box>
      <IconButton
        onClick={() => setEditFreezeOpen(false)}
        sx={{ "&:hover": { color: theme.palette.error.main } }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  <DialogContent dividers>
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
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon />
              </InputAdornment>
            ),
          }}
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
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Reason"
          name="Reason"
          value={selectedFreeze.Reason || ""}
          onChange={handleEditFreezeChange}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <StickyNote2Icon />
              </InputAdornment>
            ),
          }}
        />
      </>
    )}
  </DialogContent>

  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleEditFreezeSubmit} // Staffified handler (should use /staff/ endpoint & attach BranchID)
      sx={{
        px: 4,
        py: 1,
        fontSize: "1rem",
        fontWeight: "bold",
        borderRadius: 2,
        textTransform: "none",
        ml: 2,
      }}
      startIcon={<SaveIcon />}
    >
      Save Changes
    </Button>
  </DialogActions>
</Dialog>

     {/* VIEW Renewal */}
     <Dialog
     open={isViewRenewalOpen}
     onClose={() => setViewRenewalOpen(false)}
     fullWidth
     maxWidth="sm" // Reduced width
     sx={{
       "& .MuiDialog-paper": {
         borderRadius: 3,
         boxShadow: 6,
         p: 3,
         maxWidth: "55vw", // Less wide than before
       },
     }}
   >
       <DialogTitle sx={{ p: 2 }}>
   <Box display="flex" justifyContent="space-between" alignItems="center">
     <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
       <AutorenewIcon sx={{ fontSize: 32, color: "primary.main" }} />
       <Typography variant="h6" sx={{ fontWeight: "bold" }}>
         Renewal Details
       </Typography>
     </Box>
     <IconButton
       onClick={() => setViewRenewalOpen(false)}
       sx={{ "&:hover": { color: theme.palette.error.main } }}
     >
       <CloseIcon />
     </IconButton>
   </Box>
 </DialogTitle>
     {/* Content */}
     <DialogContent dividers sx={{ p: 4 }}>
       {selectedRenewal && (
         <Box>
           <Grid container spacing={3}>
             {/* Left Column: Member & Renewal Info */}
             <Grid item xs={12} sm={6}>
               <Typography
                 variant="h5"
                 sx={{
                   fontWeight: "bold",
                   mb: 2,
                   display: "flex",
                   alignItems: "center",
                   gap: 1,
                 }}
               >
                 <PersonIcon color="primary" /> Member Information
               </Typography>
               <TextField
               fullWidth
               label="Member Name"
               variant="filled"
               InputProps={{ readOnly: true }}
               value={
                 membershipRecords.find((m) => m.MemberID === selectedRenewal.MemberID)
                   ?.FullName || "—"
               }
               sx={{ mb: 2 }}
             />
               <TextField
                 fullWidth
                 label="Renewal ID"
                 variant="filled"
                 InputProps={{ readOnly: true }}
                 value={selectedRenewal.RenewalID || "—"}
                 sx={{ mb: 2 }}
               />
               <TextField
                 fullWidth
                 label="Renewal Date"
                 variant="filled"
                 InputProps={{ readOnly: true }}
                 value={formatDate(selectedRenewal.RenewalDate)}
                 sx={{ mb: 2 }}
               />
             </Grid>

             {/* Right Column: Plan & Payment Info */}
             <Grid item xs={12} sm={6}>
               <Typography
                 variant="h5"
                 sx={{
                   fontWeight: "bold",
                   mb: 2,
                   display: "flex",
                   alignItems: "center",
                   gap: 1,
                 }}
               >
                 <PaymentIcon color="primary" /> Payment & Plan
               </Typography>
               <TextField
               fullWidth
               label="Plan Name"
               variant="filled"
               InputProps={{ readOnly: true }}
               value={
                 plans.find((plan) => plan.PlanID === selectedRenewal.PlanID)?.PlanName || "—"
               }
               sx={{ mb: 2 }}
             />
               <TextField
                 fullWidth
                 label="Amount Paid"
                 variant="filled"
                 InputProps={{ readOnly: true }}
                 value={
                   selectedRenewal.RenewalAmount
                     ? `₱${parseFloat(selectedRenewal.RenewalAmount).toFixed(2)}`
                     : "N/A"
                 }
                 sx={{ mb: 2 }}
               />
             </Grid>
           </Grid>
         </Box>
       )}
     </DialogContent>
   </Dialog>

   {/* NEW: ADD RENEWAL DIALOG (Staffified) */}
<Dialog
  open={isAddRenewalOpen}
  onClose={() => setAddRenewalOpen(false)}
  fullWidth
  maxWidth="sm"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
      overflow: "hidden",
      backgroundColor: theme.palette.background.paper,
    },
  }}
>
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box display="flex" alignItems="center" gap={1}>
        <AutorenewIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
        >
          Add New Renewal
        </Typography>
      </Box>
      <IconButton onClick={() => setAddRenewalOpen(false)} sx={{ "&:hover": { color: "red" } }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  <DialogContent
    dividers
    sx={{
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
    }}
  >
    {/* (A) Member Name */}
    <TextField
      label="Member Name"
      fullWidth
      variant="outlined"
      margin="normal"
      value={
        membershipRecords.find((m) => m.MemberID === newRenewal.MemberID)?.FullName ||
        "Unknown Member"
      }
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <PersonIcon />
          </InputAdornment>
        ),
      }}
    />

    {/* (B) CURRENT MEMBERSHIP END DATE (READ-ONLY) */}
    <TextField
      label="Current End Date"
      fullWidth
      variant="outlined"
      margin="normal"
      value={currentEndDateDisplay}
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <EventIcon />
          </InputAdornment>
        ),
      }}
    />

    {/* (C) NEW MEMBERSHIP END DATE */}
    <TextField
      label="New Membership End Date"
      name="NewEndDate"
      type="date"
      fullWidth
      margin="normal"
      variant="outlined"
      value={newRenewal.NewEndDate}
      onChange={(e) =>
        setNewRenewal((prev) => ({ ...prev, NewEndDate: e.target.value }))
      }
      InputLabelProps={{ shrink: true }}
      error={!!validationErrors.NewEndDate}
      helperText={validationErrors.NewEndDate}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <EventIcon />
          </InputAdornment>
        ),
      }}
    />

    {/* Renewal Amount */}
    <TextField
      label="Renewal Amount"
      name="RenewalAmount"
      type="number"
      fullWidth
      margin="dense"
      value={newRenewal.RenewalAmount}
      onChange={(e) =>
        setNewRenewal((prev) => ({ ...prev, RenewalAmount: e.target.value }))
      }
      variant="outlined"
      error={!!validationErrors.RenewalAmount}
      helperText={validationErrors.RenewalAmount}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Typography sx={{ fontWeight: "bold" }}>₱</Typography>
          </InputAdornment>
        ),
      }}
    />

    {/* Payment Splits */}
    <Typography variant="subtitle2" sx={{ mt: 2, color: theme.palette.text.primary }}>
      Payments (Split Allowed)
    </Typography>
    {renewalPayments.map((payment, index) => (
      <Box
        key={index}
        sx={{
          display: "flex",
          gap: 2,
          mb: 1,
          mt: 1,
          flexWrap: "wrap",
          alignItems: "center",
          backgroundColor:
            theme.palette.mode === "dark" ? theme.palette.grey[800] : "#f9f9f9",
          p: 1,
          borderRadius: 1,
        }}
      >
        <FormControl
          sx={{ minWidth: 120 }}
          error={!!validationErrors[`Payments.${index}.PaymentMethod`]}
        >
          <InputLabel sx={{ color: theme.palette.text.primary }}>Method</InputLabel>
          <Select
            label="Method"
            value={payment.PaymentMethod}
            onChange={(e) =>
              setRenewalPayments((prev) =>
                prev.map((p, i) =>
                  i === index ? { ...p, PaymentMethod: e.target.value } : p
                )
              )
            }
            startAdornment={
              <InputAdornment position="start">
                <PaymentIcon sx={{ color: theme.palette.text.primary }} />
              </InputAdornment>
            }
            sx={{
              color: theme.palette.text.primary,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">-- Select --</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="BDO">BDO</MenuItem>
            <MenuItem value="BPI">BPI</MenuItem>
            <MenuItem value="GCash">GCash</MenuItem>
          </Select>
          {validationErrors[`Payments.${index}.PaymentMethod`] && (
            <FormHelperText>
              {validationErrors[`Payments.${index}.PaymentMethod`]}
            </FormHelperText>
          )}
        </FormControl>

        <TextField
          label="Amount"
          type="number"
          value={payment.PaymentAmount}
          onChange={(e) =>
            setRenewalPayments((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, PaymentAmount: e.target.value } : p
              )
            )
          }
          error={!!validationErrors[`Payments.${index}.PaymentAmount`]}
          helperText={validationErrors[`Payments.${index}.PaymentAmount`]}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">₱</InputAdornment>
            ),
          }}
          sx={{
            width: 150,
            color: theme.palette.text.primary,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.divider,
            },
          }}
        />

        {renewalPayments.length > 1 && (
          <IconButton
            onClick={() =>
              setRenewalPayments((prev) => prev.filter((_, i) => i !== index))
            }
            color="error"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    ))}

    <Button
      variant="outlined"
      onClick={() =>
        setRenewalPayments((prev) => [
          ...prev,
          { PaymentMethod: "", PaymentAmount: "" },
        ])
      }
      sx={{ mt: 1 }}
    >
      Add Payment
    </Button>

    {/* PaymentFor (read-only) */}
    <TextField
      label="Payment For"
      name="PaymentFor"
      fullWidth
      margin="dense"
      value={newRenewal.PaymentFor.replace(/^\["|"\]$/g, "")}
      variant="outlined"
      disabled
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <DescriptionIcon />
          </InputAdornment>
        ),
      }}
      sx={{ mt: 2 }}
    />

    {/* Show sum-of-payments error if any */}
    {validationErrors.totalPaid && (
      <Typography color="error" sx={{ mt: 1 }}>
        {validationErrors.totalPaid}
      </Typography>
    )}
  </DialogContent>

  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleAddRenewal} // Staffified handler: this should use /staff/membership/renewals and attach BranchID/StaffID
      sx={{ px: 4, py: 1, textTransform: "none" }}
      startIcon={<SaveIcon />}
    >
      SAVE RENEWAL
    </Button>
  </DialogActions>
</Dialog>

{/* EDIT Renewal (Staffified) */}
<Dialog
  open={isEditRenewalOpen}
  onClose={() => setEditRenewalOpen(false)}
  fullWidth
  maxWidth="sm"
  sx={{
    "& .MuiDialog-paper": {
      borderRadius: 3,
      boxShadow: 6,
      p: 3,
      maxWidth: "65vw", // Ensures it's not too wide
    },
  }}
>
  <DialogTitle sx={{ p: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <AutorenewIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Edit Renewal
        </Typography>
      </Box>
      <IconButton
        onClick={() => setEditRenewalOpen(false)}
        sx={{ "&:hover": { color: theme.palette.error.main } }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  {/* Content */}
  <DialogContent dividers sx={{ p: 4 }}>
    {selectedRenewal && (
      <Box>
        <Grid container spacing={3}>
          {/* Left Column: Renewal & Member Info */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonIcon color="primary" /> Member Information
            </Typography>
            <TextField
              fullWidth
              label="Member Name"
              variant="outlined"
              disabled
              value={
                membershipRecords.find((m) => m.MemberID === selectedRenewal.MemberID)
                  ?.FullName || "—"
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Renewal ID"
              variant="outlined"
              disabled
              value={selectedRenewal.RenewalID || "—"}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Renewal Date"
              variant="outlined"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={selectedRenewal.RenewalDate || ""}
              onChange={(e) =>
                setSelectedRenewal((prev) => ({
                  ...prev,
                  RenewalDate: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Right Column: Plan & Payment Info */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PaymentIcon color="primary" /> Payment & Plan
            </Typography>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Plan ID</InputLabel>
              <Select
                name="PlanID"
                value={selectedRenewal.PlanID || ""}
                onChange={(e) =>
                  setSelectedRenewal((prev) => ({
                    ...prev,
                    PlanID: e.target.value,
                  }))
                }
                label="Plan ID"
              >
                <MenuItem value="">-- Select Plan --</MenuItem>
                {plans.map((plan) => (
                  <MenuItem key={plan.PlanID} value={plan.PlanID}>
                    {plan.PlanName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Renewal Amount"
              variant="outlined"
              type="number"
              value={selectedRenewal.RenewalAmount || ""}
              onChange={(e) =>
                setSelectedRenewal((prev) => ({
                  ...prev,
                  RenewalAmount: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>

  {/* Actions */}
  <DialogActions sx={{ justifyContent: "flex-end", gap: 2, py: 2, px: 3 }}>
    <Button
      variant="contained"
      onClick={handleEditRenewalSubmit} // Staffified: should call /staff/membership/renewals/{renewalID} with staff info
      sx={{
        px: 4,
        py: 1,
        fontSize: "1rem",
        fontWeight: "bold",
        borderRadius: 2,
        textTransform: "none",
      }}
      startIcon={<SaveIcon />}
    >
      Save Changes
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

     {/* UNFREEZE CONFIRMATION DIALOG */}
      <Dialog
        open={isUnfreezeDialogOpen}
        onClose={() => setUnfreezeDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <AcUnitIcon color="primary" />
          Confirm Unfreeze
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to unfreeze this member? This action will restore their membership status to Active.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnfreezeDialogOpen(false)} sx={{ color: "gray" }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleUnfreezeMember}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>



      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <DeleteForeverIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "gray" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
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

      