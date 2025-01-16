import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

export default function EditProfile() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current user email from the server and set it
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/owner/profile'); // Assuming there's an endpoint to get user data
        setEmail(response.data.email); // Set the email from the server
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Error fetching profile');
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (newPassword !== retypePassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true); // Show loading spinner
    try {
      // Send the updated email and password to the server
      await axios.put('/owner/profile', { email, password: newPassword });
      alert('Profile updated successfully');
      setLoading(false); // Hide loading spinner
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error saving profile');
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <Box sx={{ width: '50%', margin: '0 auto', paddingTop: 4 }}>
      <Typography variant="h4" gutterBottom>Edit Profile</Typography>
      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="New Password"
        variant="outlined"
        type="password"
        fullWidth
        margin="normal"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <TextField
        label="Retype Password"
        variant="outlined"
        type="password"
        fullWidth
        margin="normal"
        value={retypePassword}
        onChange={(e) => setRetypePassword(e.target.value)}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading} // Disable button during loading
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
