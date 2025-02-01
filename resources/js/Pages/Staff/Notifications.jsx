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


    </Box>
  );
}
