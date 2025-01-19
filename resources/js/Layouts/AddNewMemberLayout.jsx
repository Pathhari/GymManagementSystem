import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Webcam from "react-webcam";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Helper function to format a Date object as "YYYY-MM-DD"
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Helper to add months to a date
 */
const addMonths = (date, monthsToAdd) => {
  const temp = new Date(date);
  temp.setMonth(temp.getMonth() + monthsToAdd);
  return temp;
};

/**
 * A React component that pops up a Dialog for adding a new member.
 *
 * @param {Function} onClose - function to close this Dialog
 */
export default function AddNewMemberLayout({ onClose, onMemberCreated  }) {
  // -------------------------------------------------------
  //  STATE
  // -------------------------------------------------------
  const [errors, setErrors] = useState({}); // For server validation errors (422)
  
  // Basic fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlanID, setSelectedPlanID] = useState("");
  const [membershipCardNumber, setMembershipCardNumber] = useState("");
  const [membershipCardIssued, setMembershipCardIssued] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState("");

  const [membershipStartDate, setMembershipStartDate] = useState("");
  const [membershipEndDate, setMembershipEndDate] = useState("");
  const [freeSessions, setFreeSessions] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");

  // For capturing an image (webcam) / biometrics
  const [biometricData, setBiometricData] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // For react-webcam
  const [openWebcam, setOpenWebcam] = useState(false);
  const webcamRef = useRef(null);
  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user",
  };

  // Plans from DB
  const [plans, setPlans] = useState([]);

  // For Material-UI responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // -------------------------------------------------------
  //  FETCH MEMBERSHIP PLANS
  // -------------------------------------------------------
  useEffect(() => {
    axios
      .get("/membership/plans")
      .then((res) => {
        setPlans(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching plans:", err);
      });
  }, []);

  // -------------------------------------------------------
  //  BASIC FRONT-END VALIDATION
  // -------------------------------------------------------
  const validateEmail = (str) => /\S+@\S+\.\S+/.test(str);
  const validatePhoneNumber = (str) => {
    const phRegex = /^(\+63|0)9\d{2}-\d{3}-\d{4}$/; 
    return phRegex.test(str);
  };

  /**
   * A small front-end check: are all required fields filled,
   * do they match expected format, etc. 
   * (We still rely on server validation for final check.)
   */
  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.FullName = ["Full Name is required"];
    }
    if (!email.trim()) {
      newErrors.Email = ["Email is required"];
    } else if (!validateEmail(email)) {
      newErrors.Email = ["Invalid email format"];
    }
    if (!phoneNumber.trim()) {
      newErrors.Phone = ["Phone Number is required"];
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.Phone = [
        "Phone number must be 09xx-xxx-xxxx or +639xx-xxx-xxxx",
      ];
    }
    if (!selectedPlanID) {
      newErrors.PlanID = ["Membership Plan is required"];
    }
    if (!membershipCardNumber.trim()) {
      newErrors.MembershipCardNumber = ["Membership Card Number is required"];
    }
    if (!membershipStatus) {
      newErrors.MembershipStatus = ["Membership Status is required"];
    }
    if (!membershipStartDate) {
      newErrors.MembershipStartDate = ["Start Date is required"];
    }
    if (!membershipEndDate) {
      newErrors.MembershipEndDate = ["End Date is required"];
    }
    if (freeSessions === "") {
      newErrors.FreeSessions = ["Free Sessions is required"];
    }
    if (!branch) {
      newErrors.BranchID = ["Branch is required"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------------------------
  //  EVENT HANDLERS
  // -------------------------------------------------------

  /**
   * Called when user picks a plan from the dropdown
   * => auto-calc membershipStartDate (today)
   * => parse plan.Duration to add months
   */
  const handlePlanChange = (e) => {
    const planID = e.target.value;
    setSelectedPlanID(planID);

    const foundPlan = plans.find((p) => p.PlanID === planID);
    if (foundPlan) {
      const today = new Date();
      setMembershipStartDate(formatDate(today));

      let monthsToAdd = 0;
      const match = foundPlan.Duration.match(/^(\d+)\s+month/i);
      if (match) {
        monthsToAdd = parseInt(match[1], 10);
      }

      let endDate = today;
      if (monthsToAdd > 0) {
        endDate = addMonths(today, monthsToAdd);
      }
      setMembershipEndDate(formatDate(endDate));
    } else {
      setMembershipStartDate("");
      setMembershipEndDate("");
    }
  };

  /**
   * Handles the file upload for biometrics
   */
  const handleBiometricUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBiometricData(e.target.files[0]);
    }
  };

  // Webcam open/close
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  /**
   * Captures image from webcam
   */
  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setOpenWebcam(false);
    }
  }, []);

  /**
   * Submits form data to /membership/members via Axios
   * => handles local validation 
   * => handles server 422 validation error 
   * => calls onClose if success
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1) Run local front-end checks
    if (!validateForm()) {
      alert("Please fix the errors before submitting.");
      return;
    }

    // 2) Build payload
    const payload = {
      FullName: fullName,
      Email: email,
      Phone: phoneNumber,
      PlanID: selectedPlanID,
      MembershipCardNumber: membershipCardNumber,
      MembershipCardIssued: membershipCardIssued,
      MembershipStatus: membershipStatus,
      MembershipStartDate: membershipStartDate,
      MembershipEndDate: membershipEndDate,
      FreeSessions: parseInt(freeSessions, 10) || 0,
      Notes: notes,
      BranchID: branch,
      // If you want to pass biometrics as a file in the same request,
      // you'd need FormData. For demonstration, we skip that here.
    };

    // 3) POST to your server
    axios.post("/membership/members", payload)
      .then((res) => {
        console.log("New member created:", res.data);
        // 1) call parent's callback if provided:
        if (onMemberCreated) {
          onMemberCreated(res.data);        }
        // 2) close the dialog
        if (onClose) onClose();
      })
      .catch((error) => {
        if (error.response && error.response.status === 422) {
          setErrors(error.response.data.errors || {});
        } else {
          console.error("Error creating member:", error);
        }
      });
  };

  // -------------------------------------------------------
  //  RENDER
  // -------------------------------------------------------
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
            <Grid container spacing={3} direction={isMobile ? "column" : "row"}>
              {/* Left/Top Section */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.02)",
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
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={!!errors.FullName}
                      helperText={errors.FullName && errors.FullName[0]}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      variant="outlined"
                      type="email"
                      fullWidth
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!errors.Email}
                      helperText={errors.Email && errors.Email[0]}
                    />
                  </Grid>

                  {/* Phone Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      error={!!errors.Phone}
                      helperText={errors.Phone && errors.Phone[0]}
                    />
                  </Grid>

                  {/* Plan Selection */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Membership Plan"
                      variant="outlined"
                      fullWidth
                      required
                      value={selectedPlanID}
                      onChange={handlePlanChange}
                      error={!!errors.PlanID}
                      helperText={errors.PlanID && errors.PlanID[0]}
                    >
                      <MenuItem value="">
                        <em>-- Select a Plan --</em>
                      </MenuItem>
                      {plans.map((plan) => (
                        <MenuItem key={plan.PlanID} value={plan.PlanID}>
                          {plan.PlanName}
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
                      required
                      value={membershipStatus}
                      onChange={(e) => setMembershipStatus(e.target.value)}
                      error={!!errors.MembershipStatus}
                      helperText={
                        errors.MembershipStatus && errors.MembershipStatus[0]
                      }
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Expired">Expired</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Membership Card Number */}
                  <Grid item xs={12}>
                    <TextField
                      label="Membership Card Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={membershipCardNumber}
                      onChange={(e) =>
                        setMembershipCardNumber(e.target.value)
                      }
                      error={!!errors.MembershipCardNumber}
                      helperText={
                        errors.MembershipCardNumber &&
                        errors.MembershipCardNumber[0]
                      }
                    />
                  </Grid>

                  {/* Card Issued (bool) */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membershipCardIssued}
                          onChange={(e) =>
                            setMembershipCardIssued(e.target.checked)
                          }
                        />
                      }
                      label="Membership Card Issued?"
                    />
                  </Grid>

                  {/* Free Sessions */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Free Sessions"
                      variant="outlined"
                      type="number"
                      fullWidth
                      required
                      value={freeSessions}
                      onChange={(e) => setFreeSessions(e.target.value)}
                      error={!!errors.FreeSessions}
                      helperText={
                        errors.FreeSessions && errors.FreeSessions[0]
                      }
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
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      error={!!errors.BranchID}
                      helperText={errors.BranchID && errors.BranchID[0]}
                    >
                      <MenuItem value="">-- Select Branch --</MenuItem>
                      <MenuItem value="branch1">Branch 1</MenuItem>
                      <MenuItem value="branch2">Branch 2</MenuItem>
                      <MenuItem value="branch3">Branch 3</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right/Bottom Section */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.02)",
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
                      required
                      InputLabelProps={{ shrink: true }}
                      value={membershipStartDate}
                      onChange={(e) => setMembershipStartDate(e.target.value)}
                      error={!!errors.MembershipStartDate}
                      helperText={
                        errors.MembershipStartDate &&
                        errors.MembershipStartDate[0]
                      }
                    />
                  </Grid>

                  {/* Membership End Date */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="date"
                      label="Membership End Date"
                      variant="outlined"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      value={membershipEndDate}
                      onChange={(e) => setMembershipEndDate(e.target.value)}
                      error={!!errors.MembershipEndDate}
                      helperText={
                        errors.MembershipEndDate &&
                        errors.MembershipEndDate[0]
                      }
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

                  {/* Captured Image Preview (from webcam) */}
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

          {/* Webcam Dialog */}
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
