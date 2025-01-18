import React, { useState } from "react";
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
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid } from "@mui/x-data-grid";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayCircleFilledIcon from "@mui/icons-material/ReplayCircleFilled";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// ---------------------- SAMPLE DATA ----------------------
const samplePayments = [
  {
    paymentId: "PAY-2001",
    memberName: "John Doe",
    paymentDate: "2025-01-05",
    amountPaid: 50,
    method: "Cash",
    status: "Completed",
    linkedInvoiceId: "INV-1001",
  },
  {
    paymentId: "PAY-2002",
    memberName: "Jane Smith",
    paymentDate: "2025-01-06",
    amountPaid: 75,
    method: "GCash",
    status: "Completed",
    linkedInvoiceId: "INV-1002",
  },
  {
    paymentId: "PAY-2003",
    memberName: "Mark Johnson",
    paymentDate: "2025-01-07",
    amountPaid: 100,
    method: "BPI",
    status: "Pending",
    linkedInvoiceId: "INV-1003",
  },
];

const sampleInvoices = [
  {
    invoiceId: "INV-1001",
    memberName: "John Doe",
    invoiceDate: "2025-01-01",
    dueDate: "2025-01-10",
    totalAmount: 150,
    status: "Unpaid",
    linkedPaymentId: "",
  },
  {
    invoiceId: "INV-1002",
    memberName: "Jane Smith",
    invoiceDate: "2025-01-02",
    dueDate: "2025-01-12",
    totalAmount: 75,
    status: "Paid",
    linkedPaymentId: "PAY-2002",
  },
  {
    invoiceId: "INV-1003",
    memberName: "Mark Johnson",
    invoiceDate: "2025-01-05",
    dueDate: "2025-01-15",
    totalAmount: 200,
    status: "Partially Paid",
    linkedPaymentId: "",
  },
];

// ---------- CSV & PDF Headers -------------
const csvHeadersPayments = [
  { label: "Payment ID", key: "paymentId" },
  { label: "Member Name", key: "memberName" },
  { label: "Payment Date", key: "paymentDate" },
  { label: "Amount Paid", key: "amountPaid" },
  { label: "Method", key: "method" },
  { label: "Status", key: "status" },
  { label: "Linked Invoice", key: "linkedInvoiceId" },
];

const csvHeadersInvoices = [
  { label: "Invoice ID", key: "invoiceId" },
  { label: "Member Name", key: "memberName" },
  { label: "Invoice Date", key: "invoiceDate" },
  { label: "Due Date", key: "dueDate" },
  { label: "Total Amount", key: "totalAmount" },
  { label: "Status", key: "status" },
  { label: "Linked Payment", key: "linkedPaymentId" },
];

// For PDF
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";

