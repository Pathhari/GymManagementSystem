import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DesktopDateTimePicker } from "@mui/x-date-pickers/DesktopDateTimePicker";
import { Close as CloseIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import axios from "axios";

export default function ManageAvailabilityDialog({
  open,
  onClose,
  coach,
  onSave // callback to refresh the coach data after changes
}) {
  const [availabilities, setAvailabilities] = useState([]);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  // Load coach.availabilities once when the dialog opens
  useEffect(() => {
    if (open && coach?.availabilities) {
      setAvailabilities(coach.availabilities);
    }
  }, [open, coach]);

  const handleAddAvailability = async () => {
    if (!newStart || !newEnd || !coach?.CoachID) return;

    // 1) Validate the date/time BEFORE the POST
    if (dayjs(newEnd).isBefore(dayjs(newStart))) {
      alert("End time must be after start time!");
      return;
    }

    try {
      // 2) Submit to server
      const response = await axios.post(
        `/coaches/${coach.CoachID}/availabilities`,
        {
          Start: newStart,
          End: newEnd
        }
      );

      // Make sure response.data.availability has { id, Start, End }
      const createdSlot = response.data.availability;

      // 3) Update local state so it appears immediately
      setAvailabilities((prev) => [...prev, createdSlot]);

      // 4) Reset inputs
      setNewStart("");
      setNewEnd("");
    } catch (err) {
      console.error("Error adding availability:", err);
      alert("Failed to add availability. See console for details.");
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    if (!coach?.CoachID) return;
    try {
      await axios.delete(
        `/coaches/${coach.CoachID}/availabilities/${availabilityId}`
      );
      setAvailabilities((prev) => prev.filter((av) => av.id !== availabilityId));
    } catch (err) {
      console.error("Error deleting availability:", err);
      alert("Failed to delete availability. See console.");
    }
  };

  const formatSlot = (datetime) => {
    if (!datetime) return "—";
    const parsed = dayjs(datetime);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : "Invalid";
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Manage Availabilities: {coach?.FullName || "—"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!coach ? (
          <Typography>No coach selected.</Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Below are the timeslots representing this coach’s availability.
            </Typography>

            {/* Existing timeslots */}
            <List>
              {availabilities.map((slot) => (
                <ListItem
                  key={slot.id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDeleteAvailability(slot.id)}
                    >
                      Delete
                    </Button>
                  }
                >
                  <ListItemText
                    primary={`${formatSlot(slot.Start)} - ${formatSlot(slot.End)}`}
                  />
                </ListItem>
              ))}
            </List>

            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Timeslot
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DesktopDateTimePicker
                    label="Start"
                    value={newStart ? dayjs(newStart) : null}
                    onChange={(newVal) => {
                      if (newVal && newVal.isValid()) {
                        setNewStart(newVal.format("YYYY-MM-DD HH:mm:ss"));
                      } else {
                        setNewStart("");
                      }
                    }}
                    format="YYYY-MM-DD HH:mm"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DesktopDateTimePicker
                    label="End"
                    value={newEnd ? dayjs(newEnd) : null}
                    onChange={(newVal) => {
                      if (newVal && newVal.isValid()) {
                        setNewEnd(newVal.format("YYYY-MM-DD HH:mm:ss"));
                      } else {
                        setNewEnd("");
                      }
                    }}
                    format="YYYY-MM-DD HH:mm"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddAvailability}>
                    Add Timeslot
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            // Optionally re-fetch in parent
            onSave && onSave();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
