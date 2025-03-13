import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Checkbox,
  FormControlLabel,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Stack,
  Tabs,
  Tab,
  InputAdornment,
  Snackbar,
  Chip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

// ===== MUI Icons =====
import CampaignIcon from "@mui/icons-material/Campaign"; // Announcements
import EmailIcon from "@mui/icons-material/Email";       // Mailjet
import ForumIcon from "@mui/icons-material/Forum";       // Semaphore
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SendIcon from "@mui/icons-material/Send";


  // 1. Define a mapping from status ID to color and label:
  const statusColorMap = {
    1: "green",    // ACTIVE
    2: "orange",   // FROZEN
    3: "blue",     // ON-HOLD
    4: "gray",     // TERMINATED
    5: "red",      // EXPIRED
    6: "purple",   // NEW MEMBER
  };

  const statusLabelMap = {
    1: "ACTIVE",
    2: "FROZEN",
    3: "ON-HOLD",
    4: "TERMINATED",
    5: "EXPIRED",
    6: "NEW MEMBER",
  };


// ---------- DataGrid columns for Mailjet and Semaphore ----------
const mailjetColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 200 },
  {
    field: "MemberStatusID",
    headerName: "Status",
    width: 150,
    renderCell: (params) => {
      const statusId = params.value;
      const label = statusLabelMap[statusId] || `Status ${statusId}`;
      const bgColor = statusColorMap[statusId] || "black";
  
      return (
        <Chip
          label={label}
          style={{ backgroundColor: bgColor, color: "white" }}
        />
      );
    },
  },
];

const semaphoreColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Phone", headerName: "Phone", width: 180 },
  {
    field: "MemberStatusID",
    headerName: "Status",
    width: 120,
    renderCell: (params) => {
      const statusId = params.value;
      const label = statusLabelMap[statusId] || `Status ${statusId}`;
      const bgColor = statusColorMap[statusId] || "black";
  
      return (
        <Chip
          label={label}
          style={{ backgroundColor: bgColor, color: "white" }}
        />
      );
    },
  },
];

