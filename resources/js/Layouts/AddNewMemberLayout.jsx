// File: ./layouts/AddNewMemberLayout.jsx
import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Webcam from "react-webcam";

export default function AddNewMemberLayout({ onClose }) {
  // ---------------------- FORM STATE ----------------------
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [membershipPlan, setMembershipPlan] = useState("");
  const [membershipCardNumber, setMembershipCardNumber] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("");
  const [membershipStartDate, setMembershipStartDate] = useState("");
  const [membershipEndDate, setMembershipEndDate] = useState("");
  const [biometricData, setBiometricData] = useState(null);
  const [freeSessions, setFreeSessions] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");

  // State for enabling next step
  const [allFieldsValid, setAllFieldsValid] = useState(false);
  // Control Modal for webcam picture
  const [openWebcam, setOpenWebcam] = useState(false);
  // For storing captured picture URL
  const [capturedImage, setCapturedImage] = useState(null);

  // For react-webcam
  const webcamRef = useRef(null);
  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user",
  };

  // Sample dropdown options.
  const membershipPlanOptions = [
    { value: "1MonthBasic", label: "1 Month Basic Plan" },
    { value: "annualPremium", label: "Annual Premium Plan" },
  ];
  const membershipStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Expired", label: "Expired" },
    { value: "Pending", label: "Pending" },
  ];
  const branchOptions = [
    { value: "branch1", label: "Branch 1" },
    { value: "branch2", label: "Branch 2" },
    { value: "branch3", label: "Branch 3" },
  ];

  // ---------------------- VALIDATION FUNCTION ----------------------
  const validateForm = useCallback(() => {
    if (
      fullName.trim() &&
      email.trim() &&
      phoneNumber.trim() &&
      membershipPlan &&
      membershipCardNumber.trim() &&
      membershipStatus &&
      membershipStartDate &&
      membershipEndDate &&
      freeSessions &&
      branch
    ) {
      setAllFieldsValid(true);
    } else {
      setAllFieldsValid(false);
    }
  }, [
    fullName,
    email,
    phoneNumber,
    membershipPlan,
    membershipCardNumber,
    membershipStatus,
    membershipStartDate,
    membershipEndDate,
    freeSessions,
    branch,
  ]);

  // Run validation when any of these fields changes.
  React.useEffect(() => {
    validateForm();
  }, [validateForm]);

  // ---------------------- HANDLERS ----------------------
  const handleBiometricUpload = (e) => {
    setBiometricData(e.target.files[0]);
  };

  const handleOpenWebcam = () => {
    setOpenWebcam(true);
  };

  const handleCloseWebcam = () => {
    setOpenWebcam(false);
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setOpenWebcam(false);
    }
  }, [webcamRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Member Details:", {
      fullName,
      email,
      phoneNumber,
      membershipPlan,
      membershipCardNumber,
      membershipStatus,
      membershipStartDate,
      membershipEndDate,
      biometricData,
      freeSessions,
      branch,
      notes,
      capturedImage,
    });
    alert("Member registration submitted!");
    // Optionally, you can also trigger an onClose to close the dialog after submission.
    if (onClose) onClose();
  };

  // ---------------------- DIALOG STATE ----------------------
  // We control the visibility of the dialog internally.
  const [openDialog, setOpenDialog] = useState(true);
  const handleDialogClose = () => {
    setOpenDialog(false);
    if (onClose) onClose();
  };

  // ---------------------- RENDER ----------------------
  return (
    <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="md">

      <DialogContent>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Add New Member
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Full Name */}
              <Grid item xs={12}>
                <TextField
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Grid>
              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  variant="outlined"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              {/* Phone Number */}
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </Grid>
              {/* Membership Plan */}
              <Grid item xs={12}>
                <TextField
                  select
                  label="Membership Plan"
                  variant="outlined"
                  fullWidth
                  value={membershipPlan}
                  onChange={(e) => setMembershipPlan(e.target.value)}
                  required
                >
                  {membershipPlanOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Membership Card Number */}
              <Grid item xs={12}>
                <TextField
                  label="Membership Card Number"
                  variant="outlined"
                  fullWidth
                  value={membershipCardNumber}
                  onChange={(e) => setMembershipCardNumber(e.target.value)}
                  required
                />
              </Grid>
              {/* Membership Status */}
              <Grid item xs={12}>
                <TextField
                  select
                  label="Membership Status"
                  variant="outlined"
                  fullWidth
                  value={membershipStatus}
                  onChange={(e) => setMembershipStatus(e.target.value)}
                  required
                >
                  {membershipStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Membership Start Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Membership Start Date"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={membershipStartDate}
                  onChange={(e) => setMembershipStartDate(e.target.value)}
                  required
                />
              </Grid>
              {/* Membership End Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Membership End Date"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  required
                />
              </Grid>
              {/* Biometric Data */}
              <Grid item xs={12}>
                <Button variant="contained" component="label">
                  Upload Biometric Data (Optional)
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={handleBiometricUpload}
                  />
                </Button>
                {biometricData && (
                  <Typography variant="caption" sx={{ ml: 2 }}>
                    {biometricData.name}
                  </Typography>
                )}
              </Grid>
              {/* Free Sessions */}
              <Grid item xs={12}>
                <TextField
                  label="Free Sessions"
                  variant="outlined"
                  type="number"
                  fullWidth
                  value={freeSessions}
                  onChange={(e) => setFreeSessions(e.target.value)}
                  required
                />
              </Grid>
              {/* Branch */}
              <Grid item xs={12}>
                <TextField
                  select
                  label="Branch"
                  variant="outlined"
                  fullWidth
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                >
                  {branchOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
  
              {/* Display captured image preview if available */}
              {capturedImage && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Captured Image Preview:
                  </Typography>
                  <img
                    src={capturedImage}
                    alt="Captured"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </Grid>
              )}
            </Grid>
  
            {/* Next Button: Only enabled if all required fields are valid */}
            {allFieldsValid && (
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                }}
              >
                <Button variant="outlined" onClick={handleOpenWebcam}>
                  Next: Capture Picture
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  Submit Registration
                </Button>
              </Box>
            )}
          </form>
  
          {/* ---------------- WebCam Dialog ---------------- */}
          <Dialog
            open={openWebcam}
            onClose={handleCloseWebcam}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Take a Picture</DialogTitle>
            <DialogContent sx={{ textAlign: "center" }}>
              <Webcam
                audio={false}
                height={240}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                videoConstraints={videoConstraints}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseWebcam}>Cancel</Button>
              <Button variant="contained" onClick={captureImage}>
                Capture
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
