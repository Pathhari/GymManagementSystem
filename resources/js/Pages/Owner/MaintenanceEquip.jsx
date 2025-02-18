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
  Chip,
  Tooltip,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"; // For "Available"
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // For "InMaintenance"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"; // For "OutOfService"
import DomainIcon from "@mui/icons-material/Domain"; // For branch
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber"; // For SN
import AccessTimeIcon from "@mui/icons-material/AccessTime"; // For clock
import { grey } from "@mui/material/colors";

// Reorder items in the same list
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// You could also use more distinct backgrounds or a theme-based approach
const droppableBackground = {
  availableList: "#c8e6c9",     // light-green
  maintenanceList: "#fff9c4",  // light-yellow
  outServiceList: "#ffccbc",   // light-orange
};

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: 12,
  margin: "0 0 8px 0",
  fontSize: "0.95rem",
  background: isDragging ? "#9c27b0" : "#fafafa",
  color: isDragging ? "#fff" : "#000",
  border: "1px solid #ddd",
  borderRadius: 6,
  transition: "all 0.2s ease",
  // Slight hover effect:
  cursor: "grab",
  "&:hover": {
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  ...draggableStyle,
});

const getListStyle = (droppableId, isDraggingOver) => ({
  background: isDraggingOver
    ? grey[200]
    : droppableBackground[droppableId] || "#f5f5f5",
  padding: 8,
  width: 300,
  minHeight: 380,
  borderRadius: 4,
  transition: "background 0.2s",
});

