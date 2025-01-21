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
  FormControl,
  InputLabel,
  Select,
  Radio,
  RadioGroup,
} from "@mui/material";
import Webcam from "react-webcam";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

export default function AddNewMemberLayout({ onClose, onMemberCreated }) {
  const [errors, setErrors] = useState({});

  // Radio for membership type
  const [membershipType, setMembershipType] = useState("regular"); 
  // If "regular", we POST /membership/members
  // If "lockin", we POST /membership/storeLockInMembership.

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlanID, setSelectedPlanID] = useState("");
  const [membershipCardNumber, setMembershipCardNumber] = useState("");
  const [membershipCardIssued, setMembershipCardIssued] = useState(false);
  const [freeSessions, setFreeSessions] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");

  // Photo states
  const [photoFile, setPhotoFile] = useState(null); // For file from disk
  const [capturedImage, setCapturedImage] = useState(null); // Base64 from webcam

  // Lists for plans + branches
  const [plans, setPlans] = useState([]);
  const [branches, setBranches] = useState([]);

  // Webcam dialog
  const [openWebcam, setOpenWebcam] = useState(false);
  const webcamRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch membership plans + branches on mount
  useEffect(() => {
    axios
      .get("/membership/plans")
      .then((res) => setPlans(res.data || []))
      .catch((err) => console.error("Error fetching plans:", err));

    // Load branches from your back end: 
    // e.g. GET /branches => returns [{ BranchID:1, BranchName:"..."}, ...]
    axios
    .get("/branches")
    .then((res) => {
      // res.data should be { branches: [...] }
      setBranches(res.data.branches || []);
    })
    .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  // Simple validations
  const validateEmail = (str) => /\S+@\S+\.\S+/.test(str);
  const validatePhoneNumber = (str) => {
    const phRegex = /^(\+63|0)9\d{9}$/; 
    return phRegex.test(str);
  };

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
      newErrors.Phone = ["Must be 09xxxxxxxxx or +639xxxxxxxxx"];
    }
    if (!selectedPlanID) {
      newErrors.PlanID = ["Plan is required"];
    }
    if (!membershipCardNumber.trim()) {
      newErrors.MembershipCardNumber = ["Membership Card Number is required"];
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

  // Convert base64 from webcam to a File if you like
  function dataURLToFile(dataURL, filename) {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // Webcam
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setOpenWebcam(false);
    }
  }, []);

  // Photo from disk
  const handleBiometricUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setCapturedImage(null); // if user picks a file, ignore webcam capture
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix errors before submitting.");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("FullName", fullName);
    formData.append("Email", email);
    formData.append("Phone", phoneNumber);
    formData.append("PlanID", selectedPlanID);
    formData.append("MembershipCardNumber", membershipCardNumber);
    formData.append("MembershipCardIssued", membershipCardIssued ? 1 : 0);
    formData.append("FreeSessions", freeSessions);
    formData.append("Notes", notes);
    formData.append("BranchID", branch);

    // File or webcam
    if (photoFile) {
      formData.append("PhotoFile", photoFile);
    } else if (capturedImage) {
      const fileFromWebcam = dataURLToFile(capturedImage, "webcam_capture.jpg");
      formData.append("PhotoFile", fileFromWebcam);
    }

    // Decide endpoint
    let url = "/membership/members"; 
    if (membershipType === "lockin") {
      url = "/membership/storeLockInMembership";
    }

    try {
      const res = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // If your response is { message, member }, call onMemberCreated:
      if (onMemberCreated) onMemberCreated(res.data);

      onClose();
    } catch (error) {
      console.error("Error creating member:", error);
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Error creating member. Check console logs.");
      }
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
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

          {/* RADIO for membership type */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Membership Type:</Typography>
            <RadioGroup
              row
              value={membershipType}
              onChange={(e) => setMembershipType(e.target.value)}
            >
              <FormControlLabel
                value="regular"
                control={<Radio />}
                label="Regular"
              />
              <FormControlLabel
                value="lockin"
                control={<Radio />}
                label="Lock-In"
              />
            </RadioGroup>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} direction={isMobile ? "column" : "row"}>
              {/* LEFT SIDE */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0,0,0,0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Personal & Membership Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={!!errors.FullName}
                      helperText={errors.FullName?.[0]}
                    />
                  </Grid>

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
                      helperText={errors.Email?.[0]}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      error={!!errors.Phone}
                      helperText={errors.Phone?.[0]}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Plan"
                      variant="outlined"
                      fullWidth
                      required
                      value={selectedPlanID}
                      onChange={(e) => setSelectedPlanID(e.target.value)}
                      error={!!errors.PlanID}
                      helperText={errors.PlanID?.[0]}
                    >
                      <MenuItem value="">
                        <em>-- Select a Plan --</em>
                      </MenuItem>
                      {plans.map((p) => (
                        <MenuItem key={p.PlanID} value={p.PlanID}>
                          {p.PlanName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Membership Card Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={membershipCardNumber}
                      onChange={(e) => setMembershipCardNumber(e.target.value)}
                      error={!!errors.MembershipCardNumber}
                      helperText={errors.MembershipCardNumber?.[0]}
                    />
                  </Grid>

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
                      helperText={errors.FreeSessions?.[0]}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>

                  {/* Branch list from your fetched branches array */}
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
                      helperText={errors.BranchID?.[0]}
                    >
                      <MenuItem value="">-- Select Branch --</MenuItem>
                      {branches.map((b) => (
                        <MenuItem key={b.BranchID} value={b.BranchID}>
                          {b.BranchName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* RIGHT SIDE */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0,0,0,0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Photo & Additional Info
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                    >
                      Upload Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleBiometricUpload}
                      />
                    </Button>
                    {photoFile && (
                      <Typography variant="caption" sx={{ ml: 2 }}>
                        {photoFile.name}
                      </Typography>
                    )}
                  </Grid>

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

                  {/* If we captured from webcam, show a preview */}
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
          <Dialog
            open={openWebcam}
            onClose={handleCloseWebcam}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
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
                videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
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
