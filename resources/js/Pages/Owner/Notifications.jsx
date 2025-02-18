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
  List,
  ListItem,
  ListItemText,
  Checkbox,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Stack
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const allMembersColumns = [
  { field: "MemberID", headerName: "ID", width: 70 },
  { field: "FullName", headerName: "Name", width: 180 },
  { field: "Email", headerName: "Email", width: 220 },
];

// Columns for expiring members
const expiringColumns = [
  { field: "MemberID", headerName: "ID", width: 80 },
  { field: "name", headerName: "Name", width: 180 },
  {
    field: "expiry_date",
    headerName: "Expiry Date",
    width: 180,
    valueGetter: (params) => {
      return params.row.expiry_date
        ? new Date(params.row.expiry_date).toLocaleDateString()
        : "";
    },
  },
  { field: "Email", headerName: "Email", width: 220 },
];

export default function Notifications() {
  // ---------------------------------------------------
  // 1. Announcements
  // ---------------------------------------------------
  const [announcements, setAnnouncements] = useState([]);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [newTopic, setNewTopic] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // ---------------------------------------------------
  // 2. Bulk SMS & Bulk Email
  // ---------------------------------------------------
  const [bulkSMSMessage, setBulkSMSMessage] = useState("");
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");

  // ---------------------------------------------------
  // 3. Ad-hoc Notification
  // ---------------------------------------------------
  const [adHocMemberID, setAdHocMemberID] = useState("");
  const [adHocMethod, setAdHocMethod] = useState("SMS");
  const [adHocMessage, setAdHocMessage] = useState("");

  // ---------------------------------------------------
  // 4. Staff Notification
  // ---------------------------------------------------
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [notifSubject, setNotifSubject] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // ---------------------------------------------------
  // 5. Expiring Membership
  // ---------------------------------------------------
  const [expiringMembers, setExpiringMembers] = useState([]);

  // ---------------------------------------------------
  // 6. Mailjet Templated Email
  // ---------------------------------------------------
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberIDs, setSelectedMemberIDs] = useState([]);
  const [templateId, setTemplateId] = useState("");

  // ---------------------------------------------------
  // useEffect: load everything on mount
  // ---------------------------------------------------
  useEffect(() => {
    loadAnnouncements();
    loadStaff();
    loadExpiringMembers();
    loadAllMembers();
  }, []);

  // ---------------------------------------------------
  // Loaders
  // ---------------------------------------------------
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
      // Suppose res.data has { members: [...] }
      setAllMembers(res.data.members || []);
    } catch (error) {
      console.error("Failed to load all members:", error);
    }
  };

  // ---------------------------------------------------
  // Announcements logic
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
  // Staff logic
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
  // Bulk SMS & Email
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
  // Ad-hoc Notification
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
  // Expiring membership (Mailjet)
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
  // Mailjet Templated Email
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
  // Rendering
  // ---------------------------------------------------
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* ================== ANNOUNCEMENTS ================== */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Add Announcement</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Topic"
                fullWidth
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
              />
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddAnnouncement}>
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

        {/* ================== EXPIRING MEMBERSHIP ================== */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">
                Expiring Memberships (Next 7 Days)
              </Typography>
              <Button
                variant="contained"
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
        </Grid>

        {/* ================== BULK SMS & BULK EMAIL ================== */}
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
              />
              <Button variant="contained" onClick={handleSendBulkSMS}>
                Send Bulk SMS
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Bulk Email</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Subject"
                fullWidth
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
              />
              <TextField
                label="Email Body"
                fullWidth
                multiline
                rows={3}
                value={bulkEmailBody}
                onChange={(e) => setBulkEmailBody(e.target.value)}
              />
              <Button variant="contained" onClick={handleSendBulkEmail}>
                Send Bulk Email
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ================== AD-HOC NOTIFICATION ================== */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Ad-hoc Notification</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Member ID"
                fullWidth
                value={adHocMemberID}
                onChange={(e) => setAdHocMemberID(e.target.value)}
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
              <Button variant="contained" onClick={handleSendAdHoc}>
                Send Ad-hoc
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ================== STAFF NOTIFICATION ================== */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Notify Staff</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Subject"
                fullWidth
                value={notifSubject}
                onChange={(e) => setNotifSubject(e.target.value)}
              />
              <TextField
                label="Message"
                fullWidth
                multiline
                rows={2}
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
              />
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
              <Button variant="contained" onClick={handleSendToStaff}>
                Send to Staff
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ================== MAILJET TEMPLATED EMAIL ================== */}
        <Grid item xs={12}>
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

            <Stack spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Mailjet Template ID"
                fullWidth
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
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
              <Button variant="contained" onClick={handleSendMailjetTemplate}>
                Send Templated Email
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
