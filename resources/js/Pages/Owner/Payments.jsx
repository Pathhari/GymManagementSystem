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
  IconButton,
  Divider,
  InputAdornment,
  OutlinedInput,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
import { CSVLink } from "react-csv";
import { AttachMoney } from "@mui/icons-material";

export default function PaymentsAndInvoices() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const theme = useTheme();
  // Arrays
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  // filters
  const handleFilterExpenses = () => {
    // Ensure both dates are selected
    if (!dateFrom || !dateTo) {
      alert("Please select both 'From' and 'To' dates.");
      return;
    }

  
    // Filter payments and invoices based on date range
    const filteredPaymentsByDate = payments.filter((p) => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= new Date(dateFrom) && paymentDate <= new Date(dateTo);
    });
  
    const filteredInvoicesByDate = invoices.filter((i) => {
      const invoiceDate = new Date(i.invoiceDate);
      return invoiceDate >= new Date(dateFrom) && invoiceDate <= new Date(dateTo);
    });
  
    setPayments(filteredPaymentsByDate);
    setInvoices(filteredInvoicesByDate);
  };


  //delete logic
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleOpenDeleteDialog = (type, id) => {
    setDeleteType(type);
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };




  // Selected branch, date filters
  const [branch, setBranch] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // =============== Payment Dialogs ===============
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [isViewPaymentOpen, setViewPaymentOpen] = useState(false);

  // Payment form states
  // paymentMode => "member", "walkIn", "booking", "session", "partial"
  const [paymentMode, setPaymentMode] = useState("");

   // Confirmation dialog
   const [openConfirmation, setOpenConfirmation] = useState(false);
  
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

   //date time formatter
   const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const dateObj = new Date(dateString);
  
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    
  };
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    const timeObj = dayjs(timeString, "HH:mm:ss");
    return timeObj.isValid() ? timeObj.format("h:mm A") : "Invalid Time"; // 12-hour format with AM/PM
};

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
          payerName: p.member ? p.member.FullName : p.WalkInName || "N/A",
          paymentDate: new Date(p.PaymentDate).toISOString(), // Ensure consistency in UTC
          amountPaid: Number(p.Amount),
          method: p.PaymentMethod,
          status: p.Status,
          branchId: p.BranchID ? p.BranchID.toString() : "",
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
      .get("/invoices?status=unpaid_or_partial")
      .then((res) => {
        const mapped = (res.data || []).map(inv => ({
          invoiceId: inv.InvoiceID,
          invoiceTotal: inv.InvoiceTotal,
          paymentStatus: inv.PaymentStatus,
          memberName: inv.member ? inv.member.FullName : "N/A",
        }));
        setUnpaidInvoices(mapped);
      })
      .catch(err => console.error(err));
  };

  //delete
  const handleConfirmDelete = async () => {
    try {
      if (deleteType === "payment") {
        await axios.delete(`/payments/${deleteItemId}`);
        setPayments((prev) => prev.filter((p) => p.paymentId !== deleteItemId));
      } else if (deleteType === "invoice") {
        await axios.delete(`/invoices/${deleteItemId}`);
        setInvoices((prev) => prev.filter((i) => i.invoiceId !== deleteItemId));
      }
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // =============== Payment Tab Logic ===============
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
  };

  // Searching / Filtering
  const paymentsByBranch = branch === "all" ? payments : payments.filter((p) => p.branchId === branch);

  const filteredPayments = payments
  .filter((p) => (branch === "all" ? true : p.branchId === branch))
  .filter((p) => Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm)));

