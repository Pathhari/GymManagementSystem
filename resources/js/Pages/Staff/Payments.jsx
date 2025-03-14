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
  TableFooter,
  IconButton,
  Divider,
  InputAdornment,
  OutlinedInput,
  useTheme,
  CircularProgress,
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
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import EventIcon from "@mui/icons-material/Event";
import PaymentIcon from "@mui/icons-material/Payment";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BarChartIcon from "@mui/icons-material/BarChart";

import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
import { CSVLink } from "react-csv";
import { AttachMoney } from "@mui/icons-material";

export default function PaymentsAndInvoices() {
  const theme = useTheme();

  // ==================== State Hooks ====================


  const [loading, setLoading] = useState(true);
  // For unfiltered data from server
  const [allPayments, setAllPayments] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [selectedDetailDate, setSelectedDetailDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  

  // For filtered data displayed in the table
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

    // For petty
  const [pettyDialogOpen, setPettyDialogOpen] = useState(false);
  const [selectedFlowRow, setSelectedFlowRow] = useState(null); // store the row user clicked
  const [pettyForm, setPettyForm] = useState({
    pettyCash: '',
    pettyTomorrow: '',
  });


  // Active tab, search, and branch
  const [activeTab, setActiveTab] = useState(2);
  const [searchTerm, setSearchTerm] = useState("");
  const [branch, setBranch] = useState("all");
  const [branchOptions, setBranchOptions] = useState([]);

  // Date range
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Payment and Invoice references
  const [members, setMembers] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);

  // Delete logic
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Payment dialogs
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [isViewPaymentOpen, setViewPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");

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

  // Partial Payment Dialog
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [partialPayment, setPartialPayment] = useState({
    memberId: "",
    paymentDate: "",
    method: "",
    amount: 0,
    status: "Pending",
    allocatedInvoices: [],
  });

  // Invoice dialogs
  const [isAddInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setViewInvoiceOpen] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    memberId: "",
    invoiceDate: "",
    dueDate: "",
    invoiceTotal: 0,
    status: "",
  });
  const [editInvoice, setEditInvoice] = useState({});
  const [viewInvoice, setViewInvoice] = useState(null);

  const [gymCashFlows, setGymCashFlows] = useState([]);
  const [filteredGymSales, setFilteredGymSales] = useState([]);

  // Confirmation dialog
  const [openConfirmation, setOpenConfirmation] = useState(false);

  // Export menu
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  // ==================== Utility/Helper Functions ====================
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

  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    return `₱${parseInt(value).toLocaleString("en-PH")}`;
  };

  function formatCurrencyCell(params) {
    if (!params.value) return '—';
    return '₱' + Number(params.value).toLocaleString();
  }

      // somewhere above your component:
    function filterSalesByDateRange(rows, fromDate, toDate) {
      if (!fromDate && !toDate) return rows;
      const start = fromDate ? new Date(fromDate) : null;
      const end = toDate ? new Date(toDate) : null;

      return rows.filter((row) => {
        // If row has row.date in 'YYYY-MM-DD' format:
        const d = new Date(row.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }
  

  // Payment-date filter for payments
  function filterPaymentsByDate(payments, start, end) {
    if (!start && !end) return payments;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    return payments.filter((p) => {
      const d = new Date(p.paymentDate); // specifically PaymentDate
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
  }

  // Invoice-date filter for invoices
  function filterInvoicesByDate(invoices, start, end) {
    if (!start && !end) return invoices;
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    return invoices.filter((inv) => {
      const d = new Date(inv.invoiceDate); // specifically InvoiceDate
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });
  }

  function groupPaymentsByPaymentFor(payments) {
    // This returns something like:
    // {
    //   "Walk-in Payment": [
    //     { payerName: "Alice", cash: 350, gcash: 0, bpi: 0, bdo: 0, total: 350 },
    //     { payerName: "Jakes", cash: 0, gcash: 350, bpi: 0, bdo: 0, total: 350 },
    //     ...
    //   ],
    //   "New Membership": [...],
    //   "Membership Renewal": [...]
    // }
  
    const result = {};
  
    payments.forEach((pay) => {
      // pay.paymentFor could be multiple categories if it's an array
      // Typically 1-element array like ["Walk-in Payment"] 
      // so we map over each category in there
      (pay.paymentFor || []).forEach((category) => {
        const normalizedCategory = category.trim();
  
        // If we only care about the Gym categories, skip anything else
        // or you can keep them all
        if (!result[normalizedCategory]) {
          result[normalizedCategory] = [];
        }
  
        // Normalize the method
        const method = normalizePaymentMethod(pay.method);
        // Prepare a row object with all method columns = 0
        const row = {
          payerName: pay.payerName || pay.walkInName || "N/A",
          cash: 0,
          gcash: 0,
          bpi: 0,
          bdo: 0,
          total: 0,
        };
  
        // Put the amount in the right column
        switch (method) {
          case "Cash":
            row.cash = pay.amountPaid;
            break;
          case "GCash":
            row.gcash = pay.amountPaid;
            break;
          case "BPI":
            row.bpi = pay.amountPaid;
            break;
          case "BDO":
            row.bdo = pay.amountPaid;
            break;
          default:
            // If you want to track others
            break;
        }
        row.total = pay.amountPaid;
  
        result[normalizedCategory].push(row);
      });
    });
  
    return result;
  }
  

  // The main "handleFilterData" function
  const handleFilterData = () => {
    // 1) Filter payments by PaymentDate
    const dateFilteredPayments = filterPaymentsByDate(allPayments, dateFrom, dateTo);

    // 2) Filter invoices by InvoiceDate
    const dateFilteredInvoices = filterInvoicesByDate(allInvoices, dateFrom, dateTo);

    // 3) Then filter by branch
    const branchFilteredPayments =
      branch === "all"
        ? dateFilteredPayments
        : dateFilteredPayments.filter((p) => p.branchId === branch);

    const branchFilteredInvoices =
      branch === "all"
        ? dateFilteredInvoices
        : dateFilteredInvoices.filter((inv) => inv.branchId === branch);

    // 4) Then filter by searchTerm
    const searchStr = searchTerm.toLowerCase();
    const textFilteredPayments = branchFilteredPayments.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchStr)
    );
    const textFilteredInvoices = branchFilteredInvoices.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchStr)
    );

    // 5) Set final arrays
    setFilteredPayments(textFilteredPayments);
    setFilteredInvoices(textFilteredInvoices);
  };

  // 2) PaymentFor categories we want to count
  const PAYMENT_FOR_TYPES = [
    "New Membership",
    "Monthly Client Fee",
    "Walk-in Payment",
    "Membership Renewal",
    "Booking",
    "CoachingSessionBooking",
  ];

  // ==================== useEffect Fetch Calls ====================
  useEffect(() => {
    async function fetchData() {
      await Promise.all([
        fetchMembers(),
        fetchBranches(),
        fetchAllPayments(),
        fetchAllInvoices(),
        fetchUnpaidInvoices(),
        fetchGymCashFlow()
      ]);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    handleFilterData();
  }, [searchTerm, dateFrom, dateTo, branch]);
  
  useEffect(() => {
    if (activeTab === 2) {
      // pivot everything into a single row per date
      const aggregated = aggregateByDate(gymCashFlows, allPayments);
      // optionally filter by date range
      const dateFiltered = filterSalesByDateRange(aggregated, dateFrom, dateTo);
      setFilteredGymSales(dateFiltered);
    }
  }, [activeTab, gymCashFlows, allPayments, dateFrom, dateTo]);
  

  // 1) MEMBERS
  const fetchMembers = async () => {
    try {
      const res = await axios.get("/membership/members");
      const data = Array.isArray(res.data) ? res.data : res.data.members || [];
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 2) BRANCHES
  const fetchBranches = async () => {
    try {
      const res = await axios.get("/owner/branches");
      const data = res.data.branches.map((b) => ({
        value: b.BranchID.toString(),
        label: b.BranchName,
      }));
      setBranchOptions([{ value: "all", label: "All Branches" }, ...data]);
    } catch (err) {
      console.error(err);
      setBranchOptions([{ value: "all", label: "All Branches" }]);
    }
  };
  

  async function fetchAllPayments() {
    try {
      const res = await axios.get("/payments");
      const mapped = res.data.map((p) => ({
        paymentId: p.PaymentID,
        memberId: p.MemberID ? p.MemberID.toString() : "",
        monthlyClientId: p.MonthlyClientID ? p.MonthlyClientID.toString() : "",
        payerName:
          p.PayerName ??
          p.member?.FullName ??
          p.monthly_client?.FullName ??
          p.WalkInName ??
          "N/A",
        // Store the raw PaymentDate => "2025-03-14 03:12:26"
        paymentDate: p.PaymentDate,
        amountPaid: Number(p.Amount),
        method: p.PaymentMethod,
        status: p.Status,
        branchId: p.BranchID ? p.BranchID.toString() : "",
        paymentFor: Array.isArray(p.PaymentFor) ? p.PaymentFor : [],
      }));
      setAllPayments(mapped);
      setFilteredPayments(mapped);
    } catch (err) {
      console.error(err);
    }
  }

  

  const fetchAllInvoices = async () => {
    try {
      const res = await axios.get("/invoices");
      const mapped = res.data.map((inv) => ({
        invoiceId: inv.InvoiceID,
        memberId: inv.MemberID ? inv.MemberID.toString() : "",
        // Use member name if available, otherwise try monthly_client
        memberName: inv.member?.FullName ?? inv.monthly_client?.FullName ?? "N/A",
        invoiceDate: inv.InvoiceDate,
        dueDate: inv.DueDate,
        invoiceTotal: inv.InvoiceTotal,
        status: inv.PaymentStatus,
        branchId: inv.BranchID ? inv.BranchID.toString() : "",
      }));
      setAllInvoices(mapped);
      setFilteredInvoices(mapped);
    } catch (err) {
      console.error(err);
    }
  };
  
  

  // 5) UNPAID
  const fetchUnpaidInvoices = async () => {
    try {
      const res = await axios.get("/invoices?status=unpaid_or_partial");
      const mapped = (res.data || []).map((inv) => ({
        invoiceId: inv.InvoiceID,
        invoiceTotal: inv.InvoiceTotal,
        paymentStatus: inv.PaymentStatus,
        memberName: inv.member ? inv.member.FullName : "N/A",
      }));
      setUnpaidInvoices(mapped);
    } catch (err) {
      console.error(err);
    }
  };

    // Example fetch for daily cash flows (Gym) - or you can fetch *all* flows and filter
    const fetchGymCashFlow = async () => {
      try {
        const res = await axios.get("/finance/cashflow");
        let flows = res.data.flows || [];
        // Filter to only Gym
        flows = flows.filter((f) => f.BusinessType === "Gym");
        setGymCashFlows(flows);
      } catch (err) {
        console.error(err);
      }
    };

  // ==================== Delete Logic ====================
  function handleOpenDeleteDialog(type, id) {
    setDeleteType(type);
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  }

  function openPettyDialog(row) {
    // Save the entire row so we know which date/Flow to update
    setSelectedFlowRow(row);
  
    // Pre-fill pettyForm with existing values
    setPettyForm({
      pettyCash: row.pettyCash?.toString() || '',
      pettyTomorrow: row.pettyTomorrow?.toString() || '',
    });
  
    setPettyDialogOpen(true);
  }

  async function handleSubmitPetty() {
    if (!selectedFlowRow) return;
  
    // Debug: see what we have
    console.log("selectedFlowRow:", selectedFlowRow);
  
    try {
      // Provide fallback or real values for the missing fields:
      const payload = {
        // If selectedFlowRow has no BranchID, you could fallback to staff’s branch or 1
        BranchID: selectedFlowRow.BranchID ?? 1,
        
        // The backend expects 'Date', but your row has 'date' (lowercase):
        Date: selectedFlowRow.date ?? dayjs().format("YYYY-MM-DD"),
  
        // If your DB column is BusinessType, you can default it or store it somewhere:
        BusinessType: selectedFlowRow.BusinessType ?? "Gym",
  
        // The actual petty-cash fields you’re updating:
        PettyCash: Number(pettyForm.pettyCash) || 0,
        PettyCashTomorrow: Number(pettyForm.pettyTomorrow) || 0,
      };
  
      console.log("Payload =>", payload);
  
      await axios.put(`/finance/cashflow/${selectedFlowRow.CashFlowID}`, payload);
  
      alert("Petty cash updated successfully!");
      await fetchGymCashFlow(); // Refresh
      setPettyDialogOpen(false);
      setSelectedFlowRow(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update petty cash");
    }
  }
  
  async function handleConfirmDelete() {
    try {
      if (deleteType === "payment") {
        await axios.delete(`/payments/${deleteItemId}`);
        setAllPayments((prev) => prev.filter((p) => p.paymentId !== deleteItemId));
        setFilteredPayments((prev) => prev.filter((p) => p.paymentId !== deleteItemId));
      } else if (deleteType === "invoice") {
        await axios.delete(`/invoices/${deleteItemId}/delete`);
        setAllInvoices((prev) => prev.filter((i) => i.invoiceId !== deleteItemId));
        setFilteredInvoices((prev) => prev.filter((i) => i.invoiceId !== deleteItemId));
      }
      alert(`${deleteType} #${deleteItemId} deleted successfully!`);
    } catch (error) {
      console.error(`Failed to delete ${deleteType}:`, error);
      alert("Error deleting record. Check console.");
    } finally {
      handleCloseDeleteDialog();
    }
  }

  function handleCloseDeleteDialog() {
    setDeleteDialogOpen(false);
    setDeleteType("");
    setDeleteItemId(null);
  }

  function getDeleteMessage() {
    if (deleteType === "payment") {
      return "Are you sure you want to delete this Payment? This action cannot be undone. If this payment is the only one linked to its invoice, the invoice will also be deleted.";
    }
    if (deleteType === "invoice") {
      return "Are you sure you want to delete this Invoice? This action cannot be undone.";
    }
    return "Are you sure you want to delete this record? This action cannot be undone.";
  }

  function normalizePaymentMethod(method) {
    if (!method) return "";
    const lower = method.toLowerCase();
  
    // Check "gcash" first; it contains "cash" at the end, so we handle it first
    if (lower.includes("gcash")) return "GCash";
    if (lower.includes("bpi")) return "BPI";
    if (lower.includes("bdo")) return "BDO";
  
    // Lastly, if it has "cash" (including "W-In Cash"), treat as Cash
    if (lower.includes("cash")) return "Cash";
  
    return method;
  }
  
  
  // ==================== Aggregation for Gym Cash Flows + Payments ====================
  function aggregateByDate(gymFlows, allPayments) {
    const resultsMap = {};
  
    // 1) Process daily flows
    gymFlows.forEach((flow) => {
      const dateStr = flow.Date; // e.g. "2025-03-14"
      if (!resultsMap[dateStr]) {
        resultsMap[dateStr] = {
          // basic skeleton
          CashFlowID: flow.CashFlowID,
          date: dateStr,
          totalCash: 0,
          totalGCash: 0,
          totalBPI: 0,
          totalBDO: 0,
          pettyCash: 0,
          pettyTomorrow: 0,
          cashPlusPetty: 0,
          countNewMembership: 0,
          countMonthlyClientFee: 0,
          countWalkinPayment: 0,
          countMembershipRenewal: 0,
          countBooking: 0,
          countCoachingSessionBooking: 0,
          totalSales: 0,
          takeHome: 0,
        };
      }
  
      // Summation logic from each flow
      const sumCash = parseFloat(flow.CashSales || 0) + parseFloat(flow.WalkInCashSales || 0);
      const sumGCash = parseFloat(flow.GCashSales || 0) + parseFloat(flow.WalkInGCashSales || 0);
      const sumBPI = parseFloat(flow.BPISales || 0) + parseFloat(flow.WalkInBPISales || 0);
      const sumBDO = parseFloat(flow.BDOSales || 0) + parseFloat(flow.WalkInBDOSales || 0);
  
      const pettyVal = parseFloat(flow.PettyCash || 0);
      const pettyTmr = parseFloat(flow.PettyCashTomorrow || 0);
  
      resultsMap[dateStr].totalCash       += sumCash;
      resultsMap[dateStr].totalGCash      += sumGCash;
      resultsMap[dateStr].totalBPI        += sumBPI;
      resultsMap[dateStr].totalBDO        += sumBDO;
      resultsMap[dateStr].pettyCash       += pettyVal;
      resultsMap[dateStr].pettyTomorrow   += pettyTmr;
      resultsMap[dateStr].cashPlusPetty   += (sumCash + pettyVal);
    });
  
    // 2) Process payments, but SKIP if that date is already in daily flows:
    allPayments.forEach((pay) => {
      if (!pay.paymentDate) return;
      const payDateStr = pay.paymentDate.split(" ")[0]; // e.g., "2025-03-14"
      if (!payDateStr) return;
  
      // If daily flow for payDateStr exists, skip to prevent double-count
      if (resultsMap[payDateStr]) {
        return;
      }
  
      // Otherwise, create or update aggregator row for that date
      if (!resultsMap[payDateStr]) {
        resultsMap[payDateStr] = {
          date: payDateStr,
          totalCash: 0,
          totalGCash: 0,
          totalBPI: 0,
          totalBDO: 0,
          pettyCash: 0,
          pettyTomorrow: 0,
          cashPlusPetty: 0,
          countNewMembership: 0,
          countMonthlyClientFee: 0,
          countWalkinPayment: 0,
          countMembershipRenewal: 0,
          countBooking: 0,
          countCoachingSessionBooking: 0,
          totalSales: 0,
          takeHome: 0,
        };
      }
  
      const payAmount = pay.amountPaid || 0;
      const method = normalizePaymentMethod(pay.method);
  
      switch (method) {
        case "Cash":
          resultsMap[payDateStr].totalCash     += payAmount;
          resultsMap[payDateStr].cashPlusPetty += payAmount;
          break;
        case "GCash":
          resultsMap[payDateStr].totalGCash += payAmount;
          break;
        case "BPI":
          resultsMap[payDateStr].totalBPI   += payAmount;
          break;
        case "BDO":
          resultsMap[payDateStr].totalBDO   += payAmount;
          break;
        default:
          break;
      }
  
      // If you track PaymentFor categories here
      if (Array.isArray(pay.paymentFor)) {
        pay.paymentFor.forEach((cat) => {
          const c = cat.trim();
          if (c === "New Membership") {
            resultsMap[payDateStr].countNewMembership++;
          } else if (c === "Monthly Client Fee") {
            resultsMap[payDateStr].countMonthlyClientFee++;
          } else if (c === "Walk-In Payment") {
            resultsMap[payDateStr].countWalkinPayment++;
          } else if (c === "Membership Renewal") {
            resultsMap[payDateStr].countMembershipRenewal++;
          } else if (c === "Booking") {
            resultsMap[payDateStr].countBooking++;
          } else if (c === "CoachingSessionBooking") {
            resultsMap[payDateStr].countCoachingSessionBooking++;
          }
        });
      }
    });
  
    // 3) Compute final totals
    Object.values(resultsMap).forEach((row) => {
      row.totalSales =
        row.cashPlusPetty + row.totalGCash + row.totalBPI + row.totalBDO;
      row.takeHome = row.totalSales - row.pettyTomorrow;
    });
  
    // 4) Sort + return
    return Object.values(resultsMap).sort((a, b) => a.date.localeCompare(b.date));
  }
  
  
  

  // ==================== Tab Logic ====================
  const handleTabChange = (event, newValue) => {
    setActiveTab(2);
    setSearchTerm("");
  };

  // ==================== Table Columns ====================
  // Payment columns
  const paymentColumns = [
    {
      field: "paymentDate",
      headerName: "Payment Date",
      width: 250,
      renderCell: (params) =>
        params.value ? formatDate(params.value) : "—", // show PaymentDate in "YYYY-MM-DD" (or local date)
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
      renderCell: (params) =>
        Array.isArray(params.value) && params.value.length > 0 ? params.value.join(", ") : "—",
    },
    {
      field: "amountPaid",
      headerName: "Amount Paid",
      width: 120,
      renderCell: (params) => (params.value ? formatCurrency(params.value) : "—"),
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
        let color = "#ff9800"; // Default orange
        if (status.toLowerCase() === "completed") color = "#4caf50"; // Green
        if (status.toLowerCase() === "failed" || status.toLowerCase() === "refunded") {
          color = "#f44336"; // Red
        }
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
          <Tooltip title="Refund Payment">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleOpenDeleteDialog("payment", params.row.paymentId)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Invoice columns
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
      renderCell: (params) =>
        params.value ? formatDateTime(params.value) : "—", // show InvoiceDate in date-time
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 200,
      renderCell: (params) => (params.value ? formatDate(params.value) : "—"),
    },
    {
      field: "invoiceTotal",
      headerName: "Total",
      width: 120,
      renderCell: (params) => (params.value ? formatCurrency(params.value) : "—"),
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
              onClick={() => handleOpenDeleteDialog("invoice", params.row.invoiceId)}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Show the filtered arrays
  const displayedRows = activeTab === 0 ? filteredPayments : filteredInvoices;
  const displayedColumns = activeTab === 0 ? paymentColumns : invoiceColumns;
  const getPaymentRowId = (row) => row.paymentId;
  const getInvoiceRowId = (row) => row.invoiceId;
  const rowIdGetter = activeTab === 0 ? getPaymentRowId : getInvoiceRowId;

  // ==================== Payment Buttons & Dialogs ====================
  const openPaymentDialog = (mode) => {
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
      openPaymentDialog(mode);
    }
  };

  // Partial Payment
  const closePartialDialog = () => {
    setPartialDialogOpen(false);
  };

  const handleSubmitPartialPayment = () => {
    const payload = {
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
        fetchAllPayments();
        setPartialDialogOpen(false);
      })
      .catch((err) => console.error(err));
  };

  const handleAddInvoiceAlloc = (inv) => {
    const existing = partialPayment.allocatedInvoices.find((x) => x.invoiceId === inv.invoiceId);
    if (!existing) {
      setPartialPayment((prev) => ({
        ...prev,
        allocatedInvoices: [
          ...prev.allocatedInvoices,
          { invoiceId: inv.invoiceId, amountAllocated: inv.invoiceTotal },
        ],
      }));
    }
  };

  // Payment creation
  const handleAddPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPaymentSubmit = () => {
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
      WalkInName: paymentMode === "walkIn" ? newPayment.walkInName : null,
      BookingRef: paymentMode === "booking" ? newPayment.bookingRef : null,
      SessionRef: paymentMode === "session" ? newPayment.sessionRef : null,
    };

    axios
      .post("/payments", payload)
      .then(() => {
        fetchAllPayments();
        setAddPaymentOpen(false);
      })
      .catch((err) => console.error(err));
  };

  // Payment edit / view
  const handleEditPaymentOpen = (row) => {
    setEditPayment(row);
    setEditPaymentOpen(true);
  };

  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPaymentSubmit = () => {
    const existingFor =
      Array.isArray(editPayment.paymentFor) && editPayment.paymentFor.length > 0
        ? editPayment.paymentFor
        : ["Membership"];

    const payload = {
      MemberID: editPayment.memberId || null,
      PaymentFor: existingFor,
      PaymentMethod: editPayment.method,
      Amount: Number(editPayment.amountPaid),
      PaymentDate: editPayment.paymentDate,
      Status: editPayment.status,
    };

    axios
      .put(`/payments/${editPayment.paymentId}`, payload)
      .then(() => {
        fetchAllPayments();
        setEditPaymentOpen(false);
      })
      .catch((err) => console.error(err));
  };

  const handleViewPaymentOpen = (row) => {
    setViewPayment(row);
    setViewPaymentOpen(true);
  };

  // ==================== Invoice: Add, Edit, View ====================
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
      .then(() => fetchAllInvoices())
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
      .then(() => fetchAllInvoices())
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

  // ==================== Export Menu ====================
  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const csvHeadersPayments = [
    { label: "Payment ID", key: "paymentId" },
    { label: "Payer Name", key: "payerName" },
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
    // CSV is handled by <CSVLink>
  };
  const handleExportPDF = () => {
    handleExportMenuClose();
    const itemsToExport = activeTab === 0 ? filteredPayments : filteredInvoices;
    if (itemsToExport.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    // Background images for cover and (optionally) subsequent pages
    const coverPage = "/imgs/coverpage2.png";
    // const addPage = "/imgs/addpage2.png"; // Not used now
  
    let tableHeaders = [];
    let tableBody = [];
    let title = "";
  
    if (activeTab === 0) {
      title = "Payments Report";
      tableHeaders = ["ID", "Payer", "Date", "Amount", "Method", "Status"];
      tableBody = itemsToExport.map((p) => [
        p.paymentId || "N/A",
        p.payerName || "N/A",
        formatDate(p.paymentDate),
        parseFloat(p.amountPaid || 0).toFixed(2),
        p.method || "N/A",
        p.status || "N/A",
      ]);
    } else {
      title = "Invoices Report";
      tableHeaders = ["ID", "Member", "Invoice Date", "Due Date", "Amount"];
      tableBody = itemsToExport.map((i) => [
        i.invoiceId || "N/A",
        i.memberName || "N/A",
        formatDate(i.invoiceDate),
        formatDate(i.dueDate),
        parseFloat(i.invoiceTotal || 0).toFixed(2),
      ]);
    }
  
    if (tableBody.length === 0) {
      alert("No records to export.");
      return;
    }
  
    // Draw the cover background and header text on the first page
    doc.addImage(coverPage, "PNG", 0, 0, pageWidth, pageHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text(title, pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(14);
    doc.text("Generated on: " + new Date().toLocaleDateString(), pageWidth / 2, 130, {
      align: "center",
    });
  
    // Define a starting Y position that leaves room for header content
    const startY = 100;
  
    const getStatusColor = (status) => {
      if (status?.toLowerCase() === "completed" || status?.toLowerCase() === "paid") {
        return "#4CAF50";
      }
      return "#333333";
    };
  
    // Generate the table. AutoTable will handle page breaks automatically.
    doc.autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: startY,
      theme: "striped",
      headStyles: {
        fillColor: "#050505",
        textColor: "#ffffff",
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        textColor: "#333333",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: "#f5f5f5",
      },
      styles: {
        overflow: "linebreak",
        cellPadding: 5,
        halign: "center",
        valign: "middle",
      },
      margin: { top: 50, left: 20, right: 20, bottom: 20 },
      didParseCell: (data) => {
        if (activeTab === 0 && data.column.index === 5) {
          const statusText = data.cell.raw;
          data.cell.styles.textColor = getStatusColor(statusText);
        }
      },
      // Removed didDrawPage callback to prevent re‑adding backgrounds on subsequent pages.
    });
  
    const pdfFilename = activeTab === 0 ? "PaymentsReport.pdf" : "InvoicesReport.pdf";
    doc.save(pdfFilename);
  };


    // ==================== Loading Front-end ====================
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh"
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
  
  
  // ==================== JSX Return ====================
  return (
    <Box sx={{ p: 3 }}>
      {/* Date and Branch Filter Section */}
     
      {/* <Paper sx={{ p: 3, mb: 2, boxShadow: 3, borderRadius: 2 }}>
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
        
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Branch</InputLabel>
              <Select
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branchOptions.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    {b.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>  */}
      {/* Tabs */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>
          Sales Reports
        </Typography>
      </Box>

      {/* Search + Export + Add Buttons */}
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          {/* Search Field */}
          <Grid item xs sx={{ mr: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value); // or e.target.value.toLowerCase()
              }}
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleAddPaymentOpen("partial")}
              >
                Make Partial Payment
              </Button>
            )}
            {activeTab === 1 && (
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
        {activeTab === 2 && (
  <>
    {/* 1) The existing "Sales Report (Gym)" pivot table */}
    <Box sx={{ mt: 2 }}>
      <div style={{ height: 420, width: "100%" }}>
        <DataGrid
          rows={filteredGymSales}
          columns={[
            { 
              field: 'date',
              headerName: 'Date',
              width: 130,
            },
            {
              field: 'totalCash',  // aggregator’s “totalCash”
              headerName: 'Cash',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'totalGCash', // aggregator’s “totalGCash”
              headerName: 'GCash',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'totalBPI',   // aggregator’s “totalBPI”
              headerName: 'BPI',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'totalBDO',   // aggregator’s “totalBDO”
              headerName: 'BDO',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
          
            //* --- PaymentFor counters --- 
            //{ field: 'countNewMembership', headerName: 'New Memb.', width: 120 },
            //{ field: 'countMonthlyClientFee', headerName: 'Monthly Fee', width: 120 },
            //{ field: 'countWalkinPayment', headerName: 'Walk-Ins', width: 120 },
            //{ field: 'countMembershipRenewal', headerName: 'Renewals', width: 120 },
            //{ field: 'countBooking', headerName: 'Booking', width: 110 },
            //{ field: 'countCoachingSessionBooking', headerName: 'Coaching', width: 120 },
          
            // --- Petty fields if you want to see them individually ---
            {
              field: 'pettyCash',
              headerName: 'Petty (Today)',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'pettyTomorrow',
              headerName: 'Petty (Tomorrow)',
              width: 140,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'cashPlusPetty',   // aggregator’s “cashPlusPetty”
              headerName: 'Cash + Petty',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
          
            // --- Totals & net ---
            {
              field: 'totalSales',      // aggregator’s “totalSales”
              headerName: 'Total Sales',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            },
            {
              field: 'takeHome',        // aggregator’s “takeHome”
              headerName: 'Take Home',
              width: 130,
              renderCell: (params) =>
                params.value ? `₱${Number(params.value).toLocaleString()}` : '—',
            }, 
            {
              field: 'Actions',
              headerName: 'Actions',
              width: 150,
              sortable: false,
              renderCell: (params) => {
                const row = params.row;
                return (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openPettyDialog(row)}
                  >
                    Set Petty
                  </Button>
                );
              },
            },
                     
          ]}
          getRowId={(row) => row.date}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
        />
      </div>
    </Box>

    {/* 2) The Detailed Breakdown: One table per PaymentFor for the selected day */}
    <Box sx={{ mt: 4 }}>
  <Typography variant="h5" gutterBottom>
    Detailed Breakdown
  </Typography>
  {/* Date picker to choose the day for which you want detailed breakdown */}
  <TextField
    type="date"
    value={selectedDetailDate}
    onChange={(e) => setSelectedDetailDate(e.target.value)}
    InputLabelProps={{ shrink: true }}
    sx={{ mb: 2 }}
  />
  <Typography variant="subtitle1" sx={{ mb: 2 }}>
    Detailed records for: {selectedDetailDate}
  </Typography>

  {/* Filter payments for the selected date */}
  {Object.entries(
    groupPaymentsByPaymentFor(
      allPayments.filter((p) => p.paymentDate.split(" ")[0] === selectedDetailDate)
    )
  ).map(([categoryName, paymentRows]) => {
    // Compute sums for columns in this category
    let sumCash = 0,
      sumGCash = 0,
      sumBPI = 0,
      sumBDO = 0,
      grandTotal = 0;

    paymentRows.forEach((r) => {
      sumCash += r.cash;
      sumGCash += r.gcash;
      sumBPI += r.bpi;
      sumBDO += r.bdo;
      grandTotal += r.total;
    });

    return (
      <Paper
        key={categoryName}
        sx={{
          mt: 2,
          p: 2,
          border: 1,
          borderColor: theme.palette.divider,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          {categoryName}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor:
                    theme.palette.mode === "light" ? "#f7f7f7" : theme.palette.grey[800],
                }}
              >
                <TableCell>Name</TableCell>
                <TableCell align="right">Cash</TableCell>
                <TableCell align="right">GCash</TableCell>
                <TableCell align="right">BPI</TableCell>
                <TableCell align="right">BDO</TableCell>
                <TableCell align="right">Row Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentRows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.payerName}</TableCell>
                  <TableCell align="right">
                    {r.cash > 0 ? r.cash.toLocaleString() : ""}
                  </TableCell>
                  <TableCell align="right">
                    {r.gcash > 0 ? r.gcash.toLocaleString() : ""}
                  </TableCell>
                  <TableCell align="right">
                    {r.bpi > 0 ? r.bpi.toLocaleString() : ""}
                  </TableCell>
                  <TableCell align="right">
                    {r.bdo > 0 ? r.bdo.toLocaleString() : ""}
                  </TableCell>
                  <TableCell align="right">
                    {r.total > 0 ? r.total.toLocaleString() : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ fontWeight: "bold" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Totals</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {sumCash.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {sumGCash.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {sumBPI.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {sumBDO.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {grandTotal.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    );
  })}
</Box>
  </>
        )}     
      </Paper>
      

      {/* ==================== Payment / Invoice Dialogs below ==================== */}

      {/* ADD Payment Dialog (non-partial) */}
      <Dialog open={isAddPaymentOpen} onClose={closePaymentDialog}>
        <DialogTitle>
          {paymentMode === "member" && "Add Member Payment"}
          {paymentMode === "walkIn" && "Add Walk-In Payment"}
          {paymentMode === "booking" && "Add Booking Payment"}
          {paymentMode === "session" && "Add Session Payment"}
        </DialogTitle>
        <DialogContent dividers>
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

      {/* PARTIAL Payment Dialog */}
      <Dialog open={partialDialogOpen} onClose={closePartialDialog} fullWidth maxWidth="lg">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              <AttachMoney sx={{ verticalAlign: "middle", mr: 1 }} />
              Create Partial Payment
            </Typography>
            <IconButton
              onClick={closePartialDialog}
              sx={{
                color: "inherit",
                "&:hover": { color: "red" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={(e) => e.preventDefault()}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Member</InputLabel>
                    <Select
                      name="memberId"
                      value={partialPayment.memberId}
                      onChange={(e) =>
                        setPartialPayment((prev) => ({
                          ...prev,
                          memberId: e.target.value,
                        }))
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
                    helperText="Sum allocated to each invoice doesn't have to match exactly, depending on your logic."
                  />
                </Grid>
              </Grid>

              {/* Invoice Allocation */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Allocate to these Invoices</Typography>
                <Grid container spacing={2}>
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
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                          onClick={() =>
                            handleAddInvoiceAlloc({
                              invoiceId: inv.invoiceId,
                              invoiceTotal: inv.invoiceTotal,
                            })
                          }
                        >
                          Invoice #{inv.invoiceId} for {inv.memberName} — ₱{inv.invoiceTotal} —{" "}
                          {inv.paymentStatus}
                        </Box>
                      ))}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Allocated Invoices:
                    </Typography>
                    <Paper sx={{ maxHeight: 250, overflowY: "auto", p: 1 }}>
                      {partialPayment.allocatedInvoices.map((alloc, idx) => (
                        <Box
                          key={`${alloc.invoiceId}-${idx}`}
                          sx={{ mb: 1, p: 1, border: "1px solid #ccc", borderRadius: 1 }}
                        >
                          Invoice #{alloc.invoiceId}
                          <TextField
                            label="Amount Allocated"
                            type="number"
                            size="small"
                            value={alloc.amountAllocated}
                            onChange={(e) => {
                              const newAlloc = [...partialPayment.allocatedInvoices];
                              newAlloc[idx].amountAllocated = e.target.value;
                              setPartialPayment((prev) => ({
                                ...prev,
                                allocatedInvoices: newAlloc,
                              }));
                            }}
                            sx={{ ml: 2, width: 100 }}
                          />
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Submit */}
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 3 }}>
                <Button variant="contained" color="primary" onClick={() => setOpenConfirmation(true)}>
                  <SaveIcon /> Submit Partial Payment
                </Button>
              </Box>
            </form>
          </Box>
        </DialogContent>
      </Dialog>

      {/* EDIT Payment Dialog */}
      <Dialog
        open={isEditPaymentOpen}
        onClose={() => setEditPaymentOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3, overflow: "hidden" } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MonetizationOnIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Edit Payment
              </Typography>
            </Box>
            <IconButton onClick={() => setEditPaymentOpen(false)}>
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
            variant="filled"
            InputProps={{ readOnly: true }}
            value={editPayment.paymentId || ""}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Member Name</InputLabel>
            <Select
              name="memberId"
              value={editPayment.memberId || ""}
              onChange={handleEditPaymentChange}
              label="Member Name"
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

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Payment Date"
            name="paymentDate"
            InputLabelProps={{ shrink: true }}
            value={editPayment.paymentDate ? editPayment.paymentDate.split("T")[0] : ""}
            onChange={handleEditPaymentChange}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Amount Paid"
            name="amountPaid"
            type="number"
            value={editPayment.amountPaid || ""}
            onChange={handleEditPaymentChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="method"
              value={editPayment.method || ""}
              onChange={handleEditPaymentChange}
              label="Payment Method"
            >
              <MenuItem value="">-- Select Method --</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="BDO">BDO</MenuItem>
              <MenuItem value="BPI">BPI</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Status</InputLabel>
            <Select
              name="status"
              value={editPayment.status || ""}
              onChange={handleEditPaymentChange}
              label="Payment Status"
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Refunded">Refunded</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
          <Button variant="contained" color="primary" onClick={handleEditPaymentSubmit}>
            <SaveIcon sx={{ mr: 1 }} />
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW Payment Dialog */}
      <Dialog
        open={isViewPaymentOpen}
        onClose={() => setViewPaymentOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, boxShadow: 6, p: 3, overflow: "hidden" } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MonetizationOnIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Payment Details
              </Typography>
            </Box>
            <IconButton onClick={() => setViewPaymentOpen(false)}>
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
                  label="Payer Name"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={viewPayment.payerName || "—"}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  variant="filled"
                  InputProps={{ readOnly: true }}
                  value={
                    viewPayment.paymentDate
                      ? dayjs(viewPayment.paymentDate).format("YYYY-MM-DD")
                      : "—"
                  }
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
              {viewPayment.paymentFor && viewPayment.paymentFor.length > 0 && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment For"
                    variant="filled"
                    InputProps={{ readOnly: true }}
                    value={viewPayment.paymentFor.join(", ") || "—"}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD Invoice Dialog */}
      <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              <ReceiptIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Add Invoice
            </Typography>
            <IconButton
              onClick={() => setAddInvoiceOpen(false)}
              sx={{
                color: "inherit",
                "&:hover": { color: "red" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={(e) => e.preventDefault()}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenConfirmation(true)}
                disabled={
                  !newInvoice.memberId ||
                  !newInvoice.invoiceDate ||
                  !newInvoice.dueDate ||
                  !newInvoice.invoiceTotal ||
                  Number(newInvoice.invoiceTotal) <= 0
                }
                sx={{
                  textTransform: "none",
            
                  px: 4,
                  py: 1,
              
                }}
              >
                <SaveIcon sx={{ mr: 1 }} /> SAVE INVOICE
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

      {/* EDIT Invoice Dialog */}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptLongIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Edit Invoice
              </Typography>
            </Box>
            <IconButton onClick={() => setEditInvoiceOpen(false)}>
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
        <DialogActions sx={{ justifyContent: "flex-end", py: 2 }}>
          <Button variant="contained" color="primary" onClick={handleEditInvoiceSubmit}>
            <SaveIcon sx={{ mr: 1 }} /> Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW Invoice Dialog */}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptLongIcon sx={{ fontSize: 32, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Invoice Details
              </Typography>
            </Box>
            <IconButton onClick={() => setViewInvoiceOpen(false)}>
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

          {/* Line Items */}
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
                        <TableCell>
                          {li.UnitPrice ? `₱${li.UnitPrice}` : "—"}
                        </TableCell>
                        <TableCell>
                          {li.Subtotal ? `₱${li.Subtotal}` : "—"}
                        </TableCell>
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

      {/* DELETE Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
          <DeleteForeverIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography>{getDeleteMessage()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: "gray" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>



              {/* Petty Cash Dialog */}
        <Dialog
          open={pettyDialogOpen}
          onClose={() => setPettyDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Set Petty Cash</DialogTitle>
          <DialogContent dividers>
            {selectedFlowRow && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Date: <strong>{selectedFlowRow.date}</strong>
                </Typography>

                <TextField
                  label="Today's Petty Cash"
                  name="pettyCash"
                  type="number"
                  fullWidth
                  value={pettyForm.pettyCash}
                  onChange={(e) =>
                    setPettyForm((prev) => ({ ...prev, pettyCash: e.target.value }))
                  }
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Petty Cash Tomorrow"
                  name="pettyTomorrow"
                  type="number"
                  fullWidth
                  value={pettyForm.pettyTomorrow}
                  onChange={(e) =>
                    setPettyForm((prev) => ({ ...prev, pettyTomorrow: e.target.value }))
                  }
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPettyDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitPetty}>
              Save Petty
            </Button>
          </DialogActions>
        </Dialog>

    </Box>
  );
}
