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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { DataGrid } from "@mui/x-data-grid";

// ===== MUI Icons =====
import CampaignIcon from "@mui/icons-material/Campaign"; // Announcements
import EmailIcon from "@mui/icons-material/Email";       // Mailjet
import ForumIcon from "@mui/icons-material/Forum";       // Semaphore
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SendIcon from "@mui/icons-material/Send";

// ---------- DataGrid columns for Mailjet and Semaphore ----------
const mailjetColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 200 },
  { field: "MemberStatusID", headerName: "StatusID", width: 100 },
  // If you want to see the date in the grid:
  // { field: "MembershipEndDate", headerName: "Ends On", width: 140 },
];

const semaphoreColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Phone", headerName: "Phone", width: 180 },
  { field: "MemberStatusID", headerName: "StatusID", width: 100 },
];

// (Optional) For staff selection
const staffColumns = [
  { field: "StaffID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 220 },
  { field: "Role", headerName: "Role", width: 150 }, // Optional, helpful info
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

  // Member Statuses (Hard-coded statuses: 1=ACTIVE, 2=FROZEN, 3=ON-HOLD, 4=TERMINATED, 5=EXPIRED, 6=NEW MEMBER)
  const [memberStatuses, setMemberStatuses] = useState([]);

  useEffect(() => {
    loadAnnouncements();
    loadAllMembersMailjet();
    loadAllMembersSemaphore();
    loadMemberStatuses();
  }, []);

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

  // ===================== ANNOUNCEMENTS =====================
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
    } catch (error) {
      console.error("Edit announcement failed:", error);
      alert("Failed to edit announcement.");
    }
  };

  const handleDeleteAnnouncement = async (notifId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }
    try {
      await axios.delete(`/notifications/announcements/${notifId}`);
      setAnnouncements((prev) => prev.filter((a) => a.NotificationID !== notifId));
    } catch (error) {
      console.error("Delete announcement failed:", error);
      alert("Failed to delete announcement.");
    }
  };

  // ============== STAFF-SPECIFIC ANNOUNCEMENTS (sendStaffNotification) ==============
  const handleStaffSelection = (staffIds) => {
    // staffIds is an array of row IDs from the DataGrid
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
      alert(resp.data.message || "Staff notification sent!");
      // Optionally reset form
      setSelectedStaff([]);
      setStaffSubject("");
      setStaffMessage("");
    } catch (error) {
      console.error("Failed to send staff notification:", error);
      alert("Error sending staff notification.");
    }
  };

  // ===================== MAILJET =====================
  const handleMailjetSelection = (ids) => {
    setSelectedMailjetIDs(ids);
  };

  const handleSendMailjetTemplate = async () => {
    if (!templateId.trim()) {
      alert("Please enter the Mailjet Template ID.");
      return;
    }
    if (selectedMailjetIDs.length === 0) {
      alert("Please select at least one member.");
      return;
    }
    if (
      !window.confirm(
        `Send Mailjet template #${templateId} to ${selectedMailjetIDs.length} member(s)?`
      )
    ) {
      return;
    }
    try {
      const response = await axios.post("/notifications/send-mailjet-template", {
        templateId: Number(templateId),
        memberIds: selectedMailjetIDs,
      });
      if (response.data.status === "success") {
        alert("Template emails sent!");
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

  const filteredMailjetMembers = React.useMemo(() => {
    const today = new Date();
    const next7 = new Date();
    next7.setDate(next7.getDate() + 7); // 7 days from now

    return allMembers.filter((m) => {
      // 1) Check status
      if (
        mailjetFilterStatus !== "All" &&
        String(m.MemberStatusID) !== mailjetFilterStatus
      ) {
        return false;
      }

      // 2) Check if “Expiring in 7 days” is toggled
      if (mailjetShowExpiring) {
        if (!m.MembershipEndDate) return false;
        const endDateObj = new Date(m.MembershipEndDate);
        // Ensure we only take those strictly after "today" but on/before "next7"
        if (endDateObj <= today) return false;
        if (endDateObj > next7) return false;
      }
      return true;
    });
  }, [allMembers, mailjetFilterStatus, mailjetShowExpiring]);

  // ===================== SEMAPHORE =====================
  const handleSemaphoreSelection = (ids) => {
    setSelectedSemaphoreIDs(ids);
  };

  const handleAutoFillSemaphoreNumbers = () => {
    const selectedRows = semaphoreMembers.filter((m) =>
      selectedSemaphoreIDs.includes(m.MemberID)
    );
    const phones = selectedRows
      .map((m) => m.Phone)
      .filter((p) => p && p.trim() !== "");
    if (phones.length === 0) {
      alert("No valid phone numbers among selected members.");
      return;
    }
    setSemaphoreNumbers(phones.join(","));
  };

  const handleSendSemaphoreSMS = async () => {
    if (!semaphoreNumbers.trim()) {
      alert("Please provide at least one mobile number.");
      return;
    }
    if (!semaphoreMessage.trim()) {
      alert("Please enter your SMS message.");
      return;
    }
    const payload = {
      numbers: semaphoreNumbers,
      message: semaphoreMessage,
      senderName: semaphoreSenderName,
    };
    if (!window.confirm("Send the above message via Semaphore?")) {
      return;
    }
    try {
      const resp = await axios.post("/notifications/send-semaphore-sms", payload);
      if (resp.data && resp.data.status === "success") {
        alert("SMS successfully sent via Semaphore!");
      } else {
        alert("Something went wrong. Check logs or details.");
      }
      setSemaphoreNumbers("");
      setSemaphoreMessage("");
      setSemaphoreSenderName("");
    } catch (error) {
      console.error("Sending Semaphore SMS failed:", error);
      alert("Semaphore SMS error. Check console or logs.");
    }
  };

  const filteredSemaphoreMembers = semaphoreMembers.filter((m) => {
    if (semaphoreFilterStatus === "All") return true;
    return String(m.MemberStatusID) === semaphoreFilterStatus;
  });

  // ===================== RENDER =====================
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
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
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
          </Grid>

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
                          <IconButton size="small" onClick={() => handleEditOpen(ann)}>
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            sx={{ color: "red", ml: 1 }}
                            onClick={() => handleDeleteAnnouncement(ann.NotificationID)}
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

          {/* Filter UI: status + “expiring soon” checkbox */}
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
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Members to Receive the Template
          </Typography>
          <div style={{ width: "100%", height: 400 }}>
            <DataGrid
              rows={filteredMailjetMembers}
              columns={mailjetColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              onSelectionModelChange={(newSelection) => {
                handleMailjetSelection(newSelection);
              }}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </div>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={
                mailjetShowExpiring
                  ? handleSendExpiringReminder
                  : handleSendMailjetTemplate
              }
            >
              {mailjetShowExpiring
                ? "Send Expiry Reminders"
                : "Send Templated Email"}
            </Button>
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
                // newSelection might be ["1201", "1202"], so convert them if needed
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
    </Box>
  );
}