const filteredInvoices = invoices
  .filter((i) => Object.values(i).some((val) => String(val).toLowerCase().includes(searchTerm)));


  // Payment or Invoice columns
  const paymentColumns = [
    { 
      field: "paymentId", 
      headerName: "Payment ID", 
      width: 120,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "payerName",
      headerName: "Payer",
      width: 180,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "paymentFor",
      headerName: "Payment For",
      width: 200,
      renderCell: (params) => (Array.isArray(params.value) && params.value.length > 0 ? params.value.join(", ") : "—"),
    },
    {
      field: "paymentDate",
      headerName: "Payment Date",
      width: 250,
      renderCell: (params) => params.value ? formatDateTime(params.value) : "—",
    },
    {
      field: "amountPaid",
      headerName: "Amount Paid",
      width: 120,
      renderCell: (params) => params.value ? formatCurrency(params.value) : "—",
    },    
    { 
      field: "method", 
      headerName: "Method", 
      width: 110,
      renderCell: (params) => params.value ?? "—",
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const status = params.value ?? "—";
        let color = "#ff9800"; // Default Orange for Pending

        if (status.toLowerCase() === "completed") color = "#4caf50"; // Green
        else if (status.toLowerCase() === "failed" || status.toLowerCase() === "refunded") color = "#f44336"; // Red

        return <span style={{ color, fontWeight: "bold" }}>{status}</span>;
      },
    },
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
              sx={{ backgroundColor: "#4caf50", color: "#fff", minWidth: 40 }}
              onClick={() => handleViewPaymentOpen(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2196f3", color: "#fff", minWidth: 40 }}
              onClick={() => handleEditPaymentOpen(params.row)}
            >
              <EditIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Refund">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#f44336", color: "#fff", minWidth: 40 }}
              onClick={() => handleRefundPayment(params.row)}
            >
              <ReplayCircleFilledIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
];

