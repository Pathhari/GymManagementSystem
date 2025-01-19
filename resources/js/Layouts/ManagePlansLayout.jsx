// File: ./Layouts/ManagePlansLayout.jsx

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

/**
 * Layout to Manage Membership Plans in a Dialog:
 *  - Loads existing plans via GET /membership/plans
 *  - Allows create, edit, delete
 */
export default function ManagePlansLayout({ onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for new or editing plan
  const [planForm, setPlanForm] = useState({
    PlanID: null,      // numeric ID
    PlanName: "",
    Price: 0,
    Duration: "",
    Features: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch plans on mount
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

  // Handle open "Add Plan"
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

  // Handle open "Edit Plan"
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

  // Common "onChange" for TextFields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Create or Update
  const handleSubmitPlan = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!planForm.PlanName.trim()) {
      alert("Plan Name is required");
      return;
    }

    try {
      if (isEditing && planForm.PlanID) {
        // PUT /membership/plans/{id}
        const res = await axios.put(`/membership/plans/${planForm.PlanID}`, {
          PlanName: planForm.PlanName,
          Price: parseFloat(planForm.Price) || 0,
          Duration: planForm.Duration,
          Features: planForm.Features,
        });
        // Update local
        setPlans((prev) =>
          prev.map((p) => (p.PlanID === planForm.PlanID ? res.data : p))
        );
      } else {
        // POST /membership/plans
        const res = await axios.post("/membership/plans", {
          PlanName: planForm.PlanName,
          Price: parseFloat(planForm.Price) || 0,
          Duration: planForm.Duration,
          Features: planForm.Features,
        });
        // Add new
        setPlans((prev) => [...prev, res.data]);
      }
      // Reset form
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

  // Delete
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
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
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
          <Box>
            {/* Table of Plans */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
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

            {/* Form for Add/Edit */}
            <Box
              component="form"
              onSubmit={handleSubmitPlan}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                {isEditing ? "Edit Plan" : "Add New Plan"}
              </Typography>
              <TextField
                label="Plan Name"
                name="PlanName"
                value={planForm.PlanName}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Price"
                name="Price"
                type="number"
                value={planForm.Price}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Duration"
                name="Duration"
                value={planForm.Duration}
                onChange={handleChange}
                fullWidth
                required
              />
              <TextField
                label="Features"
                name="Features"
                multiline
                rows={2}
                value={planForm.Features}
                onChange={handleChange}
                fullWidth
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                {/* If editing, add a "cancel" button to revert to Add. */}
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

            <Box mt={2}>
              <Button variant="outlined" onClick={handleAddPlan}>
                {isEditing ? "Switch to Add New Plan" : "Add Another Plan"}
              </Button>
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
