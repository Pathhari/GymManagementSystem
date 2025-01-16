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
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"; // "Available"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // "InMaintenance"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"; // "OutOfService"

// ---------- SAMPLE DATA -----------
const initialEquipment = [
  {
    id: "eq-1001",
    equipmentId: "EQ-1001",
    name: "Treadmill Model X",
    serialNumber: "SN12345X",
    status: "Available",
  },
  {
    id: "eq-1002",
    equipmentId: "EQ-1002",
    name: "Bench Press",
    serialNumber: "SN5678A",
    status: "InMaintenance",
  },
  {
    id: "eq-1003",
    equipmentId: "EQ-1003",
    name: "Elliptical Machine",
    serialNumber: "SN9999E",
    status: "OutOfService",
  },
];

// Helper: reorder array items within the same column
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Decide background color for each column
const droppableBackground = {
  availableList: "#A6AEBF",    // light green
  maintenanceList: "#F4DEB3", // light yellow
  outServiceList: "#C96868",  // light red/pink
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

export default function MaintenanceEquip() {
  // ------------------- Real-Time Clock -------------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString(); // e.g. "10:05:23 AM"

  // Main equipment state
  const [equipment, setEquipment] = useState(initialEquipment);

  // Activity logs (most recent on top)
  const [logs, setLogs] = useState([]);

  // Derived lists for the 3 columns
  const availableEquip = equipment.filter((eq) => eq.status === "Available");
  const maintenanceEquip = equipment.filter((eq) => eq.status === "InMaintenance");
  const outOfServiceEquip = equipment.filter((eq) => eq.status === "OutOfService");

  // ============ ADD EQUIPMENT DIALOG ============
  const [isAddOpen, setAddOpen] = useState(false);
  const [newEquipData, setNewEquipData] = useState({
    equipmentId: "",
    name: "",
    serialNumber: "",
  });
  const [addError, setAddError] = useState("");

  const handleAddOpen = () => {
    setNewEquipData({ equipmentId: "", name: "", serialNumber: "" });
    setAddError("");
    setAddOpen(true);
  };
  const handleAddEquipChange = (e) => {
    const { name, value } = e.target;
    setNewEquipData((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddEquipSubmit = () => {
    // Minimal validation
    if (!newEquipData.equipmentId || !newEquipData.name || !newEquipData.serialNumber) {
      setAddError("Please fill out all fields.");
      return;
    }
    // Check duplicates
    if (equipment.some((eq) => eq.equipmentId === newEquipData.equipmentId)) {
      setAddError("That equipment ID already exists!");
      return;
    }
    // Add new item
    const newItem = {
      id: `eq-${Date.now()}`,
      equipmentId: newEquipData.equipmentId,
      name: newEquipData.name,
      serialNumber: newEquipData.serialNumber,
      status: "Available",
    };
    setEquipment((prev) => [...prev, newItem]);
    setLogs((prev) => [
      `Added Equipment: ${newEquipData.equipmentId} (${newEquipData.name}).`,
      ...prev,
    ]);
    setAddOpen(false);
  };

  // ============== DRAG & DROP LOGIC ==============
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Same-list reordering
    if (source.droppableId === destination.droppableId && source.index !== destination.index) {
      let updated = [];
      if (source.droppableId === "availableList") {
        updated = reorder(availableEquip, source.index, destination.index);
        applyReorderToEquipment(updated, "Available");
      } else if (source.droppableId === "maintenanceList") {
        updated = reorder(maintenanceEquip, source.index, destination.index);
        applyReorderToEquipment(updated, "InMaintenance");
      } else if (source.droppableId === "outServiceList") {
        updated = reorder(outOfServiceEquip, source.index, destination.index);
        applyReorderToEquipment(updated, "OutOfService");
      }
      return;
    }

    // Different-list drop
    if (source.droppableId !== destination.droppableId) {
      handleChangeStatus(source, destination);
    }
  };

  const applyReorderToEquipment = (newArr, status) => {
    const other = equipment.filter((eq) => eq.status !== status);
    const final = [...other, ...newArr.map((item) => ({ ...item, status }))];
    setEquipment(final);
  };

  const getListFromDroppable = (droppableId) => {
    if (droppableId === "availableList") return availableEquip;
    if (droppableId === "maintenanceList") return maintenanceEquip;
    return outOfServiceEquip;
  };

  const applyAllLists = (availArr, maintArr, outArr) => {
    const final = [
      ...availArr.map((eq) => ({ ...eq, status: "Available" })),
      ...maintArr.map((eq) => ({ ...eq, status: "InMaintenance" })),
      ...outArr.map((eq) => ({ ...eq, status: "OutOfService" })),
    ];
    setEquipment(final);
  };

  // -------------- Status-Change Form Logic --------------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    equipmentId: "",
    oldStatus: "",
    newStatus: "",
    reason: "",
    date: "",
    time: "",
  });
  const [modalEquipItem, setModalEquipItem] = useState(null);

  // This function is invoked when we drag from one column to another
  const handleChangeStatus = (source, destination) => {
    const srcList = getListFromDroppable(source.droppableId);
    const destList = getListFromDroppable(destination.droppableId);
    const [movedItem] = srcList.splice(source.index, 1);

    let newStatus = "Available";
    if (destination.droppableId === "maintenanceList") newStatus = "InMaintenance";
    if (destination.droppableId === "outServiceList") newStatus = "OutOfService";

    // If oldStatus=Available -> newStatus=InMaintenance => open form
    // If oldStatus=Available -> newStatus=OutOfService => open form
    // If oldStatus=InMaintenance -> newStatus=Available => open form
    // If oldStatus=InMaintenance -> newStatus=OutOfService => open form
    // If oldStatus=OutOfService -> newStatus=Available => open form, etc.
    // We'll unify all with a single "transition form."
    setModalEquipItem(movedItem);
    setModalData({
      equipmentId: movedItem.equipmentId,
      oldStatus: movedItem.status,
      newStatus: newStatus,
      reason: "",   // user can type: "Scheduled maintenance" or "Broken part" etc.
      date: "",     // user picks date
      time: "",     // user picks time
    });
    setModalOpen(true);

    // We'll hold onto the item in the "modalEquipItem" and only apply changes after user saves
    // Meanwhile, we do NOT finalize anything in "equipment" until the user completes the form
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    // If user cancels, we must revert item to its original column
    // We'll just do a forced refresh of the columns
    setEquipment((prev) => [...prev]); // or reload from old arrays
  };

  const handleModalSave = () => {
    const { equipmentId, oldStatus, newStatus, reason, date, time } = modalData;
    if (!date || !time) {
      alert("Please specify both date and time for this status change.");
      return;
    }
    // Now finalize the item in the new status:
    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === modalEquipItem.id) {
          return { ...eq, status: newStatus };
        }
        return eq;
      })
    );
    // Re-apply occupant or not occupant if needed:
    // e.g. if newStatus !== "InMaintenance", occupant could be cleared. It's optional.
    // set occupant to "Maintenance log: reason" if you'd like. We'll skip occupant here.

    // We'll log the reason, date, time:
    const logMsg = `Equipment #${equipmentId} changed from ${oldStatus} to ${newStatus} on ${date} at ${time}. Reason: ${reason || "N/A"}`;
    setLogs((prev) => [logMsg, ...prev]);

    // Now push the item to the correct final array
    // We do that by calling "applyAllLists" again:
    applyAllLists(availableEquip, maintenanceEquip, outOfServiceEquip);

    setModalOpen(false);
  };

  // -------------- Remove (Delete) an Equipment --------------
  const removeEquipment = (id) => {
    const itemToRemove = equipment.find((eq) => eq.id === id);
    if (!itemToRemove) return;
    setEquipment((prev) => prev.filter((eq) => eq.id !== id));
    setLogs((prev) => [
      `Removed Equipment #${itemToRemove.equipmentId} (${itemToRemove.name}) from system.`,
      ...prev,
    ]);
  };

  // =============== DRAGGABLE RENDER ===============
  const renderDraggableItem = (item, index) => (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
          {/* Remove Button */}
          <Box sx={{ textAlign: "right" }}>
            <IconButton
              size="small"
              onClick={() => removeEquipment(item.id)}
              sx={{ color: "#f44336" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <strong>{item.equipmentId}</strong> - {item.name}
          <br />
          <small>SN: {item.serialNumber}</small>
        </Box>
      )}
    </Draggable>
  );

  // =============== LOG EDITING ===============
  const [editLogIndex, setEditLogIndex] = useState(null);
  const [editLogText, setEditLogText] = useState("");

  const handleEditLog = (idx) => {
    setEditLogIndex(idx);
    setEditLogText(logs[idx]);
  };
  const handleSaveLogEdit = () => {
    if (editLogIndex !== null) {
      const updated = [...logs];
      updated[editLogIndex] = editLogText;
      setLogs(updated);
    }
    setEditLogIndex(null);
    setEditLogText("");
  };
  const handleCancelLogEdit = () => {
    setEditLogIndex(null);
    setEditLogText("");
  };

  // Show only 15 logs
  const truncatedLogs = logs.slice(0, 15);

  // CLEAR ALL
  const clearAllLogs = () => setLogs([]);

  return (
    <Box sx={{ display: "flex", gap: 3, p: 4 }}>
      {/* Left side: Equipment Drag & Drop */}
      <Box flex={1}>
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

      {/* Right side: Activity & Real-Time Clock */}
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
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  borderBottom: "1px solid #333",
                  pb: 1,
                }}
              >
                <Typography variant="body2" sx={{ flex: 1, fontSize: "0.9rem" }}>
                  {log}
                </Typography>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleEditLog(idx)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      {/* DIALOG: Add Equipment */}
      <Dialog open={isAddOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Equipment</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Equipment ID"
            name="equipmentId"
            fullWidth
            margin="normal"
            value={newEquipData.equipmentId}
            onChange={handleAddEquipChange}
          />
          <TextField
            label="Name"
            name="name"
            fullWidth
            margin="normal"
            value={newEquipData.name}
            onChange={handleAddEquipChange}
          />
          <TextField
            label="Serial Number"
            name="serialNumber"
            fullWidth
            margin="normal"
            value={newEquipData.serialNumber}
            onChange={handleAddEquipChange}
          />
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

      {/* DIALOG: Status Transition Form */}
      <Dialog open={modalOpen} onClose={handleModalCancel} fullWidth maxWidth="sm">
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Equipment: {modalData.equipmentId} <br />
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

      {/* DIALOG: Edit Log Entry */}
      <Dialog
        open={editLogIndex !== null}
        onClose={handleCancelLogEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Activity Log</DialogTitle>
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
