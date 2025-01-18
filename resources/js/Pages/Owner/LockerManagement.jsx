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
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";

import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// ===================================================================
// NOTE on react-beautiful-dnd warning:
// The warning about "defaultProps" comes from internals of react-beautiful-dnd.
// Upgrading or switching to an actively maintained alternative (like @hello-pangea/dnd)
// is recommended if you wish to remove such warnings. Otherwise, you may also choose to
// ignore/suppress it during development.
// ===================================================================

// ---------- SAMPLE DATA -----------
// Each locker now has a branch property.
const initialLockers = [
  { id: "locker-101", lockerNumber: 101, status: "vacant", occupant: "", branch: "New York" },
  { id: "locker-102", lockerNumber: 102, status: "occupied", occupant: "John Doe", branch: "Los Angeles" },
  { id: "locker-103", lockerNumber: 103, status: "outOfService", occupant: "", branch: "New York" },
  { id: "locker-104", lockerNumber: 104, status: "vacant", occupant: "", branch: "Chicago" },
  { id: "locker-105", lockerNumber: 105, status: "occupied", occupant: "Jane Smith", branch: "Los Angeles" },
];

// List of branches (plus an option for all)
const branchOptions = ["All Branches", "New York", "Los Angeles", "Chicago", "Houston", "Miami"];

// Helper function to reorder an array within the same list.
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Define background colors for the droppable columns.
const droppableBackground = {
  vacantList: "#A6AEBF",    // Vacant
  occupiedList: "#F4DEB3",  // Occupied
  outServiceList: "#C96868",// Out of Service
};

// Function to get the style of a draggable item.
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

// Function to style the droppable area.
const getListStyle = (droppableId, isDraggingOver) => ({
  background: isDraggingOver ? "#eeeeee" : droppableBackground[droppableId] || "#f5f5f5",
  padding: 8,
  width: 300,
  minHeight: 370,
  borderRadius: 4,
  transition: "background 0.2s",
});

