import React, { useState } from "react";
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// Mock staff data
const staffList = [
  { id: 1, name: "Alice (Trainer)" },
  { id: 2, name: "Bob (Coach)" },
  { id: 3, name: "Carol (Admin)" },
  { id: 4, name: "David (Trainer)" }
];

export default function Notifications() {
  // ----------------- STATE: ANNOUNCEMENT LIST -----------------
  const [announcements, setAnnouncements] = useState([
    {
      id: 101,
      topic: "Gym Renovation Update",
      message: "We will be renovating the cardio section next week!",
    },
    {
      id: 102,
      topic: "Holiday Promo",
      message: "Enjoy our 20% discount for all memberships this December.",
    },
  ]);

  // For "Add Announcement" form
  const [newTopic, setNewTopic] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // --------------- Add Announcement ---------------
  const handleAddAnnouncement = () => {
    if (!newTopic || !newMessage) {
      alert("Please fill out both Topic and Message.");
      return;
    }
    const newId = Date.now(); // or use any unique ID logic
    const newAnnouncement = {
      id: newId,
      topic: newTopic,
      message: newMessage,
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setNewTopic("");
    setNewMessage("");
  };

  // --------------- Edit Announcement ---------------
  const [isEditOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEditOpen = (ann) => {
    setEditData({ ...ann });
    setEditOpen(true);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSave = () => {
    if (!editData.topic || !editData.message) {
      alert("Please fill out Topic and Message.");
      return;
    }
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === editData.id ? { ...editData } : ann))
    );
    setEditOpen(false);
  };

  // --------------- Delete Announcement ---------------
  const handleDeleteAnnouncement = (annId) => {
    setAnnouncements((prev) => prev.filter((ann) => ann.id !== annId));
  };

  // ----------------- STATE: SEND NOTIFICATION TO STAFF -----------------
  // We'll let user pick staff from a multi-select or checkboxes:
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [notifSubject, setNotifSubject] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  const handleStaffToggle = (staffId) => {
    // If staff is selected, remove; otherwise add
    setSelectedStaff((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const handleSendToStaff = () => {
    if (selectedStaff.length === 0) {
      alert("Please select at least one staff to notify.");
      return;
    }
    if (!notifSubject || !notifMessage) {
      alert("Please provide a notification subject and message.");
      return;
    }
    // Here you would call an API to send notifications to these staff
    console.log("Sending notification to staff IDs:", selectedStaff);
    console.log("Subject:", notifSubject);
    console.log("Message:", notifMessage);
    alert("Notification sent successfully!");
    // Reset
    setSelectedStaff([]);
    setNotifSubject("");
    setNotifMessage("");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications & Announcements
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* SEND ANNOUNCEMENT FORM */}
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
            sx={{ alignSelf: "flex-start", backgroundColor: "secondary", color: "black" }}
          >
            Publish Announcement
          </Button>
        </Box>
      </Paper>

      {/* RECENT ANNOUNCEMENTS */}
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
            {announcements.map((ann) => (
              <ListItem
                key={ann.id}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditOpen(ann)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteAnnouncement(ann.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={ann.topic}
                  secondary={ann.message}
                  primaryTypographyProps={{
                    fontWeight: 600,
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* SEND NOTIFICATION TO STAFF */}
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
                key={staff.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Checkbox
                  checked={selectedStaff.includes(staff.id)}
                  onChange={() => handleStaffToggle(staff.id)}
                />
                <Typography variant="body2">{staff.name}</Typography>
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
            sx={{ alignSelf: "flex-start", backgroundColor: "secondary", color: "black" }}
            onClick={handleSendToStaff}
          >
            Send to Staff
          </Button>
        </Box>
      </Paper>

      {/* EDIT ANNOUNCEMENT DIALOG */}
      <Dialog open={isEditOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
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
