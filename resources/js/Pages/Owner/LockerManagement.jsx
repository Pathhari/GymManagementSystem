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
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import { ClockIcon } from "@mui/x-date-pickers";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";

// Gradients for each status
const statusGradients = {
  Available: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
  Occupied: "linear-gradient(135deg, #f44336 0%, #ef5350 100%)",
  OutOfService: "linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)",
};

// Styled card with hover scale/shadow
const LockerCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "hidden",
  color: "#fff",
  padding: theme.spacing(2),
  textAlign: "center",
  height: "100%",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: theme.shadows[4],
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[8],
  },
}));

export default function LockerManagement() {
  const theme = useTheme();

  // ----------------- 1) CLOCK ------------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clockString = currentTime.toLocaleTimeString();

  // ----------------- 2) LOCKERS & BRANCHES ------------------
  const [lockers, setLockers] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    axios
      .get("/operations/lockers")
      .then((res) => setLockers(res.data.lockers || []))
      .catch((err) => console.error("Error fetching lockers:", err));

    axios
      .get("/owner/branches")
      .then((res) => setBranches(res.data.branches || []))
      .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  // ----------------- 3) BRANCH FILTER ------------------
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const filteredLockers =
    selectedBranch === "All Branches"
      ? lockers
      : lockers.filter((lk) => String(lk.BranchID) === String(selectedBranch));

  // ----------------- 4) SORT & CHUNK LOCKERS  ------------------
  const sortedLockers = filteredLockers.slice().sort(
    (a, b) => parseInt(a.LockerNumber, 10) - parseInt(b.LockerNumber, 10)
  );

  const maxColumns = sortedLockers.length
    ? Math.ceil(sortedLockers.length / 3)
    : 0;
  const row1 = sortedLockers.slice(0, maxColumns);
  const row2 = sortedLockers.slice(maxColumns, 2 * maxColumns);
  const row3 = sortedLockers.slice(2 * maxColumns, 3 * maxColumns);
  const chunkedLockers = [row1, row2, row3];

  const cardWidth = 200;
  const gap = 16;
  const containerWidth = maxColumns * (cardWidth + gap);

  // ----------------- 5) ADD LOCKER ------------------
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
    const payload = {
      LockerNumber: String(numVal),
      Status: "Available",
      Notes: null,
      BranchID: newLockerBranch || null,
    };
    axios
      .post("/operations/lockers", payload)
      .then(() => axios.get("/operations/lockers"))
      .then((res) => {
        setLockers(res.data.lockers || []);
        setAddLockerOpen(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.data?.message) {
          setAddError(err.response.data.message);
        } else if (err.response?.data?.error) {
          setAddError(err.response.data.error);
        }
      });
  };

  // ----------------- 6) BORROW LOCKER ------------------
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowData, setBorrowData] = useState({
    LockerID: "",
    MemberID: "",
    Notes: "",
  });
  const [searchBranchID, setSearchBranchID] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberOptions, setMemberOptions] = useState([]);

  useEffect(() => {
    if (memberSearch.trim().length > 0 && searchBranchID) {
      axios
        .get(
          `/membership/members/search?q=${memberSearch.trim()}&branchId=${searchBranchID}`
        )
        .then((res) => setMemberOptions(res.data))
        .catch((err) => console.error("Error searching members:", err));
    } else {
      setMemberOptions([]);
    }
  }, [memberSearch, searchBranchID]);

  const openBorrowForm = (lockerItem) => {
    setBorrowData({
      LockerID: lockerItem.LockerID,
      MemberID: "",
      Notes: "",
    });
    setMemberSearch("");
    setMemberOptions([]);
    setSearchBranchID(lockerItem.BranchID || null);
    setBorrowOpen(true);
  };

  const handleBorrowChange = (e) => {
    setBorrowData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBorrowSubmit = () => {
    if (!borrowData.LockerID || !borrowData.MemberID) {
      alert("LockerID and MemberID are required.");
      return;
    }
    axios
      .post("/operations/lockers/borrow", borrowData)
      .then(() => axios.get("/operations/lockers"))
      .then((res) => {
        setLockers(res.data.lockers || []);
        setBorrowOpen(false);
      })
      .catch((err) => console.error("Error borrowing locker:", err));
  };

  // ----------------- 7) RETURN LOCKER ------------------
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnData, setReturnData] = useState({
    usageId: "",
    occupantName: "",
    notes: "",
  });

  const openReturnForm = (usageId, occupantName = "") => {
    setReturnData({
      usageId: usageId || "",
      occupantName: occupantName || "",
      notes: "",
    });
    setReturnOpen(true);
  };

  const handleReturnChange = (e) => {
    setReturnData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReturnSubmit = () => {
    if (!returnData.usageId) {
      alert("Missing usage ID.");
      return;
    }
    axios
      .post(`/operations/lockers/${returnData.usageId}/return`, {
        notes: returnData.notes,
      })
      .then(() => axios.get("/operations/lockers"))
      .then((res) => {
        setLockers(res.data.lockers || []);
        setReturnOpen(false);
      })
      .catch((err) => console.error("Error returning locker:", err));
  };

  // ----------------- 8) DELETE CONFIRMATION ------------------
  const [lockerToDelete, setLockerToDelete] = useState(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (lockerID) => {
    setLockerToDelete(lockerID);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!lockerToDelete) return;
    axios
      .delete(`/operations/lockers/${lockerToDelete}`)
      .then(() => axios.get("/operations/lockers"))
      .then((res) => setLockers(res.data.lockers || []))
      .catch((err) => {
        console.error("Error removing locker:", err);
        if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert("An error occurred while deleting the locker.");
        }
      })
      .finally(() => {
        setDeleteDialogOpen(false);
        setLockerToDelete(null);
      });
  };

  // ----------------- 9) ACTIVITY LOG (ALL USAGES) ------------------
  const [logOpen, setLogOpen] = useState(false);
  const [usageHistory, setUsageHistory] = useState([]);

  const handleOpenLog = () => {
    setLogOpen(true);
    // Example endpoint => /operations/lockers/activity-log
    axios
      .get("/operations/lockers/activity-log")
      .then((res) => setUsageHistory(res.data.usages || []))
      .catch((err) => console.error("Error fetching usage history:", err));
  };

  const handleCloseLog = () => {
    setLogOpen(false);
    setUsageHistory([]);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Clock */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#424242",
          color: "#fff",
          textAlign: "center",
          borderRadius: 2,
        }}
        elevation={4}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          <ClockIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          {clockString}
        </Typography>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Locker Management
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Header: Branch Filter & Add Locker & Activity Log */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Branch</InputLabel>
          <Select
            label="Filter by Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <MenuItem value="All Branches">All Branches</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.BranchID} value={branch.BranchID}>
                {branch.BranchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLockerOpen}
          sx={{ minWidth: 150 }}
        >
          Add Locker
        </Button>

        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleOpenLog}
        >
          View Activity Log
        </Button>
      </Box>

      {/* Outer container with horizontal scroll */}
      <Box sx={{ overflowX: "auto", mb: 3 }}>
        {/* Inner container: 3 rows using row slicing */}
        <Box
          sx={{ display: "flex", flexDirection: "column", minWidth: containerWidth }}
        >
          {chunkedLockers.map((rowLockers, rowIndex) => (
            <Box key={rowIndex} sx={{ display: "flex", gap: 2, mb: 2 }}>
              {rowLockers.map((locker) => {
                const gradient =
                  statusGradients[locker.Status] || statusGradients.OutOfService;

                return (
                  <Box key={locker.LockerID} sx={{ flex: "0 0 auto" }}>
                    <LockerCard
                      sx={{ background: gradient, width: cardWidth }}
                      onClick={() => {
                        // Borrow if Available, Return if Occupied
                        if (locker.Status === "Available") {
                          openBorrowForm(locker);
                        } else if (locker.Status === "Occupied") {
                          const usageId = locker.occupant?.UsageID || "";
                          const occupantName = locker.occupant?.FullName || "";
                          openReturnForm(usageId, occupantName);
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                          Locker #{locker.LockerNumber}
                        </Typography>
                        <Typography variant="body1">{locker.Status}</Typography>
                        {locker.Status === "Occupied" && locker.occupant && (
                          <Typography variant="subtitle2" sx={{ mt: 1 }}>
                            Occupied by: {locker.occupant.FullName}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                          Branch: {locker.BranchID}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1, textAlign: "right" }}>
                        {/* Delete Icon triggers the delete dialog */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering Borrow/Return
                            handleDeleteClick(locker.LockerID);
                          }}
                          sx={{ color: "#fff" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </LockerCard>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ADD LOCKER DIALOG */}
      <Dialog
        open={isAddLockerOpen}
        onClose={() => setAddLockerOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3 } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LockIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Add New Locker
              </Typography>
            </Box>
            <IconButton
              onClick={() => setAddLockerOpen(false)}
              sx={{ "&:hover": { color: theme.palette.error.main } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
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
              value={newLockerBranch || ""}
              onChange={(e) => setNewLockerBranch(e.target.value)}
              label="Select Branch"
            >
              <MenuItem value="">No Branch</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.BranchID} value={b.BranchID}>
                  {b.BranchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddLocker}
            disabled={!newLockerNumber.trim() || !newLockerBranch}
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Locker
          </Button>
        </DialogActions>
      </Dialog>

      {/* BORROW LOCKER DIALOG */}
      <Dialog
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3 } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VpnKeyIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Borrow Locker
              </Typography>
            </Box>
            <IconButton
              onClick={() => setBorrowOpen(false)}
              sx={{ "&:hover": { color: theme.palette.error.main } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            label="Locker ID"
            name="LockerID"
            margin="normal"
            fullWidth
            variant="filled"
            value={borrowData.LockerID}
            disabled
          />

          <Autocomplete
            options={memberOptions}
            getOptionLabel={(option) => option.FullName}
            onInputChange={(event, newInputValue) => setMemberSearch(newInputValue)}
            onChange={(event, newValue) => {
              setBorrowData((prev) => ({
                ...prev,
                MemberID: newValue ? newValue.MemberID : "",
              }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Search Member" margin="normal" fullWidth />
            )}
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
          <Button variant="contained" color="primary" onClick={handleBorrowSubmit}>
            <SaveIcon sx={{ mr: 1 }} />
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* RETURN LOCKER DIALOG */}
      <Dialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3 } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VpnKeyIcon sx={{ fontSize: 32, color: "#ff9800" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Return Locker
              </Typography>
            </Box>
            <IconButton
              onClick={() => setReturnOpen(false)}
              sx={{ "&:hover": { color: theme.palette.error.main } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Occupant: <strong>{returnData.occupantName}</strong>
          </Typography>

          <TextField
            label="Usage ID"
            fullWidth
            variant="filled"
            value={returnData.usageId}
            disabled
            sx={{ mb: 2 }}
          />

          <TextField
            label="Notes (optional)"
            name="notes"
            fullWidth
            multiline
            rows={2}
            value={returnData.notes}
            onChange={handleReturnChange}
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" onClick={handleReturnSubmit}>
            <SaveIcon sx={{ mr: 1 }} />
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <DeleteForeverIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "gray" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ACTIVITY LOG DIALOG */}
{/* ACTIVITY LOG DIALOG */}
<Dialog
  open={logOpen}
  onClose={handleCloseLog}
  fullWidth
  maxWidth="lg"
  PaperProps={{
    sx: { borderRadius: 3, boxShadow: 6, p: 2 },
  }}
>
  <DialogTitle
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #eee",
      pb: 1,
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      Locker Activity Log
    </Typography>
    <IconButton onClick={handleCloseLog} sx={{ "&:hover": { color: "red" } }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent dividers sx={{ p: 2 }}>
    {usageHistory.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No usage records found.
      </Typography>
    ) : (
      <Paper sx={{ maxHeight: 450, overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">Usage ID</TableCell>
              <TableCell align="center">Locker ID</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>Borrow Date</TableCell>
              <TableCell>Return Date</TableCell>
              <TableCell align="center">Returned?</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usageHistory.map((usage) => (
              <TableRow key={usage.UsageID} hover>
                <TableCell align="center">{usage.UsageID}</TableCell>
                <TableCell align="center">{usage.LockerID}</TableCell>
                <TableCell>{usage.member?.FullName || "—"}</TableCell>
                <TableCell>
                  {usage.BorrowDate
                    ? new Date(usage.BorrowDate).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {usage.ReturnDate
                    ? new Date(usage.ReturnDate).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell align="center">
                  {usage.Returned ? "Yes" : "No"}
                </TableCell>
                <TableCell>{usage.Notes || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    )}
  </DialogContent>

  <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
    <Button
      onClick={handleCloseLog}
      variant="contained"
      color="primary"
      sx={{ textTransform: "none" }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
}
