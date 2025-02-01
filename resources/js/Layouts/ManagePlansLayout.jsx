import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

export default function ManagePlansLayout({ onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planForm, setPlanForm] = useState({
    PlanID: null,
    PlanName: "",
    Price: 0,
    Duration: "",
    Features: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await axios.get("/membership/plans");
      setPlans(res.data || []);
    } catch (err) {
      console.error("Error fetching membership plans:", err);
      alert("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = () => {
    setIsEditing(false);
    setPlanForm({
      PlanID: null,
      PlanName: "",
      Price: 0,
      Duration: "",
      Features: "",
    });
  };

  const handleEditPlan = (plan) => {
    setIsEditing(true);
    setPlanForm({
      PlanID: plan.PlanID,
      PlanName: plan.PlanName,
      Price: plan.Price,
      Duration: plan.Duration,
      Features: plan.Features || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!planForm.PlanName.trim()) {
      alert("Plan Name is required");
      return;
    }
    try {
      if (isEditing && planForm.PlanID) {
        const res = await axios.put(`/membership/plans/${planForm.PlanID}`, {
          PlanName: planForm.PlanName,
          Price: parseFloat(planForm.Price) || 0,
          Duration: parseInt(planForm.Duration, 10),
          Features: planForm.Features,
        });
        setPlans((prev) =>
          prev.map((p) => (p.PlanID === planForm.PlanID ? res.data : p))
        );
      } else {
        const res = await axios.post("/membership/plans", {
          PlanName: planForm.PlanName,
          Price: parseFloat(planForm.Price) || 0,
          Duration: planForm.Duration,
          Features: planForm.Features,
        });
        setPlans((prev) => [...prev, res.data]);
      }
      setPlanForm({
        PlanID: null,
        PlanName: "",
        Price: 0,
        Duration: "",
        Features: "",
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving plan:", err);
      alert("Error saving plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await axios.delete(`/membership/plans/${planId}`);
      setPlans((prev) => prev.filter((p) => p.PlanID !== planId));
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Error deleting plan");
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Manage Membership Plans</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>Loading plans...</Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" }, // Responsive layout
              gap: 2, // Space between table and form
            }}
          >
            {/* Table of Plans */}
            <Box
              sx={{
                flex: { xs: 1, md: 0.6 }, // Take 60% width on desktop
                minWidth: { xs: "100%", md: "50%" }, // Ensure proper width on mobile
              }}
            >
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "black" }}>
                    <TableRow>
                      <TableCell>PlanID</TableCell>
                      <TableCell>PlanName</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Features</TableCell>
                      <TableCell width={150}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.PlanID}>
                        <TableCell>{plan.PlanID}</TableCell>
                        <TableCell>{plan.PlanName}</TableCell>
                        <TableCell>{plan.Price}</TableCell>
                        <TableCell>{plan.Duration}</TableCell>
                        <TableCell>{plan.Features || "—"}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit Plan">
                            <IconButton
                              onClick={() => handleEditPlan(plan)}
                              sx={{ color: "#2196f3" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Plan">
                            <IconButton
                              onClick={() => handleDeletePlan(plan.PlanID)}
                              sx={{ color: "#f44336" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Form for Add/Edit */}
            <Box
              component="form"
              onSubmit={handleSubmitPlan}
              sx={{
                flex: { xs: 1, md: 0.4 }, // Take 40% width on desktop
                minWidth: { xs: "100%", md: "300px" }, // Ensure proper width on mobile
                p: 2,
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {isEditing ? "Edit Plan" : "Add New Plan"}
              </Typography>
              <TextField
                label="Plan Name"
                name="PlanName"
                value={planForm.PlanName}
                onChange={handleChange}
                required
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Price"
                name="Price"
                type="number"
                value={planForm.Price}
                onChange={handleChange}
                required
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Duration"
                name="Duration"
                value={planForm.Duration}
                onChange={handleChange}
                required
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Features"
                name="Features"
                multiline
                rows={2}
                value={planForm.Features}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                {!isEditing && (
                  <Button variant="outlined" onClick={handleAddPlan}>
                    Clear
                  </Button>
                )}
                <Button variant="contained" color="primary" type="submit">
                  {isEditing ? "Save Changes" : "Add Plan"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}