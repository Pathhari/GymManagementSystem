// File: ./layouts/AddNewMemberLayout.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Webcam from "react-webcam";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

// Helper function to format a Date object as "YYYY-MM-DD"
const formatDate = (date) => {
  const year = date.getFullYear();
  // Months are zero-indexed so we need to add 1 and pad with '0'
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AddNewMemberLayout({ onClose }) {
  // ---------------------- STATE ----------------------
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
  const [capturedImage, setCapturedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [openWebcam, setOpenWebcam] = useState(false);

  // For react-webcam
  const webcamRef = useRef(null);
  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user",
  };

  // ---------------------- MEDIA QUERY ----------------------
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------------------- DROPDOWN OPTIONS ----------------------
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

  // ---------------------- VALIDATION FUNCTIONS ----------------------
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhoneNumber = (number) => /^\d{3}-\d{3}-\d{4}$/.test(number);

  const validateForm = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = "Format: 123-456-7890";
    }
    if (!membershipPlan) newErrors.membershipPlan = "Membership Plan is required";
    if (!membershipCardNumber.trim())
      newErrors.membershipCardNumber = "Membership Card Number is required";
    if (!membershipStatus)
      newErrors.membershipStatus = "Membership Status is required";
    if (!membershipStartDate)
      newErrors.membershipStartDate = "Start Date is required";
    if (!membershipEndDate)
      newErrors.membershipEndDate = "End Date is required";
    if (!freeSessions) newErrors.freeSessions = "Free Sessions is required";
    if (!branch) newErrors.branch = "Branch is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------- AUTO-DATE CALCULATION ----------------------
  // Update start and end dates automatically based on the selected membership plan.
  useEffect(() => {
    if (membershipPlan) {
      // Use current date as the start date.
      const today = new Date();
      const startDate = formatDate(today);
      let endDate;

      if (membershipPlan === "1MonthBasic") {
        // One month later: Create a new Date, set month + 1.
        const temp = new Date(today);
        temp.setMonth(temp.getMonth() + 1);
        endDate = formatDate(temp);
      } else if (membershipPlan === "annualPremium") {
        // One year later.
        const temp = new Date(today);
        temp.setFullYear(temp.getFullYear() + 1);
        endDate = formatDate(temp);
      }
      setMembershipStartDate(startDate);
      setMembershipEndDate(endDate);
    } else {
      // Clear the dates if no plan is selected.
      setMembershipStartDate("");
      setMembershipEndDate("");
    }
  }, [membershipPlan]);

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
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
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
      if (onClose) onClose();
    } else {
      alert("Please fix the errors before submitting.");
    }
  };

  // ---------------------- RENDER ----------------------
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Add New Member</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit}>
            <Grid
              container
              spacing={3}
              direction={isMobile ? "column" : "row"}
            >
              {/* Left Section or Top Section */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0, 0, 0, 0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Personal & Membership Details
                </Typography>
                <Grid container spacing={2}>
                  {/* Full Name */}
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      required
                    />
                  </Grid>
                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      variant="outlined"
                      type="email"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                    />
                  </Grid>
                  {/* Phone Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      fullWidth
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber || "Format: 123-456-7890"}
                      required
                    />
                  </Grid>
                  {/* Membership Plan */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Membership Plan"
                      variant="outlined"
                      fullWidth
                      value={membershipPlan}
                      onChange={(e) => setMembershipPlan(e.target.value)}
                      error={!!errors.membershipPlan}
                      helperText={errors.membershipPlan}
                      required
                    >
                      {membershipPlanOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  {/* Membership Status */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Membership Status"
                      variant="outlined"
                      fullWidth
                      value={membershipStatus}
                      onChange={(e) => setMembershipStatus(e.target.value)}
                      error={!!errors.membershipStatus}
                      helperText={errors.membershipStatus}
                      required
                    >
                      {membershipStatusOptions.map((option) => (
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
                      error={!!errors.membershipCardNumber}
                      helperText={errors.membershipCardNumber}
                      required
                    />
                  </Grid>
                  {/* Free Sessions */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Free Sessions"
                      variant="outlined"
                      type="number"
                      fullWidth
                      value={freeSessions}
                      onChange={(e) => setFreeSessions(e.target.value)}
                      error={!!errors.freeSessions}
                      helperText={errors.freeSessions}
                      required
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  {/* Branch */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Branch"
                      variant="outlined"
                      fullWidth
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      error={!!errors.branch}
                      helperText={errors.branch}
                      required
                    >
                      {branchOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Section or Bottom Section */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0, 0, 0, 0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Dates, Biometric & Additional Info
                </Typography>
                <Grid container spacing={2}>
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
                      error={!!errors.membershipStartDate}
                      helperText={errors.membershipStartDate}
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
                      error={!!errors.membershipEndDate}
                      helperText={errors.membershipEndDate}
                      required
                    />
                  </Grid>
                  {/* Biometric Data Upload */}
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                    >
                      Upload Biometric
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
                  {/* Captured Image Preview */}
                  {capturedImage && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Captured Image Preview:
                      </Typography>
                      <Avatar
                        src={capturedImage}
                        alt="Captured"
                        sx={{ width: 200, height: 200 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenWebcam}
                startIcon={<PhotoCameraIcon />}
                fullWidth={isMobile}
              >
                Capture Picture
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="text" color="inherit" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  Submit Registration
                </Button>
              </Box>
            </Box>
          </form>

          {/* ---------------- Webcam Dialog ---------------- */}
          <Dialog open={openWebcam} onClose={handleCloseWebcam} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
              Capture Profile Picture
              <IconButton
                aria-label="close"
                onClick={handleCloseWebcam}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: "center" }}>
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
              <Button onClick={handleCloseWebcam} color="secondary">
                Cancel
              </Button>
              <Button variant="contained" onClick={captureImage}>
                Capture
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
