import React, { useState } from 'react';
import {
  Container,
  Box,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

export default function AddAttendanceLayout({ onClose, onAdd, staffOptions = [] }) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    StaffID: '',
    Date: '',
    TimeIn: '',
    TimeOut: '',
    HoursWorked: 0,
    OvertimeHours: 0,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onAdd(formData);
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="h6">Add New Attendance</Typography>
        <IconButton onClick={onClose} size="large">
          <CloseIcon sx={{ color: theme.palette.text.primary }} />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 3,
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="sm">
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label=""
                  fullWidth
                  variant="outlined"
                  value={formData.StaffID}
                  onChange={(e) => handleChange('StaffID', e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="">-- Select Staff --</option>
                  {staffOptions.map(st => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={formData.Date}
                  onChange={(e) => handleChange('Date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Time In"
                  type="time"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={formData.TimeIn}
                  onChange={(e) => handleChange('TimeIn', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Time Out"
                  type="time"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={formData.TimeOut}
                  onChange={(e) => handleChange('TimeOut', e.target.value)}
                />
              </Grid>
              {/* HoursWorked and OvertimeHours can be computed automatically if needed */}
            </Grid>
          </Box>
        </Container>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ boxShadow: 1, '&:hover': { boxShadow: 3 } }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
