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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import axios from "axios";

// Role options for new staff
const roleOptions = ["Staff", "Admin", "Owner"];

export default function EditProfile() {
  const theme = useTheme();
  // -------------------------- 1) MY ACCOUNT (CURRENT USER) --------------------------
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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
    // If we’re sending a new password, make sure it matches the confirm field
    if (newPassword && newPassword !== confirmPass) {
      alert("New Password and Confirm Password do not match!");
      return;
    }
    try {
      await axios.put("/profile", {
        email: userEmail.trim(),
        // Only send password if user entered a new one
        password: newPassword.trim() ? newPassword.trim() : null,
        // Include password_confirmation if user entered a new one
        password_confirmation: newPassword.trim() ? confirmPass.trim() : null
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
  // NEW: confirm password for staff
  const [staffConfirmPassword, setStaffConfirmPassword] = useState("");
  const [staffRole, setStaffRole] = useState("Staff");
  const [staffName, setStaffName] = useState("");

  // NEW: visibility toggles for staff password fields
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [showStaffConfirmPassword, setShowStaffConfirmPassword] = useState(false);

  const handleToggleShowStaffPassword = () =>
    setShowStaffPassword((prev) => !prev);
  const handleToggleShowStaffConfirmPassword = () =>
    setShowStaffConfirmPassword((prev) => !prev);

  // We'll fetch real branches via GET /owner/branches.
  const [branchOptions, setBranchOptions] = useState([]);
  const [staffBranch, setStaffBranch] = useState(""); // numeric BranchID

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await axios.get("/owner/branches");
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
    setStaffConfirmPassword("");
    setStaffRole("Staff");
    setStaffName("");
    setStaffBranch("");
    setAddStaffOpen(true);
  };

  const handleAddStaff = async () => {
    // Basic validation
    if (
      !staffName.trim() ||
      !staffEmail.trim() ||
      !staffPassword.trim() ||
      !staffBranch
    ) {
      alert("Please fill out all fields for the staff.");
      return;
    }
    // Check password match
    if (staffPassword.trim() !== staffConfirmPassword.trim()) {
      alert("Password and Confirm Password do not match!");
      return;
    }
    try {
      const res = await axios.post("/staff", {
        FullName: staffName.trim(),
        Email: staffEmail.trim(),
        Role: staffRole,
        password: staffPassword.trim(),
        // Send password_confirmation to match backend "confirmed" rule
        password_confirmation: staffConfirmPassword.trim(),
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
        Edit Profile & Manage Staff
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
                      {showConfirmPass ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
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

      {/* ---------------- CREATE STAFF SECTION ---------------- */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Add New Staff Account Credentials
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create a new staff account with role-based credentials.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddStaff}>
          Create Staff
        </Button>
      </Paper>

      {/* ADD STAFF DIALOG */}
      <Dialog
        open={isAddStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonAddIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Create Staff User
              </Typography>
            </Box>
            <IconButton
              onClick={() => setAddStaffOpen(false)}
              sx={{
                "&:hover": { color: theme.palette.error.main }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                variant="filled"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Staff Email"
                variant="filled"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                variant="filled"
                type={showStaffPassword ? "text" : "password"}
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleShowStaffPassword}>
                        {showStaffPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                variant="filled"
                type={showStaffConfirmPassword ? "text" : "password"}
                value={staffConfirmPassword}
                onChange={(e) => setStaffConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleShowStaffConfirmPassword}>
                        {showStaffConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="filled">
                <InputLabel>Role</InputLabel>
                <Select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  {roleOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="filled">
                <InputLabel>Branch</InputLabel>
                <Select value={staffBranch} onChange={(e) => setStaffBranch(e.target.value)}>
                  {branchOptions.map((b) => (
                    <MenuItem key={b.BranchID} value={b.BranchID}>
                      {b.BranchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Dialog Actions - Create aligned to the right */}
        <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddStaff}
            sx={{
              textTransform: "none"
            }}
          >
            <PersonAddIcon sx={{ mr: 1 }} /> Create Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
