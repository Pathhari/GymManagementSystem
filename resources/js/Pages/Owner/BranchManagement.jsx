import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';


const sampleBranches = [
  { id: 1, name: 'Main', address: '123 Main St', staff: 20 },
  { id: 2, name: 'Downtown', address: '456 Downtown Rd', staff: 15 },
];

export default function BranchManagement() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Branch Management
      </Typography>
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Branches</Typography>
        <List>
          {sampleBranches.map((branch) => (
            <ListItem key={branch.id}>
              <ListItemText
                primary={branch.name}
                secondary={`Address: ${branch.address}, Staff: ${branch.staff}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
