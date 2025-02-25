import React, { useState, useEffect } from "react";
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
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Stack,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

// ===== MUI Icons =====
import CampaignIcon from "@mui/icons-material/Campaign";        // For Announcements Tab
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"; // For Expiring Membership Tab
import MarkunreadMailboxIcon from "@mui/icons-material/MarkunreadMailbox"; // For Bulk SMS & Email Tab
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive"; // For Ad-hoc
import GroupsIcon from "@mui/icons-material/Groups";            // For Staff Notification
import EmailIcon from "@mui/icons-material/Email";              // For Mailjet Template Tab
import ForumIcon from "@mui/icons-material/Forum";              // For Semaphore Tab
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SendIcon from "@mui/icons-material/Send";
import SmsIcon from "@mui/icons-material/Sms";

// ---------------- DataGrid columns ----------------
const allMembersColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 220 },
];

const expiringColumns = [
  { field: "MemberID", headerName: "ID", width: 80 },
  { field: "name", headerName: "Name", width: 180 },
  {
    field: "expiry_date",
    headerName: "Expiry Date",
    width: 180,
    valueGetter: (params) =>
      params.row.expiry_date
        ? new Date(params.row.expiry_date).toLocaleDateString()
        : "",
  },
  { field: "Email", headerName: "Email", width: 220 },
];

// Columns for the "SMS Member Selection" DataGrid
const smsColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Phone", headerName: "Phone", width: 180 },
];

