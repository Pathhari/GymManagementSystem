import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

const sampleMembers = [
  { id: 1, name: 'John Doe', branch: 'Main', status: 'Active' },
  { id: 2, name: 'Jane Smith', branch: 'Downtown', status: 'Pending' },
];

export default function Reports() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Membership Management
      </Typography>
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Members</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sampleMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.id}</TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.branch}</TableCell>
                <TableCell>{member.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
