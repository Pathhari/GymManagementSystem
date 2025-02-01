import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Data arrays
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  // Selected branch ("all" or a BranchID as string)
  const [branch, setBranch] = useState("all");

  // Payment dialogs
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [isViewPaymentOpen, setViewPaymentOpen] = useState(false);

  // Invoice dialogs
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

  // The invoice we’re viewing in the dialog, including line items
  const [viewInvoice, setViewInvoice] = useState(null);

  // Summaries & filters
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ----------------- Fetch Data on Mount -----------------
  useEffect(() => {
    fetchMembers();
    fetchPayments();
    fetchInvoices();
    fetchBranches();
  }, []);

  const fetchMembers = () => {
    axios
      .get("/membership/members")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMembers(res.data);
        } else if (res.data.members) {
          setMembers(res.data.members);
        } else {
          setMembers([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setMembers([]);
      });
  };

  const fetchPayments = () => {
    axios
      .get("/payments")
      .then((res) => {
        const mapped = res.data.map((p) => ({
          paymentId: p.PaymentID,
          memberName: p.member ? p.member.FullName : "N/A",
          memberId: p.MemberID || "",
          paymentDate: p.PaymentDate,
          amountPaid: Number(p.Amount), // Ensure it's a number
          method: p.PaymentMethod,
          status: p.Status,
          branchId: p.BranchID ? p.BranchID.toString() : "",
        }));
        setPayments(mapped);
      })
      .catch((err) => console.error(err));
  };

  const fetchInvoices = () => {
    axios
      .get("/invoices")
      .then((res) => {
        const mapped = res.data.map((inv) => ({
          invoiceId: inv.InvoiceID,
          memberName: inv.member ? inv.member.FullName : "N/A",
          invoiceDate: inv.InvoiceDate,
          dueDate: inv.DueDate,
          invoiceTotal: inv.InvoiceTotal,
          status: inv.PaymentStatus, // Use the PaymentStatus field
        }));
        setInvoices(mapped);
      })
      .catch((err) => console.error(err));
  };

  const fetchBranches = () => {
    axios
      .get("/owner/branches")
      .then((res) => {
        const fetched = res.data.branches.map((b) => ({
          value: b.BranchID.toString(),
          label: b.BranchName,
        }));
        // Include "All Branches" as the first option
        setBranchOptions([{ value: "all", label: "All Branches" }, ...fetched]);
      })
      .catch((err) => {
        console.error(err);
        setBranchOptions([{ value: "all", label: "All Branches" }]);
      });
  };

  // ----------------- Payment Handlers -----------------
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
      PaymentFor: "Membership",
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

  const handleEditPaymentOpen = (row) => {
    setEditPayment(row);
    setEditPaymentOpen(true);
  };

  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPaymentSubmit = () => {
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

  const handleViewPaymentOpen = (row) => {
    setViewPayment(row);
    setViewPaymentOpen(true);
  };

  const handleRefundPayment = (row) => {
    axios
      .post(`/payments/${row.paymentId}/refund/initiate`)
      .then(() => fetchPayments())
      .catch((err) => console.error(err));
  };

  // ----------------- Invoice Handlers -----------------
  const handleAddInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvoiceSubmit = () => {
    const payload = {
      MemberID: newInvoice.memberId,
      InvoiceDate: newInvoice.invoiceDate,
      DueDate: newInvoice.dueDate,
      InvoiceTotal: newInvoice.invoiceTotal,
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
    axios
      .get(`/invoices/${row.invoiceId}`)
      .then((res) => {
        const fetched = {
          invoiceId: res.data.InvoiceID,
          memberName: res.data.member ? res.data.member.FullName : "N/A",
          invoiceDate: res.data.InvoiceDate,
          dueDate: res.data.DueDate,
          invoiceTotal: res.data.InvoiceTotal,
          lineItems: res.data.line_items || [],
        };
        setViewInvoice(fetched);
        setViewInvoiceOpen(true);
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteInvoice = (row) => {
    if (!window.confirm(`Are you sure you want to delete Invoice #${row.invoiceId}?`)) return;

    axios
      .delete(`/invoices/${row.invoiceId}`)
      .then(() => fetchInvoices())
      .catch((err) => console.error(err));
  };

  // ----------------- Summary Stats & Filtering -----------------
  // Apply branch filtering to payments for summaries and table rows
  const paymentsByBranch = branch === "all" ? payments : payments.filter((p) => p.branchId === branch);
  const totalRevenue = paymentsByBranch
    .filter((p) => p.status === "Completed")
    .reduce((acc, cur) => acc + cur.amountPaid, 0);

  const totalInvoices = invoices.length;
  const outstandingAmount = invoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Partially Paid")
    .reduce((acc, inv) => acc + Number(inv.invoiceTotal), 0);

  const filteredPayments = paymentsByBranch.filter((p) =>
    Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm))
  );

  const filteredInvoices = invoices.filter((i) =>
    Object.values(i).some((val) => String(val).toLowerCase().includes(searchTerm))
  );

  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);
  const handleBranchChange = (e) => setBranch(e.target.value);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.toLowerCase());
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
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Invoice + Line Items">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4caf50", color: "#fff" }}
              onClick={() => handleViewInvoiceOpen(params.row)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit Invoice">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff" }}
              onClick={() => handleEditInvoiceOpen(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Delete Invoice">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#e53935", color: "#fff" }}
              onClick={() => handleDeleteInvoice(params.row)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
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
  ];

  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
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
      doc.text("Invoices Export", 14, 10);
      const bodyData = filteredInvoices.map((i) => [
        i.invoiceId,
        i.memberName,
        i.invoiceDate,
        i.dueDate,
        i.invoiceTotal,
      ]);
      doc.autoTable({
        head: [["ID", "Member", "Invoice Date", "Due Date", "Amount"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Invoices.pdf");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ---------- OVERVIEW PANEL ---------- */}
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

        <Grid container spacing={2}>
  {/* Total Revenue */}
  <Grid item xs={12} sm={6} md={4}>
    <Card
      sx={{
        bgcolor: "text.primary",
        color: "background.paper",
        display: "flex",
        alignItems: "center",
        p: 2,
        boxShadow: 3,
      }}
    >
      <ReceiptIcon sx={{ fontSize: 30, mr: 1.5, color: "gold" }} />
      <CardContent sx={{ p: 0.5 }}>
        <Typography variant="body2">Total Revenue</Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  {/* Total Invoices */}
  <Grid item xs={12} sm={6} md={4}>
    <Card
      sx={{
        bgcolor: "text.primary",
        color: "background.paper",
        display: "flex",
        alignItems: "center",
        p: 2,
        boxShadow: 3,
      }}
    >
      <DescriptionIcon sx={{ fontSize: 30, mr: 1.5, color: "orange" }} />
      <CardContent sx={{ p: 0.5 }}>
        <Typography variant="body2">Total Invoices</Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{totalInvoices}</Typography>
      </CardContent>
    </Card>
  </Grid>

  {/* Outstanding Amount */}
  <Grid item xs={12} sm={6} md={4}>
    <Card
      sx={{
        bgcolor: "text.primary",
        color: "background.paper",
        display: "flex",
        alignItems: "center",
        p: 2,
        boxShadow: 3,
      }}
    >
      <ReplayCircleFilledIcon sx={{ fontSize: 30, mr: 1.5, color: "limegreen" }} />
      <CardContent sx={{ p: 0.5 }}>
        <Typography variant="body2">Outstanding Amount</Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          ₱{outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
</Grid>

      </Box>

      {/* ---------- Title & Tabs ---------- */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>
          Payments & Invoices
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<ReceiptIcon />} label="Payments" />
          <Tab icon={<DescriptionIcon />} label="Invoices" />
        </Tabs>
      </Box>

      {/* ---------- Search & Action Buttons ---------- */}
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

      {/* ----------------- ADD Payment Dialog ----------------- */}
      <Dialog open={isAddPaymentOpen} onClose={() => setAddPaymentOpen(false)}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={newPayment.memberId || ""}
              onChange={(e) =>
                setNewPayment((prev) => ({ ...prev, memberId: e.target.value }))
              }
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

      {/* ----------------- EDIT Payment Dialog ----------------- */}
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
              onChange={(e) =>
                setEditPayment((prev) => ({ ...prev, memberId: e.target.value }))
              }
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

      {/* ----------------- VIEW Payment Dialog ----------------- */}
      <Dialog open={isViewPaymentOpen} onClose={() => setViewPaymentOpen(false)} fullWidth maxWidth="sm">
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

      {/* ----------------- ADD Invoice Dialog ----------------- */}
      <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)}>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={newInvoice.memberId || ""}
              onChange={(e) =>
                setNewInvoice((prev) => ({ ...prev, memberId: e.target.value }))
              }
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
            type="date"
            label="Due Date"
            name="dueDate"
            InputLabelProps={{ shrink: true }}
            value={newInvoice.dueDate}
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

      {/* ----------------- EDIT Invoice Dialog ----------------- */}
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
              onChange={(e) =>
                setEditInvoice((prev) => ({ ...prev, memberId: e.target.value }))
              }
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
            type="date"
            label="Due Date"
            name="dueDate"
            InputLabelProps={{ shrink: true }}
            value={editInvoice.dueDate || ""}
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

      {/* ----------------- VIEW Invoice Dialog ----------------- */}
      <Dialog open={isViewInvoiceOpen} onClose={() => setViewInvoiceOpen(false)} fullWidth maxWidth="sm">
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
                    Due Date:
                  </Typography>
                  <Typography variant="body1">{viewInvoice.dueDate || "—"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Amount:
                  </Typography>
                  <Typography variant="body1">${viewInvoice.invoiceTotal}</Typography>
                </Grid>
              </Grid>
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Line Items
                </Typography>
                {viewInvoice.lineItems && viewInvoice.lineItems.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ItemType</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>UnitPrice</TableCell>
                          <TableCell>Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewInvoice.lineItems.map((li) => (
                          <TableRow key={li.LineItemID}>
                            <TableCell>{li.ItemType}</TableCell>
                            <TableCell>{li.Description}</TableCell>
                            <TableCell>{li.Quantity}</TableCell>
                            <TableCell>${li.UnitPrice}</TableCell>
                            <TableCell>${li.Subtotal}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography>No line items found.</Typography>
                )}
              </Box>
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
