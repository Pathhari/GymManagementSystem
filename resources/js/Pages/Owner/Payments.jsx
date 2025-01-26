import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Tooltip, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem,
  Menu
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";

export default function PaymentsAndInvoices() {
  // ----------------- State -----------------
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);

  // Dialog flags
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [isViewPaymentOpen, setViewPaymentOpen] = useState(false);
  
  const [isAddInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setViewInvoiceOpen] = useState(false);

  // Payment forms
  const [newPayment, setNewPayment] = useState({
    memberId: "",
    paymentDate: "",
    amountPaid: 0,
    method: "",
    status: "",
  });
  const [editPayment, setEditPayment] = useState({});
  const [viewPayment, setViewPayment] = useState(null);

  // Invoice forms
  const [newInvoice, setNewInvoice] = useState({
    memberId: "",
    invoiceDate: "",
    dueDate: "",
    invoiceTotal: 0,
    status: "",
  });
  const [editInvoice, setEditInvoice] = useState({});
  const [viewInvoice, setViewInvoice] = useState(null);

  // Summaries & filters
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branch, setBranch] = useState("all");

  // ----------------- Fetch Data on Mount -----------------
  useEffect(() => {
    fetchMembers();
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchMembers = () => {
    axios.get("/membership/members")
    .then((res) => {
      if (Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        setMembers([]); // fallback
      }
    })
    .catch((err) => {
      console.error(err);
      setMembers([]); // fallback
    })
  };

  const fetchPayments = () => {
    axios
      .get("/payments")
      .then((res) => {
        // Suppose each payment has shape: { PaymentID, MemberID, Amount, PaymentDate, ... , member: {...} }
        const mapped = res.data.map((p) => ({
          paymentId: p.PaymentID,
          memberName: p.member ? p.member.FullName : "N/A",
          memberId: p.MemberID || "",
          paymentDate: p.PaymentDate,
          amountPaid: p.Amount,
          method: p.PaymentMethod,
          status: p.Status,
        }));
        setPayments(mapped);
      })
      .catch((err) => console.error(err));
  };

  const fetchInvoices = () => {
    axios.get("/invoices").then(res => {
      const mapped = res.data.map(inv => ({
        invoiceId: inv.InvoiceID,
        memberName: inv.member ? inv.member.FullName : "N/A",
        invoiceDate: inv.InvoiceDate,
        dueDate: inv.DueDate,              // you do have a DueDate column
        invoiceTotal: inv.InvoiceTotal,    // NOT totalAmount
      }));
        setInvoices(mapped);
      })
      .catch((err) => console.error(err));
  };
  
  

  // ----------------- Handlers: Add Payment -----------------
  const handleAddPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPaymentSubmit = () => {
    const payload = {
      MemberID: newPayment.memberId,
      PaymentMethod: newPayment.method,
      Amount: newPayment.amountPaid,
      PaymentDate: newPayment.paymentDate,
      Status: newPayment.status,
      PaymentFor: "Membership", // or any field your controller needs
    };

    axios
      .post("/payments", payload)
      .then(() => fetchPayments())
      .then(() => {
        setAddPaymentOpen(false);
        setNewPayment({
          memberId: "",
          paymentDate: "",
          amountPaid: 0,
          method: "",
          status: "",
        });
      })
      .catch((err) => console.error(err));
  };

  // ----------------- Handlers: Edit Payment -----------------
  const handleEditPaymentOpen = (row) => {
    setEditPayment(row);
    setEditPaymentOpen(true);
  };
  
  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPaymentSubmit = () => {
    // editPayment.paymentId is the unique ID from the DB
    const payload = {
      MemberID: editPayment.memberId,
      PaymentMethod: editPayment.method,
      Amount: editPayment.amountPaid,
      PaymentDate: editPayment.paymentDate,
      Status: editPayment.status,
    };

    axios
      .put(`/payments/${editPayment.paymentId}`, payload)
      .then(() => fetchPayments())
      .then(() => {
        setEditPaymentOpen(false);
      })
      .catch((err) => console.error(err));
  };

  // ----------------- Handlers: View Payment -----------------
  const handleViewPaymentOpen = (row) => {
    setViewPayment(row);
    setViewPaymentOpen(true);
  };

  // ----------------- Handlers: Refund -----------------
  const handleRefundPayment = (row) => {
    axios
      .post(`/payments/${row.paymentId}/refund/initiate`)
      .then(() => fetchPayments())
      .catch((err) => console.error(err));
  };

  // ----------------- Handlers: Invoices: Add/Edit/View -----------------
  const handleAddInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvoiceSubmit = () => {
    const payload = {
      MemberID: newInvoice.memberId,
      InvoiceDate: newInvoice.invoiceDate,
      DueDate: newInvoice.dueDate,
      InvoiceTotal: newInvoice.invoiceTotal, // matches DB
    };

    axios
      .post("/invoices", payload)
      .then(() => fetchInvoices())
      .then(() => {
        setAddInvoiceOpen(false);
        setNewInvoice({
          memberId: "",
          invoiceDate: "",
          dueDate: "",
          invoiceTotal: 0,
          status: "",
        });
      })
      .catch((err) => console.error(err));
  };

  const handleEditInvoiceOpen = (row) => {
    setEditInvoice(row);
    setEditInvoiceOpen(true);
  };

  const handleEditInvoiceChange = (e) => {
    const { name, value } = e.target;
    setEditInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInvoiceSubmit = () => {
    const payload = {
      MemberID: editInvoice.memberId,
      InvoiceDate: editInvoice.invoiceDate,
      DueDate: editInvoice.dueDate,
      InvoiceTotal: editInvoice.invoiceTotal,
    };

    axios
      .put(`/invoices/${editInvoice.invoiceId}`, payload)
      .then(() => fetchInvoices())
      .then(() => {
        setEditInvoiceOpen(false);
      })
      .catch((err) => console.error(err));
  };

  const handleViewInvoiceOpen = (row) => {
    setViewInvoice(row);
    setViewInvoiceOpen(true);
  };

  const handleDeleteInvoice = (row) => {
    axios
      .delete(`/invoices/${row.invoiceId}`)
      .then(() => fetchInvoices())
      .catch((err) => console.error(err));
  };

  // ----------------- Summary Stats -----------------
  const totalRevenue = payments
    .filter((p) => p.status === "Completed")
    .reduce((acc, cur) => acc + cur.amountPaid, 0);

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "Unpaid" || inv.status === "Partially Paid"
  ).length;

  const completedInvoices = invoices.filter((inv) => inv.status === "Paid").length;

  // Filters
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);
  const branchOptions = [
    { value: "all", label: "All Branches" },
    { value: "1", label: "Branch 1" },
  ];
  const handleBranchChange = (e) => setBranch(e.target.value);

  // ----------------- Search & Filtered Data -----------------
  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredPayments = payments.filter((p) =>
    Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm))
  );
  const filteredInvoices = invoices.filter((i) =>
    Object.values(i).some((val) => String(val).toLowerCase().includes(searchTerm))
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
  };

  // ----------------- Table Columns -----------------
  const paymentColumns = [
    { field: "paymentId", headerName: "Payment ID", width: 120 },
    { field: "memberName", headerName: "Member Name", width: 150 },
    { field: "paymentDate", headerName: "Payment Date", width: 140 },
    { field: "amountPaid", headerName: "Amount Paid", width: 120 },
    { field: "method", headerName: "Method", width: 110 },
    { field: "status", headerName: "Status", width: 100 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff" }}
              onClick={() => handleViewPaymentOpen(params.row)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff" }}
              onClick={() => handleEditPaymentOpen(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Refund">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff" }}
              onClick={() => handleRefundPayment(params.row)}
            >
              <ReplayCircleFilledIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const invoiceColumns = [
    { field: "invoiceId", headerName: "Invoice ID", width: 120 },
    { field: "memberName", headerName: "Member Name", width: 150 },
    { field: "invoiceDate", headerName: "Invoice Date", width: 140 },
    { field: "dueDate", headerName: "Due Date", width: 130 },
    { field: "invoiceTotal", headerName: "Total", width: 120 },
  ];

  const displayedRows = activeTab === 0 ? filteredPayments : filteredInvoices;
  const displayedColumns = activeTab === 0 ? paymentColumns : invoiceColumns;
  const getPaymentRowId = (row) => row.paymentId;
  const getInvoiceRowId = (row) => row.invoiceId;
  const rowIdGetter = activeTab === 0 ? getPaymentRowId : getInvoiceRowId;

  // ----------------- Export Menu -----------------
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const csvHeadersPayments = [
    { label: "Payment ID", key: "paymentId" },
    { label: "Member Name", key: "memberName" },
    { label: "Payment Date", key: "paymentDate" },
    { label: "Amount Paid", key: "amountPaid" },
    { label: "Method", key: "method" },
    { label: "Status", key: "status" },
  ];

  const csvHeadersInvoices = [
    { label: "Invoice ID", key: "invoiceId" },
    { label: "Member Name", key: "memberName" },
    { label: "Invoice Date", key: "invoiceDate" },
    { label: "Due Date", key: "dueDate" },
    { label: "Total Amount", key: "invoiceTotal" },
    { label: "Status", key: "status" },
  ];

  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      // Payments
      doc.text("Payments Export", 14, 10);
      const bodyData = filteredPayments.map((p) => [
        p.paymentId,
        p.memberName,
        p.paymentDate,
        p.amountPaid,
        p.method,
        p.status,
      ]);
      doc.autoTable({
        head: [["ID", "Member", "Date", "Amount", "Method", "Status"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Payments.pdf");
    } else {
      // Invoices
      doc.text("Invoices Export", 14, 10);
      const bodyData = filteredInvoices.map((i) => [
        i.invoiceId,
        i.memberName,
        i.invoiceDate,
        i.dueDate,
        i.invoiceTotal,
        i.status,
      ]);
      doc.autoTable({
        head: [["ID", "Member", "Invoice Date", "Due Date", "Amount", "Status"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Invoices.pdf");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Overview Panel */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select value={timePeriod} label="Time Period" onChange={handleTimePeriodChange}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={handleDateFromChange}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={handleDateToChange}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={branch} label="Branch" onChange={handleBranchChange}>
              {branchOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Summaries */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                textAlign: "center",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <ReceiptIcon sx={{ fontSize: 40, color: "gold" }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  ${totalRevenue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                textAlign: "center",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <DescriptionIcon sx={{ fontSize: 40, color: "orange" }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Invoices
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  {pendingInvoices}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                textAlign: "center",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <ReplayCircleFilledIcon sx={{ fontSize: 40, color: "limegreen" }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Invoices
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  {completedInvoices}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Title & Tabs */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
      >
        <Typography variant="h4" gutterBottom>
          Payments & Invoices
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<ReceiptIcon />} label="Payments" />
          <Tab icon={<DescriptionIcon />} label="Invoices" />
        </Tabs>
      </Box>

      {/* Search & Export & Add */}
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 300 }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportMenuOpen}
              sx={{ textTransform: "none" }}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={openExportMenu}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <MenuItem onClick={handleExportCSV}>
                {activeTab === 0 ? (
                  <CSVLink
                    data={filteredPayments}
                    headers={csvHeadersPayments}
                    filename="Payments.csv"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    Export CSV
                  </CSVLink>
                ) : (
                  <CSVLink
                    data={filteredInvoices}
                    headers={csvHeadersInvoices}
                    filename="Invoices.csv"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    Export CSV
                  </CSVLink>
                )}
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </Menu>
            {activeTab === 0 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddPaymentOpen(true)}
              >
                Add Payment
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddInvoiceOpen(true)}
              >
                Add Invoice
              </Button>
            )}
          </Box>
        </Box>

        <div style={{ height: 420, width: "100%" }}>
          <DataGrid
            rows={displayedRows}
            columns={displayedColumns}
            getRowId={rowIdGetter}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />
        </div>
      </Paper>

      {/* ----------------- Add Payment Dialog ----------------- */}
      <Dialog open={isAddPaymentOpen} onClose={() => setAddPaymentOpen(false)}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent dividers>
          {/* Use a Select for the Member Name */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={newPayment.memberId || ""}
              onChange={(e) => {
                setNewPayment((prev) => ({ ...prev, memberId: e.target.value }));
              }}
            >
              {(members || []).map((m) => (
                <MenuItem key={m.MemberID} value={m.MemberID}>
                  {m.FullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Payment Date"
            name="paymentDate"
            InputLabelProps={{ shrink: true }}
            value={newPayment.paymentDate}
            onChange={handleAddPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Amount Paid"
            name="amountPaid"
            type="number"
            value={newPayment.amountPaid}
            onChange={handleAddPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Method"
            name="method"
            value={newPayment.method}
            onChange={handleAddPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={newPayment.status}
            onChange={handleAddPaymentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPaymentSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- Edit Payment Dialog ----------------- */}
      <Dialog open={isEditPaymentOpen} onClose={() => setEditPaymentOpen(false)}>
        <DialogTitle>Edit Payment</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="Payment ID"
            name="paymentId"
            value={editPayment.paymentId || ""}
            onChange={handleEditPaymentChange}
            disabled
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={editPayment.memberId || ""}
              onChange={(e) => {
                setEditPayment((prev) => ({ ...prev, memberId: e.target.value }));
              }}
            >
              {(members || []).map((m) => (
                <MenuItem key={m.MemberID} value={m.MemberID}>
                  {m.FullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Payment Date"
            name="paymentDate"
            InputLabelProps={{ shrink: true }}
            value={editPayment.paymentDate || ""}
            onChange={handleEditPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Amount Paid"
            name="amountPaid"
            type="number"
            value={editPayment.amountPaid || ""}
            onChange={handleEditPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Method"
            name="method"
            value={editPayment.method || ""}
            onChange={handleEditPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={editPayment.status || ""}
            onChange={handleEditPaymentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPaymentOpen(false)}>Cancel</Button>
          <Button onClick={handleEditPaymentSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- View Payment Dialog ----------------- */}
      <Dialog
        open={isViewPaymentOpen}
        onClose={() => setViewPaymentOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Payment Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewPayment && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Payment ID:
                  </Typography>
                  <Typography variant="body1">{viewPayment.paymentId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Member Name:
                  </Typography>
                  <Typography variant="body1">{viewPayment.memberName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Date:
                  </Typography>
                  <Typography variant="body1">{viewPayment.paymentDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body1">${viewPayment.amountPaid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Method:
                  </Typography>
                  <Typography variant="body1">{viewPayment.method}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Status:
                  </Typography>
                  <Typography variant="body1">{viewPayment.status}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPaymentOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- Add Invoice Dialog ----------------- */}
      <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)}>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogContent dividers>
          {/* Choose Member */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={newInvoice.memberId || ""}
              onChange={(e) => {
                setNewInvoice((prev) => ({ ...prev, memberId: e.target.value }));
              }}
            >
              {(members || []).map((m) => (
                <MenuItem key={m.MemberID} value={m.MemberID}>
                  {m.FullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Invoice Date"
            name="invoiceDate"
            InputLabelProps={{ shrink: true }}
            value={newInvoice.invoiceDate}
            onChange={handleAddInvoiceChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Total Amount"
            name="invoiceTotal"
            type="number"
            value={newInvoice.invoiceTotal}
            onChange={handleAddInvoiceChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddInvoiceOpen(false)}>Cancel</Button>
          <Button onClick={handleAddInvoiceSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- Edit Invoice Dialog ----------------- */}
      <Dialog open={isEditInvoiceOpen} onClose={() => setEditInvoiceOpen(false)}>
        <DialogTitle>Edit Invoice</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="Invoice ID"
            name="invoiceId"
            value={editInvoice.invoiceId || ""}
            disabled
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={editInvoice.memberId || ""}
              onChange={(e) => {
                setEditInvoice((prev) => ({ ...prev, memberId: e.target.value }));
              }}
            >
              {(members || []).map((m) => (
                <MenuItem key={m.MemberID} value={m.MemberID}>
                  {m.FullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Invoice Date"
            name="invoiceDate"
            InputLabelProps={{ shrink: true }}
            value={editInvoice.invoiceDate || ""}
            onChange={handleEditInvoiceChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Total Amount"
            name="invoiceTotal"
            type="number"
            value={editInvoice.invoiceTotal || ""}
            onChange={handleEditInvoiceChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInvoiceOpen(false)}>Cancel</Button>
          <Button onClick={handleEditInvoiceSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------- View Invoice Dialog ----------------- */}
      <Dialog
        open={isViewInvoiceOpen}
        onClose={() => setViewInvoiceOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Invoice Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewInvoice && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Invoice ID:
                  </Typography>
                  <Typography variant="body1">{viewInvoice.invoiceId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Member Name:
                  </Typography>
                  <Typography variant="body1">{viewInvoice.memberName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Invoice Date:
                  </Typography>
                  <Typography variant="body1">{viewInvoice.invoiceDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Amount:
                  </Typography>
                  <Typography variant="body1">${viewInvoice.invoiceTotal}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewInvoiceOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
