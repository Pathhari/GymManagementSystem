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

/**
 * This component has two tabs:
 *   1) Payments (Member / Walk-In / Booking / Session / Partial Payment)
 *   2) Invoices
 *
 * PaymentFor is stored as an array, so each flow sets PaymentFor like
 * ["Membership"], ["Walk-In"], ["Booking"], ["Session"], or ["Partial"].
 *
 * For partial payments, we let the user pick multiple invoices and allocate amounts.
 * The backend would handle the logic of linking Payment to those Invoices.
 */
export default function PaymentsAndInvoices() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Arrays
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  // Selected branch, date filters
  const [branch, setBranch] = useState("all");
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // =============== Payment Dialogs ===============
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [isViewPaymentOpen, setViewPaymentOpen] = useState(false);

  // Payment form states
  // paymentMode => "member", "walkIn", "booking", "session", "partial"
  const [paymentMode, setPaymentMode] = useState("");

  // Common newPayment fields
  const [newPayment, setNewPayment] = useState({
    memberId: "",
    walkInName: "",
    bookingRef: "",
    sessionRef: "",
    paymentDate: "",
    amountPaid: 0,
    method: "",
    status: "",
  });

  const [editPayment, setEditPayment] = useState({});
  const [viewPayment, setViewPayment] = useState(null);

  // =============== Partial Payment Dialog ===============
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  // We'll store the partialPayment form:
  const [partialPayment, setPartialPayment] = useState({
    memberId: "",
    paymentDate: "",
    method: "",
    amount: 0,
    status: "Pending",
    allocatedInvoices: [], // e.g. [{invoiceId, amountAllocated}, ...]
  });
  // We'll also store some "open" or "unpaid" invoices in a local state to pick from
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);

  // =============== Invoice Dialogs ===============
  const [isAddInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setViewInvoiceOpen] = useState(false);

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

  // On mount: fetch members, payments, invoices, branches
  useEffect(() => {
    fetchMembers();
    fetchPayments();
    fetchInvoices();
    fetchBranches();
    fetchUnpaidInvoices(); // for partial payment
  }, []);

  const fetchMembers = () => {
    axios
      .get("/membership/members")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.members || [];
        setMembers(data);
      })
      .catch((err) => console.error(err));
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
          amountPaid: Number(p.Amount),
          method: p.PaymentMethod,
          status: p.Status,
          branchId: p.BranchID ? p.BranchID.toString() : "",
          // if PaymentFor is JSON in DB, decode in backend or parse here if needed
          paymentFor: Array.isArray(p.PaymentFor) ? p.PaymentFor : [],
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
          status: inv.PaymentStatus,
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
        setBranchOptions([{ value: "all", label: "All Branches" }, ...fetched]);
      })
      .catch((err) => {
        console.error(err);
        setBranchOptions([{ value: "all", label: "All Branches" }]);
      });
  };

  // For partial payments, we might need a list of unpaid or partially paid invoices
  const fetchUnpaidInvoices = () => {
    axios
      .get("/invoices?status=unpaid_or_partial") // or however you filter
      .then((res) => {
        // shape it to your liking
        setUnpaidInvoices(res.data || []);
      })
      .catch((err) => console.error(err));
  };

  // =============== Payment Tab Logic ===============
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
  };

  // Searching / Filtering
  const paymentsByBranch = branch === "all" ? payments : payments.filter((p) => p.branchId === branch);

  const filteredPayments = paymentsByBranch.filter((p) =>
    Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm))
  );
  const filteredInvoices = invoices.filter((i) =>
    Object.values(i).some((val) => String(val).toLowerCase().includes(searchTerm))
  );

  // Payment or Invoice columns
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

  // =============== Payment Buttons & Dialogs ===============
  const openPaymentDialog = (mode) => {
    // This is for the older approach, we keep newPayment. But we have a separate partial approach
    setPaymentMode(mode);
    setNewPayment({
      memberId: "",
      walkInName: "",
      bookingRef: "",
      sessionRef: "",
      paymentDate: "",
      amountPaid: 0,
      method: "",
      status: "Pending",
    });
    setAddPaymentOpen(true);
  };

  const closePaymentDialog = () => {
    setAddPaymentOpen(false);
  };

  const handleAddPaymentOpen = (mode) => {
    if (mode === "partial") {
      // open partial payment dialog
      setPartialPayment({
        memberId: "",
        paymentDate: "",
        method: "",
        amount: 0,
        status: "Pending",
        allocatedInvoices: [],
      });
      setPartialDialogOpen(true);
    } else {
      // Normal payment flows
      openPaymentDialog(mode);
    }
  };

  // For partial, we have a separate approach:
  const closePartialDialog = () => {
    setPartialDialogOpen(false);
  };

  // --- SUBMIT PARTIAL Payment
  const handleSubmitPartialPayment = () => {
    // We'll post to e.g. /payments/partial with allocatedInvoices
    // allocatedInvoices = [{ invoiceId, amountAllocated }, ...]
    // Then the backend does partial logic
    const payload = {
      // If you have BranchID, etc.
      MemberID: partialPayment.memberId ? Number(partialPayment.memberId) : null,
      PaymentFor: "Partial",
      PaymentMethod: partialPayment.method,
      Amount: Number(partialPayment.amount),
      PaymentDate: partialPayment.paymentDate,
      Status: partialPayment.status,
      allocatedInvoices: partialPayment.allocatedInvoices.map((alloc) => ({
        invoiceId: alloc.invoiceId,
        amountAllocated: Number(alloc.amountAllocated),
      })),
    };

    axios
      .post("/payments/partial", payload)
      .then(() => {
        alert("Partial payment created successfully!");
        fetchPayments();
        setPartialDialogOpen(false);
      })
      .catch((err) => console.error(err));
  };

  // Example of how user picks multiple invoices for partial
  // We might show a mini table or list of unpaid invoices
  const handleAddInvoiceAlloc = (inv) => {
    // Add or update the partialPayment.allocatedInvoices
    const existing = partialPayment.allocatedInvoices.find((x) => x.invoiceId === inv.invoiceId);
    if (!existing) {
      setPartialPayment((prev) => ({
        ...prev,
        allocatedInvoices: [...prev.allocatedInvoices, { invoiceId: inv.invoiceId, amountAllocated: inv.InvoiceTotal }],
      }));
    }
  };

  // =============== Payment - Create & Edit ===============
  const handleAddPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPaymentSubmit = () => {
    // Decide PaymentFor array based on paymentMode
    let paymentForArr = [];
    switch (paymentMode) {
      case "member":
        paymentForArr = ["Membership"];
        break;
      case "walkIn":
        paymentForArr = ["Walk-In"];
        break;
      case "booking":
        paymentForArr = ["Booking"];
        break;
      case "session":
        paymentForArr = ["Session"];
        break;
      default:
        paymentForArr = ["Others"];
    }

    const payload = {
      MemberID: paymentMode === "walkIn" ? null : newPayment.memberId,
      PaymentFor: paymentForArr,
      PaymentMethod: newPayment.method,
      Amount: Number(newPayment.amountPaid),
      PaymentDate: newPayment.paymentDate,
      Status: newPayment.status || "Pending",
      // For storing references if your DB can handle it:
      WalkInName: paymentMode === "walkIn" ? newPayment.walkInName : null,
      BookingRef: paymentMode === "booking" ? newPayment.bookingRef : null,
      SessionRef: paymentMode === "session" ? newPayment.sessionRef : null,
    };

    axios
      .post("/payments", payload)
      .then(() => {
        fetchPayments();
        setAddPaymentOpen(false);
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
    // Keep the same PaymentFor array if row had it
    const existingFor = Array.isArray(editPayment.paymentFor) && editPayment.paymentFor.length > 0
      ? editPayment.paymentFor
      : ["Membership"]; // fallback

    const payload = {
      MemberID: editPayment.memberId || null,
      PaymentFor: existingFor,
      PaymentMethod: editPayment.method,
      Amount: Number(editPayment.amountPaid),
      PaymentDate: editPayment.paymentDate,
      Status: editPayment.status,
      // If we also want to update references, do so if we have them
    };

    axios
      .put(`/payments/${editPayment.paymentId}`, payload)
      .then(() => {
        fetchPayments();
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

  // =============== Invoice: Add, Edit, View ===============
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

  // =============== Export Menu ===============
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
      {/* Time Period, Branch, etc. at top */}
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
            <Select value={timePeriod} label="Time Period" onChange={(e) => setTimePeriod(e.target.value)}>
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
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={branch} label="Branch" onChange={(e) => setBranch(e.target.value)}>
              {branchOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>
          Payments & Invoices
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<ReceiptIcon />} label="Payments" />
          <Tab icon={<DescriptionIcon />} label="Invoices" />
        </Tabs>
      </Box>

      {/* Search & Export */}
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
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
              <>
                {/* 5 buttons now: Member, Walk-In, Booking, Session, Partial */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddPaymentOpen("member")}
                >
                  Member Payment
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddPaymentOpen("walkIn")}
                >
                  Walk-In Payment
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddPaymentOpen("booking")}
                >
                  Booking Payment
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddPaymentOpen("session")}
                >
                  Session Payment
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddPaymentOpen("partial")}
                >
                  Partial Payment
                </Button>
              </>
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

      {/* ================= ADD Payment Dialog (non-partial) ================= */}
      <Dialog open={isAddPaymentOpen} onClose={closePaymentDialog}>
        <DialogTitle>
          {paymentMode === "member" && "Add Member Payment"}
          {paymentMode === "walkIn" && "Add Walk-In Payment"}
          {paymentMode === "booking" && "Add Booking Payment"}
          {paymentMode === "session" && "Add Session Payment"}
        </DialogTitle>
        <DialogContent dividers>
          {/* If not walkIn, show member select */}
          {paymentMode !== "walkIn" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Member Name</InputLabel>
              <Select
                label="Member Name"
                name="memberId"
                value={newPayment.memberId}
                onChange={handleAddPaymentChange}
              >
                <MenuItem value="">
                  <em>-- Select Member --</em>
                </MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.MemberID} value={m.MemberID}>
                    {m.FullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* If walkIn => ask for name */}
          {paymentMode === "walkIn" && (
            <TextField
              fullWidth
              margin="normal"
              label="Walk-In Name"
              name="walkInName"
              value={newPayment.walkInName}
              onChange={handleAddPaymentChange}
            />
          )}

          {/* bookingRef if booking */}
          {paymentMode === "booking" && (
            <TextField
              fullWidth
              margin="normal"
              label="Booking Reference"
              name="bookingRef"
              value={newPayment.bookingRef}
              onChange={handleAddPaymentChange}
            />
          )}

          {/* sessionRef if session */}
          {paymentMode === "session" && (
            <TextField
              fullWidth
              margin="normal"
              label="Session Reference"
              name="sessionRef"
              value={newPayment.sessionRef}
              onChange={handleAddPaymentChange}
            />
          )}

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
          <Button onClick={closePaymentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPaymentSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= PARTIAL PAYMENT DIALOG ================= */}
      <Dialog open={partialDialogOpen} onClose={closePartialDialog} fullWidth maxWidth="md">
        <DialogTitle>Create Partial Payment</DialogTitle>
        <DialogContent dividers>
          {/* For partial, we let user pick a member, date, method, total amount, plus allocate to multiple invoices */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Member</InputLabel>
                <Select
                  name="memberId"
                  label="Member"
                  value={partialPayment.memberId}
                  onChange={(e) =>
                    setPartialPayment((prev) => ({ ...prev, memberId: e.target.value }))
                  }
                >
                  <MenuItem value="">
                    <em>-- None --</em>
                  </MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.MemberID} value={m.MemberID}>
                      {m.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                size="small"
                value={partialPayment.paymentDate}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, paymentDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Payment Method"
                fullWidth
                size="small"
                value={partialPayment.method}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, method: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Payment Status"
                fullWidth
                size="small"
                value={partialPayment.status}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, status: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Total Amount"
                type="number"
                fullWidth
                size="small"
                value={partialPayment.amount}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, amount: e.target.value }))
                }
                helperText="The sum of allocated to each invoice doesn't need to match exactly, depending on your logic."
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Allocate to these Invoices</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Unpaid Invoices (select to add):
                </Typography>
                <Paper sx={{ maxHeight: 200, overflowY: "auto", p: 1 }}>
                  {unpaidInvoices.map((inv) => (
                    <Box
                      key={inv.InvoiceID}
                      sx={{ mb: 1, border: "1px solid #ccc", p: 1, borderRadius: 1, cursor: "pointer" }}
                      onClick={() => handleAddInvoiceAlloc({ invoiceId: inv.InvoiceID, InvoiceTotal: inv.InvoiceTotal })}
                    >
                      Invoice #{inv.InvoiceID} - ₱{inv.InvoiceTotal} - {inv.PaymentStatus}
                    </Box>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Allocated Invoices:
                </Typography>
                <Paper sx={{ maxHeight: 200, overflowY: "auto", p: 1 }}>
                  {partialPayment.allocatedInvoices.map((alloc, idx) => (
                    <Box key={`${alloc.invoiceId}-${idx}`} sx={{ mb: 1, p: 1, border: "1px solid #ccc", borderRadius: 1 }}>
                      InvoiceID: {alloc.invoiceId}
                      <TextField
                        label="Amount Allocated"
                        type="number"
                        size="small"
                        value={alloc.amountAllocated}
                        onChange={(e) => {
                          const newAlloc = [...partialPayment.allocatedInvoices];
                          newAlloc[idx].amountAllocated = e.target.value;
                          setPartialPayment((prev) => ({ ...prev, allocatedInvoices: newAlloc }));
                        }}
                        sx={{ ml: 2, width: 100 }}
                      />
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePartialDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitPartialPayment}>
            Submit Partial Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= EDIT Payment Dialog ================= */}
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
              onChange={handleEditPaymentChange}
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
          <Button variant="contained" onClick={handleEditPaymentSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= VIEW Payment Dialog ================= */}
      <Dialog open={isViewPaymentOpen} onClose={() => setViewPaymentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Payment Details</DialogTitle>
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
                  <Typography variant="body1">₱{viewPayment.amountPaid}</Typography>
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

                {/* PaymentFor array */}
                {viewPayment.paymentFor && viewPayment.paymentFor.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Payment For:
                    </Typography>
                    <Typography variant="body1">
                      {viewPayment.paymentFor.join(", ")}
                    </Typography>
                  </Grid>
                )}
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

      {/* ================= ADD Invoice Dialog ================= */}
      <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)}>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              label="Member Name"
              name="memberId"
              value={newInvoice.memberId || ""}
              onChange={handleAddInvoiceChange}
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

      {/* ================= EDIT Invoice Dialog ================= */}
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
              onChange={handleEditInvoiceChange}
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

      {/* ================= VIEW Invoice Dialog ================= */}
      <Dialog open={isViewInvoiceOpen} onClose={() => setViewInvoiceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invoice Details</DialogTitle>
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