const invoiceColumns = [
  { 
    field: "invoiceId", 
    headerName: "Invoice ID", 
    width: 120,
    renderCell: (params) => params.value ?? "—",
  },
  { 
    field: "memberName", 
    headerName: "Member Name", 
    width: 150,
    renderCell: (params) => params.value ?? "—",
  },
  {
    field: "invoiceDate",
    headerName: "Invoice Date",
    width: 250,
    renderCell: (params) => params.value ? formatDateTime(params.value) : "—",
  },
  {
    field: "dueDate",
    headerName: "Due Date",
    width: 200,
    renderCell: (params) => params.value ? formatDate(params.value) : "—",
  },
  {
    field: "invoiceTotal",
    headerName: "Total",
    width: 120,
    renderCell: (params) => params.value ? formatCurrency(params.value) : "—",
  },
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
        <Tooltip title="Delete">
          <Button
            variant="contained"
            color="error"
            onClick={() => handleOpenDeleteDialog(params.row.type, params.row.id)}
          >
            <DeleteIcon fontSize="small" />
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
    
  // Currency Format
  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    return `₱${parseInt(value).toLocaleString("en-PH")}`;
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
  
    console.log("Filtered Payments:", filteredPayments);
    console.log("Filtered Invoices:", filteredInvoices);
  
    if (filteredPayments.length === 0 && filteredInvoices.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4"
    });
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const coverPage = "/imgs/coverpage2.png";  
    const addPage = "/imgs/addpage2.png";     
  
    let tableHeaders = [];
    let tableBody = [];
    let title = "";
  
    if (activeTab === 0) {
      title = "";
      tableHeaders = ["ID", "Member", "Date", "Amount", "Method", "Status"];
      tableBody = filteredPayments.map((p) => [
        p.paymentId || "N/A",
        p.payerName || "N/A",
        formatDate(p.paymentDate),
        `${parseFloat(p.amountPaid || 0).toFixed(2)}`,  
        p.method || "N/A",
        p.status || "N/A"
      ]);
    } else {
      title = "";
      tableHeaders = ["ID", "Member", "Invoice Date", "Due Date", "Amount"];
      tableBody = filteredInvoices.map((i) => [
        i.invoiceId || "N/A",
        i.memberName || "N/A",
        formatDate(i.invoiceDate),
        formatDate(i.dueDate),
        `${parseFloat(i.invoiceTotal || 0).toFixed(2)}`  
      ]);
    }
  
    console.log("Table Body Data:", tableBody);
  
    if (tableBody.length === 0) {
      alert("No records to export.");
      return;
    }
  

    doc.addImage(coverPage, "PNG", 0, 0, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text(title, pageWidth / 2, 100, { align: "center" });
  
    doc.setFontSize(14);
    doc.text("Generated on: " + new Date().toLocaleDateString(), pageWidth / 2, 130, { align: "center" });
  
    let startY = 100; 
    let tableHeightEstimate = tableBody.length * 20; 
  
    if (tableHeightEstimate > (pageHeight - startY - 40)) {
      doc.addPage();
      doc.addImage(addPage, "PNG", 0, 0, pageWidth, pageHeight);
      startY = 50;
    }
  
    const getStatusColor = (status) => {
      if (status?.toLowerCase() === "completed" || status?.toLowerCase() === "paid") {
        return "#4CAF50";  
      }
      return "#333333"; 
    };
  

    doc.autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: startY,
      theme: "striped",
      headStyles: { fillColor: "#050505", textColor: "#ffffff", fontStyle: "bold", fontSize: 10 },
      bodyStyles: { textColor: "#333333", fontSize: 10 },
      alternateRowStyles: { fillColor: "#f5f5f5" },
      styles: { overflow: "linebreak", cellPadding: 5, halign: "center", valign: "middle" },
      margin: { top: 50, left: 20, right: 20, bottom: 20 },
      didParseCell: (data) => {
        if (data.column.index === 5) { // ✅ Status column (6th column)
          const statusText = data.cell.raw;
          const statusColor = getStatusColor(statusText);
          data.cell.styles.textColor = statusColor;
        }
      },
      didDrawPage: (data) => {
        if (doc.internal.getNumberOfPages() > 1) {
          doc.addImage(addPage, "PNG", 0, 0, pageWidth, pageHeight);
        }
      }
    });
  
    // ✅ Save PDF with a Dynamic Name
    const pdfFilename = activeTab === 0 ? "PaymentsReport.pdf" : "InvoicesReport.pdf";
    doc.save(pdfFilename);
  };
  
  
  return (
    <Box sx={{ p: 4 }}>
  {/* Date Filter Section (Uniform Design) */}
  <Paper sx={{ p: 3, mb: 2, boxShadow: 3, borderRadius: 2 }}>
    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
      Filter Records By Date
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label="From Date"
          type="date"
          fullWidth
          size="small"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          label="To Date"
          type="date"
          fullWidth
          size="small"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button variant="contained" onClick={handleFilterExpenses}>
          Filter
        </Button>
      </Grid>
    </Grid>
  </Paper>

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

  {/* Data Grid & Search */}
  <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
      {/* Branch Filter Dropdown */}
      <Grid item sx={{ mr: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Branch</InputLabel>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)} label="Branch">
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Search Field */}
      <Grid item xs>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          fullWidth
          sx={{ maxWidth: 350 }}
        />
      </Grid>
      
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportMenuOpen}>
          Export
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={openExportMenu}
          onClose={handleExportMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem onClick={handleExportCSV}>
            <CSVLink
              data={activeTab === 0 ? filteredPayments : filteredInvoices}
              headers={activeTab === 0 ? csvHeadersPayments : csvHeadersInvoices}
              filename={activeTab === 0 ? "Payments.csv" : "Invoices.csv"}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Export CSV
            </CSVLink>
          </MenuItem>
          <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
        </Menu>

        {activeTab === 0 && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleAddPaymentOpen("partial")}>
            Make Partial Payment
          </Button>
        )}
        {activeTab === 1 && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddInvoiceOpen(true)}>
            Add Invoice
          </Button>
        )}
      </Box>
    </Box>
    
    <div style={{ height: 455, width: "100%" }}>
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
   {/* ADD Partial Payment Dialog */}
