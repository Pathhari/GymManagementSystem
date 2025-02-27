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
  InputAdornment,
  Snackbar
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import StoreIcon from "@mui/icons-material/Store";
import WorkIcon from "@mui/icons-material/Work";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import axios from "axios";

const roleOptions = ["Staff", "Admin", "Owner"];

export default function EditProfile() {
  // ----------------------------------------------------------------
  // 1) MY ACCOUNT (CURRENT USER)
  // ----------------------------------------------------------------
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
    if (newPassword && newPassword !== confirmPass) {
      alert("New Password and Confirm Password do not match!");
      return;
    }
    try {
      // Build the payload
      const payload = { email: userEmail.trim() };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
        payload.password_confirmation = confirmPass.trim();
      }

      await axios.put("/profile", payload);
      alert("Your account changes have been saved!");

      // Clear out password fields
      setNewPassword("");
      setConfirmPass("");
    } catch (error) {
      console.error("Failed to update account:", error);
      alert("Error updating your account. Check console.");
    }
  };

  // ----------------------------------------------------------------
  // 2) ADD / CREATE NEW STAFF, ADMIN, or OWNER
  // ----------------------------------------------------------------
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);

  // Single object for the staff/admin data
  const [staffData, setStaffData] = useState({
    FullName: "",
    Email: "",
    Phone: "",
    Role: "Staff",
    BranchID: "",   // single-branch for Staff
    BranchIDs: [],  // multi-branch for Admin
    DateHired: "",
    DailyRate: "",
    HourlyRate: "",
    OvertimeRate: "",
    Notes: "",
    password: "",
    confirmPassword: ""
  });

  // For multi-branch Admin usage
  const [branchOptions, setBranchOptions] = useState([]);

  // Error state for server-side validations
  const [apiErrors, setApiErrors] = useState({});

  // Snackbar for success messages
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  // Show/hide password icons
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [showStaffConfirmPassword, setShowStaffConfirmPassword] = useState(false);
  const handleToggleShowStaffPassword = () =>
    setShowStaffPassword((prev) => !prev);
  const handleToggleShowStaffConfirmPassword = () =>
    setShowStaffConfirmPassword((prev) => !prev);

  useEffect(() => {
    // Load real branches
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

  // Open the dialog
  const handleOpenAddStaff = () => {
    setStaffData({
      FullName: "",
      Email: "",
      Phone: "",
      Role: "Staff",
      BranchID: "",
      BranchIDs: [],
      DateHired: "",
      DailyRate: "",
      HourlyRate: "",
      OvertimeRate: "",
      Notes: "",
      password: "",
      confirmPassword: ""
    });
    setApiErrors({}); // clear previous errors
    setAddStaffOpen(true);
  };

  // Handle changes to the staffData object
  const handleStaffDataChange = (field, value) => {
    setStaffData((prev) => ({
      ...prev,
      [field]: value
    }));
    setApiErrors((prevErrors) => ({
      ...prevErrors,
      [field]: undefined // clear error as user types
    }));
  };

  const handleAddStaff = async () => {
    // Reset errors before submission
    setApiErrors({});

    // Basic front-end check
    if (!staffData.FullName.trim() || !staffData.Email.trim()) {
      alert("Please fill out Full Name and Email.");
      return;
    }
    if (staffData.password.trim() !== staffData.confirmPassword.trim()) {
      alert("Password and Confirm Password do not match!");
      return;
    }

    // Build final payload
    const payload = {
      FullName: staffData.FullName.trim(),
      Email: staffData.Email.trim(),
      Phone: staffData.Phone.trim(),
      Role: staffData.Role,
      Notes: staffData.Notes.trim() || null,
      password: staffData.password.trim() || null,
      password_confirmation: staffData.confirmPassword.trim() || null
    };

    if (staffData.Role === "Staff") {
      // Staff => single Branch & staff-specific fields
      if (!staffData.BranchID) {
        alert("Please select a branch for Staff.");
        return;
      }
      payload.BranchID = staffData.BranchID;
      payload.DateHired = staffData.DateHired || null;
      payload.DailyRate = staffData.DailyRate || null;
      payload.HourlyRate = staffData.HourlyRate || null;
      payload.OvertimeRate = staffData.OvertimeRate || null;
    } else if (staffData.Role === "Admin") {
      // Admin => multiple branches
      if (!staffData.BranchIDs || staffData.BranchIDs.length === 0) {
        alert("Please select at least one branch for Admin.");
        return;
      }
      payload.BranchIDs = staffData.BranchIDs;
    }
    // Owner => no branch needed

    try {
      const res = await axios.post("/staff", payload);

      setSnackMessage(`New ${staffData.Role} created: ${res.data.FullName}`);
      setSnackOpen(true);
      setAddStaffOpen(false);
    } catch (err) {
      console.error("Failed to create staff:", err);

      // Check for Laravel 422 validation error
      if (err.response && err.response.status === 422) {
        const { errors, message } = err.response.data;

        // Store the field-level errors in state
        if (errors) {
          setApiErrors(errors);
        }

        // Optionally show the top-level message
        // e.g. "The password field must be at least 8 characters."
        if (message) {
          setSnackMessage(message);
          setSnackOpen(true);
        }
      } else {
        alert("Error creating staff. Check console for details.");
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Profile & Manage Staff
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ------------- MY ACCOUNT SECTION ------------- */}
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

      {/* ------------- CREATE STAFF SECTION ------------- */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Add New Staff / Admin / Owner
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create a new user with the appropriate role and branch(es).
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddStaff}>
          Create Staff
        </Button>
      </Paper>

      {/* --------- ADD STAFF DIALOG --------- */}
      <Dialog
        open={isAddStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        fullWidth
        maxWidth="md"
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
                Create {staffData.Role}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setAddStaffOpen(false)}
              sx={{
                "&:hover": { color: "red" }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          <Grid container spacing={2}>
            {/* Full Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                value={staffData.FullName}
                onChange={(e) => handleStaffDataChange("FullName", e.target.value)}
                error={!!apiErrors.FullName}
                helperText={apiErrors.FullName ? apiErrors.FullName[0] : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={staffData.Email}
                onChange={(e) => handleStaffDataChange("Email", e.target.value)}
                error={!!apiErrors.Email}
                helperText={apiErrors.Email ? apiErrors.Email[0] : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                variant="outlined"
                fullWidth
                type={showStaffPassword ? "text" : "password"}
                value={staffData.password}
                onChange={(e) => handleStaffDataChange("password", e.target.value)}
                error={!!apiErrors.password}
                helperText={apiErrors.password ? apiErrors.password[0] : ""}
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

            {/* Confirm Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password"
                variant="outlined"
                fullWidth
                type={showStaffConfirmPassword ? "text" : "password"}
                value={staffData.confirmPassword}
                onChange={(e) =>
                  handleStaffDataChange("confirmPassword", e.target.value)
                }
                error={!!apiErrors.password_confirmation}
                helperText={
                  apiErrors.password_confirmation
                    ? apiErrors.password_confirmation[0]
                    : ""
                }
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

            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                variant="outlined"
                fullWidth
                value={staffData.Phone}
                onChange={(e) => handleStaffDataChange("Phone", e.target.value)}
                error={!!apiErrors.Phone}
                helperText={apiErrors.Phone ? apiErrors.Phone[0] : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={staffData.Role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setStaffData((prev) => ({
                      ...prev,
                      Role: newRole,
                      BranchID: "",
                      BranchIDs: [],
                      DateHired: "",
                      DailyRate: "",
                      HourlyRate: "",
                      OvertimeRate: ""
                    }));
                    setApiErrors({});
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <WorkIcon />
                    </InputAdornment>
                  }
                >
                  {roleOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Branch (Single or Multiple) */}
            {staffData.Role === "Owner" ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="textSecondary">
                  Owners have access to all branches.
                </Typography>
              </Grid>
            ) : staffData.Role === "Admin" ? (
              /* Admin => multi-select branches */
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Branches</InputLabel>
                  <Select
                    multiple
                    label="Branches"
                    value={staffData.BranchIDs}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleStaffDataChange(
                        "BranchIDs",
                        typeof value === "string" ? value.split(",") : value
                      );
                    }}
                    renderValue={(selected) => {
                      const selectedNames = branchOptions
                        .filter((b) => selected.includes(b.BranchID))
                        .map((b) => b.BranchName);
                      return selectedNames.join(", ");
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <StoreIcon />
                      </InputAdornment>
                    }
                  >
                    {branchOptions.map((b) => (
                      <MenuItem key={b.BranchID} value={b.BranchID}>
                        {b.BranchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              /* Staff => single-select branch, plus staff-specific fields */
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Branch</InputLabel>
                  <Select
                    label="Branch"
                    value={staffData.BranchID}
                    onChange={(e) => handleStaffDataChange("BranchID", e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <StoreIcon />
                      </InputAdornment>
                    }
                    error={!!apiErrors.BranchID}
                  >
                    <MenuItem value="">
                      <em>-- Select Branch --</em>
                    </MenuItem>
                    {branchOptions.map((b) => (
                      <MenuItem key={b.BranchID} value={b.BranchID}>
                        {b.BranchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Show these fields ONLY if Role === 'Staff' */}
            {staffData.Role === "Staff" && (
              <>
                {/* DateHired */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date Hired"
                    variant="outlined"
                    type="date"
                    fullWidth
                    value={staffData.DateHired}
                    onChange={(e) => handleStaffDataChange("DateHired", e.target.value)}
                    error={!!apiErrors.DateHired}
                    helperText={apiErrors.DateHired ? apiErrors.DateHired[0] : ""}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Daily Rate */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Daily Rate"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={staffData.DailyRate}
                    onChange={(e) => handleStaffDataChange("DailyRate", e.target.value)}
                    error={!!apiErrors.DailyRate}
                    helperText={apiErrors.DailyRate ? apiErrors.DailyRate[0] : ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <span>₱</span>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Hourly Rate */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Hourly Rate"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={staffData.HourlyRate}
                    onChange={(e) => handleStaffDataChange("HourlyRate", e.target.value)}
                    error={!!apiErrors.HourlyRate}
                    helperText={apiErrors.HourlyRate ? apiErrors.HourlyRate[0] : ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Overtime Rate */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Overtime Rate"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={staffData.OvertimeRate}
                    onChange={(e) =>
                      handleStaffDataChange("OvertimeRate", e.target.value)
                    }
                    error={!!apiErrors.OvertimeRate}
                    helperText={apiErrors.OvertimeRate ? apiErrors.OvertimeRate[0] : ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimelapseIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Additional Notes (visible for all roles) */}
            <Grid item xs={12}>
              <TextField
                label="Additional Notes"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={staffData.Notes}
                onChange={(e) => handleStaffDataChange("Notes", e.target.value)}
                error={!!apiErrors.Notes}
                helperText={apiErrors.Notes ? apiErrors.Notes[0] : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StickyNote2Icon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddStaff}
            sx={{ textTransform: "none" }}
          >
            <PersonAddIcon sx={{ mr: 1 }} /> Create {staffData.Role}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success or Error Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </Box>
  );
}
