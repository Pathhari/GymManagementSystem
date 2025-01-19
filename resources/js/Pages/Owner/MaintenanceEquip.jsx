import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"; // "Available"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // "InMaintenance"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"; // "OutOfService"

////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////

// Reorder items in the same list
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Decide background color for each column
const droppableBackground = {
  availableList: "#A6AEBF",
  maintenanceList: "#F4DEB3",
  outServiceList: "#C96868",
};

// Draggable item styling
const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: 12,
  margin: "0 0 8px 0",
  fontSize: "0.95rem",
  background: isDragging ? "#673ab7" : "#fafafa",
  color: isDragging ? "#fff" : "#000",
  border: "1px solid #ccc",
  borderRadius: 6,
  transition: "all 0.2s ease",
  ...draggableStyle,
});

// Droppable column styling
const getListStyle = (droppableId, isDraggingOver) => ({
  background: isDraggingOver
    ? "#eeeeee"
    : droppableBackground[droppableId] || "#f5f5f5",
  padding: 8,
  width: 300,
  minHeight: 370,
  borderRadius: 4,
  transition: "background 0.2s",
});

////////////////////////////////////////////////////////////////////////////////
// The main component
////////////////////////////////////////////////////////////////////////////////
export default function MaintenanceEquip() {
  // --------------------------------------------------------------------------
  // 1) Real-Time Clock (just for display)
  // --------------------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // --------------------------------------------------------------------------
  // 2) Equipment State & Fetching
  // --------------------------------------------------------------------------
  const [equipment, setEquipment] = useState([]);
  
  // You may have actual numeric IDs or different branches in your DB.
  // If you want a drop-down for branches, define them here:
  const branchOptions = ["All Branches", "1", "2", "3"];

  // Fetch equipment from /operations/equipment
  useEffect(() => {
    fetch("/operations/equipment", { method: "GET" })
      .then((res) => res.json()) 
      .then((data) => {
        // Depending on how you return data from Laravel:
        //   - If using Inertia, you might need data.props.equipment
        //   - If returning plain JSON, it might just be data.equipment
        const eq = data.equipment || data.props?.equipment || [];
        setEquipment(eq);
      })
      .catch((err) => console.error("Error fetching equipment:", err));
  }, []);

  // --------------------------------------------------------------------------
  // 3) Maintenance Logs State & Fetching
  // --------------------------------------------------------------------------
  const [logs, setLogs] = useState([]);

  // Fetch logs from /operations/maintenance-logs
  useEffect(() => {
    fetch("/operations/maintenance-logs", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        // data.logs might be the array
        const logsArray = data.logs || [];
        setLogs(logsArray);
      })
      .catch((err) => console.error("Error fetching maintenance logs:", err));
  }, []);

  // --------------------------------------------------------------------------
  // 4) Branch Filter (for columns)
  // --------------------------------------------------------------------------
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  // Filter equipment if branch != "All Branches"
  const filteredEquipment =
    selectedBranch === "All Branches"
      ? equipment
      : equipment.filter(
          (eq) => String(eq.BranchID) === String(selectedBranch)
        );

  // Separate columns by status
  const availableEquip = filteredEquipment.filter((eq) => eq.Status === "Available");
  const maintenanceEquip = filteredEquipment.filter((eq) => eq.Status === "InMaintenance");
  const outOfServiceEquip = filteredEquipment.filter((eq) => eq.Status === "OutOfService");

  // --------------------------------------------------------------------------
  // 5) Add Equipment Dialog
  // --------------------------------------------------------------------------
  const [isAddOpen, setAddOpen] = useState(false);
  const [newEquipData, setNewEquipData] = useState({
    // If EquipmentID is auto-increment in your DB, omit it
    Name: "",
    SerialNumber: "",
    BranchID: "", // or 0 if numeric
  });
  const [addError, setAddError] = useState("");

  const handleAddOpen = () => {
    setNewEquipData({ Name: "", SerialNumber: "", BranchID: "" });
    setAddError("");
    setAddOpen(true);
  };

  const handleAddEquipChange = (e) => {
    const { name, value } = e.target;
    setNewEquipData((prev) => ({ ...prev, [name]: value }));
  };

  const refetchEquipment = () => {
    fetch("/operations/equipment", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        const eq = data.equipment || data.props?.equipment || [];
        setEquipment(eq);
      })
      .catch((err) => console.error("Error refetching equipment:", err));
  };

  const handleAddEquipSubmit = () => {
    if (!newEquipData.Name || !newEquipData.SerialNumber) {
      setAddError("Please fill out required fields (Name, SerialNumber).");
      return;
    }

    // Building payload to match your "storeEquipment" method
    const payload = {
      // If your EquipmentID is auto-increment, do NOT include it here
      Name: newEquipData.Name,
      SerialNumber: newEquipData.SerialNumber,
      Status: "Available", // newly added equipment defaults to Available
      BranchID: newEquipData.BranchID || null,
    };

    fetch("/operations/equipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": window.csrfToken, // or however you handle CSRF
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not save equipment.");
        return res;
      })
      .then(() => {
        // Refresh the list from the server so we see the new item
        refetchEquipment();
        setAddOpen(false);
      })
      .catch((err) => {
        console.error(err);
        setAddError("Error saving new equipment.");
      });
  };

  // --------------------------------------------------------------------------
  // 6) Drag & Drop Logic
  // --------------------------------------------------------------------------
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Same column reorder
    if (
      source.droppableId === destination.droppableId &&
      source.index !== destination.index
    ) {
      let updatedList = [];
      if (source.droppableId === "availableList") {
        updatedList = reorder(availableEquip, source.index, destination.index);
        applyReorderToEquipment(updatedList, "Available");
      } else if (source.droppableId === "maintenanceList") {
        updatedList = reorder(maintenanceEquip, source.index, destination.index);
        applyReorderToEquipment(updatedList, "InMaintenance");
      } else if (source.droppableId === "outServiceList") {
        updatedList = reorder(outOfServiceEquip, source.index, destination.index);
        applyReorderToEquipment(updatedList, "OutOfService");
      }
      return;
    }

    // Different column => change status
    if (source.droppableId !== destination.droppableId) {
      handleChangeStatus(source, destination);
    }
  };

  // Rebuild the equipment array in state after reordering
  const applyReorderToEquipment = (newArr, status) => {
    const others = equipment.filter((eq) => eq.Status !== status);
    const final = [...others, ...newArr.map((item) => ({ ...item, Status: status }))];
    setEquipment(final);
  };

  const getListFromDroppable = (droppableId) => {
    if (droppableId === "availableList") return availableEquip;
    if (droppableId === "maintenanceList") return maintenanceEquip;
    return outOfServiceEquip;
  };

  // --------------------------------------------------------------------------
  // 7) Status-Change (Modal)
  // --------------------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    EquipmentID: null,
    oldStatus: "",
    newStatus: "",
    reason: "",
    date: "",
    time: "",
  });
  const [modalEquipItem, setModalEquipItem] = useState(null);

  const handleChangeStatus = (source, destination) => {
    const srcList = getListFromDroppable(source.droppableId);
    const [movedItem] = srcList.splice(source.index, 1);

    let newStatus = "Available";
    if (destination.droppableId === "maintenanceList") newStatus = "InMaintenance";
    if (destination.droppableId === "outServiceList") newStatus = "OutOfService";

    setModalEquipItem(movedItem);
    setModalData({
      EquipmentID: movedItem.EquipmentID,
      oldStatus: movedItem.Status,
      newStatus,
      reason: "",
      date: "",
      time: "",
    });
    setModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    // Re-fetch or revert local changes if needed. 
  };

  const handleModalSave = () => {
    const { EquipmentID, oldStatus, newStatus, reason, date, time } = modalData;
    if (!EquipmentID || !date || !time) {
      alert("Please specify date/time for the status change.");
      return;
    }

    // 1) Update the equipment status via /operations/equipment
    // We'll fetch the old record from local state to fill in missing fields:
    const eq = modalEquipItem || {};
    const payload = {
      EquipmentID: eq.EquipmentID,
      Name: eq.Name,
      SerialNumber: eq.SerialNumber,
      Status: newStatus,
      BranchID: eq.BranchID,
    };

    fetch("/operations/equipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": window.csrfToken,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update equipment status.");
        return res;
      })
      .then(() => {
        // 2) Optionally add a maintenance log if moving to InMaintenance or OutOfService
        if (newStatus === "InMaintenance" || newStatus === "OutOfService") {
          const logPayload = {
            EquipmentID: eq.EquipmentID,
            MaintenanceDate: date, // could combine date/time if you prefer
            IssueDescription: reason,
            Resolution: "",
            MaintainedBy: null,
            NextMaintenanceDate: null,
            Notes: `Status changed from ${oldStatus} to ${newStatus} at ${time}.`,
          };

          return fetch("/operations/equipment/maintenance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": window.csrfToken,
            },
            body: JSON.stringify(logPayload),
          });
        }
      })
      .then(() => {
        // Local state update
        setEquipment((prev) =>
          prev.map((item) => {
            if (item.EquipmentID === EquipmentID) {
              return { ...item, Status: newStatus };
            }
            return item;
          })
        );
        // Also refresh logs from the server so we see the new entry
        refetchLogs();
        setModalOpen(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Error updating status or adding maintenance log.");
      });
  };

  const refetchLogs = () => {
    fetch("/operations/maintenance-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch((err) => console.error(err));
  };

  // --------------------------------------------------------------------------
  // 8) Remove (Delete) an Equipment (if you want)
  //    You do NOT have an explicit DELETE route for equipment in your snippet,
  //    so this is optional or depends on your setup.
  // --------------------------------------------------------------------------
  const removeEquipment = (EquipmentID) => {
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;

    // If you have a DELETE route for equipment, call it here.
    // Otherwise, you can just remove from local state (but not from DB).
    setEquipment((prev) => prev.filter((eq) => eq.EquipmentID !== EquipmentID));
  };

  // --------------------------------------------------------------------------
  // 9) Activity Logs (Server-Synced) - Editing and Deleting
  //    The logs we have in `logs` come from the server. We'll show them in
  //    a list and allow editing (PUT) or deleting (DELETE).
  // --------------------------------------------------------------------------
  // For editing a single log:
  const [editLogIndex, setEditLogIndex] = useState(null);
  const [editLogText, setEditLogText] = useState("");

  const handleEditLog = (logItem, idx) => {
    setEditLogIndex(idx);
    // We'll store the entire log JSON as text, or just the relevant part.
    // For simplicity, let's store the "IssueDescription" or "Notes" in a big text field.
    // Or store them combined. That’s up to you.
    const combined = `Issue: ${logItem.IssueDescription}\nResolution: ${logItem.Resolution}\nNotes: ${logItem.Notes}`;
    setEditLogText(combined);
  };

  const handleSaveLogEdit = () => {
    if (editLogIndex == null) return;

    // We need the log's ID to update on the server:
    const logToEdit = logs[editLogIndex];
    if (!logToEdit) {
      setEditLogIndex(null);
      return;
    }

    // For a more robust solution, you'd parse `editLogText` into fields again.
    // Example: we might set IssueDescription, Resolution, or Notes from the text.
    // For a simpler example, let's assume we only want to update `Notes`.
    const updatedLog = { ...logToEdit, Notes: editLogText };

    fetch(`/operations/maintenance-logs/${logToEdit.MaintenanceLogID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": window.csrfToken,
      },
      body: JSON.stringify(updatedLog),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update maintenance log.");
        return res.json();
      })
      .then(() => {
        // Re-fetch logs or update local state
        refetchLogs();
        setEditLogIndex(null);
        setEditLogText("");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleCancelLogEdit = () => {
    setEditLogIndex(null);
    setEditLogText("");
  };

  // For deleting a log
  const deleteLog = (logId) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;

    fetch(`/operations/maintenance-logs/${logId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": window.csrfToken,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error deleting log.");
        // Re-fetch
        refetchLogs();
      })
      .catch((err) => console.error(err));
  };

  // Clear all logs (a naive approach: iterate and delete)
  const clearAllLogs = () => {
    if (!window.confirm("Really delete all logs?")) return;
    // Delete each log from the server
    const promises = logs.map((log) =>
      fetch(`/operations/maintenance-logs/${log.MaintenanceLogID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": window.csrfToken,
        },
      })
    );

    Promise.all(promises)
      .then(() => {
        refetchLogs();
      })
      .catch((err) => console.error("Failed clearing all logs:", err));
  };

  // Limit logs displayed if you want
  const truncatedLogs = logs.slice(0, 15);

  // --------------------------------------------------------------------------
  // 10) Rendering the Draggable Items
  // --------------------------------------------------------------------------
  const renderDraggableItem = (item, index) => (
    <Draggable
      key={String(item.EquipmentID)}
      draggableId={String(item.EquipmentID)}
      index={index}
    >
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
          <Box sx={{ textAlign: "right" }}>
            <IconButton
              size="small"
              onClick={() => removeEquipment(item.EquipmentID)}
              sx={{ color: "#f44336" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <strong>{item.EquipmentID}</strong> - {item.Name}
          <br />
          <small>SN: {item.SerialNumber}</small>
          <br />
          <small>Branch: {item.BranchID}</small>
        </Box>
      )}
    </Draggable>
  );

  // --------------------------------------------------------------------------
  // 11) Final Return (JSX Layout)
  // --------------------------------------------------------------------------
  return (
    <Box sx={{ display: "flex", gap: 3, p: 4, flexWrap: "wrap" }}>
      {/* Left side: Equipment Drag & Drop */}
      <Box flex={1} minWidth={600}>
        {/* Branch Filter */}
        <FormControl sx={{ mb: 2, minWidth: 180 }}>
          <InputLabel>Filter by Branch</InputLabel>
          <Select
            label="Filter by Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branchOptions.map((branchVal) => (
              <MenuItem key={branchVal} value={branchVal}>
                {branchVal}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h4" gutterBottom>
          Equipment Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddOpen}
          sx={{ mb: 3 }}
        >
          Add Equipment
        </Button>

        {/* Drag & Drop Columns */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {/* Available */}
            <Droppable droppableId="availableList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("availableList", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" gutterBottom textAlign="center">
                    <CheckBoxOutlineBlankIcon /> Available
                  </Typography>
                  {availableEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            {/* In Maintenance */}
            <Droppable droppableId="maintenanceList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("maintenanceList", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" gutterBottom textAlign="center">
                    <BuildCircleIcon /> In Maintenance
                  </Typography>
                  {maintenanceEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            {/* Out of Service */}
            <Droppable droppableId="outServiceList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("outServiceList", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" gutterBottom textAlign="center">
                    <ErrorOutlineIcon /> Out of Service
                  </Typography>
                  {outOfServiceEquip.map((eq, idx) => renderDraggableItem(eq, idx))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>
          </Box>
        </DragDropContext>
      </Box>

      {/* Right side: Activity Logs & Clock */}
      <Box sx={{ width: 320, maxWidth: "100%" }}>
        {/* Real-Time Clock */}
        <Paper
          sx={{
            p: 1,
            mb: 2,
            backgroundColor: "#424242",
            color: "#fff",
            textAlign: "center",
          }}
          elevation={3}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {clockString}
          </Typography>
        </Paper>

        <Typography variant="h5" gutterBottom>
          Activity
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ textAlign: "right", mb: 1 }}>
          <Button variant="outlined" color="secondary" onClick={clearAllLogs}>
            Clear All
          </Button>
        </Box>

        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#212121",
            color: "#fafafa",
            maxHeight: 600,
            overflowY: "auto",
          }}
          elevation={4}
        >
          {truncatedLogs.length === 0 ? (
            <Typography variant="body2" color="#ccc">
              No recent logs...
            </Typography>
          ) : (
            truncatedLogs.map((log, idx) => (
              <Box
                key={String(log.MaintenanceLogID)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  borderBottom: "1px solid #333",
                  pb: 1,
                }}
              >
                {/* Show a short summary of the log. Adjust as you wish. */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                    <strong>Log #{log.MaintenanceLogID}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                    Equipment #{log.EquipmentID} | Date: {log.MaintenanceDate}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                    Issue: {log.IssueDescription} | Resolution: {log.Resolution}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                    Notes: {log.Notes}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleEditLog(log, idx)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => deleteLog(log.MaintenanceLogID)}
                  sx={{ ml: 1, color: "red" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      {/* Dialog: Add Equipment */}
      <Dialog open={isAddOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Equipment</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Name"
            name="Name"
            fullWidth
            margin="normal"
            value={newEquipData.Name}
            onChange={handleAddEquipChange}
          />
          <TextField
            label="Serial Number"
            name="SerialNumber"
            fullWidth
            margin="normal"
            value={newEquipData.SerialNumber}
            onChange={handleAddEquipChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Branch</InputLabel>
            <Select
              label="Select Branch"
              name="BranchID"
              value={newEquipData.BranchID}
              onChange={handleAddEquipChange}
            >
              {branchOptions
                .filter((b) => b !== "All Branches")
                .map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {addError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {addError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEquipSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Status Transition Form */}
      <Dialog open={modalOpen} onClose={handleModalCancel} fullWidth maxWidth="sm">
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Equipment: {modalData.EquipmentID}
            <br />
            Changing from "{modalData.oldStatus}" to "{modalData.newStatus}".
          </Typography>
          <TextField
            label="Date"
            name="date"
            type="date"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={modalData.date}
            onChange={handleModalChange}
          />
          <TextField
            label="Time"
            name="time"
            type="time"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={modalData.time}
            onChange={handleModalChange}
          />
          <TextField
            label="Reason / Notes"
            name="reason"
            margin="normal"
            fullWidth
            multiline
            rows={3}
            value={modalData.reason}
            onChange={handleModalChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalCancel}>Cancel</Button>
          <Button variant="contained" onClick={handleModalSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Edit Log Entry */}
      <Dialog
        open={editLogIndex !== null}
        onClose={handleCancelLogEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Maintenance Log</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editLogText}
            onChange={(e) => setEditLogText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLogEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
