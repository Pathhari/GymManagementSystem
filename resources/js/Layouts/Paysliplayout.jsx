import React from "react";
import { Box, Typography, Divider } from "@mui/material";

const PayslipLayout = ({ staffData, payrollData }) => {
  return (
    <Box
      sx={{
        p: 4,
        m: "auto",
        maxWidth: "210mm", // A4 width
        minHeight: "297mm", // A4 height
        backgroundColor: "#fff",
        boxShadow: 3,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <Typography variant="h4" align="center" sx={{ fontWeight: "bold", mb: 2 }}>
        PAYSLIP
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Company / Gym Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "medium" }}>
          Contnental Fitness Gym
        </Typography>
      </Box>

      {/* Staff Information Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Staff Information
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
          <Typography variant="body1">
            <strong>Name:</strong> {staffData?.FullName || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {staffData?.Email || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {staffData?.Role || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Phone:</strong> {staffData?.Phone || "N/A"}
          </Typography>
        </Box>
      </Box>

      {/* Payroll Information Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Payroll Information
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
          }}
        >
          <Typography variant="body1">
            <strong>Period:</strong> {payrollData?.StartDate || "N/A"} -{" "}
            {payrollData?.EndDate || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Date Issued:</strong> {payrollData?.GeneratedDate || "N/A"}
          </Typography>
          <Typography variant="body1">
            <strong>Gross Pay:</strong> ₱{payrollData?.GrossPay || "0.00"}
          </Typography>
          <Typography variant="body1">
            <strong>Deductions:</strong> ₱{payrollData?.Deductions || "0.00"}
          </Typography>
          <Typography variant="body1" sx={{ gridColumn: "span 2" }}>
            <strong>Net Pay:</strong> ₱{payrollData?.NetPay || "0.00"}
          </Typography>
          <Typography variant="body1" sx={{ gridColumn: "span 2" }}>
            <strong>Status:</strong> {payrollData?.Status || "N/A"}
          </Typography>
        </Box>
      </Box>

      {/* Computation Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Computation of Salary
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body1">Daily Rate: {staffData?.DailyRate || "0.00"}</Typography>
            <Typography variant="body1">
              No. of Hours Worked: {payrollData?.HoursWorked || "N/A"}
            </Typography>
            <Typography variant="body1">
              No. of Days Absent: {payrollData?.DaysAbsent || "N/A"}
            </Typography>
            <Typography variant="body1">
              No. of Tardiness: {payrollData?.Tardiness || "N/A"}
            </Typography>
            <Typography variant="body1">
              Deductions: ₱{payrollData?.Deductions || "0.00"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1">
              Date Issued: {payrollData?.GeneratedDate || "N/A"}
            </Typography>
            <Typography variant="body1">
              Salary for the month of: {payrollData?.StartDate || "N/A"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" sx={{ fontWeight: "medium" }}>
          Prepared By:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: "medium", mt: 1 }}>
          Received By:
        </Typography>
        <Typography variant="body2" sx={{ mt: 3 }}>
          This is to certify that I, ______________________, have received the correct amount of
          pay/salary for the month of ___________________.
        </Typography>
      </Box>
    </Box>
  );
};

export default PayslipLayout;