<Dialog open={partialDialogOpen} onClose={closePartialDialog} fullWidth maxWidth="lg">
  {/* DIALOG TITLE */}
  <DialogTitle>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h5">
        <AttachMoney sx={{verticalAlign: "middle", mr: 1}} />
        Create Partial Payment</Typography>
      <IconButton onClick={closePartialDialog} sx={{
          color: "inherit",
          "&:hover": { color: "red" },
        }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  {/* DIALOG CONTENT */}
  <DialogContent dividers>
    <Box sx={{ p: 2 }}>
      <Divider sx={{ mb: 3 }} />

      <form onSubmit={(e) => e.preventDefault()}>
        <Grid container spacing={2}>
          {/* Member Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Member</InputLabel>
              <Select
                name="memberId"
                value={partialPayment.memberId}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, memberId: e.target.value }))
                }
                input={
                  <OutlinedInput
                    label="Member"
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    }
                  />
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

          {/* Payment Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Payment Date"
              name="paymentDate"
              type="date"
              fullWidth
              required
              value={partialPayment.paymentDate}
              onChange={(e) =>
                setPartialPayment((prev) => ({ ...prev, paymentDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="method"
                value={partialPayment.method}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, method: e.target.value }))
                }
                input={
                  <OutlinedInput
                    label="Payment Method"
                    startAdornment={
                      <InputAdornment position="start">
                        <PaymentIcon />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="BDO">BDO</MenuItem>
                <MenuItem value="BPI">BPI</MenuItem>
                <MenuItem value="GCash">GCash</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Payment Status</InputLabel>
              <Select
                name="status"
                value={partialPayment.status}
                onChange={(e) =>
                  setPartialPayment((prev) => ({ ...prev, status: e.target.value }))
                }
                input={
                  <OutlinedInput
                    label="Payment Status"
                    startAdornment={
                      <InputAdornment position="start">
                        <InfoIcon />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Total Amount */}
          <Grid item xs={12}>
            <TextField
              label="Total Amount"
              name="amount"
              type="number"
              fullWidth
              required
              value={partialPayment.amount}
              onChange={(e) =>
                setPartialPayment((prev) => ({ ...prev, amount: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body1">₱</Typography>
                  </InputAdornment>
                ),
              }}
              helperText="The sum allocated to each invoice doesn't need to match exactly, depending on your logic."
            />
          </Grid>
        </Grid>

        {/* Invoice Allocation Section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Allocate to these Invoices</Typography>
          <Grid container spacing={2}>
            {/* Unpaid Invoices */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Unpaid Invoices (select to add):
              </Typography>
              <Paper sx={{ maxHeight: 250, overflowY: "auto", p: 1 }}>
                {unpaidInvoices.map((inv) => (
                  <Box
                    key={inv.invoiceId}
                    sx={{
                      mb: 1,
                      border: "1px solid #ccc",
                      p: 1,
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f5f5" }
                    }}
                    onClick={() =>
                      handleAddInvoiceAlloc({
                        invoiceId: inv.invoiceId,
                        InvoiceTotal: inv.invoiceTotal
                      })
                    }
                  >
                    Invoice #{inv.invoiceId} for {inv.memberName} — ₱{inv.invoiceTotal} — {inv.paymentStatus}
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Allocated Invoices */}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Allocated Invoices:
              </Typography>
              <Paper sx={{ maxHeight: 250, overflowY: "auto", p: 1 }}>
                {partialPayment.allocatedInvoices.map((alloc, idx) => (
                  <Box key={`${alloc.invoiceId}-${idx}`} sx={{ mb: 1, p: 1, border: "1px solid #ccc", borderRadius: 1 }}>
                    Invoice #{alloc.invoiceId}
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

        {/* BUTTONS */}
        <Box sx={{ mt: 4, display: "flex", flexDirection: "row", gap: 3, justifyContent: "flex-end" }}>
          <Button variant="contained" color="primary" onClick={() => setOpenConfirmation(true)}>
            <SaveIcon /> Submit Partial Payment
          </Button>
        </Box>
      </form>
    </Box>
  </DialogContent>
</Dialog>


      {/* ================= EDIT Payment Dialog ================= */}
    <Dialog
      open={isEditPaymentOpen}
      onClose={() => setEditPaymentOpen(false)}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          boxShadow: 6,
          p: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MonetizationOnIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Edit Payment
            </Typography>
          </Box>
          <IconButton
            onClick={() => setEditPaymentOpen(false)}
            sx={{
              "&:hover": { color: theme.palette.error.main },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 4 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Payment ID"
          name="paymentId"
          value={editPayment.paymentId || ""}
          disabled
          variant="filled"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Member Name</InputLabel>
          <Select
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
          label="Payment Method"
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

      {/* Dialog Actions - Save aligned to the right */}
      <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleEditPaymentSubmit}
          sx={{
            textTransform: "none",
          }}
        >
          <SaveIcon sx={{ mr: 1 }} /> Save Changes
        </Button>
      </DialogActions>
    </Dialog>


      {/* ================= VIEW Payment Dialog ================= */}

      <Dialog
        open={isViewPaymentOpen}
        onClose={() => setViewPaymentOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MonetizationOnIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Payment Details
              </Typography>
            </Box>
            <IconButton
              onClick={() => setViewPaymentOpen(false)}
              sx={{
                "&:hover": { color: theme.palette.error.main },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          {viewPayment && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Payment ID"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.paymentId || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Member Name"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.memberName || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={formatDateTime(viewPayment.paymentDate || "—")}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Amount Paid"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.amountPaid ? `₱${viewPayment.amountPaid}` : "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.method || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Status"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.status || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Payment For Section */}
              {viewPayment.paymentFor && viewPayment.paymentFor.length > 0 && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment For"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={viewPayment.paymentFor.join(", ") || "—"}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= ADD Invoice Dialog ================= */}
      {/* ADD Invoice Dialog */}
    <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)} fullWidth maxWidth="md">
      {/* DIALOG TITLE */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <ReceiptIcon sx={{verticalAlign: "middle", mr: 1}} />
            Add Invoice</Typography>
          <IconButton onClick={() => setAddInvoiceOpen(false)} sx={{
              color: "inherit",
              "&:hover": { color: "red" },
            }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* DIALOG CONTENT */}
      <DialogContent dividers>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={(e) => e.preventDefault()}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Member Name */}
              <FormControl fullWidth required>
                <InputLabel>Member Name</InputLabel>
                <Select
                  name="memberId"
                  value={newInvoice.memberId || ""}
                  onChange={handleAddInvoiceChange}
                  input={
                    <OutlinedInput
                      label="Member Name"
                      startAdornment={
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {(members || []).map((m) => (
                    <MenuItem key={m.MemberID} value={m.MemberID}>
                      {m.FullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Invoice Date */}
              <TextField
                label="Invoice Date"
                name="invoiceDate"
                type="date"
                fullWidth
                required
                value={newInvoice.invoiceDate}
                onChange={handleAddInvoiceChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Due Date */}
              <TextField
                label="Due Date"
                name="dueDate"
                type="date"
                fullWidth
                required
                value={newInvoice.dueDate}
                onChange={handleAddInvoiceChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Total Amount */}
              <TextField
                label="Total Amount"
                name="invoiceTotal"
                type="number"
                fullWidth
                required
                value={newInvoice.invoiceTotal}
                onChange={handleAddInvoiceChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body1">₱</Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* BUTTONS */}
            <Box sx={{ mt: 4, display: "flex", flexDirection: "row", gap: 3, justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary" onClick={() => setOpenConfirmation(true)}>
                <SaveIcon /> Save Invoice
              </Button>
            </Box>
          </form>
        </Box>
      </DialogContent>
    </Dialog>

    {/* CONFIRMATION DIALOG */}
    <Dialog
      open={openConfirmation}
      onClose={() => setOpenConfirmation(false)}
      PaperProps={{
        sx: { borderRadius: 3, minWidth: 350 },
      }}
    >
  <DialogTitle sx={{ textAlign: "center", p: 3 }}>
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      <CheckCircleOutlineIcon sx={{ fontSize: 50, color: "primary.main" }} />
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        Confirm Submission
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent dividers sx={{ textAlign: "center", py: 2 }}>
    <Typography variant="body1">Are you sure you want to add this invoice?</Typography>
  </DialogContent>

  <DialogActions sx={{ justifyContent: "center", gap: 2, py: 2 }}>
    <Button onClick={() => setOpenConfirmation(false)} sx={{ textTransform: "none" }} style={{ color: "red" }}>
      Cancel
    </Button>
    <Button
      variant="contained"
      color="primary"
      sx={{ textTransform: "none" }}
      onClick={async () => {
        await handleAddInvoiceSubmit();
        setOpenConfirmation(false);
      }}
    >
      Confirm
    </Button>
  </DialogActions>
</Dialog>


      {/* ================= EDIT Invoice Dialog ================= */}
      <Dialog
        open={isEditInvoiceOpen}
        onClose={() => setEditInvoiceOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptLongIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Edit Invoice
              </Typography>
            </Box>
            <IconButton
              onClick={() => setEditInvoiceOpen(false)}
              sx={{
                "&:hover": { color: theme.palette.error.main },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Invoice ID"
            name="invoiceId"
            variant="filled"
            InputProps={{ readOnly: true }}
            value={editInvoice.invoiceId || ""}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel>Member Name</InputLabel>
            <Select
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
            sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Total Amount"
            name="invoiceTotal"
            type="number"
            value={editInvoice.invoiceTotal || ""}
            onChange={handleEditInvoiceChange}
            sx={{ mb: 2 }}
          />
        </DialogContent>

        {/* Dialog Actions - Save aligned to the right */}
        <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditInvoiceSubmit}
            sx={{
              textTransform: "none",
            }}
          >
            <SaveIcon sx={{ mr: 1 }} /> Save Changes
          </Button>
        </DialogActions>
      </Dialog>


      {/* ================= VIEW Invoice Dialog ================= */}
      <Dialog
        open={isViewInvoiceOpen}
        onClose={() => setViewInvoiceOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: 6,
            p: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptLongIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Invoice Details
              </Typography>
            </Box>
            <IconButton
              onClick={() => setViewInvoiceOpen(false)}
              sx={{
                "&:hover": { color: theme.palette.error.main },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 4 }}>
          {viewInvoice && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Invoice ID"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewInvoice.invoiceId || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Member Name"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewInvoice.memberName || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={formatDate(viewInvoice.invoiceDate || "—")}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={formatDate(viewInvoice.dueDate || "—")}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
              <TextField
              fullWidth
              label="Total Amount"
              variant="filled"
              InputProps={{ readOnly: true }}
              value={viewInvoice.invoiceTotal ? `₱${viewInvoice.invoiceTotal}` : "—"}
              sx={{ mb: 2 }}
            />
              </Grid>
            </Grid>
          )}

          {/* Line Items Section */}
          <Box mt={3}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Line Items
            </Typography>
            {viewInvoice?.lineItems && viewInvoice.lineItems.length > 0 ? (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Item Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewInvoice.lineItems.map((li, index) => (
                      <TableRow key={index}>
                        <TableCell>{li.ItemType || "—"}</TableCell>
                        <TableCell>{li.Description || "—"}</TableCell>
                        <TableCell>{li.Quantity || "—"}</TableCell>
                        <TableCell>{li.UnitPrice ? `₱${li.UnitPrice}` : "—"}</TableCell>
                        <TableCell>{li.Subtotal ? `₱${li.Subtotal}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No line items found.</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>


       {/* Delete Dialog */}   
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <DeleteForeverIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "gray" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
