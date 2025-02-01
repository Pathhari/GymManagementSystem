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
  Checkbox
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
  const [staffList, setStaffList] = useState([]);       // Real staff from your StaffController
  const [selectedStaff, setSelectedStaff] = useState([]); 
  const [notifSubject, setNotifSubject] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  // ----------------- 3) LOAD DATA ON MOUNT -----------------
  useEffect(() => {
    loadAnnouncements();
    loadStaff();
  }, []);

  // --- A) Load announcements from /notifications/announcements
  const loadAnnouncements = async () => {
    try {
      const res = await axios.get("/notifications/announcements");
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Error loading announcements:", error);
      alert("Failed to load announcements from server.");
    }
  };

  // --- B) Load staff from /staff (or wherever your route is)
  const loadStaff = async () => {
    try {
      // If your route is /staff -> StaffController@indexStaffJson
      // adjust if needed
      const res = await axios.get("/staff");
      setStaffList(res.data);
    } catch (error) {
      console.error("Error loading staff:", error);
      alert("Failed to load staff from server.");
    }
  };

  // ----------------- 4) CREATE ANNOUNCEMENT -----------------
  const handleAddAnnouncement = async () => {
    if (!newTopic.trim() || !newMessage.trim()) {
      alert("Please fill out both Topic and Message.");
      return;
    }
    try {
      // POST /notifications/announcements
      const res = await axios.post("/notifications/announcements", {
        topic: newTopic,
        message: newMessage
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

  // ----------------- 5) EDIT ANNOUNCEMENT -----------------
  const handleEditOpen = (announcement) => {
    // Parse the "Topic:\nMessage" from announcement.Message
    const lines = announcement.Message.split("\n");
    const rawTopic = lines[0].replace("Topic: ", "").trim();
    const rawMsg = lines.slice(1).join("\n").trim();

    setEditData({
      id: announcement.NotificationID,
      topic: rawTopic,
      message: rawMsg
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
      const res = await axios.put(
        `/notifications/announcements/${editData.id}`,
        {
          topic: editData.topic,
          message: editData.message
        }
      );
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

  // ----------------- 6) DELETE ANNOUNCEMENT -----------------
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

  // ----------------- 7) NOTIFY STAFF -----------------
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
        message: notifMessage
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* CREATE NEW ANNOUNCEMENT */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Post a New Announcement
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField
            label="Topic / Subject"
            variant="outlined"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
          />
          <TextField
            label="Message"
            multiline
            rows={3}
            variant="outlined"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddAnnouncement}
            sx={{ 
              alignSelf: "flex-start", 
              backgroundColor: "secondary", 
              color: "black" 
            }}
          >
            Publish Announcement
          </Button>
        </Box>
      </Paper>

      {/* LIST ANNOUNCEMENTS */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Announcements
        </Typography>
        {announcements.length === 0 ? (
          <Typography variant="body2" sx={{ mt: 2 }}>
            No announcements yet...
          </Typography>
        ) : (
          <List sx={{ mt: 2 }}>
            {announcements.map((ann) => {
              // Parse "Topic: X\nMessage..."
              const lines = ann.Message.split("\n");
              const parsedTopic = lines[0].replace("Topic: ", "");
              const parsedMsg = lines.slice(1).join("\n");

              return (
                <ListItem
                  key={ann.NotificationID}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditOpen(ann)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteAnnouncement(ann.NotificationID)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={parsedTopic}
                    secondary={parsedMsg}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* NOTIFY STAFF */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Notify Staff
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select staff members you want to send a notification:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {staffList.map((staff) => (
              <Box
                key={staff.StaffID}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  px: 1,
                  py: 0.5
                }}
              >
                <Checkbox
                  checked={selectedStaff.includes(staff.StaffID)}
                  onChange={() => handleStaffToggle(staff.StaffID)}
                />
                <Typography variant="body2">{staff.FullName}</Typography>
              </Box>
            ))}
          </Box>

          <TextField
            label="Notification Subject"
            variant="outlined"
            value={notifSubject}
            onChange={(e) => setNotifSubject(e.target.value)}
          />
          <TextField
            label="Notification Message"
            multiline
            rows={3}
            variant="outlined"
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{ 
              alignSelf: "flex-start", 
              backgroundColor: "secondary", 
              color: "black" 
            }}
            onClick={handleSendToStaff}
          >
            Send to Staff
          </Button>
        </Box>
      </Paper>

      {/* EDIT ANNOUNCEMENT DIALOG */}
      <Dialog
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Topic / Subject"
                name="topic"
                variant="outlined"
                value={editData.topic}
                onChange={handleEditChange}
              />
              <TextField
                label="Message"
                name="message"
                multiline
                rows={3}
                variant="outlined"
                value={editData.message}
                onChange={handleEditChange}
              />
            </Box>
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
