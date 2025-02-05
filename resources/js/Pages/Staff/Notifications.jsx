import React, { useState, useEffect } from "react";
import {
  Box,
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
  ListItemSecondaryAction,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

export default function Notifications() {
  // ----------------- 1) ANNOUNCEMENTS -----------------
  const [announcements, setAnnouncements] = useState([]);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // For "Add Announcement" form
  const [newTopic, setNewTopic] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // ----------------- 2) STAFF (LOADED FROM BACKEND) -----------------
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [notifSubject, setNotifSubject] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // ----------------- 3) BULK SMS -----------------
  const [bulkSMSMessage, setBulkSMSMessage] = useState("");

  // ----------------- 4) BULK EMAIL -----------------
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");

  // ----------------- 5) AD-HOC NOTIFICATION -----------------
  const [adHocMemberID, setAdHocMemberID] = useState("");
  const [adHocMethod, setAdHocMethod] = useState("SMS");
  const [adHocMessage, setAdHocMessage] = useState("");

  // ----------------- 6) LOAD DATA ON MOUNT -----------------
  useEffect(() => {
    loadAnnouncements();
    loadStaff();
  }, []);

  // --- A) Load announcements from /notifications/announcements
  const loadAnnouncements = async () => {
    try {
      const res = await axios.get("/notifications/announcements");
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      alert("Failed to load announcements from server.");
    }
  };

  // --- B) Load staff from /staff (or wherever your route is)
  const loadStaff = async () => {
    try {
      // Adjust to your actual route for staff data
      const res = await axios.get("/staff");
      setStaffList(res.data);
    } catch (error) {
      console.error("Error loading staff:", error);
      alert("Failed to load staff from server.");
    }
  };

  // =========================================================
  // ANNOUNCEMENT METHODS
  // =========================================================
  const handleAddAnnouncement = async () => {
    if (!newTopic.trim() || !newMessage.trim()) {
      alert("Please fill out both Topic and Message.");
      return;
    }
    try {
      // POST /notifications/announcements
      const res = await axios.post("/notifications/announcements", {
        topic: newTopic,
        message: newMessage,
      });
      const newAnnouncement = res.data;
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setNewTopic("");
      setNewMessage("");
    } catch (error) {
      console.error("Add announcement failed:", error);
      alert("Failed to add announcement.");
    }
  };

  const handleEditOpen = (announcement) => {
    // The announcement.Message is typically "Topic: XYZ\nThe rest..."
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
      // PUT /notifications/announcements/:id
      const res = await axios.put(`/notifications/announcements/${editData.id}`, {
        topic: editData.topic,
        message: editData.message,
      });
      const updated = res.data;
      // Update local announcements
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.NotificationID === editData.id ? updated : ann
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

  // =========================================================
  // STAFF NOTIFICATION
  // =========================================================
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
      alert("Please provide a notification subject and message.");
      return;
    }
    try {
      // POST /notifications/send-staff
      await axios.post("/notifications/send-staff", {
        staffIds: selectedStaff,
        subject: notifSubject,
        message: notifMessage,
      });
      alert("Notification sent successfully!");
      setSelectedStaff([]);
      setNotifSubject("");
      setNotifMessage("");
    } catch (error) {
      console.error("Sending staff notification failed:", error);
      alert("Failed to send notification to staff.");
    }
  };

  // =========================================================
  // BULK SMS
  // =========================================================
  const handleSendBulkSMS = async () => {
    if (!bulkSMSMessage.trim()) {
      alert("Please enter the SMS message.");
      return;
    }
    try {
      // POST /notifications/send/bulk-sms
      await axios.post("/notifications/send/bulk-sms", {
        message: bulkSMSMessage,
        recipientGroup: "", // optional if your back end uses it
      });
      alert("Bulk SMS sent successfully!");
      setBulkSMSMessage("");
    } catch (error) {
      console.error("Sending bulk SMS failed:", error);
      alert("Failed to send bulk SMS.");
    }
  };

  // =========================================================
  // BULK EMAIL
  // =========================================================
  const handleSendBulkEmail = async () => {
    if (!bulkEmailSubject.trim() || !bulkEmailBody.trim()) {
      alert("Please fill out the subject and body.");
      return;
    }
    try {
      // POST /notifications/send/bulk-email
      await axios.post("/notifications/send/bulk-email", {
        subject: bulkEmailSubject,
        body: bulkEmailBody,
      });
      alert("Bulk Email sent successfully!");
      setBulkEmailSubject("");
      setBulkEmailBody("");
    } catch (error) {
      console.error("Sending bulk email failed:", error);
      alert("Failed to send bulk email.");
    }
  };

  // =========================================================
  // AD-HOC NOTIFICATION
  // =========================================================
  const handleSendAdHoc = async () => {
    if (!adHocMemberID.trim() || !adHocMessage.trim()) {
      alert("Please fill out the MemberID and Message fields.");
      return;
    }
    try {
      // POST /notifications/send/ad-hoc
      await axios.post("/notifications/send/ad-hoc", {
        MemberID: adHocMemberID,
        method: adHocMethod, // "SMS" or "Email"
        message: adHocMessage,
      });
      alert("Ad-hoc notification sent!");
      setAdHocMemberID("");
      setAdHocMessage("");
    } catch (error) {
      console.error("Sending ad-hoc notification failed:", error);
      alert("Failed to send ad-hoc notification.");
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ================== ANNOUNCEMENTS SECTION ================== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Announcements
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {announcements.length === 0 ? (
            <Typography variant="body2" sx={{ mt: 2 }}>
              No announcements yet...
            </Typography>
          ) : (
            <List>
              {announcements.map((ann) => {
                // Parse "Topic: X\nMessage..."
                const lines = ann.Message.split("\n");
                const parsedTopic = lines[0].replace("Topic: ", "").trim();
                const parsedMsg = lines.slice(1).join("\n").trim();

                return (
                  <ListItem
                    key={ann.NotificationID}
                    disableGutters
                    divider
                    sx={{ py: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {parsedTopic}
                        </Typography>
                      }
                      secondary={parsedMsg}
                    />
                    <ListItemSecondaryAction>
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
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>

      {/* ================== BULK SMS SECTION ================== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Bulk SMS
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <TextField
            label="SMS Message"
            fullWidth
            multiline
            rows={2}
            margin="normal"
            value={bulkSMSMessage}
            onChange={(e) => setBulkSMSMessage(e.target.value)}
          />
          <Button variant="contained" onClick={handleSendBulkSMS}>
            Send Bulk SMS
          </Button>
        </Paper>
      </Box>

      {/* ================== BULK EMAIL SECTION ================== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Bulk Email
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            value={bulkEmailSubject}
            onChange={(e) => setBulkEmailSubject(e.target.value)}
          />
          <TextField
            label="Email Body"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={bulkEmailBody}
            onChange={(e) => setBulkEmailBody(e.target.value)}
          />
          <Button variant="contained" onClick={handleSendBulkEmail}>
            Send Bulk Email
          </Button>
        </Paper>
      </Box>

      {/* ================== AD-HOC NOTIFICATION SECTION ================== */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ad-hoc Notification
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <TextField
            label="Member ID"
            fullWidth
            margin="normal"
            value={adHocMemberID}
            onChange={(e) => setAdHocMemberID(e.target.value)}
          />

          <FormControl fullWidth margin="normal">
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
            margin="normal"
            value={adHocMessage}
            onChange={(e) => setAdHocMessage(e.target.value)}
          />
          <Button variant="contained" onClick={handleSendAdHoc}>
            Send Ad-hoc
          </Button>
        </Paper>
      </Box>

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
