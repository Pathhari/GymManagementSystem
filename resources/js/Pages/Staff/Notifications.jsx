import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Tabs,
  Tab,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Autocomplete from "@mui/material/Autocomplete";

// ===== MUI Icons =====
import CampaignIcon from "@mui/icons-material/Campaign"; // For Announcements
import EmailIcon from "@mui/icons-material/Email";       // For Mailjet
import ForumIcon from "@mui/icons-material/Forum";       // For Semaphore
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
];

const semaphoreColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Phone", headerName: "Phone", width: 180 },
  { field: "MemberStatusID", headerName: "StatusID", width: 100 },
];

export default function StaffNotifications({ staffId }) {
  // -------------------------------------------------------------------
  //                         STATE & HOOKS
  // -------------------------------------------------------------------
  // We keep three tabs: Announcements, Mailjet, and Semaphore.
  // In the Announcements tab we also display the staff’s personal notifications.
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // ------------------ A) Announcements (Read-Only for Staff) ------------------
  const [announcements, setAnnouncements] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [isViewOpen, setViewOpen] = useState(false);
  const [staffNotifications, setStaffNotifications] = useState([]);

  // ------------------ B) Mailjet Templated Email (Same as Owner Side) ------------------
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMailjetIDs, setSelectedMailjetIDs] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [mailjetFilterStatus, setMailjetFilterStatus] = useState("All");

  // ------------------ C) Semaphore SMS (Same as Owner Side) ------------------
  const [semaphoreMembers, setSemaphoreMembers] = useState([]);
  const [selectedSemaphoreIDs, setSelectedSemaphoreIDs] = useState([]);
  const [semaphoreNumbers, setSemaphoreNumbers] = useState("");
  const [semaphoreMessage, setSemaphoreMessage] = useState("");
  const [semaphoreSenderName, setSemaphoreSenderName] = useState("");
  const [semaphoreFilterStatus, setSemaphoreFilterStatus] = useState("All");

  // ------------------ Member Statuses ------------------
  const [memberStatuses, setMemberStatuses] = useState([]);

  // -------------------------------------------------------------------
  //                   USE EFFECT: LOAD DATA
  // -------------------------------------------------------------------
  useEffect(() => {
    loadAnnouncements();
    loadStaffNotifications();
    loadAllMembersMailjet();
    loadAllMembersSemaphore();
    loadMemberStatuses();
  }, [staffId]);

  // Load announcements (global)
  const loadAnnouncements = async () => {
    try {
      const res = await axios.get("/notifications/announcements");
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      alert("Failed to load announcements.");
    }
  };

  // Load personal notifications for this staff using their unique staffId
  const loadStaffNotifications = async () => {
    try {
      const res = await axios.get(`/notifications/staff/${staffId}`);
      console.log("Staff notifications:", res.data);
      setStaffNotifications(res.data || []);
    } catch (error) {
      console.error("Failed to load staff notifications:", error);
    }
  };

  // Load all members for Mailjet (unchanged)
  const loadAllMembersMailjet = async () => {
    try {
      const res = await axios.get("/membership/members");
      setAllMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load members for Mailjet:", error);
    }
  };

  // Load all members for Semaphore (unchanged)
  const loadAllMembersSemaphore = async () => {
    try {
      const res = await axios.get("/membership/members");
      setSemaphoreMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load members for Semaphore:", error);
    }
  };

  // Hard-coded statuses (or fetch from API)
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

  // ------------------ MAILJET FUNCTIONS (Same as Owner Side) ------------------
  const handleMailjetSelection = (ids) => setSelectedMailjetIDs(ids);

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
        templateId: parseInt(templateId, 10),
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

  const filteredMailjetMembers = allMembers.filter((m) =>
    mailjetFilterStatus === "All" ? true : String(m.MemberStatusID) === mailjetFilterStatus
  );

  // ------------------ SEMAPHORE FUNCTIONS (Same as Owner Side) ------------------
  const handleSemaphoreSelection = (ids) => setSelectedSemaphoreIDs(ids);

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

  const filteredSemaphoreMembers = semaphoreMembers.filter((m) =>
    semaphoreFilterStatus === "All" ? true : String(m.MemberStatusID) === semaphoreFilterStatus
  );


  const handleViewAnnouncement = (announcement) => {
    setViewData(announcement);
    setViewOpen(true);
};

  // ------------------ RENDER ------------------
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Staff Notifications
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Tabs: 0 = Announcements, 1 = Mailjet, 2 = Semaphore */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab icon={<CampaignIcon />} label="Announcements" />
        <Tab icon={<EmailIcon />} label="Mailjet" />
        <Tab icon={<ForumIcon />} label="Semaphore" />
      </Tabs>

      {/* TAB 0: Announcements and Personal Staff Notifications */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={3}>
            {/* Global Announcements (read-only) */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Announcements
                </Typography>
                {announcements.length === 0 ? (
                  <Typography>No announcements yet...</Typography>
                ) : (
                  announcements.map((ann) => {
                    const lines = ann.Message.split("\n");
                    const parsedTopic = lines[0].replace("Topic: ", "").trim();
                    const parsedMsg = lines.slice(1).join("\n").trim();
                    return (
                        <Box key={ann.NotificationID} sx={{ border: "1px solid #ccc", borderRadius: 1, p: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {parsedTopic}
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                {parsedMsg}
                            </Typography>
                            <Button onClick={() => handleViewAnnouncement({ topic: parsedTopic, message: parsedMsg })}>
                                View
                            </Button>
                        </Box>
                    );
                  })
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Personal Notifications for the logged-in staff */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  My Personal Notifications
                </Typography>
                {staffNotifications.length === 0 ? (
                  <Typography>No personal notifications yet...</Typography>
                ) : (
                  staffNotifications.map((notif) => (
                    <Box
                      key={notif.NotificationID}
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 1,
                        p: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        From: {notif.Sender || "Unknown"}
                      </Typography>
                      <Typography variant="subtitle2">
                        Subject: {notif.Subject || "No Subject"}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {notif.Message}
                      </Typography>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* TAB 1: Mailjet Templated Email (unchanged) */}
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
          <Box sx={{ mb: 2, maxWidth: 300 }}>
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
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Members to Receive the Template
          </Typography>
          <div style={{ width: "100%", height: 400 }}>
            <DataGrid
              rows={filteredMailjetMembers}
              columns={mailjetColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              onSelectionModelChange={(newSelection) =>
                handleMailjetSelection(newSelection)
              }
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

      {/* TAB 2: Semaphore SMS (unchanged) */}
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
              rows={semaphoreMembers.filter((m) =>
                semaphoreFilterStatus === "All"
                  ? true
                  : String(m.MemberStatusID) === semaphoreFilterStatus
              )}
              columns={semaphoreColumns}
              getRowId={(row) => row.MemberID}
              checkboxSelection
              onSelectionModelChange={(newSelection) =>
                setSelectedSemaphoreIDs(newSelection)
              }
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
              label="Recipient Number(s)"
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

      {/* VIEW ANNOUNCEMENT DIALOG */}
      <Dialog open={isViewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="sm">
    <DialogTitle>View Announcement</DialogTitle>
    <DialogContent dividers>
        {viewData && (
            <>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Topic: {viewData.topic}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {viewData.message}
                </Typography>
            </>
        )}
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setViewOpen(false)}>Close</Button>
    </DialogActions>
</Dialog>
    </Box>
  );
}
