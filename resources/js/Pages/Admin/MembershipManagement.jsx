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
  // States for membership data
  const [membershipRecords, setMembershipRecords] = useState([]);
  const [walkInRecords, setWalkInRecords] = useState([]);
  const [renewalRecords, setRenewalRecords] = useState([]);
  const [freezeRecords, setFreezeRecords] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // For managing plans
  const [plans, setPlans] = useState([]);

  // For membership statuses (e.g. Active=1, Frozen=2, Banned=3, Expired=4)
  const [memberStatuses, setMemberStatuses] = useState([]);

  // Others
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isManagePlansOpen, setManagePlansOpen] = useState(false);
  

  // Utility to show a success message (Snackbar)
  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  useEffect(() => {
    // 1) Fetch membership/members
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

    // 2) Fetch membership/plans
    axios
      .get("/membership/plans")
      .then((res) => {
        setPlans(res.data || []);
      })
      .catch((err) => console.error("Error fetching plans:", err));

    // 3) Fetch membership statuses (NEW)
    // e.g. GET /membership/statuses returning an array:
    // [ { MemberStatusID: 1, StatusName: "Active" }, ... ]
    axios
      .get("/membership/statuses")
      .then((res) => {
        setMemberStatuses(res.data || []); 
      })
      .catch((err) => console.error("Error fetching statuses:", err));
    axios
      .get("/operations/walk-ins")
    .then((res) => {
      // If your back end returns something like ["WalkInID" => ..., "FullName" => ...]
      setWalkInRecords(res.data);
    })
    .catch((err) => console.error("Error fetching walk-ins:", err));
     // 4) Fetch branches
  axios
  .get("/owner/branches")
  .then((res) => {
    // If your back end returns { branches: [...] }, do:
    setBranches(res.data.branches || []);

    // If it returns an array directly, do:
    // setBranches(res.data);
  })
  .catch((err) => console.error("Error fetching branches:", err));

    const intervalId = setInterval(() => {
    axios.get("/membership/members")
      .then((res) => setMembershipRecords(res.data.members || []))
      .catch(console.error);
  }, 10000); // every 10 seconds

  // clear interval on unmount
  return () => clearInterval(intervalId);
  }, []);

  const [branches, setBranches] = useState([]);

  // Called by AddNewMemberLayout => new member created
  function handleNewMemberCreated(resData) {
    // if resData = { message: "...", member: {...} }
    const memberObj = resData.member;
    setMembershipRecords(prev => [memberObj, ...prev]);
    showSuccessMessage("New member added successfully!");
  }
  // For searching
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


  // --------------------------
  // MEMBERSHIP CRUD
  // --------------------------
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [isViewMembershipOpen, setViewMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setEditMembershipOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");

  const handleViewMembership = (row) => {
    setSelectedMembership(row);
    setViewMembershipOpen(true);
  };

  const handleEditMembership = (row) => {
    setSelectedMembership({ ...row });
    setEditMembershipOpen(true);
  };

  // We'll convert old "MemberStatusID" to numeric "MemberStatusID"
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
  
      // Send as multipart/form-data
      await axios.put(`/membership/members/${memberID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      // Locally update membership array
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

  const [isAddMembershipLayoutVisible, setAddMembershipLayoutVisible] = useState(false);

  function getStatusNameByID(memberStatusID) {
    const st = memberStatuses.find((s) => s.MemberStatusID === memberStatusID);
    return st ? st.StatusName : "Unknown";
  }

   // DataGrid columns for membership
   const membershipColumns = [
    {
      field: "StartedBranchID",
      headerName: "Branch",
      flex: 1, 
      width: 130,
      renderCell: (params) => {
        const startedBranchId = params.value; // the numeric ID
        // 'branches' is your array from the backend: [ {BranchID, BranchName}, ... ]
        const br = branches.find(b => b.BranchID === startedBranchId);
        return br ? br.BranchName : "N/A";
      },
    },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "Email", headerName: "Email", width: 160 },
    { field: "Phone", headerName: "Phone", width: 130 },
    {
      field: "PlanID",
      headerName: "Plan",
      width: 130,
      renderCell: (params) => {
        const pid = Number(params.value); // ensure numeric
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "Unknown";
      }
    },    {
      field: "MemberStatusID",
      headerName: "Status",
      width: 130,
      // We do a custom render cell that shows the StatusName from memberStatuses
      renderCell: (params) => {
        const msid = params.value; // This is the numeric ID in the row
        // e.g. 1 => "Active", 2 => "Frozen", etc.
        const stName = getStatusNameByID(msid);
        return <span>{stName}</span>;
      },
    },
    { field: "MembershipEndDate", headerName: "Membership Ends", width: 100 },

    {
      field: "Actions",
      headerName: "Actions",
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* View */}
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
              onClick={() => handleViewMembership(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
  
          {/* Edit */}
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
              onClick={() => handleEditMembership(params.row)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
  
          {/* Freeze (AcUnitIcon) */}
          <Tooltip title="Freeze">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#00acc1", color: "#fff", minWidth: 40 }}
              onClick={() => handleOpenFreezeModal(params.row.MemberID)}
            >
              <AcUnitIcon fontSize="small" />
            </Button>
          </Tooltip>
  
          {/* Delete */}
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
              onClick={() => handleDeleteMembership(params.row.MemberID)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>

                {/* Renew */}
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
    PaymentID: "", // keep if you have PaymentID in your table
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
        Notes: newWalkIn.Notes,
      });
      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        PaymentID: "",
        Notes: "",
      });
      setAddWalkInOpen(false);
    // 3) Optionally re-fetch the walkIns to update table:
    const refreshed = await axios.get("/operations/walk-ins");
    setWalkInRecords(refreshed.data);

    showSuccessMessage("Walk-In created successfully!");
  } catch (err) {
    console.error("Error creating walk-in:", err);
    alert("Create error. Check console for details.");
  }
};

 // States
const [selectedFreeze, setSelectedFreeze] = useState(null);

const [isViewFreezeOpen, setViewFreezeOpen] = useState(false);
const [isEditFreezeOpen, setEditFreezeOpen] = useState(false);

// For creation
const [isFreezeModalOpen, setFreezeModalOpen] = useState(false);
const [freezeForm, setFreezeForm] = useState({
  MemberID: "",
  FreezeStartDate: "",
  FreezeEndDate: "",
  Reason: "",
});

function handleOpenRenewalDialog(memberRow) {
  setNewRenewal({
    MemberID: memberRow.MemberID,
    RenewalDate: "",   // default to today’s date if you like
    PlanID: "",
    RenewalAmount: 0,
  });
  setAddRenewalOpen(true);
}


// 1) Open creation modal, pass in MemberID
function handleOpenFreezeModal(memberID) {
  setFreezeForm({
    MemberID: memberID,
    FreezeStartDate: "",
    FreezeEndDate: "",
    Reason: "",
  });
  setFreezeModalOpen(true);
}

// 2) Called when user types in creation form fields
function handleFreezeFormChange(e) {
  const { name, value } = e.target;
  setFreezeForm((prev) => ({ ...prev, [name]: value }));
}

// 3) Submit creation form -> POST to /membership/freezes
async function handleSubmitFreeze() {
  try {
    // 1) POST to create the freeze
    const res = await axios.post("/membership/freezes", freezeForm);
    const newFreeze = res.data;

    // 2) Update local freezeRecords so we see the freeze in the table
    setFreezeRecords((prev) => [newFreeze, ...prev]);

    // 3) Re-fetch the membership list so the updated "Frozen" status is reflected 
    //    in membershipRecords (assuming your storeFreeze method updates MemberStatusID).
    const refreshedMembers = await axios.get("/membership/members");
    setMembershipRecords(refreshedMembers.data.members || []);

    // 4) Close the Freeze modal and show a success message
    setFreezeModalOpen(false);
    showSuccessMessage("Freeze created successfully. Member is now Frozen!");
  } catch (err) {
    console.error("Error creating freeze:", err);
    alert("Error. Check console for details.");
  }
}


// 4) View an existing freeze
function handleViewFreeze(freezeRow) {
  setSelectedFreeze(freezeRow);
  setViewFreezeOpen(true);
}

// 5) Edit an existing freeze
function handleEditFreeze(freezeRow) {
  setSelectedFreeze({ ...freezeRow }); // copy the freeze object into state
  setEditFreezeOpen(true);
}

// For the edit form, we need to update fields as user types
function handleEditFreezeChange(e) {
  const { name, value } = e.target;
  setSelectedFreeze((prev) => ({ ...prev, [name]: value }));
}

// 6) Submit edit -> PUT /membership/freezes/:id
async function handleEditFreezeSubmit() {
  if (!selectedFreeze) return;
  try {
    const freezeID = selectedFreeze.FreezeID;
    const res = await axios.put(`/membership/freezes/${freezeID}`, {
      FreezeStartDate: selectedFreeze.FreezeStartDate,
      FreezeEndDate: selectedFreeze.FreezeEndDate,
      Reason: selectedFreeze.Reason,
      // Add more if your DB has them
    });
    const updatedFreeze = res.data;
    // Update local array
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

// 7) Delete an existing freeze
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

function fetchActivityLogs() {
  axios
    .get("/membership/logs")   // or whatever your endpoint is
    .then((res) => {
      setActivityLogs(res.data || []);
    })
    .catch((err) => console.error("Error fetching logs:", err));
}


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
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewLogOpen, setViewLogOpen] = useState(false);
  const handleViewLog = (row) => {
    setSelectedLog(row);
    setViewLogOpen(true);
  };
  const handleDeleteLog = (logID) => {};

  const totalMembers = membershipRecords.length;

  const expiredMemberships = membershipRecords.filter((m) => {
    // If m is nullish or missing MemberStatusID, treat it as not expired
    if (!m || m.MemberStatusID == null) return false;
    return getStatusNameByID(m.MemberStatusID) === "Expired";
  }).length;

  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 30);
  const upcomingExpirations = membershipRecords.filter((m) => {
    // skip if no end date
    if (!m?.MembershipEndDate) return false;
    const endDate = new Date(m.MembershipEndDate);
    return endDate > today && endDate <= next30;
  }).length

  const walkInColumns = [
    { field: "WalkInID", headerName: "Walk-In ID", width: 100 },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "VisitDate", headerName: "Visit Date", width: 160 },
    { field: "PaymentID", headerName: "Payment ID",flex: 1, width: 90 },
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

// State for new renewal
const [isAddRenewalOpen, setAddRenewalOpen] = useState(false);
const [newRenewal, setNewRenewal] = useState({
  MemberID: "",
  PlanID: "",
  RenewalAmount: 0,
});

function handleAddRenewalChange(e) {
  setNewRenewal((prev) => ({ ...prev, [e.target.name]: e.target.value }));
}

async function handleAddRenewal() {
  try {
    // Call POST /membership/renewals
    const res = await axios.post("/membership/renewals", {
      MemberID: newRenewal.MemberID,
      PlanID: newRenewal.PlanID,
      RenewalAmount: newRenewal.RenewalAmount,
    });
    const created = res.data;

    // 1) Add it to local state (assuming you store them in renewalRecords)
    setRenewalRecords((prev) => [created, ...prev]);

    // 2) Reset form + close dialog
    setNewRenewal({ MemberID: "", RenewalDate: "", PlanID: "", RenewalAmount: 0 });
    setAddRenewalOpen(false);

    showSuccessMessage("Renewal created successfully!");
  } catch (err) {
    console.error("Error creating renewal:", err);
    alert("Create error. Check console for details.");
  }
}

  const renewalColumns = [
    {
      field: "MemberID",
      headerName: "Member Name",
      width: 160,
      renderCell: (params) => {
        const memberId = Number(params.value);
        // Use membershipRecords instead of members
        const member = membershipRecords.find((m) => m.MemberID === memberId);
        return member ? member.FullName : "N/A";
      }
    },    
    { field: "RenewalDate", headerName: "Renewal Date", width: 100 },    
    {       field: "PlanID",
      headerName: "Plan",
      flex: 1, 
      width: 60,
      renderCell: (params) => {
        const pid = Number(params.value); // ensure numeric
        const plan = plans.find((pl) => pl.PlanID === pid);
        return plan ? plan.PlanName : "Unknown";
      }
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
      flex: 1, 
      width: 160,
      // Either use valueGetter or renderCell—here we use renderCell:
      renderCell: (params) => {
        // 'params.row.MemberID' is the member ID on the freeze record
        const member = membershipRecords.find(
          (m) => m.MemberID === params.row.MemberID
        );
        // If found, show FullName; otherwise show "Unknown"
        return member ? member.FullName : "Unknown";
      },
    },    { field: "FreezeStartDate", headerName: "Start Date", width: 130 },
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

  const filteredMemberships = membershipRecords.filter((m) => {
    const branchMatches =
      branchFilter === "all" ||
      String(m.StartedBranchID) === branchFilter;
    const searchMatches = Object.values(m).some((val) =>
      String(val).toLowerCase().includes(searchTerm)
    );
    return branchMatches && searchMatches;
  });
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
          {/* Key Metrics Section */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Total Members */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 1.5, display: "flex", alignItems: "center", boxShadow: 2 }}>
                <GroupsIcon sx={{ fontSize: 30, color: "gray", mr: 1.5 }} />
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="body2">Total Members</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{totalMembers}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Walk-Ins */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 1.5, display: "flex", alignItems: "center", boxShadow: 2 }}>
                <DirectionsWalkIcon sx={{ fontSize: 30, color: "primary.main", mr: 1.5 }} />
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="body2">Walk-Ins</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{walkInRecords.length}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Expired Memberships */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 1.5, display: "flex", alignItems: "center", boxShadow: 2 }}>
                <WarningIcon sx={{ fontSize: 30, color: "red", mr: 1.5 }} />
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="body2">Expired</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{expiredMemberships}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Expiring Soon */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "text.primary", color: "background.paper", p: 1.5, display: "flex", alignItems: "center", boxShadow: 2 }}>
                <EventAvailableIcon sx={{ fontSize: 30, color: "blue", mr: 1.5 }} />
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="body2">Expiring Soon</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{upcomingExpirations}</Typography>
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
          
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {/* Example: a button to open ManagePlansLayout */}
          <Button variant="outlined"  onClick={() => setManagePlansOpen(true)}  sx={{ color: "primary" }}>
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

      {isAddMembershipLayoutVisible && (
        <AddNewMemberLayout onClose={() => setAddMembershipLayoutVisible(false)} 
        onMemberCreated={handleNewMemberCreated}
        />
      )}

      {isManagePlansOpen && (
        <ManagePlansLayout onClose={() => setManagePlansOpen(false)} />
      )}
      
{/* ---------------------------- */
/*    BEGIN: Walk-Ins Dialogs    */
/* ---------------------------- */}

{/* 1) ADD Walk-In Dialog */}
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

{/* 2) VIEW Walk-In Dialog */}
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
        <Typography variant="body1">
          Name: {selectedWalkIn.FullName}
        </Typography>
        <Typography variant="body1">
          Visit Date: {selectedWalkIn.VisitDate}
        </Typography>
        <Typography variant="body1">
          Payment ID: {selectedWalkIn.PaymentID}
        </Typography>
        <Typography variant="body1">
          Notes: {selectedWalkIn.Notes}
        </Typography>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      variant="contained"
      onClick={() => setViewWalkInOpen(false)}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

{/* 3) EDIT Walk-In Dialog */}
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
        <TextField
          label="Full Name"
          name="FullName"
          fullWidth
          margin="dense"
          value={selectedWalkIn.FullName}
          onChange={(e) =>
            setSelectedWalkIn((prev) => ({
              ...prev,
              FullName: e.target.value,
            }))
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
            setSelectedWalkIn((prev) => ({
              ...prev,
              VisitDate: e.target.value,
            }))
          }
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Payment ID"
          name="PaymentID"
          fullWidth
          margin="dense"
          value={selectedWalkIn.PaymentID}
          onChange={(e) =>
            setSelectedWalkIn((prev) => ({
              ...prev,
              PaymentID: e.target.value,
            }))
          }
        />
        <TextField
          label="Notes"
          name="Notes"
          fullWidth
          margin="dense"
          multiline
          rows={3}
          value={selectedWalkIn.Notes}
          onChange={(e) =>
            setSelectedWalkIn((prev) => ({
              ...prev,
              Notes: e.target.value,
            }))
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

 {/*
  1) MEMBERSHIP DIALOGS
     - isViewMembershipOpen, isEditMembershipOpen
     - selectedMembership
*/}

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
        {/* Display photo if PhotoPath is available */}
        {selectedMembership.PhotoPath ? (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src={`/storage/${selectedMembership.PhotoPath}`}
              alt="Member Photo"
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
        <Typography>
          Plan: {selectedMembership.PlanID /* or do plan name lookup */}
        </Typography>
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
          Card Issued?{" "}
          {selectedMembership.MembershipCardIssued ? "Yes" : "No"}
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



{/* EDIT Membership Dialog */}
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

        {/* Plan selection, same as before */}
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
            setSelectedMembership((prev) => ({ ...prev, Notes: e.target.value }))
          }
        />

        {/* Upload a new photo/biometric */}
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
                    PhotoFile: e.target.files[0], // store the actual File object
                  }));
                }
              }}
            />
          </Button>
          {selectedMembership.BiometricFile && (
            <Typography variant="caption" sx={{ ml: 1 }}>
              {selectedMembership.BiometricFile.name}
            </Typography>
          )}
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




    {/*
  2) FREEZE MEMBERSHIP DIALOGS
     - isFreezeModalOpen (for new freeze)
     - freezeForm, handleFreezeFormChange, handleSubmitFreeze
     - isViewFreezeOpen, selectedFreeze
     - isEditFreezeOpen
*/}

{/* CREATE Freeze Dialog */}
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

{/* VIEW Freeze Dialog */}
<Dialog
  open={isViewFreezeOpen}
  onClose={() => setViewFreezeOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Freeze Details</DialogTitle>
  <DialogContent dividers>
    {selectedFreeze && (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          MemberID: {selectedFreeze.MemberID}
        </Typography>
        <Typography variant="body1">
          Start: {selectedFreeze.FreezeStartDate}
        </Typography>
        <Typography variant="body1">
          End: {selectedFreeze.FreezeEndDate}
        </Typography>
        <Typography variant="body1">
          Reason: {selectedFreeze.Reason}
        </Typography>
        {/* ... etc. */}
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button variant="contained" onClick={() => setViewFreezeOpen(false)}>
      Close
    </Button>
  </DialogActions>
</Dialog>

{/* EDIT Freeze Dialog */}
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

<Dialog
  open={isViewRenewalOpen}
  onClose={() => setViewRenewalOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Renewal Details</DialogTitle>
  <DialogContent dividers>
    {selectedRenewal && (
      <Box sx={{ p: 2 }}>
        {/* Show fields */}
        <Typography variant="body1">RenewalID: {selectedRenewal.RenewalID}</Typography>
        <Typography variant="body1">MemberID: {selectedRenewal.MemberID}</Typography>
        <Typography variant="body1">Renewal Date: {selectedRenewal.RenewalDate}</Typography>
        <Typography variant="body1">PlanID: {selectedRenewal.PlanID}</Typography>
        {/* etc. */}
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button variant="contained" onClick={() => setViewRenewalOpen(false)}>
      Close
    </Button>
  </DialogActions>
</Dialog>


{/* "Add Renewal" Dialog */}
<Dialog
  open={isAddRenewalOpen}
  onClose={() => setAddRenewalOpen(false)}
  fullWidth
  maxWidth="sm"
>
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
          
          // 1) Look up that plan's Price
          const planObj = plans.find(
            (p) => p.PlanID === selectedPlanID
          );
          // 2) If found, auto-fill RenewalAmount with the plan’s Price
          if (planObj) {
            setNewRenewal((prev) => ({
              ...prev,
              PlanID: selectedPlanID,
              RenewalAmount: planObj.Price, // auto-set
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

    {/* RenewalAmount (auto-filled, but still editable) */}
    <TextField
      label="Renewal Amount"
      name="RenewalAmount"
      type="number"
      fullWidth
      margin="dense"
      value={newRenewal.RenewalAmount}
      onChange={handleAddRenewalChange}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setAddRenewalOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleAddRenewal}>
      Save
    </Button>
  </DialogActions>
</Dialog>


<Dialog open={isEditRenewalOpen} onClose={() => setEditRenewalOpen(false)}>
  <DialogTitle>Edit Renewal</DialogTitle>
  <DialogContent>
    {selectedRenewal && (
      <>
        {/* No real update route example, but if you had one, you'd show fields here */}
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
        {/* etc. */}
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


      {/*
  4) LOG DIALOG
     - isViewLogOpen, selectedLog
*/}

<Dialog open={isViewLogOpen} onClose={() => setViewLogOpen(false)}>
  <DialogTitle>Log Details</DialogTitle>
  <DialogContent dividers>
    {selectedLog && (
      <>
        {/* Show fields */}
        <Typography variant="body1">Log ID: {selectedLog.LogID}</Typography>
        <Typography variant="body1">User ID: {selectedLog.UserID}</Typography>
        <Typography variant="body1">Action: {selectedLog.Action}</Typography>
        <Typography variant="body1">Timestamp: {selectedLog.Timestamp}</Typography>
        <Typography variant="body1">Details: {selectedLog.Details}</Typography>
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