export default function Notifications() {
  // ---------------------------------------------------
  //                  STATES & HOOKS
  // ---------------------------------------------------
  // 1) Tab
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 2) Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // 3) Bulk SMS & Bulk Email
  const [bulkSMSMessage, setBulkSMSMessage] = useState("");
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");

  // 4) Ad-hoc Notification
  const [adHocMemberID, setAdHocMemberID] = useState("");
  const [adHocMethod, setAdHocMethod] = useState("SMS");
  const [adHocMessage, setAdHocMessage] = useState("");

  // 5) Staff Notification
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [notifSubject, setNotifSubject] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // 6) Expiring Membership
  const [expiringMembers, setExpiringMembers] = useState([]);

  // 7) Mailjet Templated Email
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberIDs, setSelectedMemberIDs] = useState([]);
  const [templateId, setTemplateId] = useState("");

  // 8) Semaphore SMS
  const [semaphoreNumbers, setSemaphoreNumbers] = useState("");
  const [semaphoreMessage, setSemaphoreMessage] = useState("");
  const [semaphoreSenderName, setSemaphoreSenderName] = useState("");

  // 9) SMS Members
  const [smsMembers, setSmsMembers] = useState([]);
  const [selectedSMSMemberIDs, setSelectedSMSMemberIDs] = useState([]);

  // ---------------------------------------------------
  //                 USE EFFECTS (LOAD DATA)
  // ---------------------------------------------------
  useEffect(() => {
    loadAnnouncements();
    loadStaff();
    loadExpiringMembers();
    loadAllMembers();
    loadMembersForSMS();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await axios.get("/notifications/announcements");
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      alert("Failed to load announcements from server.");
    }
  };

  const loadStaff = async () => {
    try {
      const res = await axios.get("/staff");
      setStaffList(res.data || []);
    } catch (error) {
      console.error("Error loading staff:", error);
    }
  };

  const loadExpiringMembers = async () => {
    try {
      const res = await axios.get("/membership/expiring?days=7");
      setExpiringMembers(res.data || []);
    } catch (error) {
      console.error("Failed to load expiring members:", error);
    }
  };

  const loadAllMembers = async () => {
    try {
      const res = await axios.get("/membership/members");
      setAllMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load all members:", error);
    }
  };

  const loadMembersForSMS = async () => {
    try {
      const res = await axios.get("/membership/members");
      setSmsMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load members for SMS:", error);
    }
  };

  // ---------------------------------------------------
  //       ANNOUNCEMENTS: ADD / EDIT / DELETE
  // ---------------------------------------------------
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
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
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
      setAnnouncements((prev) =>
        prev.filter((a) => a.NotificationID !== notifId)
      );
    } catch (error) {
      console.error("Delete announcement failed:", error);
      alert("Failed to delete announcement.");
    }
  };

  // ---------------------------------------------------
  //                 STAFF NOTIFICATION
  // ---------------------------------------------------
  const handleStaffToggle = (staffId) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSendToStaff = async () => {
    if (!selectedStaff.length) {
      alert("Please select at least one staff to notify.");
      return;
    }
    if (!notifSubject.trim() || !notifMessage.trim()) {
      alert("Provide subject and message.");
      return;
    }
    try {
      await axios.post("/notifications/send-staff", {
        staffIds: selectedStaff,
        subject: notifSubject,
        message: notifMessage,
      });
      alert("Staff notification sent!");
      setSelectedStaff([]);
      setNotifSubject("");
      setNotifMessage("");
    } catch (error) {
      console.error("Sending staff notification failed:", error);
      alert("Failed to send notification to staff.");
    }
  };

  // ---------------------------------------------------
  //                 BULK SMS & EMAIL
  // ---------------------------------------------------
  const handleSendBulkSMS = async () => {
    if (!bulkSMSMessage.trim()) {
      alert("Enter the SMS message.");
      return;
    }
    try {
      await axios.post("/notifications/send/bulk-sms", {
        message: bulkSMSMessage,
      });
      alert("Bulk SMS sent!");
      setBulkSMSMessage("");
    } catch (error) {
      console.error("Bulk SMS failed:", error);
      alert("Failed to send bulk SMS.");
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailSubject.trim() || !bulkEmailBody.trim()) {
      alert("Fill out subject and body.");
      return;
    }
    try {
      await axios.post("/notifications/send/bulk-email", {
        subject: bulkEmailSubject,
        body: bulkEmailBody,
      });
      alert("Bulk Email sent!");
      setBulkEmailSubject("");
      setBulkEmailBody("");
    } catch (error) {
      console.error("Bulk email failed:", error);
      alert("Failed to send bulk email.");
    }
  };

  // ---------------------------------------------------
  //                 AD-HOC NOTIFICATION
  // ---------------------------------------------------
  const handleSendAdHoc = async () => {
    if (!adHocMemberID.trim() || !adHocMessage.trim()) {
      alert("Provide MemberID and Message.");
      return;
    }
    try {
      await axios.post("/notifications/send/ad-hoc", {
        MemberID: adHocMemberID,
        method: adHocMethod,
        message: adHocMessage,
      });
      alert("Ad-hoc notification sent!");
      setAdHocMemberID("");
      setAdHocMessage("");
    } catch (error) {
      console.error("Ad-hoc notify failed:", error);
      alert("Failed to send ad-hoc notification.");
    }
  };

  // ---------------------------------------------------
  //      EXPIRING MEMBERSHIP (MAILJET REMINDER)
  // ---------------------------------------------------
  const handleSendExpiringMembershipEmails = async () => {
    if (!window.confirm("Send expiring membership reminder emails via Mailjet?")) {
      return;
    }
    try {
      const response = await axios.get("/notifications/send-expiring-reminder");
      if (response.data.status === "success") {
        alert("Expiring membership emails sent!");
      } else if (response.data.status === "no-action") {
        alert("No members expiring soon.");
      } else {
        console.warn(response.data);
        alert("Mailjet: Some issue occurred. Check logs.");
      }
    } catch (error) {
      console.error("Mailjet send failed:", error);
      alert("Failed to send expiring membership emails.");
    }
  };

  // ---------------------------------------------------
  //       MAILJET TEMPLATED EMAIL (CUSTOM TEMPLATE)
  // ---------------------------------------------------
  const handleMemberSelection = (ids) => {
    setSelectedMemberIDs(ids);
  };

  const handleSendMailjetTemplate = async () => {
    if (!templateId.trim()) {
      alert("Please enter the Mailjet Template ID.");
      return;
    }
    if (selectedMemberIDs.length === 0) {
      alert("Please select at least one member.");
      return;
    }
    if (
      !window.confirm(
        `Send Mailjet template #${templateId} to ${selectedMemberIDs.length} member(s)?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.post("/notifications/send-mailjet-template", {
        templateId: parseInt(templateId, 10),
        memberIds: selectedMemberIDs,
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

  // ---------------------------------------------------
  //                 SEMAPHORE SMS
  // ---------------------------------------------------
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
      // Clear fields
      setSemaphoreNumbers("");
      setSemaphoreMessage("");
      setSemaphoreSenderName("");
    } catch (error) {
      console.error("Sending Semaphore SMS failed:", error);
      alert("Semaphore SMS error. Check console or logs.");
    }
  };

  // Auto-fill phone numbers from selected rows in SMS DataGrid
  const handleAutoFillNumbers = () => {
    const selectedRows = smsMembers.filter((m) =>
      selectedSMSMemberIDs.includes(m.MemberID)
    );
    const phones = selectedRows
      .map((m) => m.Phone)
      .filter((p) => !!p && p.trim().length > 0);

    if (phones.length === 0) {
      alert("No valid phone numbers among selected members.");
      return;
    }
    setSemaphoreNumbers(phones.join(","));
  };

  // ---------------------------------------------------
  //                    RENDER
  // ---------------------------------------------------
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* -------------------- TABS -------------------- */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab icon={<CampaignIcon />} label="Announcements" />
        <Tab icon={<CalendarMonthIcon />} label="Expiring" />
        <Tab icon={<MarkunreadMailboxIcon />} label="Bulk SMS & Email" />
        <Tab icon={<NotificationsActiveIcon />} label="Ad-hoc" />
        <Tab icon={<GroupsIcon />} label="Staff" />
        <Tab icon={<EmailIcon />} label="Mailjet" />
        <Tab icon={<ForumIcon />} label="Semaphore" />
      </Tabs>

      {/* ========================== TAB PANELS ========================== */}
      {/* -------------------- TAB 0: Announcements -------------------- */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left: Add Announcement */}
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

          {/* Right: Recent Announcements */}
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
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-line" }}
                      >
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

      {/* ------------------ TAB 1: Expiring Memberships ------------------ */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">
              Expiring Memberships (Next 7 Days)
            </Typography>
            <Button
              variant="contained"
              color="warning"
              startIcon={<CalendarMonthIcon />}
              onClick={handleSendExpiringMembershipEmails}
            >
              Send Expiring Emails
            </Button>
          </Box>
          <div style={{ width: "100%", height: 400 }}>
            <DataGrid
              rows={expiringMembers}
              columns={expiringColumns}
              getRowId={(row) => row.MemberID}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </div>
        </Paper>
      )}

      {/* ------------------ TAB 2: Bulk SMS & Email ------------------ */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Bulk SMS */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Bulk SMS</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="SMS Message"
                  fullWidth
                  multiline
                  rows={2}
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SmsIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendBulkSMS}
                >
                  Send Bulk SMS
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Bulk Email */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Bulk Email</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Subject"
                  fullWidth
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Email Body"
                  fullWidth
                  multiline
                  rows={3}
                  value={bulkEmailBody}
                  onChange={(e) => setBulkEmailBody(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendBulkEmail}
                >
                  Send Bulk Email
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ------------------ TAB 3: Ad-hoc Notification ------------------ */}
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ad-hoc Notification
          </Typography>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 600 }}>
            <TextField
              label="Member ID"
              fullWidth
              value={adHocMemberID}
              onChange={(e) => setAdHocMemberID(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GroupsIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select
                value={adHocMethod}
                label="Method"
                onChange={(e) => setAdHocMethod(e.target.value)}
              >
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={3}
              value={adHocMessage}
              onChange={(e) => setAdHocMessage(e.target.value)}
            />
            <Button
              variant="contained"
              color="success"
              startIcon={<NotificationsActiveIcon />}
              onClick={handleSendAdHoc}
            >
              Send Ad-hoc
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ------------------ TAB 4: Staff Notification ------------------ */}
      {activeTab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Notify Staff
          </Typography>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 600 }}>
            <TextField
              label="Subject"
              fullWidth
              value={notifSubject}
              onChange={(e) => setNotifSubject(e.target.value)}
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
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
            />
            {/* Staff List */}
            <Box
              sx={{
                maxHeight: 120,
                overflowY: "auto",
                border: "1px solid #ccc",
                p: 1,
              }}
            >
              {staffList.map((staff) => (
                <Box
                  key={staff.id}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Checkbox
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => handleStaffToggle(staff.id)}
                  />
                  <Typography>{staff.name}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendToStaff}
            >
              Send to Staff
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ------------------ TAB 5: Mailjet Templates ------------------ */}
      {activeTab === 5 && (
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

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Members to Receive the Template
          </Typography>
          <div style={{ width: "100%", height: 400 }}>
            <DataGrid
              rows={allMembers}
              columns={allMembersColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              onSelectionModelChange={(newSelection) => {
                handleMemberSelection(newSelection);
              }}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </div>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendMailjetTemplate}
            >
              Send Templated Email
            </Button>
          </Box>
        </Paper>
      )}

      {/* ------------------ TAB 6: Semaphore SMS ------------------ */}
      {activeTab === 6 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Send SMS via Semaphore
          </Typography>

          {/* 1) DataGrid to pick which members to text */}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            (Optional) Select members to pull their phone numbers
          </Typography>
          <div style={{ width: "100%", height: 300, marginBottom: 16 }}>
            <DataGrid
              rows={smsMembers}
              columns={smsColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              rowSelectionModel={selectedSMSMemberIDs}
              onRowSelectionModelChange={(newSelection) => {
                setSelectedSMSMemberIDs(newSelection);
              }}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </div>
          <Button
            variant="outlined"
            sx={{ mb: 2 }}
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAutoFillNumbers}
          >
            Auto-Fill from Selected
          </Button>

          {/* 2) Manual fields for custom phone input */}
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
                    <SmsIcon />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ForumIcon />
                  </InputAdornment>
                ),
              }}
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