export default function LockerManagement() {
  // ------------- Real-Time Clock -------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // ------------- Lockers State -------------
  const [lockers, setLockers] = useState(initialLockers);
  const [logs, setLogs] = useState([]);

  // ------------- Branch Filter State -------------
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  // Only show lockers that match the selected branch.
  const filteredLockers =
    selectedBranch === "All Branches"
      ? lockers
      : lockers.filter((lk) => lk.branch === selectedBranch);

  // From the filtered list, derive the three status arrays.
  const vacantLockers = filteredLockers.filter((lk) => lk.status === "vacant");
  const occupiedLockers = filteredLockers.filter((lk) => lk.status === "occupied");
  const outServiceLockers = filteredLockers.filter((lk) => lk.status === "outOfService");

  // ------------- Add Locker Dialog State -------------
  const [isAddLockerOpen, setAddLockerOpen] = useState(false);
  const [newLockerNumber, setNewLockerNumber] = useState("");
  const [newLockerBranch, setNewLockerBranch] = useState(branchOptions[1]); // default to first branch (skip "All Branches")
  const [addError, setAddError] = useState("");

  const handleAddLockerOpen = () => {
    setNewLockerNumber("");
    setNewLockerBranch(branchOptions[1]);
    setAddError("");
    setAddLockerOpen(true);
  };

  const handleAddLocker = () => {
    const numVal = parseInt(newLockerNumber, 10);
    if (!numVal || numVal <= 0) {
      setAddError("Please enter a valid locker number.");
      return;
    }
    // Check for duplicate locker numbers (regardless of branch).
    if (lockers.some((lk) => lk.lockerNumber === numVal)) {
      setAddError("That locker number already exists!");
      return;
    }
    const newLocker = {
      id: `locker-${numVal}`,
      lockerNumber: numVal,
      status: "vacant",
      occupant: "",
      branch: newLockerBranch,
    };
    setLockers((prev) => [...prev, newLocker]);
    const newLog = `Added locker #${numVal} in ${newLockerBranch}.`;
    setLogs((prev) => [newLog, ...prev]);
    setAddLockerOpen(false);
  };

  // ------------- Drag & Drop -------------
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reordering within the same column.
    if (source.droppableId === destination.droppableId && source.index !== destination.index) {
      let updated = [];
      if (source.droppableId === "vacantList") {
        updated = reorder(vacantLockers, source.index, destination.index);
        applyReorderToLockers(updated, "vacant");
      } else if (source.droppableId === "occupiedList") {
        updated = reorder(occupiedLockers, source.index, destination.index);
        applyReorderToLockers(updated, "occupied");
      } else if (source.droppableId === "outServiceList") {
        updated = reorder(outServiceLockers, source.index, destination.index);
        applyReorderToLockers(updated, "outOfService");
      }
      return;
    }

    // Moving between columns.
    if (source.droppableId !== destination.droppableId) {
      const movedItem = handleStatusChange(source, destination);
      if (!movedItem) return;
    }
  };

  // Update the lockers list when reordering within one status.
  const applyReorderToLockers = (newArr, status) => {
    // Update only the lockers of a given status.
    const otherLockers = lockers.filter((lk) => lk.status !== status);
    const updatedLockers = [...otherLockers, ...newArr.map((item) => ({ ...item, status }))];
    setLockers(updatedLockers);
  };

  // Given a droppable ID, return the corresponding list.
  const getLockersByDroppable = (droppableId) => {
    if (droppableId === "vacantList") return vacantLockers;
    if (droppableId === "occupiedList") return occupiedLockers;
    if (droppableId === "outServiceList") return outServiceLockers;
    return [];
  };

  // Update the global lockers if items have changed status.
  const applyAllLockers = (vacArr, occArr, outArr) => {
    const final = [
      ...vacArr.map((lk) => ({ ...lk, status: "vacant" })),
      ...occArr.map((lk) => ({ ...lk, status: "occupied" })),
      ...outArr.map((lk) => ({ ...lk, status: "outOfService" })),
    ];
    setLockers(final);
  };

  // When a locker changes status between columns.
  // (For example, from vacant to occupied or vice-versa.)
  const handleStatusChange = (source, destination) => {
    const srcList = getLockersByDroppable(source.droppableId);
    const destList = getLockersByDroppable(destination.droppableId);
    const [movedItem] = srcList.splice(source.index, 1);

    let newStatus = "vacant";
    if (destination.droppableId === "occupiedList") newStatus = "occupied";
    if (destination.droppableId === "outServiceList") newStatus = "outOfService";

    // (Optional) Add any logic here if you need to open a form
    // when a particular status change occurs.

    // Immediate update:
    const oldStatus = movedItem.status;
    movedItem.status = newStatus;
    if (newStatus !== "occupied") movedItem.occupant = "";
    destList.splice(destination.index, 0, movedItem);
    applyAllLockers(vacantLockers, occupiedLockers, outServiceLockers);
    const logMsg = `Locker #${movedItem.lockerNumber} (${movedItem.branch}) changed from ${oldStatus} to ${newStatus}.`;
    setLogs((prev) => [logMsg, ...prev]);
    return movedItem;
  };

  // ------------- Borrow / Return Forms (for completeness) -------------
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowData, setBorrowData] = useState({
    usageId: "",
    lockerId: "",
    memberName: "",
    borrowDate: "",
    borrowTime: "",
  });
  const [borrowLocker, setBorrowLocker] = useState(null);

  const openBorrowForm = (lockerItem) => {
    setBorrowLocker(lockerItem);
    setBorrowData({
      usageId: "",
      lockerId: lockerItem.id,
      memberName: "",
      borrowDate: "",
      borrowTime: "",
    });
    setBorrowOpen(true);
  };

  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBorrowSubmit = () => {
    if (
      !borrowData.usageId ||
      !borrowData.memberName ||
      !borrowData.borrowDate ||
      !borrowData.borrowTime
    ) {
      alert("Please fill out all fields (Usage ID, Name, Date, Time).");
      return;
    }
    // Update the locker to occupied.
    setLockers((prev) =>
      prev.map((lk) =>
        lk.id === borrowLocker.id
          ? { ...lk, status: "occupied", occupant: borrowData.memberName }
          : lk
      )
    );
    const logMsg = `Locker #${borrowLocker.lockerNumber} (${borrowLocker.branch}) borrowed by ${borrowData.memberName} on ${borrowData.borrowDate} at ${borrowData.borrowTime} (UsageID: ${borrowData.usageId}).`;
    setLogs((prev) => [logMsg, ...prev]);
    setBorrowOpen(false);
  };

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnData, setReturnData] = useState({
    returnDate: "",
    returnTime: "",
    notes: "",
  });
  const [returnLocker, setReturnLocker] = useState(null);

  const openReturnForm = (lockerItem) => {
    setReturnLocker(lockerItem);
    setReturnData({
      returnDate: "",
      returnTime: "",
      notes: "",
    });
    setReturnOpen(true);
  };

  const handleReturnChange = (e) => {
    const { name, value } = e.target;
    setReturnData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReturnSubmit = () => {
    if (!returnData.returnDate || !returnData.returnTime) {
      alert("Please provide a Return Date and Time.");
      return;
    }
    // Update the locker to vacant.
    setLockers((prev) =>
      prev.map((lk) =>
        lk.id === returnLocker.id
          ? { ...lk, status: "vacant", occupant: "" }
          : lk
      )
    );
    const logMsg = `Locker #${returnLocker.lockerNumber} (${returnLocker.branch}) returned on ${returnData.returnDate} at ${returnData.returnTime}. Notes: ${returnData.notes || "N/A"}`;
    setLogs((prev) => [logMsg, ...prev]);
    setReturnOpen(false);
  };

  // ------------- Remove Locker -------------
  const removeLocker = (id) => {
    const lockerToRemove = lockers.find((lk) => lk.id === id);
    if (!lockerToRemove) return;
    setLockers((prev) => prev.filter((lk) => lk.id !== id));
    const logMsg = `Removed Locker #${lockerToRemove.lockerNumber} (${lockerToRemove.branch}).`;
    setLogs((prev) => [logMsg, ...prev]);
  };

  // ------------- Render Draggable Locker -------------
  const renderDraggableLocker = (locker, index) => (
    <Draggable key={locker.id} draggableId={locker.id} index={index}>
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
              onClick={() => removeLocker(locker.id)}
              sx={{ color: "#f44336" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <strong>#{locker.lockerNumber}</strong>
          {locker.occupant ? ` (User: ${locker.occupant})` : ""}
          <br />
          <small>{locker.branch}</small>
        </Box>
      )}
    </Draggable>
  );

  // ------------- Log Editing -------------
  const [editLogIndex, setEditLogIndex] = useState(null);
  const [editLogText, setEditLogText] = useState("");

  const handleEditLog = (idx) => {
    setEditLogIndex(idx);
    setEditLogText(logs[idx]);
  };

  const handleSaveLogEdit = () => {
    if (editLogIndex !== null) {
      const updatedLogs = [...logs];
      updatedLogs[editLogIndex] = editLogText;
      setLogs(updatedLogs);
    }
    setEditLogIndex(null);
    setEditLogText("");
  };

  const handleCancelLogEdit = () => {
    setEditLogIndex(null);
    setEditLogText("");
  };

  const truncatedLogs = logs.slice(0, 15);

  // ------------- Clear Logs -------------
  const clearAllLogs = () => setLogs([]);

  return (
    <Box sx={{ display: "flex", gap: 3, p: 4 }}>
      {/* ---------- LEFT SIDE: Filter, Columns ---------- */}
      <Box flex={1}>
        {/* Moved Branch Filter to the very top */}
        <FormControl sx={{ mb: 2, minWidth: 180 }}>
          <InputLabel>Filter by Branch</InputLabel>
          <Select
            label="Filter by Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branchOptions.map((branch) => (
              <MenuItem key={branch} value={branch}>
                {branch}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h4" gutterBottom>
          Locker Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLockerOpen}
          sx={{ mb: 3 }}
        >
          Add Locker
        </Button>

        <DragDropContext onDragEnd={onDragEnd}>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {/* ---------- VACANT Column ---------- */}
            <Droppable droppableId="vacantList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("vacantList", snapshot.isDraggingOver)}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    <CheckBoxOutlineBlankIcon /> Vacant
                  </Typography>
                  {vacantLockers.map((lk, index) => renderDraggableLocker(lk, index))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            {/* ---------- OCCUPIED Column ---------- */}
            <Droppable droppableId="occupiedList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("occupiedList", snapshot.isDraggingOver)}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    <AssignmentTurnedInIcon /> Occupied
                  </Typography>
                  {occupiedLockers.map((lk, index) => renderDraggableLocker(lk, index))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            {/* ---------- Out of Service Column ---------- */}
            <Droppable droppableId="outServiceList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("outServiceList", snapshot.isDraggingOver)}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    <ErrorOutlineIcon /> Out of Service
                  </Typography>
                  {outServiceLockers.map((lk, index) => renderDraggableLocker(lk, index))}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>
          </Box>
        </DragDropContext>
      </Box>

      {/* ---------- RIGHT SIDE: Activity / Logs ---------- */}
      <Box sx={{ width: 320, maxWidth: "100%" }}>
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

        <Box sx={{ mb: 1, textAlign: "right" }}>
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

      {/* ---------- DIALOG: Add Locker ---------- */}
      <Dialog open={isAddLockerOpen} onClose={() => setAddLockerOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add New Locker</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Locker Number"
            fullWidth
            margin="normal"
            value={newLockerNumber}
            onChange={(e) => setNewLockerNumber(e.target.value)}
            error={!!addError}
            helperText={addError}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Branch</InputLabel>
            <Select
              label="Select Branch"
              value={newLockerBranch}
              onChange={(e) => setNewLockerBranch(e.target.value)}
            >
              {branchOptions
                .filter((branch) => branch !== "All Branches")
                .map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLockerOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddLocker}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- DIALOG: Borrow Form ---------- */}
      <Dialog open={borrowOpen} onClose={() => setBorrowOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Locker Borrow Form</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Usage ID"
            name="usageId"
            margin="normal"
            fullWidth
            value={borrowData.usageId}
            onChange={handleBorrowChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Locker ID"
            name="lockerId"
            margin="normal"
            fullWidth
            value={borrowData.lockerId}
            disabled
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Member Name"
            name="memberName"
            margin="normal"
            fullWidth
            value={borrowData.memberName}
            onChange={handleBorrowChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Borrow Date"
            name="borrowDate"
            type="date"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={borrowData.borrowDate}
            onChange={handleBorrowChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Borrow Time"
            name="borrowTime"
            type="time"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={borrowData.borrowTime}
            onChange={handleBorrowChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrowOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBorrowSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- DIALOG: Return Form ---------- */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Locker Return Form</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Return Date"
            name="returnDate"
            type="date"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={returnData.returnDate}
            onChange={handleReturnChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Return Time"
            name="returnTime"
            type="time"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={returnData.returnTime}
            onChange={handleReturnChange}
            inputProps={{ style: { fontSize: 18 } }}
          />
          <TextField
            label="Notes"
            name="notes"
            margin="normal"
            fullWidth
            multiline
            rows={3}
            value={returnData.notes}
            onChange={handleReturnChange}
            inputProps={{ style: { fontSize: 16 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReturnSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- DIALOG: Edit Log Entry ---------- */}
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