// (Optional) For staff selection
const staffColumns = [
  { field: "StaffID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 220 },
  { field: "Role", headerName: "Role", width: 150 },
];

export default function Notifications() {
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Staff Notification
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [staffSubject, setStaffSubject] = useState("");
  const [staffMessage, setStaffMessage] = useState("");

  // Mailjet Templated Email
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMailjetIDs, setSelectedMailjetIDs] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [mailjetFilterStatus, setMailjetFilterStatus] = useState("All");
  const [mailjetShowExpiring, setMailjetShowExpiring] = useState(false);
  // State for Mailjet activity logs
  const [mailjetActivityLogs, setMailjetActivityLogs] = useState([]);
  // Search term for Email Activity Logs
  const [logSearchTerm, setLogSearchTerm] = useState("");

  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  // Semaphore
  const [semaphoreMembers, setSemaphoreMembers] = useState([]);
  const [selectedSemaphoreIDs, setSelectedSemaphoreIDs] = useState([]);
  const [semaphoreNumbers, setSemaphoreNumbers] = useState("");
  const [semaphoreMessage, setSemaphoreMessage] = useState("");
  const [semaphoreSenderName, setSemaphoreSenderName] = useState("");
  const [semaphoreFilterStatus, setSemaphoreFilterStatus] = useState("All");

  // Staff Personal Notification
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaffIDs, setSelectedStaffIDs] = useState([]);
  const [staffNotificationSubject, setStaffNotificationSubject] = useState("");
  const [staffNotificationMessage, setStaffNotificationMessage] = useState("");
  const [staffSender, setStaffSender] = useState("admin");
  const [staffNotifications, setStaffNotifications] = useState([]);

  // Member Statuses
  const [memberStatuses, setMemberStatuses] = useState([]);

  // ─────────────────────────────────────────────────────────
  // Confirmation Dialog States
  // ─────────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmCallback, setConfirmCallback] = useState(null);

  const openConfirmDialog = (title, message, callback) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
    setConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setConfirmTitle("");
    setConfirmMessage("");
    setConfirmCallback(null);
  };

  const handleConfirm = () => {
    if (confirmCallback) confirmCallback();
    handleCloseConfirm();
  };

  //formatter
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
  // ─────────────────────────────────────────────────────────
  // Snackbar
  // ─────────────────────────────────────────────────────────
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const showSuccessMessage = (msg) => {
    setSnackMessage(msg);
    setSnackOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Lifecycle & Data Loading
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadAnnouncements();
    loadAllMembersMailjet();
    loadAllMembersSemaphore();
    loadMemberStatuses();
    loadStaffList();
  }, [activeTab]);

  // Load Mailjet activity logs when Mailjet tab is active
  useEffect(() => {
    if (activeTab === 1) {
      loadMailjetActivityLogs();
    }
  }, [activeTab]);

  const loadAnnouncements = async () => {
    try {
      const res = await axios.get("/notifications/announcements");
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      alert("Failed to load announcements.");
    }
  };

  const loadAllMembersMailjet = async () => {
    try {
      const res = await axios.get("/membership/members");
      setAllMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load mailjet members:", error);
    }
  };

  const loadAllMembersSemaphore = async () => {
    try {
      const res = await axios.get("/membership/members");
      setSemaphoreMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load semaphore members:", error);
    }
  };

  const loadMemberStatuses = async () => {
    const statuses = [
      { id: "All", name: "All" },
      { id: "1", name: "ACTIVE" },
      { id: "2", name: "FROZEN" },
      { id: "3", name: "ON-HOLD" },
      { id: "4", name: "TERMINATED" },
      { id: "5", name: "EXPIRED" },
      { id: "6", name: "NEW MEMBER" },
    ];
    setMemberStatuses(statuses);
  };

  const loadStaffList = async () => {
    try {
      const response = await axios.get("/staff");
      setStaffList(response.data || []);
    } catch (error) {
      console.error("Failed to load staff list:", error);
    }
  };

  const loadMailjetActivityLogs = async () => {
    try {
      const res = await axios.get("/notifications/mailjet-activity-logs");
      setMailjetActivityLogs(res.data.logs || []);
    } catch (error) {
      console.error("Error loading Mailjet logs:", error);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Announcements
  // ─────────────────────────────────────────────────────────
  const handleAddAnnouncement = async () => {
    if (!newTopic.trim() || !newMessage.trim()) {
      alert("Please fill out both Topic and Message.");
      return;
    }
    try {
      const res = await axios.post("/notifications/announcements", {
        topic: newTopic,
        message: newMessage,
      });
      setAnnouncements((prev) => [res.data, ...prev]);
      setNewTopic("");
      setNewMessage("");
      showSuccessMessage("Announcement added!");
    } catch (error) {
      console.error("Add announcement failed:", error);
      alert("Failed to add announcement.");
    }
  };

  const handleEditOpen = (announcement) => {
    const lines = announcement.Message.split("\n");
    const rawTopic = lines[0].replace("Topic: ", "").trim();
    const rawMsg = lines.slice(1).join("\n").trim();
    setEditData({
      id: announcement.NotificationID,
      topic: rawTopic,
      message: rawMsg,
    });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSave = async () => {
    if (!editData.topic.trim() || !editData.message.trim()) {
      alert("Please fill out Topic and Message.");
      return;
    }
    try {
      const res = await axios.put(`/notifications/announcements/${editData.id}`, {
        topic: editData.topic,
        message: editData.message,
      });
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.NotificationID === editData.id ? res.data : ann
        )
      );
      setEditOpen(false);
      showSuccessMessage("Announcement updated!");
    } catch (error) {
      console.error("Edit announcement failed:", error);
      alert("Failed to edit announcement.");
    }
  };

  const doDeleteAnnouncement = async (notifId) => {
    try {
      await axios.delete(`/notifications/announcements/${notifId}`);
      setAnnouncements((prev) =>
        prev.filter((a) => a.NotificationID !== notifId)
      );
      showSuccessMessage("Announcement deleted.");
    } catch (error) {
      console.error("Delete announcement failed:", error);
      alert("Failed to delete announcement.");
    }
  };

  const handleDeleteAnnouncement = (notifId) => {
    const ann = announcements.find((a) => a.NotificationID === notifId);
    if (!ann) return;
    openConfirmDialog(
      "Delete Announcement",
      `Are you sure you want to delete "${ann.Message.substring(0, 30)}..."?`,
      () => doDeleteAnnouncement(notifId)
    );
  };

  // ─────────────────────────────────────────────────────────
  // Staff-Specific Announcements
  // ─────────────────────────────────────────────────────────
  const handleStaffSelection = (staffIds) => {
    setSelectedStaff(staffIds);
  };

  const handleSendStaffAnnouncement = async () => {
    if (!staffSubject.trim() || !staffMessage.trim()) {
      alert("Please fill out the Subject and Message.");
      return;
    }
    if (selectedStaff.length === 0) {
      alert("Please select at least one staff member.");
      return;
    }
    const payload = {
      staffIds: selectedStaff,
      subject: staffSubject,
      message: staffMessage,
    };

    try {
      const resp = await axios.post("/notifications/send-staff", payload);
      showSuccessMessage(resp.data.message || "Staff notification sent!");
      setSelectedStaff([]);
      setStaffSubject("");
      setStaffMessage("");
    } catch (error) {
      console.error("Failed to send staff notification:", error);
      alert("Error sending staff notification.");
    }
  };

  // ─────────────────────────────────────────────────────────
  // Mailjet
  // ─────────────────────────────────────────────────────────
  const handleMailjetSelection = (ids) => {
    setSelectedMailjetIDs(ids);
  };

  const doSendMailjetTemplate = async () => {
    try {
      const response = await axios.post("/notifications/send-mailjet-template", {
        templateId: Number(templateId),
        memberIds: selectedMailjetIDs,
      });

      if (response.data.status === "success") {
        showSuccessMessage("Template emails sent!");
        setSelectedMailjetIDs([]);
        loadMailjetActivityLogs();
      } else if (response.data.status === "no-action") {
        alert("No valid members or emails found.");
      } else {
        console.error("Mailjet error response:", response.data);
        alert("Some issue occurred. Check logs.");
      }
    } catch (error) {
      console.error("Mailjet template send failed:", error);
      alert("Failed to send Mailjet template.");
    }
  };

  const handleSendMailjetTemplate = () => {
    if (!templateId.trim()) {
      alert("Please enter the Mailjet Template ID.");
      return;
    }
    if (selectedMailjetIDs.length === 0) {
      alert("Please select at least one member.");
      return;
    }
    openConfirmDialog(
      "Send Templated Email",
      `Send Mailjet template #${templateId} to ${selectedMailjetIDs.length} member(s)?`,
      doSendMailjetTemplate
    );
  };

  // Transform logs: map MemberID to MemberName using allMembers
  const transposedLogs = mailjetActivityLogs.map((log) => {
    const member = allMembers.find((m) => m.MemberID === log.MemberID);
    return { ...log, MemberName: member ? member.FullName : log.MemberID };
  });

  // Filter logs by search term (searching in MemberName and Message)
  const filteredLogs = transposedLogs.filter(
    (log) =>
      log.MemberName.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.Message.toLowerCase().includes(logSearchTerm.toLowerCase())
  );

  // Define columns for the Mailjet Activity Logs with custom rendering for Status
  const logColumns = [
    { field: "NotificationID", headerName: "ID", width: 70 },
    { field: "MemberName", headerName: "Member", width: 150 },
    {
      field: "Status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        let bgColor = "";
        if (status === "Sent") bgColor = "green";
        else if (status === "Failed") bgColor = "red";
        else if (status === "Pending") bgColor = "blue";
        else if (status === "Queued") bgColor = "orange";
        return <Chip label={status} style={{ backgroundColor: bgColor, color: "white" }} />;
      },
    },
    { field: "timestamp", headerName: "Sent Date", width: 250,  renderCell: (params) =>
      params.value ? formatDateTime(params.value) : "—",},
    { field: "Message", headerName: "Message", width: 250 },
  ];

  const filteredMailjetMembers = React.useMemo(() => {
    const today = new Date();
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
  
    return allMembers.filter((m) => {
      // Filter by search term on FullName or Email
      if (memberSearchTerm) {
        const search = memberSearchTerm.toLowerCase();
        if (
          !m.FullName.toLowerCase().includes(search) &&
          !m.Email.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (mailjetShowExpiring) {
        if (!m.MembershipEndDate) return false;
        const endDateObj = new Date(m.MembershipEndDate);
        if (endDateObj <= today) return false;
        if (endDateObj > next7) return false;
      }
      return true;
    });
  }, [allMembers, mailjetFilterStatus, mailjetShowExpiring, memberSearchTerm]);

  const handleSendExpiryReminderSelected = async () => {
    if (selectedMailjetIDs.length === 0) {
      alert("Please select at least one member.");
      return;
    }
    try {
      const response = await axios.post(
        "/notifications/send-expiring-reminder-selected",
        { memberIds: selectedMailjetIDs }
      );
      if (response.data.status === "success") {
        showSuccessMessage("Expiry reminders sent for selected members!");
      } else {
        alert(response.data.message || "Some issue occurred. Check logs.");
      }
      setSelectedMailjetIDs([]);
    } catch (error) {
      console.error("Failed to send expiry reminders for selected members:", error);
      alert("Error sending expiry reminders for selected members.");
    }
  };

  const handleSendExpiryReminder = async () => {
    try {
      const res = await axios.get("/notifications/send-expiring-reminder");
      if (res.data.status === "success") {
        showSuccessMessage("Expiry reminder emails sent!");
      } else if (res.data.status === "no-action") {
        alert("No members expiring in 7 days.");
      } else {
        alert("An error occurred. Please check the logs.");
      }
    } catch (error) {
      console.error("Failed to send expiring reminder:", error);
      alert("Failed to send expiry reminder.");
    }
  };

  // ─────────────────────────────────────────────────────────
  // Semaphore
  // ─────────────────────────────────────────────────────────
  const handleSemaphoreSelection = (ids) => {
    setSelectedSemaphoreIDs(ids);
  };

  const handleAutoFillSemaphoreNumbers = () => {
    const selectedRows = semaphoreMembers.filter((m) =>
      selectedSemaphoreIDs.includes(m.MemberID)
    );

    const phones = selectedRows
      .map((m) => {
        if (!m.Phone) return null;
        let formatted = m.Phone.replace(/\D/g, "");
        if (formatted.startsWith("09")) {
          formatted = "63" + formatted.substring(1);
        }
        return formatted;
      })
      .filter(Boolean);

    if (phones.length === 0) {
      alert("No valid phone numbers among selected members.");
      return;
    }
    setSemaphoreNumbers(phones.join(","));
  };

  const doSendSemaphoreSMS = async () => {
    const payload = {
      numbers: semaphoreNumbers,
      message: semaphoreMessage,
      senderName: semaphoreSenderName || "Contnental",
    };
    try {
      const resp = await axios.post("/notifications/send-semaphore-sms", payload);
      if (resp.data.status === "success" || resp.data.status === "partial") {
        showSuccessMessage(
          `SMS sent successfully! Sent: ${resp.data.successCount}, Failed: ${resp.data.failCount}`
        );
        setSemaphoreNumbers("");
        setSemaphoreMessage("");
        setSemaphoreSenderName("");
      } else {
        console.error("Semaphore API Response Error:", resp.data);
        alert(`Something went wrong: ${resp.data.message}`);
      }
    } catch (error) {
      console.error("Semaphore SMS error:", error);
      alert("Error sending Semaphore SMS. Check logs.");
    }
  };

  const handleSendSemaphoreSMS = () => {
    if (!semaphoreNumbers.trim()) {
      alert("Please provide at least one mobile number.");
      return;
    }
    if (!semaphoreMessage.trim()) {
      alert("Please enter your SMS message.");
      return;
    }
    openConfirmDialog(
      "Send SMS",
      `Send the above message to:\n${semaphoreNumbers}`,
      doSendSemaphoreSMS
    );
  };

  const filteredSemaphoreMembers = semaphoreMembers.filter((m) => {
    if (semaphoreFilterStatus === "All") return true;
    return String(m.MemberStatusID) === semaphoreFilterStatus;
  });

  // ─────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab icon={<CampaignIcon />} label="Announcements" />
        <Tab icon={<EmailIcon />} label="Mailjet" />
        <Tab icon={<ForumIcon />} label="Semaphore" />
      </Tabs>

      {/* ---------------------- TAB 0: Announcements & Staff Notifications ---------------------- */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* ==================== Add a General Announcement ==================== */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6">Add Announcement</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Topic"
                  fullWidth
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CampaignIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Message"
                  fullWidth
                  multiline
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddAnnouncement}
                >
                  Add Announcement
                </Button>
              </Stack>
            </Paper>
            {/* =============== STAFF-SPECIFIC ANNOUNCEMENT MODULE =============== */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Send Announcement to Specific Staff
              </Typography>
              <Stack spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Subject"
                  fullWidth
                  value={staffSubject}
                  onChange={(e) => setStaffSubject(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CampaignIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Message"
                  fullWidth
                  multiline
                  rows={2}
                  value={staffMessage}
                  onChange={(e) => setStaffMessage(e.target.value)}
                />
              </Stack>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Staff to Receive This Announcement
              </Typography>
              <div style={{ width: "100%", height: 300, marginBottom: 16 }}>
                <DataGrid
                  rows={staffList}
                  columns={staffColumns}
                  getRowId={(row) => row.StaffID}
                  checkboxSelection
                  rowSelectionModel={selectedStaff}
                  onRowSelectionModelChange={(newSelection) => {
                    const numericIDs = newSelection.map(Number);
                    handleStaffSelection(numericIDs);
                  }}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              </div>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSendStaffAnnouncement}
              >
                Send to Staff
              </Button>
            </Paper>
          </Grid>

          {/* ==================== Display Recent Announcements ==================== */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Recent Announcements
              </Typography>
              {announcements.length === 0 ? (
                <Typography>No announcements yet...</Typography>
              ) : (
                announcements.map((ann) => {
                  const lines = ann.Message.split("\n");
                  const parsedTopic = lines[0].replace("Topic: ", "").trim();
                  const parsedMsg = lines.slice(1).join("\n").trim();
                  return (
                    <Box
                      key={ann.NotificationID}
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 1,
                        p: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {parsedTopic}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {parsedMsg}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditOpen(ann)}
                          >
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            sx={{ color: "red", ml: 1 }}
                            onClick={() =>
                              handleDeleteAnnouncement(ann.NotificationID)
                            }
                          >
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ---------------------- TAB 1: Mailjet ---------------------- */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mailjet Templated Email
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Need to create or edit a new template?{" "}
            <a
              href="https://app.mailjet.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              Go to Mailjet Dashboard
            </a>
          </Typography>

          {!mailjetShowExpiring && (
            <Stack spacing={2} sx={{ mb: 2, maxWidth: 400 }}>
              <TextField
                label="Mailjet Template ID"
                fullWidth
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          )}

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={mailjetFilterStatus}
                  label="Filter by Status"
                  onChange={(e) => setMailjetFilterStatus(e.target.value)}
                >
                  {memberStatuses.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      {st.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mailjetShowExpiring}
                  onChange={(e) => setMailjetShowExpiring(e.target.checked)}
                  color="primary"
                />
              }
              label="Expiring in 7 days"
            />
          </Box>

          <Grid container spacing={2}>
            {/* Left: Member Selection DataGrid */}
            <Grid item xs={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Select Members to Receive the Template
              </Typography>
              <TextField
                  label="Search Members"
                  fullWidth
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <div style={{ width: "100%", height: 400 }}>
                <DataGrid
                  rows={filteredMailjetMembers}
                  columns={mailjetColumns}
                  getRowId={(row) => row.MemberID}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection) => {
                    handleMailjetSelection(newSelection.map(Number));
                  }}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              </div>
            </Grid>

            {/* Right: Email Activity Logs */}
            <Grid item xs={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Email Activity Logs
              </Typography>
              <TextField
                label="Search Logs"
                fullWidth
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                sx={{ mb: 1 }}
              />
              <div style={{ width: "100%", height: 400 }}>
                <DataGrid
                  rows={filteredLogs}
                  columns={logColumns}
                  getRowId={(row) => row.NotificationID}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              </div>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            {mailjetShowExpiring ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendExpiryReminder}
                >
                  Send Expiry Reminders to All Expiring Members
                </Button>
                {selectedMailjetIDs.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendExpiryReminderSelected}
                  >
                    Send Expiry Reminder to Selected Members
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSendMailjetTemplate}
              >
                Send Templated Email
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* ---------------------- TAB 2: Semaphore ---------------------- */}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Send SMS via Semaphore
          </Typography>
          <Box sx={{ mb: 2, maxWidth: 300 }}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={semaphoreFilterStatus}
                label="Filter by Status"
                onChange={(e) => setSemaphoreFilterStatus(e.target.value)}
              >
                {memberStatuses.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            (Optional) Select members to pull their phone numbers
          </Typography>
          <div style={{ width: "100%", height: 300, marginBottom: 16 }}>
            <DataGrid
              rows={filteredSemaphoreMembers}
              columns={semaphoreColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              rowSelectionModel={selectedSemaphoreIDs}
              onRowSelectionModelChange={(newSelection) => {
                setSelectedSemaphoreIDs(newSelection.map(Number));
              }}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </div>
          <Button
            variant="outlined"
            sx={{ mb: 2 }}
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAutoFillSemaphoreNumbers}
          >
            Auto-Fill from Selected
          </Button>
          <Stack spacing={2} sx={{ maxWidth: 600 }}>
            <TextField
              label='Recipient Number(s)'
              placeholder='e.g. "09998887777,09171234567"'
              fullWidth
              value={semaphoreNumbers}
              onChange={(e) => setSemaphoreNumbers(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ForumIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="SMS Message"
              multiline
              rows={2}
              fullWidth
              value={semaphoreMessage}
              onChange={(e) => setSemaphoreMessage(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CampaignIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Sender Name (optional)"
              placeholder="Defaults to SEMAPHORE"
              fullWidth
              value={semaphoreSenderName}
              onChange={(e) => setSemaphoreSenderName(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleSendSemaphoreSMS}
            >
              Send via Semaphore
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ================== EDIT ANNOUNCEMENT DIALOG ================== */}
      <Dialog
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <>
              <TextField
                label="Topic"
                fullWidth
                margin="normal"
                name="topic"
                value={editData.topic}
                onChange={handleEditChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CampaignIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={3}
                margin="normal"
                name="message"
                value={editData.message}
                onChange={handleEditChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================== CONFIRMATION DIALOG ================== */}
      <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent dividers>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================== SNACKBAR FOR SUCCESS ================== */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </Box>
  );
}
