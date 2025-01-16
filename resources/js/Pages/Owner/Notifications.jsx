import React from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';

export default function Notifications() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Send Announcement</Typography>
        <TextField
          label="Message"
          multiline
          rows={4}
          fullWidth
          sx={{ mt: 2 }}
        />
        <Button variant="contained" sx={{ mt: 2, backgroundColor: 'black', color: 'white' }}>
          Send
        </Button>
      </Paper>
    </Box>
  );
}