export default function PaymentsAndInvoices() {
  // ------------------ Tab / Search States ------------------
  const [activeTab, setActiveTab] = useState(0); // 0 = Payments, 1 = Invoices
  const [searchTerm, setSearchTerm] = useState("");

  // ------------------ Payment States & Dialogs ------------------
  const [payments, setPayments] = useState(samplePayments);
  const [isAddPaymentOpen, setAddPaymentOpen] = useState(false);
  const [isEditPaymentOpen, setEditPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // For the "Add Payment" form
  const [newPayment, setNewPayment] = useState({
    paymentId: "",
    memberName: "",
    paymentDate: "",
    amountPaid: 0,
    method: "",
    status: "",
    linkedInvoiceId: "",
  });

  // For the "Edit Payment" form
  const [editPayment, setEditPayment] = useState({
    paymentId: "",
    memberName: "",
    paymentDate: "",
    amountPaid: 0,
    method: "",
    status: "",
    linkedInvoiceId: "",
  });

  // ------------------ Invoice States & Dialogs ------------------
  const [invoices, setInvoices] = useState(sampleInvoices);
  const [isAddInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // For the "Add Invoice" form
  const [newInvoice, setNewInvoice] = useState({
    invoiceId: "",
    memberName: "",
    invoiceDate: "",
    dueDate: "",
    totalAmount: 0,
    status: "",
    linkedPaymentId: "",
  });

  // For the "Edit Invoice" form
  const [editInvoice, setEditInvoice] = useState({
    invoiceId: "",
    memberName: "",
    invoiceDate: "",
    dueDate: "",
    totalAmount: 0,
    status: "",
    linkedPaymentId: "",
  });

  // ------------------ Search & Filtering ------------------
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredPayments = payments.filter((p) =>
    Object.values(p).some((val) => String(val).toLowerCase().includes(searchTerm))
  );
  const filteredInvoices = invoices.filter((i) =>
    Object.values(i).some((val) => String(val).toLowerCase().includes(searchTerm))
  );

  // ------------------ Tab Change ------------------
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(""); // reset search when switching tabs
  };

  // ------------------ Payment Handlers ------------------
  const handleAddPaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPaymentSubmit = () => {
    const updated = [...payments, { ...newPayment }];
    setPayments(updated);
    setAddPaymentOpen(false);
    // Reset form
    setNewPayment({
      paymentId: "",
      memberName: "",
      paymentDate: "",
      amountPaid: 0,
      method: "",
      status: "",
      linkedInvoiceId: "",
    });
  };

  const handleEditPaymentOpen = (row) => {
    setSelectedPayment(row);
    setEditPayment({ ...row }); // copy row data into editPayment form
    setEditPaymentOpen(true);
  };

  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPaymentSubmit = () => {
    const updated = payments.map((p) =>
      p.paymentId === editPayment.paymentId ? editPayment : p
    );
    setPayments(updated);
    setEditPaymentOpen(false);
  };

  // ------------------ Invoice Handlers ------------------
  const handleAddInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvoiceSubmit = () => {
    const updated = [...invoices, { ...newInvoice }];
    setInvoices(updated);
    setAddInvoiceOpen(false);
    // Reset form
    setNewInvoice({
      invoiceId: "",
      memberName: "",
      invoiceDate: "",
      dueDate: "",
      totalAmount: 0,
      status: "",
      linkedPaymentId: "",
    });
  };

  const handleEditInvoiceOpen = (row) => {
    setSelectedInvoice(row);
    setEditInvoice({ ...row }); // copy row data into editInvoice form
    setEditInvoiceOpen(true);
  };

  const handleEditInvoiceChange = (e) => {
    const { name, value } = e.target;
    setEditInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInvoiceSubmit = () => {
    const updated = invoices.map((inv) =>
      inv.invoiceId === editInvoice.invoiceId ? editInvoice : inv
    );
    setInvoices(updated);
    setEditInvoiceOpen(false);
  };

  // -------------- Compute Overview Panel Stats --------------
  const totalRevenue = payments
    .filter((p) => p.status === "Completed")
    .reduce((acc, cur) => acc + cur.amountPaid, 0);

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "Unpaid" || inv.status === "Partially Paid"
  ).length;

  const completedInvoices = invoices.filter((inv) => inv.status === "Paid").length;

  // -------------- DATE FILTERS for Summary Cards --------------
  // (Reusing the same state names for time period, dateFrom, dateTo)
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleTimePeriodChange = (e) => {
    setTimePeriod(e.target.value);
    // Insert your actual filtering logic if desired
  };
  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
    // Insert your actual filtering logic if desired
  };
  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
    // Insert your actual filtering logic if desired
  };

  // -------------- NEW: BRANCH FILTER --------------
  const [branch, setBranch] = useState("all");
  const branchOptions = [
    { value: "all", label: "All Branches" },
    { value: "1", label: "Branch 1" },
    { value: "2", label: "Branch 2" },
    { value: "3", label: "Branch 3" },
  ];
  const handleBranchChange = (e) => {
    setBranch(e.target.value);
    // Insert branch filtering logic if desired
  };

  // -------------- COLUMNS: PAYMENTS --------------
  const paymentColumns = [
    { field: "paymentId", headerName: "Payment ID", width: 120 },
    { field: "memberName", headerName: "Member Name", width: 150 },
    { field: "paymentDate", headerName: "Payment Date", width: 140 },
    { field: "amountPaid", headerName: "Amount Paid", width: 120 },
    { field: "method", headerName: "Method", width: 110 },
    { field: "status", headerName: "Status", width: 100 },
    { field: "linkedInvoiceId", headerName: "Invoice", width: 120 },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#4caf50",
                color: "#fff",
                "&:hover": { backgroundColor: "#43a047" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => alert(`View Payment: ${params.row.paymentId}`)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#2196f3",
                color: "#fff",
                "&:hover": { backgroundColor: "#1976d2" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleEditPaymentOpen(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Refund">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#f44336",
                color: "#fff",
                "&:hover": { backgroundColor: "#d32f2f" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => alert(`Refund Payment: ${params.row.paymentId}`)}
            >
              <ReplayCircleFilledIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // -------------- COLUMNS: INVOICES --------------
  const invoiceColumns = [
    { field: "invoiceId", headerName: "Invoice ID", width: 120 },
    { field: "memberName", headerName: "Member Name", width: 150 },
    { field: "invoiceDate", headerName: "Invoice Date", width: 130 },
    { field: "dueDate", headerName: "Due Date", width: 130 },
    { field: "totalAmount", headerName: "Amount", width: 100 },
    { field: "status", headerName: "Status", width: 110 },
    {
      field: "linkedPaymentId",
      headerName: "Payment",
      width: 120,
      renderCell: (params) => (params.value ? params.value : "—"),
    },
    {
      field: "Actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#4caf50",
                color: "#fff",
                "&:hover": { backgroundColor: "#43a047" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => alert(`View Invoice: ${params.row.invoiceId}`)}
            >
              <VisibilityIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#2196f3",
                color: "#fff",
                "&:hover": { backgroundColor: "#1976d2" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => handleEditInvoiceOpen(params.row)}
            >
              <EditIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#f44336",
                color: "#fff",
                "&:hover": { backgroundColor: "#d32f2f" },
                minWidth: "40px",
                padding: "6px",
              }}
              onClick={() => alert(`Delete Invoice: ${params.row.invoiceId}`)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // -------------- ROW ID GETTERS --------------
  const getPaymentRowId = (row) => row.paymentId;
  const getInvoiceRowId = (row) => row.invoiceId;

  // -------------- TAB-DISPLAYED DATA --------------
  const displayedRows = activeTab === 0 ? filteredPayments : filteredInvoices;
  const displayedColumns = activeTab === 0 ? paymentColumns : invoiceColumns;
  const rowIdGetter = activeTab === 0 ? getPaymentRowId : getInvoiceRowId;

  // =============== Export Menu Logic For Each Table ===============
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  // Export to CSV (react-csv handles the actual download)
  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  // Export to PDF (jsPDF + autoTable)
  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();

    if (activeTab === 0) {
      // Export Payments
      doc.text("Payments Export", 14, 10);
      const bodyData = filteredPayments.map((p) => [
        p.paymentId,
        p.memberName,
        p.paymentDate,
        p.amountPaid,
        p.method,
        p.status,
        p.linkedInvoiceId,
      ]);
      doc.autoTable({
        head: [
          ["Payment ID", "Member Name", "Date", "Amount", "Method", "Status", "Invoice"],
        ],
        body: bodyData,
        startY: 20,
      });
      doc.save("Payments.pdf");
    } else {
      // Export Invoices
      doc.text("Invoices Export", 14, 10);
      const bodyData = filteredInvoices.map((i) => [
        i.invoiceId,
        i.memberName,
        i.invoiceDate,
        i.dueDate,
        i.totalAmount,
        i.status,
        i.linkedPaymentId,
      ]);
      doc.autoTable({
        head: [
          ["Invoice ID", "Member Name", "Date", "Due", "Amount", "Status", "Payment"],
        ],
        body: bodyData,
        startY: 20,
      });
      doc.save("Invoices.pdf");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ------------------- OVERVIEW PANEL ------------------- */}
      <Box sx={{ mb: 3 }}>
        {/* ---------- Date Filters for Summary Cards ---------- */}
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
          {/* Time Period Dropdown */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              label="Time Period"
              onChange={handleTimePeriodChange}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          {/* From Date */}
          <TextField
            type="date"
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={handleDateFromChange}
          />
          {/* To Date */}
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={handleDateToChange}
          />
          {/* New Branch Filter */}
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

        {/* ---------- Summaries (Example cards - adjust as needed) ---------- */}
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

      {/* ---------- Title & Tabs ---------- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Payments & Invoices
        </Typography>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <Tab icon={<ReceiptIcon />} label="Payments" />
          <Tab icon={<DescriptionIcon />} label="Invoices" />
        </Tabs>
      </Box>

      {/* ---------- Search & Action Buttons ---------- */}
      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          {/* Search Input */}
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: 300 }}
          />

          {/* Right side: Export + Add Buttons */}
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

        {/* ---------- DataGrid Table ---------- */}
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

      {/* ============ ADD Payment Dialog ============ */}
      <Dialog open={isAddPaymentOpen} onClose={() => setAddPaymentOpen(false)}>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="Payment ID"
            name="paymentId"
            value={newPayment.paymentId}
            onChange={handleAddPaymentChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Member Name"
            name="memberName"
            value={newPayment.memberName}
            onChange={handleAddPaymentChange}
          />
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
          <TextField
            fullWidth
            margin="normal"
            label="Linked Invoice ID"
            name="linkedInvoiceId"
            value={newPayment.linkedInvoiceId}
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

      {/* ============ EDIT Payment Dialog ============ */}
      <Dialog open={isEditPaymentOpen} onClose={() => setEditPaymentOpen(false)}>
        <DialogTitle>Edit Payment</DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Payment ID"
                name="paymentId"
                value={editPayment.paymentId}
                onChange={handleEditPaymentChange}
                disabled
              />
              <TextField
                fullWidth
                margin="normal"
                label="Member Name"
                name="memberName"
                value={editPayment.memberName}
                onChange={handleEditPaymentChange}
              />
              <TextField
                fullWidth
                margin="normal"
                type="date"
                label="Payment Date"
                name="paymentDate"
                InputLabelProps={{ shrink: true }}
                value={editPayment.paymentDate}
                onChange={handleEditPaymentChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Amount Paid"
                name="amountPaid"
                type="number"
                value={editPayment.amountPaid}
                onChange={handleEditPaymentChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Method"
                name="method"
                value={editPayment.method}
                onChange={handleEditPaymentChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Status"
                name="status"
                value={editPayment.status}
                onChange={handleEditPaymentChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Linked Invoice ID"
                name="linkedInvoiceId"
                value={editPayment.linkedInvoiceId}
                onChange={handleEditPaymentChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPaymentOpen(false)}>Cancel</Button>
          <Button onClick={handleEditPaymentSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ ADD Invoice Dialog ============ */}
      <Dialog open={isAddInvoiceOpen} onClose={() => setAddInvoiceOpen(false)}>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="normal"
            label="Invoice ID"
            name="invoiceId"
            value={newInvoice.invoiceId}
            onChange={handleAddInvoiceChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Member Name"
            name="memberName"
            value={newInvoice.memberName}
            onChange={handleAddInvoiceChange}
          />
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
            name="totalAmount"
            type="number"
            value={newInvoice.totalAmount}
            onChange={handleAddInvoiceChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={newInvoice.status}
            onChange={handleAddInvoiceChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Linked Payment ID"
            name="linkedPaymentId"
            value={newInvoice.linkedPaymentId}
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

      {/* ============ EDIT Invoice Dialog ============ */}
      <Dialog open={isEditInvoiceOpen} onClose={() => setEditInvoiceOpen(false)}>
        <DialogTitle>Edit Invoice</DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Invoice ID"
                name="invoiceId"
                value={editInvoice.invoiceId}
                onChange={handleEditInvoiceChange}
                disabled
              />
              <TextField
                fullWidth
                margin="normal"
                label="Member Name"
                name="memberName"
                value={editInvoice.memberName}
                onChange={handleEditInvoiceChange}
              />
              <TextField
                fullWidth
                margin="normal"
                type="date"
                label="Invoice Date"
                name="invoiceDate"
                InputLabelProps={{ shrink: true }}
                value={editInvoice.invoiceDate}
                onChange={handleEditInvoiceChange}
              />
              <TextField
                fullWidth
                margin="normal"
                type="date"
                label="Due Date"
                name="dueDate"
                InputLabelProps={{ shrink: true }}
                value={editInvoice.dueDate}
                onChange={handleEditInvoiceChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Total Amount"
                name="totalAmount"
                type="number"
                value={editInvoice.totalAmount}
                onChange={handleEditInvoiceChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Status"
                name="status"
                value={editInvoice.status}
                onChange={handleEditInvoiceChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Linked Payment ID"
                name="linkedPaymentId"
                value={editInvoice.linkedPaymentId}
                onChange={handleEditInvoiceChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditInvoiceOpen(false)}>Cancel</Button>
          <Button onClick={handleEditInvoiceSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
