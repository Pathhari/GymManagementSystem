// File: js/Layouts/AddNewStaffLayout.jsx
import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Divider,
  Grid,
  Button,
  TextField,
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
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CloseIcon from "@mui/icons-material/Close";

// Define initial staff object so our state is not undefined
const initialStaff = {
  FullName: "",
  Email: "",
  Phone: "",
  Role: "",
  BranchID: "",
  DateHired: "",
  DailyRate: "",
  HourlyRate: "",
  OvertimeRate: "",
  Notes: "",
};

export default function AddNewStaffLayout({ onClose }) {
  // Local state for new staff details
  const [newStaff, setNewStaff] = useState(initialStaff);
  const [errors, setErrors] = useState({});
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [openWebcam, setOpenWebcam] = useState(false);

  // Refs for webcam and file input
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Video constraints for webcam
  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user",
  };

  // Responsive settings
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Handlers for form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert file to DataURL for preview (this can be sent to backend as well)
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for Webcam dialog
  const handleOpenWebcam = () => {
    setOpenWebcam(true);
  };

  const handleCloseWebcam = () => {
    setOpenWebcam(false);
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedPhoto(imageSrc);
      setOpenWebcam(false);
    }
  }, []);

  // Handle form submission with basic validation
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation
    const newErrors = {};
    if (!newStaff.FullName.trim())
      newErrors.FullName = "Full Name is required";
    if (!newStaff.Email.trim())
      newErrors.Email = "Email is required";
    // Set errors if any; else, proceed
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      alert("Please fix the errors before submitting.");
      return;
    }
    console.log("New Staff:", { ...newStaff, Photo: capturedPhoto });
    alert("Staff registration submitted!");
    if (onClose) onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Add New Staff</Typography>
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
              {/* Left Section: Staff Information */}
              <Grid
                item
                xs={12}
                md={7}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0, 0, 0, 0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Basic & Employment Information
                </Typography>
                <Grid container spacing={2}>
                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      name="FullName"
                      value={newStaff.FullName}
                      onChange={handleInputChange}
                      error={!!errors.FullName}
                      helperText={errors.FullName}
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
                      name="Email"
                      value={newStaff.Email}
                      onChange={handleInputChange}
                      error={!!errors.Email}
                      helperText={errors.Email}
                      required
                    />
                  </Grid>
                  {/* Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      name="Phone"
                      value={newStaff.Phone}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  {/* Role */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Role"
                      variant="outlined"
                      fullWidth
                      name="Role"
                      value={newStaff.Role}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  {/* Branch ID */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Branch ID"
                      variant="outlined"
                      fullWidth
                      name="BranchID"
                      type="number"
                      value={newStaff.BranchID}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  {/* Date Hired */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date Hired"
                      variant="outlined"
                      fullWidth
                      name="DateHired"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={newStaff.DateHired}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  {/* Rates */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Daily Rate"
                      variant="outlined"
                      fullWidth
                      name="DailyRate"
                      type="number"
                      value={newStaff.DailyRate}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Hourly Rate"
                      variant="outlined"
                      fullWidth
                      name="HourlyRate"
                      type="number"
                      value={newStaff.HourlyRate}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Overtime Rate"
                      variant="outlined"
                      fullWidth
                      name="OvertimeRate"
                      type="number"
                      value={newStaff.OvertimeRate}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField
                      label="Additional Notes"
                      variant="outlined"
                      fullWidth
                      name="Notes"
                      value={newStaff.Notes}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Section: Photo */}
              <Grid
                item
                xs={12}
                md={5}
                sx={{
                  backgroundColor: isMobile ? "transparent" : "rgba(0, 0, 0, 0.02)",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Photo
                </Typography>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    p: 2,
                    border: "1px dashed #ccc",
                    borderRadius: 2,
                    minHeight: 300,
                  }}
                >
                  {capturedPhoto ? (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Selected Photo
                      </Typography>
                      <Avatar
                        src={capturedPhoto}
                        alt="Captured Staff"
                        sx={{ width: 150, height: 150, mb: 2 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => setCapturedPhoto(null)}
                        sx={{ mb: 1 }}
                      >
                        Remove Photo
                      </Button>
                    </>
                  ) : (
                    <Typography variant="subtitle1" gutterBottom>
                      No Photo Selected
                    </Typography>
                  )}
                  {/* Buttons for Upload and Capture */}
                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<FileUploadIcon />}
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Upload Photo
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PhotoCameraIcon />}
                      onClick={handleOpenWebcam}
                    >
                      Capture Photo
                    </Button>
                  </Box>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </Box>
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
              <Button variant="text" color="inherit" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" type="submit">
                Submit Registration
              </Button>
            </Box>
          </form>

          {/* Webcam Dialog */}
          <Dialog open={openWebcam} onClose={handleCloseWebcam} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Capture Staff Photo</Typography>
                <IconButton onClick={handleCloseWebcam}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: "center" }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={isMobile ? 280 : 320}
                height={isMobile ? 210 : 240}
                videoConstraints={videoConstraints}
                style={{ borderRadius: 8 }}
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
