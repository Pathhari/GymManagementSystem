import React, { useState, useEffect } from "react";
import axios from "axios";
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

/** 
 * EXPLANATION:
 * - We rename statuses to match your DB: "Available", "Occupied", "OutOfService".
 * - We'll fetch lockers from GET /operations/lockers (which your backend can return in JSON format).
 * - We'll send new/updates to POST /operations/lockers (storeLocker).
 * - We'll handle borrow/return keys with your existing borrowLockerKey / returnLockerKey routes.
 */

// Droppable background colors, keyed by the droppable ID
const droppableBackground = {
  availableList: "#A6AEBF",   
  occupiedList: "#F4DEB3",  
  outOfServiceList: "#C96868",
};

// Helper function to reorder within the same list.
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Draggable item style
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

// Droppable area style
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

export default function LockerManagement() {
  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // Lockers state (fetched from your backend)
  const [lockers, setLockers] = useState([]);
  const [logs, setLogs] = useState([]);

  // 1) Fetch lockers from the backend on mount
  useEffect(() => {
    axios
      .get("/operations/lockers") // your indexLockers route returning JSON
      .then((res) => {
        // Expect res.data.lockers or something similar
        setLockers(res.data.lockers || []);
      })
      .catch((err) => console.error("Error fetching lockers:", err));
  }, []);

  // 2) Branch Filter (assuming all branches are returned if admin/owner)
  //    If staff, the backend will already filter. We can still let them filter locally
  const branchOptions = ["All Branches"]; // We'll fill in after we see real data from server
  // Or you can build an array from the returned data
  // e.g. const branchOptions = [...new Set(lockers.map(lk => lk.BranchName))];

  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  const filteredLockers =
    selectedBranch === "All Branches"
      ? lockers
      : lockers.filter((lk) => lk.BranchID === selectedBranch);

  // Derive the three status arrays
  const availableLockers = filteredLockers.filter(
    (lk) => lk.Status === "Available"
  );
  const occupiedLockers = filteredLockers.filter(
    (lk) => lk.Status === "Occupied"
  );
  const outOfServiceLockers = filteredLockers.filter(
    (lk) => lk.Status === "OutOfService"
  );

  // 3) Add Locker Dialog
  const [isAddLockerOpen, setAddLockerOpen] = useState(false);
  const [newLockerNumber, setNewLockerNumber] = useState("");
  const [newLockerBranch, setNewLockerBranch] = useState("");
  const [addError, setAddError] = useState("");

  const handleAddLockerOpen = () => {
    setNewLockerNumber("");
    setNewLockerBranch("");
    setAddError("");
    setAddLockerOpen(true);
  };

  const handleAddLocker = () => {
    const numVal = parseInt(newLockerNumber, 10);
    if (!numVal || numVal <= 0) {
      setAddError("Please enter a valid locker number.");
      return;
    }

    // Build payload for your storeLocker method
    const payload = {
      // According to your validation rules:
      // 'LockerID' => 'nullable|exists:lockers,LockerID'
      LockerID: null,
      LockerNumber: String(numVal),
      Status: "Available",
      Notes: null,
      BranchID: newLockerBranch || null,
    };

    axios
      .post("/operations/lockers", payload)
      .then((res) => {
        // Successfully created. We can do one of two approaches:
        // A) Re-fetch from backend for the updated list:
        return axios.get("/operations/lockers");
      })
      .then((refetch) => {
        setLockers(refetch.data.lockers || []);
        setAddLockerOpen(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.data?.message) {
          setAddError(err.response.data.message);
        }
      });
  };

  // 4) Drag & Drop
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reorder within the same column
    if (
      source.droppableId === destination.droppableId &&
      source.index !== destination.index
    ) {
      let updated = [];
      if (source.droppableId === "availableList") {
        updated = reorder(availableLockers, source.index, destination.index);
        applyReorderToLockers(updated, "Available");
      } else if (source.droppableId === "occupiedList") {
        updated = reorder(occupiedLockers, source.index, destination.index);
        applyReorderToLockers(updated, "Occupied");
      } else if (source.droppableId === "outOfServiceList") {
        updated = reorder(
          outOfServiceLockers,
          source.index,
          destination.index
        );
        applyReorderToLockers(updated, "OutOfService");
      }
      return;
    }

    // Move between columns
    if (source.droppableId !== destination.droppableId) {
      handleStatusChange(source, destination);
    }
  };

  const applyReorderToLockers = (newArr, status) => {
    // Just updates local array; no DB call
    // If you want to preserve re-order in DB, you'd store "sortOrder" in your DB.
    // For now, we only do local reorder
    const otherLockers = lockers.filter((lk) => lk.Status !== status);
    const updatedLockers = [
      ...otherLockers,
      ...newArr.map((item) => ({ ...item, Status: status })),
    ];
    setLockers(updatedLockers);
  };

  // Return array based on droppableId
  const getLockersByDroppable = (droppableId) => {
    if (droppableId === "availableList") return availableLockers;
    if (droppableId === "occupiedList") return occupiedLockers;
    if (droppableId === "outOfServiceList") return outOfServiceLockers;
    return [];
  };

  const applyAllLockers = (avail, occ, out) => {
    const final = [
      ...avail.map((lk) => ({ ...lk, Status: "Available" })),
      ...occ.map((lk) => ({ ...lk, Status: "Occupied" })),
      ...out.map((lk) => ({ ...lk, Status: "OutOfService" })),
    ];
    setLockers(final);
  };

  // handleStatusChange: changes a single item’s status + calls server
  const handleStatusChange = (source, destination) => {
    const srcList = getLockersByDroppable(source.droppableId);
    const destList = getLockersByDroppable(destination.droppableId);
    const [movedItem] = srcList.splice(source.index, 1);

    let newStatus = "Available";
    if (destination.droppableId === "occupiedList") newStatus = "Occupied";
    if (destination.droppableId === "outOfServiceList") newStatus = "OutOfService";

    const oldStatus = movedItem.Status;
    movedItem.Status = newStatus;
    // If you want occupant cleared for non-Occupied
    if (newStatus !== "Occupied") {
      movedItem.occupant = "";
    }
    destList.splice(destination.index, 0, movedItem);
    applyAllLockers(availableLockers, occupiedLockers, outOfServiceLockers);

    // CALL SERVER to update the status
    const payload = {
      LockerID: movedItem.LockerID,
      LockerNumber: movedItem.LockerNumber,
      Status: newStatus,
      BranchID: movedItem.BranchID,
      // You can pass occupant if you store it in DB, etc.
    };

    axios
      .post("/operations/lockers", payload) // storeLocker
      .then(() => {
        const logMsg = `Locker #${movedItem.LockerNumber} changed from ${oldStatus} to ${newStatus}.`;
        setLogs((prev) => [logMsg, ...prev]);
      })
      .catch((err) => {
        console.error("Error updating locker status:", err);
      });
  };

  // 5) Borrow & Return
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowData, setBorrowData] = useState({
    LockerID: "",
    MemberID: "",
    Notes: "",
  });
  const [borrowLocker, setBorrowLocker] = useState(null);

  const openBorrowForm = (lockerItem) => {
    setBorrowLocker(lockerItem);
    setBorrowData({
      LockerID: lockerItem.LockerID, // from DB
      MemberID: "", // user must pick a member ID
      Notes: "",
    });
    setBorrowOpen(true);
  };

  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBorrowSubmit = () => {
    if (!borrowData.LockerID || !borrowData.MemberID) {
      alert("Please fill out LockerID and MemberID.");
      return;
    }

    axios
      .post("/operations/lockers/borrow", borrowData)
      .then(() => {
        // Optionally refresh the locker list
        return axios.get("/operations/lockers");
      })
      .then((res) => {
        setLockers(res.data.lockers || []);
        setBorrowOpen(false);
      })
      .catch((err) => {
        console.error("Error borrowing locker:", err);
      });
  };

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnData, setReturnData] = useState({
    usageId: "",
    returnDate: "",
    notes: "",
  });
  const [returnLocker, setReturnLocker] = useState(null);

  const openReturnForm = (lockerItem, usageId) => {
    setReturnLocker(lockerItem);
    setReturnData({
      usageId: usageId || "",
      returnDate: "",
      notes: "",
    });
    setReturnOpen(true);
  };

  const handleReturnChange = (e) => {
    const { name, value } = e.target;
    setReturnData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReturnSubmit = () => {
    // Your backend route is: POST /operations/lockers/{usageId}/return
    // so we do:
    if (!returnData.usageId) {
      alert("Missing usage ID for returning a locker.");
      return;
    }
    axios
      .post(`/operations/lockers/${returnData.usageId}/return`, {
        notes: returnData.notes,
        returnDate: returnData.returnDate,
      })
      .then(() => axios.get("/operations/lockers"))
      .then((res) => {
        setLockers(res.data.lockers || []);
        setReturnOpen(false);
      })
      .catch((err) => {
        console.error("Error returning locker:", err);
      });
  };

  // 6) Removing a locker (if your backend allows it).
  // In your code, you have "storeLocker" for create/update. 
  // There's no direct "destroy" route shown, but you might add:
  // Route::delete('/operations/lockers/{lockerID}', ...)
  const removeLocker = (LockerID) => {
    if (!confirm("Are you sure you want to remove this locker?")) return;
    axios
      .delete(`/operations/lockers/${LockerID}`)
      .then(() => axios.get("/operations/lockers"))
      .then((res) => {
        setLockers(res.data.lockers || []);
      })
      .catch((err) => {
        console.error("Error removing locker:", err);
      });
  };

  // Renders a single Draggable
  const renderDraggableLocker = (locker, index) => (
    <Draggable key={String(locker.LockerID)} draggableId={String(locker.LockerID)} index={index}>
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
              onClick={() => removeLocker(locker.LockerID)}
              sx={{ color: "#f44336" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <strong>#{locker.LockerNumber}</strong>
          {locker.occupant ? ` (User: ${locker.occupant})` : ""}
          <br />
          <small>BranchID: {locker.BranchID}</small>
          <br />
          {locker.Status}
          <br />
          <Button
            size="small"
            variant="outlined"
            onClick={() => openBorrowForm(locker)}
            disabled={locker.Status !== "Available"} 
            sx={{ mt: 1, mr: 1 }}
          >
            Borrow
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => openReturnForm(locker, /* usageId? */ "")}
            disabled={locker.Status !== "Occupied"}
            sx={{ mt: 1 }}
          >
            Return
          </Button>
        </Box>
      )}
    </Draggable>
  );

  // (Optional) editing logs, local only
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
  const clearAllLogs = () => setLogs([]);

  return (
    <Box sx={{ display: "flex", gap: 3, p: 4 }}>
      {/* ---------- LEFT SIDE: Filter, Columns ---------- */}
      <Box flex={1}>
        <FormControl sx={{ mb: 2, minWidth: 180 }}>
          <InputLabel>Filter by Branch</InputLabel>
          <Select
            label="Filter by Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {/* Basic example: only "All Branches" if you don't have a list */}
            <MenuItem value="All Branches">All Branches</MenuItem>
            {/* 
              If you want to dynamically load branches from the server, 
              you'd map them here:
            
              {branchesFromServer.map(branch => (
                <MenuItem key={branch.BranchID} value={branch.BranchID}>
                  {branch.Name}
                </MenuItem>
              ))}
            */}
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
            {/* ---------- AVAILABLE Column ---------- */}
            <Droppable droppableId="availableList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("availableList", snapshot.isDraggingOver)}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    <CheckBoxOutlineBlankIcon /> Available
                  </Typography>
                  {availableLockers.map((lk, index) =>
                    renderDraggableLocker(lk, index)
                  )}
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
                  {occupiedLockers.map((lk, index) =>
                    renderDraggableLocker(lk, index)
                  )}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            {/* ---------- Out of Service Column ---------- */}
            <Droppable droppableId="outOfServiceList">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ p: 2 }}
                  style={getListStyle("outOfServiceList", snapshot.isDraggingOver)}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    <ErrorOutlineIcon /> Out of Service
                  </Typography>
                  {outOfServiceLockers.map((lk, index) =>
                    renderDraggableLocker(lk, index)
                  )}
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
      <Dialog
        open={isAddLockerOpen}
        onClose={() => setAddLockerOpen(false)}
        fullWidth
        maxWidth="xs"
      >
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
              {/* If staff => we might auto-set this to staff's branch
                  If admin => list them. Example placeholder: */}
              <MenuItem value="">No Branch</MenuItem>
              <MenuItem value="1">Branch #1</MenuItem>
              <MenuItem value="2">Branch #2</MenuItem>
              {/* or map from some branch list */}
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
      <Dialog
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Locker Borrow Form</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Locker ID"
            name="LockerID"
            margin="normal"
            fullWidth
            value={borrowData.LockerID}
            onChange={handleBorrowChange}
            disabled
          />
          <TextField
            label="Member ID"
            name="MemberID"
            margin="normal"
            fullWidth
            value={borrowData.MemberID}
            onChange={handleBorrowChange}
          />
          <TextField
            label="Notes"
            name="Notes"
            margin="normal"
            fullWidth
            multiline
            rows={2}
            value={borrowData.Notes}
            onChange={handleBorrowChange}
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
      <Dialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Locker Return Form</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Usage ID"
            name="usageId"
            margin="normal"
            fullWidth
            value={returnData.usageId}
            onChange={handleReturnChange}
          />
          <TextField
            label="Return Date"
            name="returnDate"
            type="date"
            margin="normal"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={returnData.returnDate}
            onChange={handleReturnChange}
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
