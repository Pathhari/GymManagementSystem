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

import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

/* Layouts */
import AddNewMemberLayout from "../../Layouts/AddNewMemberLayout";
import ManagePlansLayout from "../../Layouts/ManagePlansLayout";

export default function MembershipManagement() {

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]   = useState("");
  // Core records
  const [membershipRecords, setMembershipRecords] = useState([]);
  const [walkInRecords, setWalkInRecords] = useState([]);
  const [renewalRecords, setRenewalRecords] = useState([]);
  const [freezeRecords, setFreezeRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const theme = useTheme();
  //set validation errors
  const [validationErrors, setValidationErrors] = useState({});
  // References
  const [plans, setPlans] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [branches, setBranches] = useState({});

  //WEBCAM
  const [capturedImage, setCapturedImage] = useState(null);
  const [openWebcam, setOpenWebcam] = useState(false);
  const webcamRef = useRef(null);
  // UI / State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isManagePlansOpen, setManagePlansOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");

  // New state to control expiring soon filter on memberships
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [filterExpired, setFilterExpired] = useState(false);

  // Confirmation dialog
  const [openConfirmation, setOpenConfirmation] = useState(false);

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

  const [membershipSubTab, setMembershipSubTab] = useState(0);

  // An array that labels your sub‐tabs:
  const membershipFilters = [
    { label: "All" },           // subTab=0 => show all
    { label: "Expired" },       // subTab=1
    { label: "Expiring Soon" }, // subTab=2
    { label: "Active" },        // subTab=3 (StatusID=1)
    { label: "Frozen" },        // subTab=4 (StatusID=2)
    { label: "On Hold" },       // subTab=5 (StatusID=3)
    { label: "Terminated" },    // subTab=6 (StatusID=4)
    { label: "New" },           // subTab=7 (StatusID=6)
  ];

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
    NewEndDate: "",
    RenewalAmount: 0,
    PaymentFor: '["Membership Renewal"]',
  });

  const [renewalPayments, setRenewalPayments] = useState([
    { PaymentMethod: "", PaymentAmount: "" },
  ]);
  
    // ─────────────────────────────────────────────────────────
  // HELPER: Get the member object from membershipRecords
  // ─────────────────────────────────────────────────────────
  function getMemberByID(memberID) {
    return membershipRecords.find((m) => m.MemberID === memberID);
  }

  // ─────────────────────────────────────────────────────────
  // HELPER: Decide the "start date" for renewal based on status
  // ─────────────────────────────────────────────────────────
  function getRenewalStartDate(member) {
    if (!member) return new Date(); // fallback

    // Suppose 4/5 are "Terminated" / "Expired"
    // If so => start from "today"
    // else => start from their existing MembershipEndDate
    if (member.MemberStatusID === 4 || member.MemberStatusID === 5) {
      return new Date(); // "today"
    } else {
      if (!member.MembershipEndDate) return new Date(); // fallback
      return new Date(member.MembershipEndDate);
    }
  }

  // ─────────────────────────────────────────────────────────
  // HELPER: Get plan price from the member's PlanID
  // ─────────────────────────────────────────────────────────
  function getPlanPriceForMember(member) {
    if (!member || !member.PlanID) return 0;
    const plan = plans.find((p) => p.PlanID === member.PlanID);
    return plan?.Price || 0;
  }

  // ─────────────────────────────────────────────────────────
  // HELPER: Simple "monthsBetweenDates(start, end)" integer
  // ─────────────────────────────────────────────────────────
  function monthsBetweenDates(start, end) {
    if (end <= start) return 0; // or 1, if you want a minimum

    const yearDiff = end.getFullYear() - start.getFullYear();
    let monthDiff = end.getMonth() - start.getMonth();
    let totalMonths = yearDiff * 12 + monthDiff;

    // Optional partial-month logic if you want:
    // if (end.getDate() < start.getDate()) totalMonths -= 1;

    if (totalMonths < 0) totalMonths = 0;
    return totalMonths;
  }

    // ─────────────────────────────────────────────────────────────────
  // (A) Handle user clicks "Renew" => open the Add Renewal dialog
  // ─────────────────────────────────────────────────────────────────
  function handleOpenRenewalDialog(memberRow) {
    // We'll store the member's ID plus default values
    setNewRenewal({
      MemberID: memberRow.MemberID,
      NewEndDate: "", // let user pick
      RenewalAmount: 0,
      PaymentFor: '["Membership Renewal"]',
    });
    setRenewalPayments([{ PaymentMethod: "", PaymentAmount: "" }]);

    setValidationErrors({});
    setAddRenewalOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────
  // (B) Auto-calc RenewalAmount whenever the user picks NewEndDate 
  //     or changes the Member (the "start date" depends on status)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // We need a real member object:
    const member = getMemberByID(newRenewal.MemberID);
    if (!member) return; // no valid member => skip
    if (!newRenewal.NewEndDate) return; // user hasn't chosen end date => skip

    // 1) parse the chosen end date
    const dtChosen = new Date(newRenewal.NewEndDate);
    if (isNaN(dtChosen.getTime())) return;

    // 2) decide the "start date" => membership end date or today
    const dtStart = getRenewalStartDate(member);

    // 3) compute difference in months
    const diffMonths = monthsBetweenDates(dtStart, dtChosen);

    // 4) multiply by the plan's monthly price
    const monthlyPrice = getPlanPriceForMember(member);
    const total = diffMonths * monthlyPrice;

    // If your business rule is: 
    //   - if the difference is 0, maybe force 1
    // e.g. 
    // if (diffMonths <= 0) total = monthlyPrice;
    // or do nothing if you want 0 => 0

    setNewRenewal((prev) => ({
      ...prev,
      RenewalAmount: total,
    }));
  }, [newRenewal.MemberID, newRenewal.NewEndDate]);

  // LOGS
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewLogOpen, setViewLogOpen] = useState(false);

  // DELETE CONFIRMATION DIALOG STATES
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ type: "", id: null });

  // Date translator
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

  // Currency Format
  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    return `₱${parseInt(value).toLocaleString("en-PH")}`;
  };

  // Convert base64 to File
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

  // Handle Capturing Image from Webcam
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

  // Handle File Upload
  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedMembership((prev) => ({
        ...prev,
        PhotoFile: e.target.files[0],
      }));
      setCapturedImage(null);
    }
  };
  // Webcam handlers
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  // Fetch data on mount
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
      .catch((err) => console.error("Error fetching members:", err));

    axios
      .get("/membership/plans")
      .then((res) => setPlans(res.data || []))
      .catch((err) => console.error("Error fetching plans:", err));

    axios
      .get("/membership/statuses")
      .then((res) => setMemberStatuses(res.data || []))
      .catch((err) => console.error("Error fetching statuses:", err));

    axios
      .get("/operations/walk-ins")
      .then((res) => setWalkInRecords(res.data))
      .catch((err) => console.error("Error fetching walk-ins:", err));

    axios.get("/owner/branches")
      .then((res) => {
        const branchArray = res.data.branches || [];
        const branchMap = {};
        branchArray.forEach(branch => {
          branchMap[branch.BranchID] = branch.BranchName;
        });
        setBranches(branchMap);
      })
      .catch((err) => console.error("Error fetching branches:", err));

    const intervalId = setInterval(() => {
      axios
        .get("/membership/members")
        .then((res) => setMembershipRecords(res.data.members || []))
        .catch(console.error);
    }, 100000);

    return () => clearInterval(intervalId);
  }, []);

  // Snackbar helper
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  // Called by AddNewMemberLayout => new member created
  function handleNewMemberCreated(resData) {
    const memberObj = resData.member;
    setMembershipRecords((prev) => [memberObj, ...prev]);
    showSuccessMessage("New member added successfully!");
  }

  // Searching / filtering
  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
    // Reset the expiring filter when changing tabs
    if(newValue !== 0) setFilterExpiring(false);
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  const applySearchFilter = (arr) =>
    arr.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm))
    );

    // Right near your other filter states:
    const [filterByStatusID, setFilterByStatusID] = useState(null);

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

      if (selectedMembership.PhotoFile) {
        formData.append("PhotoFile", selectedMembership.PhotoFile);
      }

      await axios.post(`/membership/members/${memberID}`, formData, {
        params: { _method: "PUT" },
        headers: { "Content-Type": "multipart/form-data" },
      });
      
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

  const openDeleteDialog = (type, id) => {
    setDeleteInfo({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteMembership = async (memberID) => {
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
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
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

  const getTodayWalkIns = () => {
    const todayDate = new Date().toISOString().split("T")[0];
    return walkInRecords.filter((walkIn) => {
      const walkInDate = new Date(walkIn.VisitDate).toISOString().split("T")[0];
      return walkInDate === todayDate;
    }).length;
  };

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
      showSuccessMessage("Freeze Updated successfully!");
    } catch (err) {
      console.error("Error updating freeze:", err);
      alert("Error. Check console for details.");
    }
  }

  async function handleDeleteFreeze(freezeID) {
    try {
      await axios.delete(`/membership/freezes/${freezeID}`);
      setFreezeRecords((prev) => prev.filter((f) => f.FreezeID !== freezeID));
      showSuccessMessage("Freeze Deleted successfully!")
    } catch (err) {
      console.error("Error deleting freeze:", err);
      alert("Error. Check console for details.");
    }
  }

  // --------------- RENEWAL HANDLERS ---------------
  function handleOpenRenewalDialog(memberRow) {
    setNewRenewal({
      MemberID: memberRow.MemberID,
      NewEndDate: "", // let user pick
      RenewalAmount: 0,
      PaymentMethod: "",
      PaymentAmount: 0,
      PaymentFor: '["Membership Renewal"]',
    });
    setValidationErrors({});
    setAddRenewalOpen(true);
  }
  
  
  const validateRenewal = () => {
    let errors = {};
    if (!newRenewal.MemberID) {
      errors.MemberID = "No member selected.";
    }
    if (!newRenewal.RenewalAmount || Number(newRenewal.RenewalAmount) <= 0) {
      errors.RenewalAmount = "Please enter a valid renewal amount.";
    }
    if (!newRenewal.PaymentMethod) {
      errors.PaymentMethod = "Please select a payment method.";
    }
    if (!newRenewal.PaymentAmount || Number(newRenewal.PaymentAmount) <= 0) {
      errors.PaymentAmount = "Please enter a valid payment amount.";
    }
    return errors;
  };
  

  function handleAddRenewalChange(e) {
    const { name, value } = e.target;
    if (name === "PlanID") {
      const selectedPlan = plans.find(plan => plan.PlanID === Number(value));
      if (selectedPlan) {
        let updatedFields = {
          PlanID: value,
          PaymentAmount: selectedPlan.Price
        };
        if (selectedPlan.DurationInDays) {
          const today = new Date();
          today.setDate(today.getDate() + selectedPlan.DurationInDays);
          updatedFields.MembershipEndDate = today.toISOString().split("T")[0];
        }
        setNewRenewal(prev => ({ ...prev, ...updatedFields }));
        return;
      }
    }
    setNewRenewal(prev => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    if (newRenewal.PlanID) {
      const selectedPlan = plans.find(plan => plan.PlanID === Number(newRenewal.PlanID));
      if (selectedPlan) {
        setNewRenewal(prev => ({ ...prev, PaymentAmount: selectedPlan.Price }));
      }
    }
  }, [newRenewal.PlanID, plans]);

  async function handleAddRenewal() {
    let errors = {};

    if (!newRenewal.NewEndDate) {
      errors.NewEndDate = "Please select the new membership end date.";
    }
    if (!newRenewal.RenewalAmount || Number(newRenewal.RenewalAmount) <= 0) {
      errors.RenewalAmount = "Please enter a valid renewal amount.";
    }

    // Check that we have at least one payment row
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

    // (Optional) If you want totalPaid >= RenewalAmount
    const totalPaid = renewalPayments.reduce(
      (sum, p) => sum + Number(p.PaymentAmount || 0),
      0
    );
    if (totalPaid < newRenewal.RenewalAmount) {
      errors.totalPaid = "The sum of payments is less than the renewal amount.";
    }

    // If any errors exist
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Build the request body
      const body = {
        MemberID:      newRenewal.MemberID,
        NewEndDate:    newRenewal.NewEndDate,
        RenewalAmount: Number(newRenewal.RenewalAmount),
        PaymentFor:    newRenewal.PaymentFor,
        Payments:      renewalPayments,
      };

      const res = await axios.post("/membership/renewals", body);
      const { renewal, member } = res.data;
      
      // update local states
      setRenewalRecords((prev) => [renewal, ...prev]);
      setMembershipRecords((prev) =>
        prev.map((m) => (m.MemberID === member.MemberID ? member : m))
      );

      // reset & close
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

  async function handleDeleteLog(logID) {
    // Implementation for log deletion if needed
  }

  // METRICS
  const totalMembers = membershipRecords.length;
  // FIX: Make sure "Expired" is matched in lowercase
  // For example, if you know the status IDs:
  const activeCount = membershipRecords.filter(m => m.MemberStatusID === 1).length;
  const frozenCount = membershipRecords.filter(m => m.MemberStatusID === 2).length;
  const onHoldCount = membershipRecords.filter(m => m.MemberStatusID === 3).length;
  const terminatedCount = membershipRecords.filter(m => m.MemberStatusID === 4).length;
  const newCount = membershipRecords.filter(m => m.MemberStatusID === 6).length;
  const expiredMemberships = membershipRecords.filter((m) => {
    if (!m?.MemberStatusID) return false;
    return getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired";
  }).length;

  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 7);

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
      width: 180,
      renderCell: (params) => {
        return branches[params.value] || "—"; 
      },
    },    
    { 
      field: "FullName", 
      headerName: "Full Name", 
      width: 150,
      renderCell: (params) => params.value ?? "—"
    },
    { 
      field: "Email", 
      headerName: "Email", 
      width: 170,
      renderCell: (params) => params.value ?? "—"
    },
    { 
      field: "Phone", 
      headerName: "Phone", 
      width: 130,
      renderCell: (params) => params.value ?? "—"
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
      renderCell: (params) => params.value ? formatDate(params.value) : "—",
    },
    { 
      field: "Notes", 
      headerName: "Remarks", 
      width: 150,
      renderCell: (params) => params.value ?? "—"
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
      renderCell: (params) => params.value ?? "—"
    },
    { 
      field: "FullName", 
      headerName: "Full Name", 
      width: 160,
      renderCell: (params) => params.value ?? "—"
    },
    {
      field: "VisitDate",
      headerName: "Visit Date",
      width: 300,
      renderCell: (params) => params.value ? formatDateTime(params.value) : "—",
    },
    { 
      field: "PaymentID", 
      headerName: "Payment ID", 
      width: 110,
      renderCell: (params) => params.value ?? "—"
    },
    { 
      field: "Notes", 
      headerName: "Notes", 
      width: 150,
      renderCell: (params) => params.value ?? "—"
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
      renderCell: (params) => params.value ? formatDate(params.value) : "—",
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
      renderCell: (params) => {
        return branches[params.value] || "—"; 
      },
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
      renderCell: (params) => params.value ? formatDate(params.value) : "—",
    },
    { 
      field: "FreezeEndDate", 
      headerName: "End Date", 
      width: 180,
      renderCell: (params) => params.value ? formatDate(params.value) : "—",
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

   // Helper function to filter an array by date range
   function filterByDateRange(recordsArray, getDateField) {
    if (!startDate && !endDate) return recordsArray; // no filter
    const start = startDate ? new Date(startDate) : null;
    const end   = endDate   ? new Date(endDate)   : null;

    return recordsArray.filter((rec) => {
      const dateValue = getDateField(rec);
      if (!dateValue) return false; // or true if you prefer to keep records w/o date
      const recDate = new Date(dateValue);

      // if start & end exist:
      if (start && end) {
        return recDate >= start && recDate <= end;
      }
      // if only start
      if (start && !end) {
        return recDate >= start;
      }
      // if only end
      if (!start && end) {
        return recDate <= end;
      }
      return true;
    });
  }

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
  
    if (activeTab === 0) {
      // MEMBERSHIP TAB
      let data = membershipRecords.slice(); // shallow copy for safety
  
      // ─────────────────────────────────────────────────────────────────
      // (a) Apply sub-tab filters (Expired, Expiring Soon, etc.)
      // ─────────────────────────────────────────────────────────────────
      switch (membershipSubTab) {
        case 1: // "Expired"
          data = data.filter(
            (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired"
          );
          break;
        case 2: { // "Expiring Soon"
          const today = new Date();
          const next7 = new Date();
          next7.setDate(today.getDate() + 7);
          data = data.filter((m) => {
            if (!m.MembershipEndDate) return false;
            const endDate = new Date(m.MembershipEndDate);
            return endDate > today && endDate <= next7;
          });
          break;
        }
        case 3: // "Active" => StatusID = 1
          data = data.filter((m) => m.MemberStatusID === 1);
          break;
        case 4: // "Frozen" => StatusID = 2
          data = data.filter((m) => m.MemberStatusID === 2);
          break;
        case 5: // "On Hold" => StatusID = 3
          data = data.filter((m) => m.MemberStatusID === 3);
          break;
        case 6: // "Terminated" => StatusID = 4
          data = data.filter((m) => m.MemberStatusID === 4);
          break;
        case 7: // "New" => StatusID = 6
          data = data.filter((m) => m.MemberStatusID === 6);
          break;
        // case 0 => "All" => do nothing
        default:
          break;
      }
  
      // ─────────────────────────────────────────────────────────────────
      // (b) Apply Branch & Search filters
      // ─────────────────────────────────────────────────────────────────
      data = applyBranchAndSearch(data);
  
      // ─────────────────────────────────────────────────────────────────
      // (c) Apply Date Range filter => MEMBERSHIP START DATE
      // ─────────────────────────────────────────────────────────────────
      data = filterByDateRange(data, (m) => m.MembershipStartDate);
  
      return data;
    }
  
    // WAlK-INS, RENEWALS, FREEZE, ETC.
    // ... your usual code ...
    if (activeTab === 1) return applySearchFilter(walkInRecords);
    if (activeTab === 2) return applySearchFilter(renewalRecords);
    if (activeTab === 3) return applyBranchAndSearch(freezeRecords);
    return applySearchFilter(activityLogs);
  }
  
  
  

  const rows = getFilteredData();
  let columns = [];
  if (activeTab === 0) columns = membershipColumns;
  else if (activeTab === 1) columns = walkInColumns;
  else if (activeTab === 2) columns = renewalColumns;
  else if (activeTab === 3) columns = freezeColumns;
  else columns = logColumns;

  const getRowId = (row) => {
    if (activeTab === 0) return row.MemberID;
    if (activeTab === 1) return row.WalkInID;
    if (activeTab === 2) return row.RenewalID;
    if (activeTab === 3) return row.FreezeID;
    return row.LogID; 
  };

  // Export logic
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  const handleExportMenuOpen = (e) => setExportAnchorEl(e.currentTarget);
  const handleExportMenuClose = () => setExportAnchorEl(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFilename, setCsvFilename] = useState("export.csv");

  const handleExportCSV = () => {
    handleExportMenuClose();
    let headers = [];
    let data = [];
    let filename = "";

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
      format: "A4"
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const coverPage = "/imgs/coverpage2.png";
    let tableHeaders = [];
    let tableBody = [];
    let title = "";

    if (activeTab === 0) {
      title = "Memberships Report";
      tableHeaders = ["ID", "Full Name", "Email", "Plan", "Status", "Start Date", "End Date", "Notes"];
      tableBody = rows.map((m) => [
        m.MemberID,
        m.FullName,
        m.Email,
        plans.find((p) => p.PlanID === m.PlanID)?.PlanName || "Unknown",
        getStatusNameByID(m.MemberStatusID),
        formatDate(m.MembershipStartDate),
        formatDate(m.MembershipEndDate),
        m.Notes || "—"
      ]);

    } else if (activeTab === 1) {
      title = "Walk-In Report";
      tableHeaders = ["ID", "Name", "Visit Date", "Payment Method", "Amount Paid", "Notes"];
      tableBody = rows.map((w) => [
        w.WalkInID,
        w.FullName,
        formatDateTime(w.VisitDate),
        w.PaymentMethod || "N/A",
        Number(w.AmountPaid || 0).toFixed(2),
        w.Notes || "—"
      ]);

    } else if (activeTab === 2) {
      title = "Renewal Report";
      tableHeaders = ["ID", "Member Name", "Renewal Date", "Plan", "Amount"];
      tableBody = rows.map((r) => [
        r.RenewalID,
        membershipRecords.find((m) => m.MemberID === r.MemberID)?.FullName || "Unknown",
        formatDate(r.RenewalDate),
        plans.find((p) => p.PlanID === r.PlanID)?.PlanName || "Unknown",
        parseFloat(r.RenewalAmount || 0).toFixed(2)
      ]);

    } else if (activeTab === 3) {
      title = "Freeze Report";
      tableHeaders = ["ID", "Member Name", "Branch", "Start Date", "End Date", "Reason"];
      tableBody = rows.map((f) => [
        f.FreezeID,
        membershipRecords.find((m) => m.MemberID === f.MemberID)?.FullName || "Unknown",
        branches[f.StartedBranchID] || "Unknown",
        formatDate(f.FreezeStartDate),
        formatDate(f.FreezeEndDate),
        f.Reason || "—"
      ]);
    }

    tableBody.sort((a, b) => a[0] - b[0]);
    doc.addImage(coverPage, "PNG", 0, 0, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text(title, pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(14);
    doc.text("Generated on: " + new Date().toLocaleDateString(), pageWidth / 2, 130, { align: "center" });

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
      }
    });

    const pdfFilename = 
      activeTab === 0 ? "MembershipList.pdf" :
      activeTab === 1 ? "WalkInsList.pdf" :
      activeTab === 2 ? "RenewalsList.pdf" : "FreezesList.pdf";
    doc.save(pdfFilename);
  };

  const [isUnfreezeDialogOpen, setUnfreezeDialogOpen] = useState(false);
  const [freezeToUnfreeze, setFreezeToUnfreeze] = useState(null);

  const openUnfreezeDialog = (type, freezeID) => {
    if (type === "freeze") {
      setFreezeToUnfreeze(freezeID);
      setUnfreezeDialogOpen(true);
    }
  };
  const handleUnfreezeMember = async () => {
    if (!freezeToUnfreeze) return;
    try {
      await axios.delete(`/membership/freezes/${freezeToUnfreeze}`);
      setFreezeRecords((prev) => prev.filter((f) => f.FreezeID !== freezeToUnfreeze));
      const refreshed = await axios.get("/membership/members");
      setMembershipRecords(refreshed.data.members || []);
      setUnfreezeDialogOpen(false);
      showSuccessMessage("Member successfully unfrozen!");
    } catch (err) {
      console.error("Error unfreezing member:", err);
      alert("Error. Check console for details.");
    }
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
      default:
        break;
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
            <DirectionsWalkIcon sx={{ fontSize: 30, color: "primary.main", mr: 1.5 }} />
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="body2">Today's Walk-Ins</Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {getTodayWalkIns()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {/* Expired Card now clickable */}
          <Card
            onClick={() => {
              setActiveTab(0);
              setFilterExpired((prev) => !prev);
              setFilterExpiring(false); // reset other filter
            }}
            sx={{
              cursor: "pointer",
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
                  membershipRecords.filter(
                    (m) => getStatusNameByID(m.MemberStatusID)?.toLowerCase() === "expired"
                  ).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => {
              setActiveTab(0);
              setFilterExpiring((prev) => !prev);
              setFilterExpired(false); // reset the other filter
            }}
            sx={{
              cursor: "pointer",
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
            <Grid item>
              <FormControl variant="outlined" size="small" sx={{ width: 150 }}>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  label="Branch"
                >
                  <MenuItem value="all">All Branches</MenuItem>
                  {Object.entries(branches).map(([BranchID, BranchName]) => (
                    <MenuItem key={BranchID} value={BranchID}>
                      {BranchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
            </Grid>
          </Grid>
        </Box>
        <Box style={{ height: 510, width: "100%", mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
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
            onClick={handleEditWalkInSubmit}
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
              {/* Upload Button */}
              <Button variant="outlined" component="label" startIcon={<FileUploadIcon />}>
                Upload Photo
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </Button>

              {/* Recapture Button */}
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
      onClick={handleEditMembershipSubmit}
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


      {/* CREATE Freeze */}
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
          onClick={handleSubmitFreeze}
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


      {/* EDIT Freeze */}
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
          onClick={handleEditFreezeSubmit}
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


      {/* ADD Renewal Dialog (Manual End Date) */}
      <Dialog
        open={isAddRenewalOpen}
        onClose={() => setAddRenewalOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <AutorenewIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Add New Renewal
              </Typography>
            </Box>
            <IconButton
              onClick={() => setAddRenewalOpen(false)}
              sx={{ "&:hover": { color: "red" } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* (A) Member Name */}
          <TextField
            label="Member Name"
            fullWidth
            variant="outlined"
            margin="normal"
            value={
              membershipRecords.find((m) => m.MemberID === newRenewal.MemberID)?.FullName
              || "Unknown Member"
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

          {/* (B) New Membership End Date */}
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

          {/* Renewal Amount (auto-filled by the useEffect) */}
          <TextField
            label="Renewal Amount"
            name="RenewalAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newRenewal.RenewalAmount}
            onChange={(e) =>
              setNewRenewal((prev) => ({
                ...prev,
                RenewalAmount: e.target.value,
              }))
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
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
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
                backgroundColor: "#f9f9f9",
                p: 1,
                borderRadius: 1,
              }}
            >
              <FormControl
                sx={{ minWidth: 120 }}
                error={!!validationErrors[`Payments.${index}.PaymentMethod`]}
              >
                <InputLabel>Method</InputLabel>
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
                      i === index
                        ? { ...p, PaymentAmount: e.target.value }
                        : p
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
                sx={{ width: 150 }}
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
              setRenewalPayments((prev) => [...prev, { PaymentMethod: "", PaymentAmount: "" }])
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
            onClick={handleAddRenewal}
            sx={{ px: 4, py: 1, textTransform: "none" }}
            startIcon={<SaveIcon />}
          >
            SAVE RENEWAL
          </Button>
        </DialogActions>
      </Dialog>


     {/* EDIT Renewal */}
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
                    disabled={true}
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
          onClick={handleEditRenewalSubmit}
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