export default function MaintenanceEquip() {
  // --------------------------------------------------------------------------
  // 1) Clock
  // --------------------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // --------------------------------------------------------------------------
  // 2) Branches
  // --------------------------------------------------------------------------
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    fetch("/owner/branches")
      .then((res) => res.json())
      .then((data) => {
        setBranches(data.branches || []);
      })
      .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  // --------------------------------------------------------------------------
  // 3) Equipment
  // --------------------------------------------------------------------------
  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  const [equipment, setEquipment] = useState([]);
  const getEquipment = () => {
    fetch("/operations/equipment", {
      method: "GET",
      headers: {
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const eq = data.equipment || data.props?.equipment || [];
        setEquipment(eq);
      })
      .catch((err) => console.error("Error fetching equipment:", err));
  };

  useEffect(() => {
    getEquipment();
  }, []);

  // --------------------------------------------------------------------------
  // 4) Maintenance Logs
  // --------------------------------------------------------------------------
  const [logs, setLogs] = useState([]);
  const getLogs = () => {
    fetch("/operations/maintenance-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch((err) => console.error("Error fetching maintenance logs:", err));
  };

  useEffect(() => {
    getLogs();
  }, []);

  // --------------------------------------------------------------------------
  // 5) Branch Filter
  // --------------------------------------------------------------------------
  const [selectedBranch, setSelectedBranch] = useState("All");
  const filteredEquipment =
    selectedBranch === "All"
      ? equipment
      : equipment.filter((eq) => String(eq.BranchID) === String(selectedBranch));

  // Split into columns by status
  const availableEquip = filteredEquipment.filter((eq) => eq.Status === "Available");
  const maintenanceEquip = filteredEquipment.filter((eq) => eq.Status === "InMaintenance");
  const outOfServiceEquip = filteredEquipment.filter((eq) => eq.Status === "OutOfService");

  // --------------------------------------------------------------------------
  // 6) Add Equipment
  // --------------------------------------------------------------------------
  const [isAddOpen, setAddOpen] = useState(false);
  const [newEquipData, setNewEquipData] = useState({
    Name: "",
    SerialNumber: "",
    BranchID: "",
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
    fetch("/operations/equipment")
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
    const payload = {
      Name: newEquipData.Name,
      SerialNumber: newEquipData.SerialNumber,
      Status: "Available",
      BranchID: newEquipData.BranchID || null,
    };

    fetch("/operations/equipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not save equipment.");
        return res;
      })
      .then(() => {
        refetchEquipment();
        setAddOpen(false);
      })
      .catch((err) => {
        console.error(err);
        setAddError("Error saving new equipment.");
      });
  };

  // --------------------------------------------------------------------------
  // 7) Drag & Drop
  // --------------------------------------------------------------------------
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

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
    if (source.droppableId !== destination.droppableId) {
      handleChangeStatus(source, destination);
    }
  };

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
  // 8) Status-Change Modal
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
  };

  const handleModalSave = () => {
    const { EquipmentID, oldStatus, newStatus, reason, date, time } = modalData;
    if (!EquipmentID || !date || !time) {
      alert("Please specify date/time for the status change.");
      return;
    }
    const eq = modalEquipItem || {};
    const updatePayload = {
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
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(updatePayload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update equipment status.");
        return res;
      })
      .then(() => {
        if (newStatus === "InMaintenance" || newStatus === "OutOfService") {
          const logPayload = {
            EquipmentID: eq.EquipmentID,
            MaintenanceDate: date,
            IssueDescription: reason,
            Resolution: "",
            MaintainedBy: null,
            NextMaintenanceDate: null,
            Notes: `Status changed from ${oldStatus} to ${newStatus} at ${time}.`,
          };
          return fetch("/operations/maintenance-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrfToken,
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify(logPayload),
          });
        }
      })
      .then(() => {
        setEquipment((prev) =>
          prev.map((item) =>
            item.EquipmentID === EquipmentID
              ? { ...item, Status: newStatus }
              : item
          )
        );
        getLogs();
        setModalOpen(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Error updating status or adding maintenance log.");
      });
  };

  // --------------------------------------------------------------------------
  // 9) Remove Equipment (Optional)
  // --------------------------------------------------------------------------
  const removeEquipment = (EquipmentID) => {
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    setEquipment((prev) => prev.filter((eq) => eq.EquipmentID !== EquipmentID));
    // If you had a DELETE route, call it here.
  };

  // --------------------------------------------------------------------------
  // 10) Activity Logs
  // --------------------------------------------------------------------------
  const [editLogIndex, setEditLogIndex] = useState(null);
  const [editLogText, setEditLogText] = useState("");

  const handleEditLog = (logItem, idx) => {
    setEditLogIndex(idx);
    const combined = `Issue: ${logItem.IssueDescription}\nResolution: ${logItem.Resolution}\nNotes: ${logItem.Notes}`;
    setEditLogText(combined);
  };

  const handleSaveLogEdit = () => {
    if (editLogIndex == null) return;
    const logToEdit = logs[editLogIndex];
    if (!logToEdit) {
      setEditLogIndex(null);
      return;
    }
    const updatedLog = { ...logToEdit, Notes: editLogText };

    fetch(`/operations/maintenance-logs/${logToEdit.MaintenanceID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(updatedLog),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update maintenance log.");
        return res.json();
      })
      .then(() => {
        getLogs();
        setEditLogIndex(null);
        setEditLogText("");
      })
      .catch((err) => console.error(err));
  };

  const handleCancelLogEdit = () => {
    setEditLogIndex(null);
    setEditLogText("");
  };

  const deleteLog = (logId) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    fetch(`/operations/maintenance-logs/${logId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error deleting log.");
        getLogs();
      })
      .catch((err) => console.error(err));
  };

  const clearAllLogs = () => {
    if (!window.confirm("Really delete all logs?")) return;
    const promises = logs.map((log) =>
      fetch(`/operations/maintenance-logs/${log.MaintenanceID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
      })
    );
    Promise.all(promises)
      .then(() => getLogs())
      .catch((err) => console.error("Failed clearing all logs:", err));
  };

  const truncatedLogs = logs.slice(0, 15);

  // --------------------------------------------------------------------------
  // 11) Rendering Draggable Items
  // --------------------------------------------------------------------------
  const statusChips = {
    Available: (
      <Chip
        size="small"
        label="Available"
        icon={<CheckBoxOutlineBlankIcon style={{ fontSize: 16 }} />}
        color="success"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    InMaintenance: (
      <Chip
        size="small"
        label="Maintenance"
        icon={<BuildCircleIcon style={{ fontSize: 16 }} />}
        color="warning"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    OutOfService: (
      <Chip
        size="small"
        label="Out of Service"
        icon={<ErrorOutlineIcon style={{ fontSize: 16 }} />}
        color="error"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
  };

  const renderDraggableItem = (item, index) => (
    <Draggable
      key={String(item.EquipmentID)}
      draggableId={String(item.EquipmentID)}
      index={index}
    >
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          variant="outlined"
          sx={{
            ...getItemStyle(snapshot.isDragging, provided.draggableProps.style),
            p: 1.5,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <IconButton
              size="small"
              onClick={() => removeEquipment(item.EquipmentID)}
              sx={{ color: "red" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
              {statusChips[item.Status]}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ lineHeight: 1.4, mb: 0.5 }}>
            <Tooltip title="Equipment Name">
              <strong>{item.Name}</strong>
            </Tooltip>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            <Tooltip title="Serial Number">
              <span>
                <ConfirmationNumberIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                {item.SerialNumber}
              </span>
            </Tooltip>
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            <Tooltip title="Branch">
              <span>
                <DomainIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                {item.BranchID}
              </span>
            </Tooltip>
          </Typography>
        </Paper>
      )}
    </Draggable>
  );

  // --------------------------------------------------------------------------
  // 12) Final Return
  // --------------------------------------------------------------------------
  return (
    <Box sx={{ display: "flex", gap: 3, p: 4, flexWrap: "wrap" }}>
      {/* Left side: Equipment DnD */}
      <Box flex={1} minWidth={600}>
        <FormControl sx={{ mb: 2, minWidth: 180 }}>
          <InputLabel>Filter by Branch</InputLabel>
          <Select
            label="Filter by Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <MenuItem value="All">All Branches</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.BranchID} value={String(b.BranchID)}>
                {b.BranchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h4" gutterBottom fontWeight="bold">
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

      {/* Right side: Activity Logs & Clock */}
      <Box sx={{ width: 360, maxWidth: "100%" }}>
        {/* Real-Time Clock */}
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor: "#424242",
            color: "#fff",
            textAlign: "center",
            borderRadius: 2,
          }}
          elevation={3}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AccessTimeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0 }}>
              {clockString}
            </Typography>
          </Box>
        </Paper>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
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
              <Paper
                key={String(log.MaintenanceID)}
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 2,
                  backgroundColor: "#333",
                  borderRadius: 2,
                  borderColor: "#555",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#ccc" }}>
                    <strong>Log #{log.MaintenanceID}</strong>
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => handleEditLog(log, idx)}
                      sx={{ ml: 1, color: "#aaa" }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => deleteLog(log.MaintenanceID)}
                      sx={{ ml: 1, color: "red" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Divider sx={{ mb: 1, borderColor: "#444" }} />
                <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#ddd" }}>
                  <strong>Equipment #{log.EquipmentID}</strong> | Date: {log.MaintenanceDate}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#ddd" }}>
                  Issue: {log.IssueDescription || "N/A"}
                  <br />
                  Resolution: {log.Resolution || "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#bbb" }}>
                  Notes: {log.Notes || ""}
                </Typography>
              </Paper>
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
              {branches.map((b) => (
                <MenuItem key={b.BranchID} value={String(b.BranchID)}>
                  {b.BranchName}
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

      {/* Dialog: Status Transition */}
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
