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
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Save } from "@mui/icons-material";
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

export default function AddNewMemberLayout({ onClose, onMemberCreated, role }) {
  const theme = useTheme();
  const { mode } = theme.palette;
  const webcamRef = useRef(null);

  // Member info state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlanID, setSelectedPlanID] = useState("");
  const [monthsToPay, setMonthsToPay] = useState(1);
  const [membershipCardNumber, setMembershipCardNumber] = useState("");
  const [membershipCardIssued, setMembershipCardIssued] = useState(false);
  const [freeSessions, setFreeSessions] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");

  // Payment splits
  const [payments, setPayments] = useState([{ PaymentMethod: "", PaymentAmount: "" }]);

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Data from backend
  const [plans, setPlans] = useState([]);
  const [branches, setBranches] = useState([]);

  // Computed membership total
  const [membershipTotal, setMembershipTotal] = useState(0);

  // Dialog states
  const [openWebcam, setOpenWebcam] = useState(false);
  const [openConfirmation, setOpenConfirmation] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // ────────────────────────────────────────────────────────────────
  // Fetch plans & branches on mount
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

  // ────────────────────────────────────────────────────────────────
  // For staff, auto-set branch from logged‑in staff details
  useEffect(() => {
    if (role === "staff") {
      axios
        .get("/staff/get-logged-in-staff")
        .then((res) => {
          const staffData = res.data;
          setBranch(String(staffData.BranchID));
        })
        .catch((err) => console.error("Error fetching staff details:", err));
    }
  }, [role]);

  // ────────────────────────────────────────────────────────────────
  // Recompute membershipTotal whenever plan or monthsToPay changes
  useEffect(() => {
    const selectedPlan = plans.find((p) => p.PlanID === selectedPlanID);
    const planPrice = selectedPlan?.Price ? Number(selectedPlan.Price) : 0;
    const months = Number(monthsToPay) || 1;
    const total = planPrice * months;
    setMembershipTotal(total);

    if (total > 0) {
      setPayments([{ PaymentMethod: "", PaymentAmount: total }]);
    } else {
      setPayments([{ PaymentMethod: "", PaymentAmount: "" }]);
    }
  }, [selectedPlanID, monthsToPay, plans]);

  // ────────────────────────────────────────────────────────────────
  // Auto-generate next membership card number on mount
  useEffect(() => {
    axios
      .get("/membership/latest-card-number")
      .then((res) => {
        const latest = res.data.latestCardNumber || "CARD-0000";
        const [prefix, numString] = latest.split("-");
        const next = String(parseInt(numString, 10) + 1).padStart(4, "0");
        setMembershipCardNumber(`${prefix}-${next}`);
      })
      .catch((err) => console.error("Error fetching latest card number:", err));
  }, []);

  // ────────────────────────────────────────────────────────────────
  // Validations
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
    if (!branch) {
      newErrors.BranchID = ["Branch is required"];
    }
    if (!membershipCardNumber.trim()) {
      newErrors.MembershipCardNumber = ["Membership Card Number is required"];
    }
    if (freeSessions === "") {
      newErrors.FreeSessions = ["Free Sessions is required"];
    }
    if (!notes.trim()) {
      newErrors.Notes = ["Notes are required"];
    }
    if (isNaN(monthsToPay) || Number(monthsToPay) < 1) {
      newErrors.MonthsToPay = ["Months to Pay must be at least 1"];
    }
    if (!photoFile && !capturedImage) {
      newErrors.PhotoFile = ["A photo is required"];
    }
    if (!payments.length) {
      newErrors.Payments = ["At least one payment row is required"];
    } else {
      payments.forEach((payment, index) => {
        if (!payment.PaymentMethod) {
          newErrors[`Payments_${index}_PaymentMethod`] = ["Payment Method is required"];
        }
        if (
          !payment.PaymentAmount ||
          isNaN(payment.PaymentAmount) ||
          Number(payment.PaymentAmount) <= 0
        ) {
          newErrors[`Payments_${index}_PaymentAmount`] = ["Must be a positive number"];
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ────────────────────────────────────────────────────────────────
  // Payment row handlers
  const handleAddPaymentRow = () => {
    setPayments((prev) => [...prev, { PaymentMethod: "", PaymentAmount: "" }]);
  };

  const handleRemovePaymentRow = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaymentChange = (index, field, value) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // ────────────────────────────────────────────────────────────────
  // Photo handlers
  const handleOpenWebcam = () => setOpenWebcam(true);
  const handleCloseWebcam = () => setOpenWebcam(false);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setOpenWebcam(false);
    }
  }, []);

  const handleBiometricUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setCapturedImage(null);
    }
  };

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

  // ────────────────────────────────────────────────────────────────
  // Submit & confirmation handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setOpenConfirmation(true);
  };

  const handleConfirmYes = async () => {
    const formData = new FormData();
    formData.append("FullName", fullName);
    formData.append("Email", email);
    formData.append("Phone", phoneNumber);
    formData.append("PlanID", selectedPlanID);
    formData.append("MonthsToPayUpfront", monthsToPay);
    formData.append("MembershipCardNumber", membershipCardNumber);
    formData.append("MembershipCardIssued", membershipCardIssued ? 1 : 0);
    formData.append("FreeSessions", freeSessions);
    formData.append("Notes", notes);
    formData.append("BranchID", branch);
    formData.append("Payments", JSON.stringify(payments));
    formData.append("MembershipTotal", membershipTotal);

    if (photoFile) {
      formData.append("PhotoFile", photoFile);
    } else if (capturedImage) {
      const fileFromWebcam = dataURLToFile(capturedImage, "webcam_capture.jpg");
      formData.append("PhotoFile", fileFromWebcam);
    }

    try {
      const response = await axios.post("/membership/members", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onMemberCreated) {
        onMemberCreated(response.data);
      }
      setOpenConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error creating member:", error);
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert("Error creating member. Check console logs.");
      }
      setOpenConfirmation(false);
    }
  };

  const handleConfirmNo = () => {
    setOpenConfirmation(false);
  };

  // ────────────────────────────────────────────────────────────────
  // UI Rendering
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            Add New Member
          </Typography>
          <IconButton onClick={onClose} sx={{ "&:hover": { color: "red" } }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* LEFT SIDE: Personal & Membership Details */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: mode === "dark" ? theme.palette.background.paper : "rgba(0,0,0,0.02)",
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Months to Pay"
                      variant="outlined"
                      type="number"
                      fullWidth
                      required
                      value={monthsToPay}
                      onChange={(e) => setMonthsToPay(e.target.value)}
                      error={!!errors.MonthsToPay}
                      helperText={
                        errors.MonthsToPay?.[0] ||
                        "Paying 3+ months means you'll become 'Active' once fully paid."
                      }
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Total Membership Cost"
                      variant="outlined"
                      fullWidth
                      value={membershipTotal}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">₱</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Membership Card Number"
                      variant="outlined"
                      fullWidth
                      required
                      value={membershipCardNumber}
                      error={!!errors.MembershipCardNumber}
                      helperText={errors.MembershipCardNumber?.[0]}
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
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membershipCardIssued}
                          onChange={(e) => setMembershipCardIssued(e.target.checked)}
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
                      // Disable branch selection if role is staff
                      disabled={role === "staff"}
                    >
                      <MenuItem value="">
                        <em>-- Select Branch --</em>
                      </MenuItem>
                      {branches.map((b) => (
                        <MenuItem key={b.BranchID} value={b.BranchID}>
                          {b.BranchName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>
              {/* RIGHT SIDE: Photo & Additional Info */}
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  backgroundColor: mode === "dark" ? theme.palette.background.paper : "rgba(0,0,0,0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Photo & Additional Info
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<FileUploadIcon />}
                        sx={{
                          bgcolor: mode === "dark" ? theme.palette.grey[700] : "#fff",
                          color: mode === "dark" ? "#fff" : "#000",
                        }}
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
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Payments (Split Allowed)
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexWrap: "wrap" }}>
                      {capturedImage && (
                        <Box
                          component="img"
                          src={capturedImage}
                          alt="Captured"
                          sx={{
                            width: 150,
                            height: 150,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <Box>
                        {payments.map((payment, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              gap: 2,
                              mb: 1,
                              flexWrap: "wrap",
                              alignItems: "center",
                              backgroundColor: mode === "dark" ? theme.palette.grey[800] : "#f9f9f9",
                              p: 1,
                              borderRadius: 1,
                            }}
                          >
                            <FormControl
                              sx={{ minWidth: 120 }}
                              error={!!errors[`Payments_${index}_PaymentMethod`]}
                            >
                              <InputLabel>Method</InputLabel>
                              <Select
                                label="Method"
                                value={payment.PaymentMethod}
                                onChange={(e) =>
                                  handlePaymentChange(index, "PaymentMethod", e.target.value)
                                }
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
                              {errors[`Payments_${index}_PaymentMethod`] && (
                                <FormHelperText>
                                  {errors[`Payments_${index}_PaymentMethod`][0]}
                                </FormHelperText>
                              )}
                            </FormControl>
                            <TextField
                              label="Amount"
                              type="number"
                              value={payment.PaymentAmount}
                              onChange={(e) =>
                                handlePaymentChange(index, "PaymentAmount", e.target.value)
                              }
                              error={!!errors[`Payments_${index}_PaymentAmount`]}
                              helperText={errors[`Payments_${index}_PaymentAmount`]?.[0]}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                              }}
                              sx={{ width: 150 }}
                            />
                            {payments.length > 1 && (
                              <IconButton onClick={() => handleRemovePaymentRow(index)} color="error">
                                <CloseIcon />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        <Button variant="outlined" onClick={handleAddPaymentRow} sx={{ mt: 1 }}>
                          Add Payment
                        </Button>
                        {errors.Payments && (
                          <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                            {errors.Payments[0]}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="contained" color="primary" type="submit" sx={{ textTransform: "none" }}>
                <Save sx={{ mr: 1 }} />
                Submit Registration
              </Button>
            </Box>
          </form>
          <Dialog open={openWebcam} onClose={handleCloseWebcam} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: "center" }}>Capture Profile Picture</DialogTitle>
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
          <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={handleConfirmYes}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
  