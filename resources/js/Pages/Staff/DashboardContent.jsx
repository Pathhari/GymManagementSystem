import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";

export default function StaffDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Metrics
  const [checkInsToday, setCheckInsToday] = useState(0);

  // Tab: 0 => Visits, 1 => Walk-Ins
  const [activeTab, setActiveTab] = useState(0);

  // Check-In
  const [checkInMemberID, setCheckInMemberID] = useState("");
  const [checkInMethod, setCheckInMethod] = useState("card");
  const [isCamOpen, setCamOpen] = useState(false);
  const [isBiometricOpen, setBiometricOpen] = useState(false);

  // Visits
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isViewVisitOpen, setViewVisitOpen] = useState(false);
  const [isEditVisitOpen, setEditVisitOpen] = useState(false);

  // Walk-Ins
  const [walkIns, setWalkIns] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [isViewWalkInOpen, setViewWalkInOpen] = useState(false);
  const [isEditWalkInOpen, setEditWalkInOpen] = useState(false);

  // Add Walk-In
  const [isAddWalkInOpen, setAddWalkInOpen] = useState(false);
  const [newWalkIn, setNewWalkIn] = useState({
    FullName: "",
    VisitDate: "",
    Notes: "",
    PaymentMethod: "",
    PaymentAmount: ""
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Metrics
      const metricsRes = await axios.get("/staff/metrics");
      setCheckInsToday(metricsRes.data.checkInsToday || 0);

      // 2) Visits
      const visitsRes = await axios.get("/operations/visits");
      setVisits(visitsRes.data.visits || []);

      // 3) Walk-ins
      const walkInsRes = await axios.get("/operations/walk-ins");
      setWalkIns(walkInsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load staff dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const handleRefresh = () => {
    loadDashboardData();
  };

  // Tabs
  const handleTabChange = (e, val) => {
    setActiveTab(val);
  };

  // -------------- CHECK-IN (storeVisit) --------------
  const handleCheckIn = async () => {
    if (!checkInMemberID.trim()) {
      alert("Please enter a Member ID.");
      return;
    }
    try {
      await axios.post("/operations/visits", {
        MemberID: checkInMemberID.trim(),
        CheckInMethod: checkInMethod
        // BranchID is auto-forced by the backend if staff
      });
      alert(`Member #${checkInMemberID.trim()} checked in successfully!`);
      setCheckInMemberID("");
      loadDashboardData(); // refresh metrics & visits
    } catch (err) {
      console.error("Check-in error:", err);
      if (err.response && err.response.status === 409) {
        alert("Member is already checked in for today.");
      } else {
        alert("Failed to check in. See console for details.");
      }
    }
  };

  // Camera Dialog
  const handleOpenCam = () => setCamOpen(true);
  const handleCloseCam = () => setCamOpen(false);
  const handleSimulateCardScan = () => {
    setCheckInMemberID("123456");
    setCamOpen(false);
  };

  // Biometric Dialog
  const handleOpenBiometric = () => setBiometricOpen(true);
  const handleCloseBiometric = () => setBiometricOpen(false);
  const handleSimulateFingerprint = () => {
    setCheckInMemberID("987654");
    setBiometricOpen(false);
  };

  // -------------- VISITS CRUD --------------
  // View
  const handleViewVisit = (visit) => {
    setSelectedVisit(visit);
    setViewVisitOpen(true);
  };
  // Edit
  const handleEditVisit = (visit) => {
    setSelectedVisit({ ...visit });
    setEditVisitOpen(true);
  };
  const handleEditVisitSubmit = async () => {
    if (!selectedVisit) return;
    try {
      await axios.put(`/operations/visits/${selectedVisit.VisitID}`, {
        MemberID:      selectedVisit.MemberID,
        VisitDate:     selectedVisit.VisitDate,
        VisitTime:     selectedVisit.VisitTime,
        CheckInMethod: selectedVisit.CheckInMethod,
        Remarks:       selectedVisit.Remarks
      });
      setEditVisitOpen(false);
      loadDashboardData();
      alert("Visit updated successfully.");
    } catch (err) {
      console.error("Failed to update visit:", err);
    }
  };
  // Delete
  const handleDeleteVisit = async (visitID) => {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await axios.delete(`/operations/visits/${visitID}`);
      loadDashboardData();
      alert("Visit deleted!");
    } catch (err) {
      console.error("Failed to delete visit:", err);
    }
  };

  // -------------- WALK-INS CRUD --------------
  // View
  const handleViewWalkIn = (wk) => {
    setSelectedWalkIn(wk);
    setViewWalkInOpen(true);
  };
  // Edit
  const handleEditWalkIn = (wk) => {
    setSelectedWalkIn({ ...wk });
    setEditWalkInOpen(true);
  };
  const handleEditWalkInSubmit = async () => {
    if (!selectedWalkIn) return;
    try {
      await axios.put(`/operations/walk-ins/${selectedWalkIn.WalkInID}`, {
        FullName:       selectedWalkIn.FullName || "",
        VisitDate:      selectedWalkIn.VisitDate,
        PaymentID:      selectedWalkIn.PaymentID || null,
        PaymentMethod:  selectedWalkIn.PaymentMethod || "",
        AmountPaid:     selectedWalkIn.AmountPaid || 0,
        Notes:          selectedWalkIn.Notes || ""
      });
      setEditWalkInOpen(false);
      loadDashboardData();
      alert("Walk-In updated!");
    } catch (err) {
      console.error("Failed to update walk-in:", err);
    }
  };
  // Delete
  const handleDeleteWalkIn = async (walkInID) => {
    if (!window.confirm("Delete this walk-in record?")) return;
    try {
      await axios.delete(`/operations/walk-ins/${walkInID}`);
      loadDashboardData();
      alert("Walk-In deleted.");
    } catch (err) {
      console.error("Failed to delete walk-in:", err);
    }
  };

  // Add new Walk-In
  const handleAddWalkInChange = (e) => {
    setNewWalkIn((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAddWalkIn = async () => {
    try {
      await axios.post("/operations/walk-ins", {
        FullName:       newWalkIn.FullName || null,
        VisitDate:      newWalkIn.VisitDate,
        Notes:          newWalkIn.Notes || null,
        PaymentMethod:  newWalkIn.PaymentMethod || null,
        PaymentAmount:  newWalkIn.PaymentAmount || 0
        // BranchID forced by backend
      });
      alert("Walk-In created successfully.");
      setNewWalkIn({
        FullName: "",
        VisitDate: "",
        Notes: "",
        PaymentMethod: "",
        PaymentAmount: ""
      });
      setAddWalkInOpen(false);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to create walk-in:", err);
      alert("Create error. Check console for details.");
    }
  };

  // DataGrid columns for visits
  const visitColumns = [
    { field: "VisitID", headerName: "ID", width: 80 },
    { field: "MemberID", headerName: "MemberID", width: 100 },
    { field: "VisitDate", headerName: "Date", width: 100 },
    { field: "VisitTime", headerName: "Time", width: 100 },
    { field: "CheckInMethod", headerName: "Method", width: 100 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View">
              <Button
                variant="contained"
                color="success"
                onClick={() => handleViewVisit(row)}
              >
                <VisibilityIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleEditVisit(row)}
              >
                <EditIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteVisit(row.VisitID)}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // DataGrid columns for walk-ins
  const walkInColumns = [
    { field: "WalkInID", headerName: "ID", width: 80 },
    { field: "FullName", headerName: "Name", width: 130 },
    { field: "VisitDate", headerName: "Date", width: 100 },
    { field: "Notes", headerName: "Notes", width: 150 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View">
              <Button
                variant="contained"
                color="success"
                onClick={() => handleViewWalkIn(row)}
              >
                <VisibilityIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleEditWalkIn(row)}
              >
                <EditIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteWalkIn(row.WalkInID)}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Staff Dashboard
        </Typography>
        <IconButton color="primary" onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Top: Metrics row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, backgroundColor: "#42A5F5", color: "#fff" }}>
            <CardContent>
              <Typography variant="subtitle2">Check-ins Today</Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {checkInsToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Add more metrics cards as needed */}
      </Grid>

      {/* Middle: Check-In Form */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Check In Member" />
        <CardContent>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Check-in Method</InputLabel>
            <Select
              label="Check-in Method"
              value={checkInMethod}
              onChange={(e) => setCheckInMethod(e.target.value)}
            >
              <MenuItem value="card">Membership Card</MenuItem>
              <MenuItem value="biometric">Biometric</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </Select>
          </FormControl>

          {/* If "card", show "Open Camera Scanner" */}
          {checkInMethod === "card" && (
            <Button
              variant="outlined"
              startIcon={<CameraAltIcon />}
              onClick={handleOpenCam}
              fullWidth
              sx={{ mb: 2 }}
            >
              Open Camera Scanner
            </Button>
          )}
          {/* If "biometric", show "Fingerprint" */}
          {checkInMethod === "biometric" && (
            <Button
              variant="outlined"
              startIcon={<FingerprintIcon />}
              onClick={handleOpenBiometric}
              fullWidth
              sx={{ mb: 2 }}
            >
              Scan Fingerprint
            </Button>
          )}

          <TextField
            label="Member ID"
            variant="outlined"
            fullWidth
            size="small"
            value={checkInMemberID}
            onChange={(e) => setCheckInMemberID(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleCheckIn} fullWidth>
            Check In
          </Button>
        </CardContent>
      </Card>

      {/* Bottom: Tabs => Visits, Walk-Ins */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Visits" />
          <Tab label="Walk-Ins" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Paper sx={{ height: 500 }}>
          <DataGrid
            rows={visits}
            columns={visitColumns}
            getRowId={(row) => row.VisitID}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </Paper>
      )}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ textAlign: "right", mb: 1 }}>
            <Button variant="contained" onClick={() => setAddWalkInOpen(true)}>
              Add Walk-In
            </Button>
          </Box>
          <Paper sx={{ height: 500 }}>
            <DataGrid
              rows={walkIns}
              columns={walkInColumns}
              getRowId={(row) => row.WalkInID}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </Paper>
        </Box>
      )}

      {/* Camera Dialog */}
      <Dialog open={isCamOpen} onClose={() => setCamOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Card Scanning via Webcam</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for webcam scanning. A real implementation would parse a barcode or QR code.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCamOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSimulateCardScan}>
            Simulate Card Scan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Biometric Dialog */}
      <Dialog open={isBiometricOpen} onClose={() => setBiometricOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Fingerprint Scan</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Placeholder for biometric scanning. In production, you'd integrate hardware or a library.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBiometricOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSimulateFingerprint}>
            Simulate Fingerprint
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Visit Dialog */}
      <Dialog open={isViewVisitOpen} onClose={() => setViewVisitOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Visit Details</DialogTitle>
        <DialogContent dividers>
          {selectedVisit && (
            <Box>
              <Typography>
                <strong>VisitID:</strong> {selectedVisit.VisitID}
              </Typography>
              <Typography>
                <strong>MemberID:</strong> {selectedVisit.MemberID}
              </Typography>
              <Typography>
                <strong>Date:</strong> {selectedVisit.VisitDate}
              </Typography>
              <Typography>
                <strong>Time:</strong> {selectedVisit.VisitTime}
              </Typography>
              <Typography>
                <strong>Method:</strong> {selectedVisit.CheckInMethod}
              </Typography>
              <Typography>
                <strong>Remarks:</strong> {selectedVisit.Remarks}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewVisitOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={isEditVisitOpen} onClose={() => setEditVisitOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Visit</DialogTitle>
        <DialogContent dividers>
          {selectedVisit && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="MemberID"
                value={selectedVisit.MemberID}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, MemberID: e.target.value }))
                }
              />
              <TextField
                label="VisitDate"
                type="date"
                value={selectedVisit.VisitDate}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, VisitDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="VisitTime"
                value={selectedVisit.VisitTime}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, VisitTime: e.target.value }))
                }
              />
              <TextField
                label="CheckInMethod"
                value={selectedVisit.CheckInMethod || ""}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, CheckInMethod: e.target.value }))
                }
              />
              <TextField
                label="Remarks"
                value={selectedVisit.Remarks || ""}
                onChange={(e) =>
                  setSelectedVisit((prev) => ({ ...prev, Remarks: e.target.value }))
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditVisitOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditVisitSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Walk-In Dialog */}
      <Dialog open={isViewWalkInOpen} onClose={() => setViewWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Walk-In Details</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box>
              <Typography>
                <strong>ID:</strong> {selectedWalkIn.WalkInID}
              </Typography>
              <Typography>
                <strong>Name:</strong> {selectedWalkIn.FullName}
              </Typography>
              <Typography>
                <strong>VisitDate:</strong> {selectedWalkIn.VisitDate}
              </Typography>
              <Typography>
                <strong>Notes:</strong> {selectedWalkIn.Notes}
              </Typography>
              {/* Payment details if any */}
              <Typography>
                <strong>PaymentMethod:</strong> {selectedWalkIn.PaymentMethod}
              </Typography>
              <Typography>
                <strong>AmountPaid:</strong> {selectedWalkIn.AmountPaid}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewWalkInOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Walk-In Dialog */}
      <Dialog open={isEditWalkInOpen} onClose={() => setEditWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Walk-In</DialogTitle>
        <DialogContent dividers>
          {selectedWalkIn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Name"
                value={selectedWalkIn.FullName || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                label="VisitDate"
                type="date"
                value={selectedWalkIn.VisitDate || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, VisitDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Payment Method"
                value={selectedWalkIn.PaymentMethod || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, PaymentMethod: e.target.value }))
                }
              />
              <TextField
                label="AmountPaid"
                type="number"
                value={selectedWalkIn.AmountPaid || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, AmountPaid: e.target.value }))
                }
              />
              <TextField
                label="Notes"
                multiline
                rows={2}
                value={selectedWalkIn.Notes || ""}
                onChange={(e) =>
                  setSelectedWalkIn((prev) => ({ ...prev, Notes: e.target.value }))
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditWalkInSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Walk-In Dialog */}
      <Dialog open={isAddWalkInOpen} onClose={() => setAddWalkInOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Walk-In</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Full Name"
            name="FullName"
            fullWidth
            margin="dense"
            value={newWalkIn.FullName}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Visit Date"
            name="VisitDate"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={newWalkIn.VisitDate}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Payment Method"
            name="PaymentMethod"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentMethod}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Payment Amount"
            name="PaymentAmount"
            type="number"
            fullWidth
            margin="dense"
            value={newWalkIn.PaymentAmount}
            onChange={handleAddWalkInChange}
          />
          <TextField
            label="Notes"
            name="Notes"
            fullWidth
            margin="dense"
            multiline
            rows={3}
            value={newWalkIn.Notes}
            onChange={handleAddWalkInChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWalkInOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWalkIn}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
