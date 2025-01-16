import React, { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * Demo roles (for staff creation).
 * In real usage, you might fetch from server, e.g. ['Staff', 'Admin', 'Owner'].
 */
const roleOptions = ["Staff", "Admin", "Owner"];

export default function EditProfile() {
  // -----------------------------------------
  // SECTION 1: MY ACCOUNT (CURRENT USER)
  // -----------------------------------------
  const [userEmail, setUserEmail] = useState("john.doe@example.com");

  // Removed "currentPassword"; we only have new & confirm password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Control password visibility (new + confirm)
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleToggleShowNewPass = () => setShowNewPass((prev) => !prev);
  const handleToggleShowConfirmPass = () => setShowConfirmPass((prev) => !prev);

  const handleSaveMyAccount = () => {
    // If a new password is entered, ensure it matches the confirm
    if (newPassword && newPassword !== confirmPass) {
      alert("New Password and Confirm Password do not match!");
      return;
    }
    // API call or context update to save changes...
    alert("Your account changes saved!");
  };

  // -----------------------------------------
  // SECTION 2: ADD STAFF
  // -----------------------------------------
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("Staff"); // default to Staff
  const [staffName, setStaffName] = useState("");

  const handleOpenAddStaff = () => {
    // Clear fields
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole("Staff");
    setStaffName("");
    setAddStaffOpen(true);
  };

  const handleAddStaff = () => {
    if (!staffName || !staffEmail || !staffPassword) {
      alert("Please fill out name, email, and password for staff.");
      return;
    }
    // Suppose you call an API to create staff user ...
    alert(
      `Staff created!\nName: ${staffName}\nEmail: ${staffEmail}\nRole: ${staffRole}`
    );
    setAddStaffOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Profile & Manage Staff
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* MY ACCOUNT SECTION */}
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          My Account
        </Typography>
        <Grid container spacing={2}>
          {/* Email */}
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

          {/* New Password */}
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
                ),
              }}
            />
          </Grid>

          {/* Confirm New Password */}
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
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* SAVE BUTTON */}
        <Box sx={{ textAlign: "right", mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveMyAccount}
          >
            Save My Account
          </Button>
        </Box>
      </Paper>

      {/* ADD STAFF SECTION */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Add New Staff Account Credentials
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create a new staff account with role-based credentials.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddStaff}
        >
          Create Staff
        </Button>
      </Paper>

      {/* ADD STAFF DIALOG */}
      <Dialog
        open={isAddStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Staff User</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            sx={{ mt: 1 }}
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          />
          <TextField
            label="Staff Email"
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            type="password"
            sx={{ mt: 2 }}
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
            >
              {roleOptions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStaffOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddStaff}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



























//<----- ADD MEMBER CODE DO NOT REMOVE ----->

// import React, { useState } from "react";

// import {
//   Box,
//   Typography,
//   Divider,
//   Grid,
//   Card,
//   CardContent,
//   Paper,
//   Avatar,
//   Button,
//   TextField,
//   MenuItem,
//   FormControlLabel,
//   Checkbox,
//   Switch,
//   FormControl,
//   InputLabel,
//   Select,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Tooltip,
// } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

// // Sample membership details if user is a member
// const mockMembershipDetails = {
//   membershipType: "Premium Plan",
//   startDate: "2025-01-01",
//   endDate: "2025-12-31",
//   autoRenew: true,
// };

// export default function EditProfile() {
//   // ---------------------- PROFILE STATE (Demo) ----------------------
//   // Profile Overview
//   const [profilePic, setProfilePic] = useState(
//     "https://via.placeholder.com/100x100?text=Profile"
//   );

//   // Personal Info
//   const [firstName, setFirstName] = useState("John");
//   const [lastName, setLastName] = useState("Doe");
//   const [dob, setDob] = useState("1990-01-01");
//   const [gender, setGender] = useState("Male");
//   const [contactNumber, setContactNumber] = useState("123-456-7890");
//   const [email, setEmail] = useState("john.doe@example.com");
//   const [address, setAddress] = useState("1234 Elm Street, City, Country");
//   const [emergencyContactName, setEmergencyContactName] = useState("Jane Doe");
//   const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("Spouse");
//   const [emergencyContactPhone, setEmergencyContactPhone] = useState("987-654-3210");

//   // Account Info
//   const [username, setUsername] = useState("john_doe");
//   const [currPassword, setCurrPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [emailPref, setEmailPref] = useState(true);

//   // Membership Details (view-only, if applicable)
//   const [membershipData] = useState(mockMembershipDetails);

//   // Preferences
//   const [prefLanguage, setPrefLanguage] = useState("en");
//   const [prefEmail, setPrefEmail] = useState(true);
//   const [prefSMS, setPrefSMS] = useState(false);
//   const [prefApp, setPrefApp] = useState(true);
//   const [prefPaymentMethod, setPrefPaymentMethod] = useState("GCash");

//   // ---------------------- HANDLERS ----------------------
//   const handleProfilePicChange = (e) => {
//     // For demonstration only. Typically, you'd read the file & convert to base64 or store in DB.
//     alert("Profile picture updated! (Mock)");
//   };

//   const handleSaveChanges = () => {
//     // Validate & Save all data to server or context
//     if (newPassword && newPassword !== confirmPassword) {
//       alert("New Password and Confirm Password do not match!");
//       return;
//     }
//     // Additional checks, then call an API
//     alert("Profile changes saved!");
//   };

//   const handleCancelChanges = () => {
//     // Revert or navigate away, etc.
//     alert("Changes cancelled. Reverting...");
//     // You might re-fetch user data from the backend or reset states.
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Edit Profile
//       </Typography>
//       <Divider sx={{ mb: 3 }} />

//       {/* ------------ Profile Overview ------------ */}
//       <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Profile Overview
//         </Typography>
//         <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
//           <Avatar
//             src={profilePic}
//             alt="Profile Avatar"
//             sx={{ width: 100, height: 100, border: "2px solid #ccc" }}
//           />
//           <Box>
//             <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
//               {firstName} {lastName}
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               Role: Member (or Staff/Admin/Owner)
//             </Typography>
//             <Typography variant="body2" color="text.secondary">
//               Member ID: M-202501
//             </Typography>
//             {/* Upload button to change the profile picture */}
//             <Button
//               variant="outlined"
//               startIcon={<AddAPhotoIcon />}
//               sx={{ mt: 1 }}
//               onClick={handleProfilePicChange}
//             >
//               Update Photo
//             </Button>
//           </Box>
//         </Box>
//       </Paper>

//       {/* ------------ Personal Information ------------ */}
//       <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Personal Information
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="First Name"
//               variant="outlined"
//               fullWidth
//               value={firstName}
//               onChange={(e) => setFirstName(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Last Name"
//               variant="outlined"
//               fullWidth
//               value={lastName}
//               onChange={(e) => setLastName(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               type="date"
//               label="Date of Birth"
//               variant="outlined"
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               value={dob}
//               onChange={(e) => setDob(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               select
//               label="Gender"
//               variant="outlined"
//               fullWidth
//               value={gender}
//               onChange={(e) => setGender(e.target.value)}
//             >
//               <MenuItem value="Male">Male</MenuItem>
//               <MenuItem value="Female">Female</MenuItem>
//               <MenuItem value="Other">Other</MenuItem>
//             </TextField>
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Contact Number"
//               variant="outlined"
//               fullWidth
//               value={contactNumber}
//               onChange={(e) => setContactNumber(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Email Address"
//               variant="outlined"
//               fullWidth
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Address"
//               variant="outlined"
//               fullWidth
//               multiline
//               rows={2}
//               value={address}
//               onChange={(e) => setAddress(e.target.value)}
//             />
//           </Grid>
//         </Grid>

//         <Typography variant="subtitle1" sx={{ mt: 3 }}>
//           Emergency Contact
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Name"
//               variant="outlined"
//               fullWidth
//               value={emergencyContactName}
//               onChange={(e) => setEmergencyContactName(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Relationship"
//               variant="outlined"
//               fullWidth
//               value={emergencyContactRelationship}
//               onChange={(e) => setEmergencyContactRelationship(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               label="Phone Number"
//               variant="outlined"
//               fullWidth
//               value={emergencyContactPhone}
//               onChange={(e) => setEmergencyContactPhone(e.target.value)}
//             />
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* ------------ Account Information ------------ */}
//       <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Account Information
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               label="Username"
//               variant="outlined"
//               fullWidth
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <FormControlLabel
//               control={
//                 <Checkbox
//                   checked={emailPref}
//                   onChange={(e) => setEmailPref(e.target.checked)}
//                 />
//               }
//               label="Receive email promotions/updates?"
//             />
//           </Grid>
//         </Grid>
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
//             Change Password
//           </Typography>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={4}>
//               <TextField
//                 label="Current Password"
//                 type="password"
//                 variant="outlined"
//                 fullWidth
//                 value={currPassword}
//                 onChange={(e) => setCurrPassword(e.target.value)}
//               />
//             </Grid>
//             <Grid item xs={12} sm={4}>
//               <TextField
//                 label="New Password"
//                 type="password"
//                 variant="outlined"
//                 fullWidth
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </Grid>
//             <Grid item xs={12} sm={4}>
//               <TextField
//                 label="Confirm New Password"
//                 type="password"
//                 variant="outlined"
//                 fullWidth
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </Grid>
//           </Grid>
//         </Box>
//       </Paper>

//       {/* ------------ Membership Details (Read Only) ------------ */}
//       <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Membership Details (View-Only)
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="Membership Type"
//               variant="outlined"
//               fullWidth
//               value={membershipData.membershipType}
//               disabled
//             />
//           </Grid>
//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="Start Date"
//               variant="outlined"
//               fullWidth
//               value={membershipData.startDate}
//               disabled
//             />
//           </Grid>
//           <Grid item xs={12} sm={3}>
//             <TextField
//               label="End Date"
//               variant="outlined"
//               fullWidth
//               value={membershipData.endDate}
//               disabled
//             />
//           </Grid>
//           <Grid item xs={12} sm={3}>
//             <FormControlLabel
//               label="Auto-Renew?"
//               control={<Switch checked={membershipData.autoRenew} disabled />}
//             />
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* ------------ Preferences ------------ */}
//       <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Preferences
//         </Typography>
//         <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={12} sm={4}>
//             <TextField
//               select
//               label="Preferred Language"
//               variant="outlined"
//               fullWidth
//               value={prefLanguage}
//               onChange={(e) => setPrefLanguage(e.target.value)}
//             >
//               <MenuItem value="en">English</MenuItem>
//               <MenuItem value="es">Spanish</MenuItem>
//               <MenuItem value="fr">French</MenuItem>
//             </TextField>
//           </Grid>
//           <Grid item xs={12} sm={4}>
//             <FormControl fullWidth>
//               <InputLabel>Preferred Payment Method</InputLabel>
//               <Select
//                 label="Preferred Payment Method"
//                 value={prefPaymentMethod}
//                 onChange={(e) => setPrefPaymentMethod(e.target.value)}
//               >
//                 <MenuItem value="GCash">GCash</MenuItem>
//                 <MenuItem value="CreditCard">Credit Card</MenuItem>
//                 <MenuItem value="PayPal">PayPal</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//         </Grid>
//         <Typography variant="subtitle1" sx={{ mt: 2 }}>
//           Notification Preferences
//         </Typography>
//         <Box sx={{ display: "flex", gap: 4, mt: 1 }}>
//           <FormControlLabel
//             label="Email Notifications"
//             control={
//               <Checkbox
//                 checked={prefEmail}
//                 onChange={(e) => setPrefEmail(e.target.checked)}
//               />
//             }
//           />
//           <FormControlLabel
//             label="SMS Notifications"
//             control={
//               <Checkbox
//                 checked={prefSMS}
//                 onChange={(e) => setPrefSMS(e.target.checked)}
//               />
//             }
//           />
//           <FormControlLabel
//             label="App Notifications"
//             control={
//               <Checkbox
//                 checked={prefApp}
//                 onChange={(e) => setPrefApp(e.target.checked)}
//               />
//             }
//           />
//         </Box>
//       </Paper>

//       {/* ------------ ACTION BUTTONS ------------ */}
//       <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
//         <Button variant="text" color="inherit" onClick={handleCancelChanges}>
//           Cancel
//         </Button>
//         <Button variant="contained" color="primary" onClick={handleSaveChanges}>
//           Save Changes
//         </Button>
//       </Box>
//     </Box>
//   );
// }
