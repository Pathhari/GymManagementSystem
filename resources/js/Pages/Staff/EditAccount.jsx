import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";

// Role options for new staff.
const roleOptions = ["Staff", "Admin", "Owner"];

export default function EditProfile() {
  // -------------------------- 1) MY ACCOUNT (CURRENT USER) --------------------------
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fetch current profile details on mount.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile");
        setUserEmail(res.data.email);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleShowNewPass = () => setShowNewPass((prev) => !prev);
  const handleToggleShowConfirmPass = () => setShowConfirmPass((prev) => !prev);

  const handleSaveMyAccount = async () => {
    if (newPassword && newPassword !== confirmPass) {
      alert("New Password and Confirm Password do not match!");
      return;
    }
    try {
      await axios.put("/profile", {
        email: userEmail.trim(),
        password: newPassword.trim() ? newPassword.trim() : null
      });
      alert("Your account changes have been saved!");
      setNewPassword("");
      setConfirmPass("");
    } catch (error) {
      console.error("Failed to update account:", error);
      alert("Error updating your account. Check console.");
    }
  };

  // -------------------------- 2) CREATE NEW STAFF --------------------------
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("Staff");
  const [staffName, setStaffName] = useState("");

  // We'll fetch real branches via GET /owner/branches.
  const [branchOptions, setBranchOptions] = useState([]);
  const [staffBranch, setStaffBranch] = useState(""); // Will store the numeric BranchID

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await axios.get("/owner/branches");
        // Depending on your BranchController, the response may be wrapped in a "branches" key.
        setBranchOptions(res.data.branches || res.data);
      } catch (err) {
        console.error("Error loading branches:", err);
        alert("Failed to load branches from server.");
      }
    };
    loadBranches();
  }, []);

  const handleOpenAddStaff = () => {
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole("Staff");
    setStaffName("");
    setStaffBranch("");
    setAddStaffOpen(true);
  };

  const handleAddStaff = async () => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim() || !staffBranch) {
      alert("Please fill out all fields for the staff.");
      return;
    }
    try {
      const res = await axios.post("/staff", {
        FullName: staffName.trim(),
        Email: staffEmail.trim(),
        Role: staffRole,
        password: staffPassword.trim(),
        BranchID: staffBranch
      });
      alert(
        `Staff created successfully!
Name: ${res.data.FullName}
Role: ${res.data.Role}
BranchID: ${res.data.BranchID}`
      );
      setAddStaffOpen(false);
    } catch (err) {
      console.error("Failed to create staff:", err);
      alert("Error creating staff. Check console for details.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Profile
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ---------------- MY ACCOUNT SECTION ---------------- */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          My Account
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="New Password"
              variant="outlined"
              fullWidth
              type={showNewPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mt: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleShowNewPass}>
                      {showNewPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirm New Password"
              variant="outlined"
              fullWidth
              type={showConfirmPass ? "text" : "password"}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleShowConfirmPass}>
                      {showConfirmPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ textAlign: "right", mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSaveMyAccount}>
            Save My Account
          </Button>
        </Box>
      </Paper>

    </Box>
  );
}
