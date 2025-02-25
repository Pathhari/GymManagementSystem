import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";
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
  IconButton,
  Avatar,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  InputAdornment,
  OutlinedInput,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Cancel, Save } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import StoreIcon from "@mui/icons-material/Store";
import PaymentIcon from "@mui/icons-material/Payment";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function AddNewMemberLayout({ onClose, onMemberCreated }) {
  const theme = useTheme();
  const webcamRef = useRef(null);

  // Membership fields
  const [membershipType, setMembershipType] = useState("regular");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlanID, setSelectedPlanID] = useState("");
  const [membershipCardNumber, setMembershipCardNumber] = useState("");
  const [membershipCardIssued, setMembershipCardIssued] = useState(false);
  const [freeSessions, setFreeSessions] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Data from backend
  const [plans, setPlans] = useState([]);
  const [branches, setBranches] = useState([]);

  // Webcam
  const [openWebcam, setOpenWebcam] = useState(false);

  // Confirmation dialog
  const [openConfirmation, setOpenConfirmation] = useState(false);

  // Form errors (UI validation)
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios
      .get("/membership/plans")
      .then((res) => setPlans(res.data || []))
      .catch((err) => console.error("Error fetching plans:", err));

    axios
      .get("/owner/branches")
      .then((res) => {
        setBranches(res.data.branches || []);
      })
      .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  useEffect(() => {
    // Auto-fetch the price when the user selects a plan
    if (selectedPlanID) {
      const selectedPlan = plans.find((plan) => plan.PlanID === selectedPlanID);
      if (selectedPlan) {
        setPaymentAmount(selectedPlan.Price); // Automatically set price
      }
    }
  }, [selectedPlanID, plans]);

  // Basic validations
  const validateEmail = (str) =>
    /^[^\d][\w.-]+@[a-zA-Z]+\.[a-zA-Z]+$/.test(str);
  const validatePhoneNumber = (str) => {
    const phRegex = /^(\+63|0)9\d{9}$/;
    return phRegex.test(str);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.FullName = ["Full Name is required"];
    } else if (/\d/.test(fullName)) {
      newErrors.FullName = ["Full Name cannot contain numbers"];
    }
    if (!email.trim()) newErrors.Email = ["Email is required"];
    else if (!validateEmail(email)) newErrors.Email = ["Invalid email format"];

    if (!phoneNumber.trim())
      newErrors.Phone = ["Phone Number is required"];
    else if (!validatePhoneNumber(phoneNumber))
      newErrors.Phone = ["Must be 09xxxxxxxxx or +639xxxxxxxxx"];

    if (!selectedPlanID) newErrors.PlanID = ["Plan is required"];
    if (!membershipCardNumber.trim())
      newErrors.MembershipCardNumber = ["Membership Card Number is required"];
    if (freeSessions === "")
      newErrors.FreeSessions = ["Free Sessions is required"];
    if (!branch) newErrors.BranchID = ["Branch is required"];

    // New validations for fields now required
    if (!notes.trim()) newErrors.Notes = ["Notes are required"];
    if (!paymentMethod) newErrors.PaymentMethod = ["Payment Method is required"];
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0)
      newErrors.PaymentAmount = ["Payment Amount must be a positive number"];
    if (!photoFile && !capturedImage)
      newErrors.PhotoFile = ["A photo is required"];

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert base64 from webcam to a File
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

  // Webcam handlers
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setOpenWebcam(false);
    }
  }, []);

  // Photo upload
  const handleBiometricUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setCapturedImage(null);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // On Submit: Validate & Open Confirmation dialog
  // ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setOpenConfirmation(true);
  };

  // If user confirms, do final request
  const handleConfirmYes = async () => {
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

    // Payment fields
    formData.append("PaymentMethod", paymentMethod);
    formData.append("PaymentAmount", paymentAmount);

    // PaymentFor => "New Membership"
    const paymentFor = ["New Membership"];
    formData.append("PaymentFor", JSON.stringify(paymentFor));

    // Photo file or captured
    if (photoFile) {
      formData.append("PhotoFile", photoFile);
    } else if (capturedImage) {
      const fileFromWebcam = dataURLToFile(capturedImage, "webcam_capture.jpg");
      formData.append("PhotoFile", fileFromWebcam);
    }

    let url = "/membership/members";
    if (membershipType === "lockin") {
      url = "/membership/storeLockInMembership";
    }

    try {
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onMemberCreated) onMemberCreated(response.data);
      setOpenConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error creating member:", error);
      if (error.response?.status === 422) {
        setOpenConfirmation(false);
        setErrors(error.response.data.errors || {});
      } else {
        alert("Error creating member. Check console logs.");
      }
    }
  };

  const handleConfirmNo = () => {
    setOpenConfirmation(false);
  };

  // Fetch latest card number
  axios
    .get("/membership/latest-card-number")
    .then((res) => {
      const latestCardNumber = res.data.latestCardNumber || "CARD-0000";
      const nextNumber = String(
        parseInt(latestCardNumber.split("-")[1]) + 1
      ).padStart(4, "0");
      setMembershipCardNumber(`CARD-${nextNumber}`);
    })
    .catch((err) => console.error("Error fetching latest card number:", err));

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      {/* DIALOG TITLE */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Add New Member
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: "inherit",
              "&:hover": { color: "red" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* DIALOG CONTENT */}
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          {/* Membership Type Radio */}
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

          {/* MAIN FORM */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* LEFT SIDE */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{ backgroundColor: "rgba(0,0,0,0.02)", p: 2, borderRadius: 2 }}
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
                      helperText={errors.FullName?.[0]}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
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
                      helperText={errors.Email?.[0]}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* Phone */}
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* Plan */}
                  <Grid item xs={12}>
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ListAltIcon />
                          </InputAdornment>
                        ),
                      }}
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
                  {/* Membership Card Number */}
                  <Grid item xs={12}>
                    <TextField
                      label="Membership Card Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={membershipCardNumber}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CardMembershipIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* Card Issued? */}
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
                      helperText={errors.FreeSessions?.[0]}
                      InputProps={{
                        inputProps: { min: 0 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <ConfirmationNumberIcon />
                          </InputAdornment>
                        ),
                      }}
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
                      helperText={errors.BranchID?.[0]}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <StoreIcon />
                          </InputAdornment>
                        ),
                      }}
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
                sx={{ backgroundColor: "rgba(0,0,0,0.02)", p: 2, borderRadius: 2 }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Photo & Additional Info
                </Typography>
                <Grid container spacing={2}>
                  {/* Photo Upload & Webcam */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <Button
                        sx={{ bgcolor: "#ffffff", color: "black" }}
                        variant="contained"
                        component="label"
                        startIcon={<FileUploadIcon />}
                      >
                        Upload Biometrics
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleBiometricUpload}
                        />
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenWebcam}
                        startIcon={<PhotoCameraIcon />}
                      >
                        Capture Picture
                      </Button>
                    </Box>
                    {photoFile && (
                      <Typography variant="caption" sx={{ ml: 2 }}>
                        {photoFile.name}
                      </Typography>
                    )}
                    {errors.PhotoFile && (
                      <Typography variant="caption" color="error">
                        {errors.PhotoFile[0]}
                      </Typography>
                    )}
                  </Grid>
                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      variant="outlined"
                      fullWidth
                      required
                      multiline
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      error={!!errors.Notes}
                      helperText={errors.Notes?.[0]}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <StickyNote2Icon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* Payment & Image Preview */}
                  <Grid item xs={12}>
                    <Grid container spacing={2} alignItems="center">
                      {capturedImage && (
                        <Grid item xs={12} sm={4} display="flex" justifyContent="center">
                          <Box
                            component="img"
                            src={capturedImage}
                            alt="Captured"
                            sx={{
                              width: 150,
                              height: 150,
                              border: "1px solid #ccc",
                              borderRadius: 2,
                              objectFit: "cover",
                            }}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={capturedImage ? 8 : 12}>
                        <Grid container spacing={2}>
                        <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined" required error={!!errors.PaymentMethod}>
                        <InputLabel id="payment-method-label">Payment Method</InputLabel>
                        <Select
                          labelId="payment-method-label"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          label="Payment Method"
                          startAdornment={
                            <InputAdornment position="start">
                              <PaymentIcon />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="">-- Select --</MenuItem>
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="BDO">BDO</MenuItem>
                          <MenuItem value="BPI">BPI</MenuItem>
                          <MenuItem value="GCash">GCash</MenuItem>
                        </Select>
                        {errors.PaymentMethod && (
                          <FormHelperText>{errors.PaymentMethod[0]}</FormHelperText>
                        )}
                      </FormControl>


                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Payment Amount"
                              type="number"
                              fullWidth
                              variant="outlined"
                              required
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              error={!!errors.PaymentAmount}
                              helperText={errors.PaymentAmount?.[0]}
                              InputProps={{
                                readOnly: true,
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Typography variant="h6">₱</Typography>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<Save />}
                sx={{ textTransform: "none" }}
              >
                Submit Registration
              </Button>
            </Box>
          </form>

          {/* Webcam Dialog */}
          <Dialog open={openWebcam} onClose={handleCloseWebcam} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: "center" }}>
              Capture Profile Picture
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Webcam
                audio={false}
                height={240}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
              />
            </DialogContent>
            <DialogActions sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <IconButton onClick={handleCloseWebcam} sx={{ color: "#FF0000" }}>
                <CloseIcon fontSize="large" />
              </IconButton>
              <IconButton onClick={captureImage} color="primary">
                <CameraAltIcon fontSize="large" />
              </IconButton>
            </DialogActions>
          </Dialog>
        </Box>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmation}
        onClose={handleConfirmNo}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
      >
        <DialogTitle sx={{ textAlign: "center", p: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <CheckCircleOutlineIcon sx={{ fontSize: 50, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Confirm Submission
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body1">
            Are you sure you want to submit this registration?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, py: 2 }}>
          <Button onClick={handleConfirmNo} sx={{ textTransform: "none", color: "red" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none" }}
            onClick={handleConfirmYes}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
