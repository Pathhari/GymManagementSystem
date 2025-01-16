import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';

const sampleLogs = [
  { id: 1, activity: 'John Doe logged in', timestamp: '2025-01-01 10:00 AM' },
  { id: 2, activity: 'Jane Smith added a new member', timestamp: '2025-01-02 2:00 PM' },
];

export default function SystemLogs() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        System Logs
      </Typography>
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <List>
          {sampleLogs.map((log) => (
            <ListItem key={log.id}>
              <ListItemText
                primary={log.activity}
                secondary={log.timestamp}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
