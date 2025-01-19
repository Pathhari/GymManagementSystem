// File: StaffManagement.jsx
import React, { useState, useRef } from "react";
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import CleanHandsIcon from "@mui/icons-material/CleanHands";
import { DataGrid } from "@mui/x-data-grid";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReactToPrint from "react-to-print";

// Import external layout components (ensure they are default exported)
import AddNewStaffLayout from "../../Layouts/AddNewStaffLayout";
import AddPayrollLayout from "../../Layouts/AddPayrollLayout";
import AddStaffTaskLayout from "../../Layouts/AddStaffTaskLayout";
import PayslipLayout from "../../Layouts/Paysliplayout";

// ---------- SAMPLE DATA ----------
const sampleStaff = [
  {
    StaffID: 1,
    FullName: "Alice Johnson",
    Email: "alice.johnson@example.com",
    Phone: "123-456-7890",
    Role: "Trainer",
    BranchID: 1,
    DateHired: "2023-01-10",
    DailyRate: 100,
    HourlyRate: 15,
    OvertimeRate: 20,
    Notes: "Expert in cardio training",
  },
  {
    StaffID: 2,
    FullName: "Bob Williams",
    Email: "bob.williams@example.com",
    Phone: "987-654-3210",
    Role: "Admin",
    BranchID: 2,
    DateHired: "2022-06-15",
    DailyRate: 120,
    HourlyRate: 18,
    OvertimeRate: 25,
    Notes: "Handles front desk operations",
  },
];

const sampleAttendance = [
  {
    AttendanceID: 1,
    StaffID: 1,
    Date: "2023-08-01",
    TimeIn: "08:00",
    TimeOut: "16:00",
    HoursWorked: 8,
    OvertimeHours: 1,
    PayrollID: 101,
  },
  {
    AttendanceID: 2,
    StaffID: 2,
    Date: "2023-08-01",
    TimeIn: "09:00",
    TimeOut: "17:00",
    HoursWorked: 8,
    OvertimeHours: 0,
    PayrollID: 102,
  },
];

const samplePayroll = [
  {
    PayrollID: 101,
    StaffID: 1,
    StartDate: "2023-08-01",
    EndDate: "2023-08-15",
    GrossPay: 1500,
    Deductions: 200,
    NetPay: 1300,
    GeneratedDate: "2023-08-16",
    Status: "Paid",
  },
  {
    PayrollID: 102,
    StaffID: 2,
    StartDate: "2023-08-01",
    EndDate: "2023-08-15",
    GrossPay: 1440,
    Deductions: 150,
    NetPay: 1290,
    GeneratedDate: "2023-08-16",
    Status: "Pending",
  },
];

const sampleTasks = [
  {
    TaskID: 1,
    StaffID: 1,
    TaskDescription: "Conduct morning yoga session",
    TaskDate: "2023-08-10",
    Status: "Pending",
  },
  {
    TaskID: 2,
    StaffID: 2,
    TaskDescription: "Update member billing info",
    TaskDate: "2023-08-10",
    Status: "Completed",
  },
];

const sampleSchedule = [
  {
    ScheduleID: 1,
    StaffID: 1,
    ShiftDate: "2023-08-11",
    ShiftStart: "08:00",
    ShiftEnd: "16:00",
    RoleOverride: "",
  },
  {
    ScheduleID: 2,
    StaffID: 2,
    ShiftDate: "2023-08-11",
    ShiftStart: "09:00",
    ShiftEnd: "17:00",
    RoleOverride: "Manager",
  },
];

export default function StaffManagement() {
  // ------------------- STATES: STAFF TAB -------------------
  const [staffRecords, setStaffRecords] = useState(sampleStaff);
  const [filteredStaff, setFilteredStaff] = useState(sampleStaff);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Modals for Staff
  const [isViewStaffOpen, setViewStaffOpen] = useState(false);
  const [isEditStaffOpen, setEditStaffOpen] = useState(false);
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);

  // ------------------- STATES: ATTENDANCE TAB -------------------
  const [attendanceRecords, setAttendanceRecords] = useState(sampleAttendance);
  const [filteredAttendance, setFilteredAttendance] = useState(sampleAttendance);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isViewAttendanceOpen, setViewAttendanceOpen] = useState(false);
  const [isEditAttendanceOpen, setEditAttendanceOpen] = useState(false);

  // ------------------- STATES: PAYROLL TAB ---------------------
  const [payrollRecords, setPayrollRecords] = useState(samplePayroll);
  const [filteredPayroll, setFilteredPayroll] = useState(samplePayroll);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isViewPayrollOpen, setViewPayrollOpen] = useState(false);
  const [isEditPayrollOpen, setEditPayrollOpen] = useState(false);
  const [isAddPayrollOpen, setAddPayrollOpen] = useState(false);

  // ------------------- STATES: TASK TAB ------------------------
  const [taskRecords, setTaskRecords] = useState(sampleTasks);
  const [filteredTasks, setFilteredTasks] = useState(sampleTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewTaskOpen, setViewTaskOpen] = useState(false);
  const [isEditTaskOpen, setEditTaskOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);

  // ------------------- STATES: SCHEDULE TAB --------------------
  const [scheduleRecords, setScheduleRecords] = useState(sampleSchedule);
  const [filteredSchedule, setFilteredSchedule] = useState(sampleSchedule);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isViewScheduleOpen, setViewScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setEditScheduleOpen] = useState(false);

  // ------------------- PRINT PAYSLIP DIALOG STATE --------------------
  const [isPayslipOpen, setPayslipOpen] = useState(false);
  const [payslipStaffData, setPayslipStaffData] = useState(null);
  const [payslipPayrollData, setPayslipPayrollData] = useState(null);
  const printRef = useRef();

  // ------------------- TABS & SEARCH --------------------------
  // 0 = Staff, 1 = Attendance, 2 = Payroll, 3 = Task, 4 = Schedule
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // -------------- TIME PERIOD + DATE FILTERS --------------
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // -------------- NEW: BRANCH FILTER --------------
  const [branch, setBranch] = useState("all");
  const branchOptions = [
    { value: "all", label: "All Branches" },
    { value: "1", label: "Branch 1" },
    { value: "2", label: "Branch 2" },
    { value: "3", label: "Branch 3" },
  ];

  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
  };

  const handleDateFromChange = (event) => {
    setDateFrom(event.target.value);
  };

  const handleDateToChange = (event) => {
    setDateTo(event.target.value);
  };

  const handleBranchChange = (event) => {
    setBranch(event.target.value);
  };

  // ------------------- STAFF: VIEW, EDIT, DELETE -----------
  const handleViewStaff = (record) => {
    setSelectedStaff(record);
    setViewStaffOpen(true);
  };

  const handleEditStaff = (record) => {
    setSelectedStaff(record);
    setEditStaffOpen(true);
  };

  const handleDeleteStaff = (staffID) => {
    const updated = staffRecords.filter((s) => s.StaffID !== staffID);
    setStaffRecords(updated);
    setFilteredStaff(updated);
  };

  const handleEditStaffSubmit = () => {
    setStaffRecords((prev) =>
      prev.map((s) => (s.StaffID === selectedStaff.StaffID ? selectedStaff : s))
    );
    setFilteredStaff((prev) =>
      prev.map((s) => (s.StaffID === selectedStaff.StaffID ? selectedStaff : s))
    );
    setEditStaffOpen(false);
  };

  // ------------------- ATTENDANCE: VIEW, EDIT, DELETE -----------
  const handleViewAttendance = (record) => {
    setSelectedAttendance(record);
    setViewAttendanceOpen(true);
  };

  const handleEditAttendance = (record) => {
    setSelectedAttendance(record);
    setEditAttendanceOpen(true);
  };

  const handleDeleteAttendance = (attendanceID) => {
    const updated = attendanceRecords.filter((a) => a.AttendanceID !== attendanceID);
    setAttendanceRecords(updated);
    setFilteredAttendance(updated);
  };

  const handleEditAttendanceSubmit = () => {
    setAttendanceRecords((prev) =>
      prev.map((a) =>
        a.AttendanceID === selectedAttendance.AttendanceID ? selectedAttendance : a
      )
    );
    setFilteredAttendance((prev) =>
      prev.map((a) =>
        a.AttendanceID === selectedAttendance.AttendanceID ? selectedAttendance : a
      )
    );
    setEditAttendanceOpen(false);
  };

  // ------------------- PAYROLL: VIEW, EDIT, DELETE -----------
  const handleViewPayroll = (record) => {
    setSelectedPayroll(record);
    setViewPayrollOpen(true);
  };

  const handleEditPayroll = (record) => {
    setSelectedPayroll(record);
    setEditPayrollOpen(true);
  };

  const handleDeletePayroll = (payrollID) => {
    const updated = payrollRecords.filter((p) => p.PayrollID !== payrollID);
    setPayrollRecords(updated);
    setFilteredPayroll(updated);
  };

  const handleEditPayrollSubmit = () => {
    setPayrollRecords((prev) =>
      prev.map((p) => (p.PayrollID === selectedPayroll.PayrollID ? selectedPayroll : p))
    );
    setFilteredPayroll((prev) =>
      prev.map((p) => (p.PayrollID === selectedPayroll.PayrollID ? selectedPayroll : p))
    );
    setEditPayrollOpen(false);
  };

  // ------------------- TASK: VIEW, EDIT, DELETE -----------
  const handleViewTask = (record) => {
    setSelectedTask(record);
    setViewTaskOpen(true);
  };

  const handleEditTask = (record) => {
    setSelectedTask(record);
    setEditTaskOpen(true);
  };

  const handleDeleteTask = (taskID) => {
    const updated = taskRecords.filter((t) => t.TaskID !== taskID);
    setTaskRecords(updated);
    setFilteredTasks(updated);
  };

  const handleEditTaskSubmit = () => {
    setTaskRecords((prev) =>
      prev.map((t) => (t.TaskID === selectedTask.TaskID ? selectedTask : t))
    );
    setFilteredTasks((prev) =>
      prev.map((t) => (t.TaskID === selectedTask.TaskID ? selectedTask : t))
    );
    setEditTaskOpen(false);
  };

  // ------------------- SCHEDULE: VIEW, EDIT, DELETE -----------
  const handleViewSchedule = (record) => {
    setSelectedSchedule(record);
    setViewScheduleOpen(true);
  };

  const handleEditSchedule = (record) => {
    setSelectedSchedule(record);
    setEditScheduleOpen(true);
  };

  const handleDeleteSchedule = (scheduleID) => {
    const updated = scheduleRecords.filter((s) => s.ScheduleID !== scheduleID);
    setScheduleRecords(updated);
    setFilteredSchedule(updated);
  };

  const handleEditScheduleSubmit = () => {
    setScheduleRecords((prev) =>
      prev.map((s) =>
        s.ScheduleID === selectedSchedule.ScheduleID ? selectedSchedule : s
      )
    );
    setFilteredSchedule((prev) =>
      prev.map((s) =>
        s.ScheduleID === selectedSchedule.ScheduleID ? selectedSchedule : s
      )
    );
    setEditScheduleOpen(false);
  };

  // ------------------- PRINT PAYSLIP -------------------
  const handlePrintPayslip = (staffRecord, payrollRecord) => {
    setPayslipStaffData(staffRecord);
    setPayslipPayrollData(payrollRecord);
    setPayslipOpen(true);
  };

  // ------------------- SEARCH & TAB SWITCHING -----------------
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (activeTab === 0) {
      const filtered = staffRecords.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(value)
        )
      );
      setFilteredStaff(filtered);
    } else if (activeTab === 1) {
      const filtered = attendanceRecords.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(value)
        )
      );
      setFilteredAttendance(filtered);
    } else if (activeTab === 2) {
      const filtered = payrollRecords.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(value)
        )
      );
      setFilteredPayroll(filtered);
    } else if (activeTab === 3) {
      const filtered = taskRecords.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(value)
        )
      );
      setFilteredTasks(filtered);
    } else {
      const filtered = scheduleRecords.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(value)
        )
      );
      setFilteredSchedule(filtered);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");

    if (newValue === 0) {
      setFilteredStaff(staffRecords);
    } else if (newValue === 1) {
      setFilteredAttendance(attendanceRecords);
    } else if (newValue === 2) {
      setFilteredPayroll(payrollRecords);
    } else if (newValue === 3) {
      setFilteredTasks(taskRecords);
    } else {
      setFilteredSchedule(scheduleRecords);
    }
  };

  // ------------------- Overview Cards Data -------------------
  const totalStaff = staffRecords.length;
  const trainersCount = staffRecords.filter((s) => s.Role === "Trainer").length;
  const adminsCount = staffRecords.filter((s) => s.Role === "Admin").length;
  const today = new Date();
  const last30 = new Date();
  last30.setDate(today.getDate() - 30);
  const recentHiresCount = staffRecords.filter((s) => {
    const hireDate = new Date(s.DateHired);
    return hireDate >= last30;
  }).length;

  // ------------------- COLUMNS: TABLES -------------------
  const staffColumns = [
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "Email", headerName: "Email", width: 160 },
    { field: "Phone", headerName: "Phone", width: 120 },
    { field: "Role", headerName: "Role", width: 120 },
    { field: "BranchID", headerName: "Branch ID", width: 100 },
    { field: "DateHired", headerName: "Hired", width: 110 },
    { field: "DailyRate", headerName: "Daily Rate", width: 100 },
    { field: "HourlyRate", headerName: "Hourly", width: 90 },
    { field: "OvertimeRate", headerName: "Overtime", width: 100 },
    { field: "Notes", headerName: "Notes", width: 150 },
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
              onClick={() => handleViewStaff(params.row)}
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
              onClick={() => handleEditStaff(params.row)}
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
              onClick={() => handleDeleteStaff(params.row.StaffID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const attendanceColumns = [
    { field: "AttendanceID", headerName: "Attendance ID", width: 110 },
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "Date", headerName: "Date", width: 100 },
    { field: "TimeIn", headerName: "Time In", width: 90 },
    { field: "TimeOut", headerName: "Time Out", width: 90 },
    { field: "HoursWorked", headerName: "Hours", width: 80 },
    { field: "OvertimeHours", headerName: "Overtime", width: 90 },
    { field: "PayrollID", headerName: "Payroll ID", width: 90 },
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
              onClick={() => handleViewAttendance(params.row)}
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
              onClick={() => handleEditAttendance(params.row)}
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
              onClick={() => handleDeleteAttendance(params.row.AttendanceID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const payrollColumns = [
    { field: "PayrollID", headerName: "Payroll ID", width: 90 },
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "StartDate", headerName: "Start", width: 100 },
    { field: "EndDate", headerName: "End", width: 100 },
    { field: "GrossPay", headerName: "Gross", width: 90 },
    { field: "Deductions", headerName: "Deductions", width: 100 },
    { field: "NetPay", headerName: "Net Pay", width: 90 },
    { field: "GeneratedDate", headerName: "Generated", width: 110 },
    { field: "Status", headerName: "Status", width: 90 },
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
              onClick={() => handleViewPayroll(params.row)}
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
              onClick={() => handleEditPayroll(params.row)}
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
              onClick={() => handleDeletePayroll(params.row.PayrollID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const taskColumns = [
    { field: "TaskID", headerName: "Task ID", width: 80 },
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "TaskDescription", headerName: "Description", width: 200 },
    { field: "TaskDate", headerName: "Date", width: 110 },
    {
      field: "Status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <span style={{ color: params.value === "Completed" ? "limegreen" : "orange" }}>
          {params.value}
        </span>
      ),
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
              onClick={() => handleViewTask(params.row)}
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
              onClick={() => handleEditTask(params.row)}
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
              onClick={() => handleDeleteTask(params.row.TaskID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const scheduleColumns = [
    { field: "ScheduleID", headerName: "Schedule ID", width: 100 },
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "ShiftDate", headerName: "Date", width: 110 },
    { field: "ShiftStart", headerName: "Start", width: 90 },
    { field: "ShiftEnd", headerName: "End", width: 90 },
    { field: "RoleOverride", headerName: "Override", width: 100 },
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
              onClick={() => handleViewSchedule(params.row)}
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
              onClick={() => handleEditSchedule(params.row)}
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
              onClick={() => handleDeleteSchedule(params.row.ScheduleID)}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const columns =
    activeTab === 0
      ? staffColumns
      : activeTab === 1
      ? attendanceColumns
      : activeTab === 2
      ? payrollColumns
      : activeTab === 3
      ? taskColumns
      : scheduleColumns;

  const getRowId = (row) => {
    if (activeTab === 0) return row.StaffID;
    if (activeTab === 1) return row.AttendanceID;
    if (activeTab === 2) return row.PayrollID;
    if (activeTab === 3) return row.TaskID;
    return row.ScheduleID;
  };

  const rows =
    activeTab === 0
      ? filteredStaff
      : activeTab === 1
      ? filteredAttendance
      : activeTab === 2
      ? filteredPayroll
      : activeTab === 3
      ? filteredTasks
      : filteredSchedule;

  // ======================= EXPORT FUNCTIONALITY ======================
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const staffCSVHeaders = [
    { label: "StaffID", key: "StaffID" },
    { label: "FullName", key: "FullName" },
    { label: "Email", key: "Email" },
    { label: "Phone", key: "Phone" },
    { label: "Role", key: "Role" },
    { label: "BranchID", key: "BranchID" },
    { label: "DateHired", key: "DateHired" },
    { label: "DailyRate", key: "DailyRate" },
    { label: "HourlyRate", key: "HourlyRate" },
    { label: "OvertimeRate", key: "OvertimeRate" },
    { label: "Notes", key: "Notes" },
  ];
  const attendanceCSVHeaders = [
    { label: "AttendanceID", key: "AttendanceID" },
    { label: "StaffID", key: "StaffID" },
    { label: "Date", key: "Date" },
    { label: "TimeIn", key: "TimeIn" },
    { label: "TimeOut", key: "TimeOut" },
    { label: "HoursWorked", key: "HoursWorked" },
    { label: "OvertimeHours", key: "OvertimeHours" },
    { label: "PayrollID", key: "PayrollID" },
  ];
  const payrollCSVHeaders = [
    { label: "PayrollID", key: "PayrollID" },
    { label: "StaffID", key: "StaffID" },
    { label: "StartDate", key: "StartDate" },
    { label: "EndDate", key: "EndDate" },
    { label: "GrossPay", key: "GrossPay" },
    { label: "Deductions", key: "Deductions" },
    { label: "NetPay", key: "NetPay" },
    { label: "GeneratedDate", key: "GeneratedDate" },
    { label: "Status", key: "Status" },
  ];
  const taskCSVHeaders = [
    { label: "TaskID", key: "TaskID" },
    { label: "StaffID", key: "StaffID" },
    { label: "TaskDescription", key: "TaskDescription" },
    { label: "TaskDate", key: "TaskDate" },
    { label: "Status", key: "Status" },
  ];
  const scheduleCSVHeaders = [
    { label: "ScheduleID", key: "ScheduleID" },
    { label: "StaffID", key: "StaffID" },
    { label: "ShiftDate", key: "ShiftDate" },
    { label: "ShiftStart", key: "ShiftStart" },
    { label: "ShiftEnd", key: "ShiftEnd" },
    { label: "RoleOverride", key: "RoleOverride" },
  ];

  let csvData = [];
  let csvHeaders = [];
  let csvFilename = "";
  if (activeTab === 0) {
    csvData = rows;
    csvHeaders = staffCSVHeaders;
    csvFilename = "Staff.csv";
  } else if (activeTab === 1) {
    csvData = rows;
    csvHeaders = attendanceCSVHeaders;
    csvFilename = "Attendance.csv";
  } else if (activeTab === 2) {
    csvData = rows;
    csvHeaders = payrollCSVHeaders;
    csvFilename = "Payroll.csv";
  } else if (activeTab === 3) {
    csvData = rows;
    csvHeaders = taskCSVHeaders;
    csvFilename = "Tasks.csv";
  } else {
    csvData = rows;
    csvHeaders = scheduleCSVHeaders;
    csvFilename = "Schedule.csv";
  }

  const handleExportCSV = () => {
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    const doc = new jsPDF();
    if (activeTab === 0) {
      doc.text("Staff Export", 14, 10);
      const bodyData = rows.map((s) => [
        s.StaffID,
        s.FullName,
        s.Email,
        s.Phone,
        s.Role,
        s.BranchID,
        s.DateHired,
        s.DailyRate,
        s.HourlyRate,
        s.OvertimeRate,
        s.Notes,
      ]);
      doc.autoTable({
        head: [
          [
            "StaffID",
            "FullName",
            "Email",
            "Phone",
            "Role",
            "BranchID",
            "DateHired",
            "DailyRate",
            "HourlyRate",
            "OvertimeRate",
            "Notes",
          ],
        ],
        body: bodyData,
        startY: 20,
      });
      doc.save("Staff.pdf");
    } else if (activeTab === 1) {
      doc.text("Attendance Export", 14, 10);
      const bodyData = rows.map((a) => [
        a.AttendanceID,
        a.StaffID,
        a.Date,
        a.TimeIn,
        a.TimeOut,
        a.HoursWorked,
        a.OvertimeHours,
        a.PayrollID,
      ]);
      doc.autoTable({
        head: [["ID", "StaffID", "Date", "TimeIn", "TimeOut", "Hours", "OT", "PayrollID"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Attendance.pdf");
    } else if (activeTab === 2) {
      doc.text("Payroll Export", 14, 10);
      const bodyData = rows.map((p) => [
        p.PayrollID,
        p.StaffID,
        p.StartDate,
        p.EndDate,
        p.GrossPay,
        p.Deductions,
        p.NetPay,
        p.GeneratedDate,
        p.Status,
      ]);
      doc.autoTable({
        head: [["ID", "StaffID", "Start", "End", "Gross", "Deductions", "NetPay", "Generated", "Status"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Payroll.pdf");
    } else if (activeTab === 3) {
      doc.text("Tasks Export", 14, 10);
      const bodyData = rows.map((t) => [
        t.TaskID,
        t.StaffID,
        t.TaskDescription,
        t.TaskDate,
        t.Status,
      ]);
      doc.autoTable({
        head: [["ID", "StaffID", "Description", "Date", "Status"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Tasks.pdf");
    } else {
      doc.text("Schedule Export", 14, 10);
      const bodyData = rows.map((sc) => [
        sc.ScheduleID,
        sc.StaffID,
        sc.ShiftDate,
        sc.ShiftStart,
        sc.ShiftEnd,
        sc.RoleOverride,
      ]);
      doc.autoTable({
        head: [["ID", "StaffID", "Date", "Start", "End", "Override"]],
        body: bodyData,
        startY: 20,
      });
      doc.save("Schedule.pdf");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* ------------------- TIME PERIOD, DATE & BRANCH FILTERS ------------------- */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
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

      {/* ------------------- OVERVIEW CARDS ------------------- */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                display: "flex",
                alignItems: "center",
                p: 2,
              }}
            >
              <GroupsIcon sx={{ fontSize: 40, color: "gray", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Staff
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {staffRecords.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                display: "flex",
                alignItems: "center",
                p: 2,
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: 40, color: "limegreen", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trainers
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {/* Add trainersCount here if available */}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                display: "flex",
                alignItems: "center",
                p: 2,
              }}
            >
              <SupervisorAccountIcon sx={{ fontSize: 40, color: "gray", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Managers
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {/* Add adminsCount here if available */}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "text.primary",
                color: "background.paper",
                display: "flex",
                alignItems: "center",
                p: 2,
              }}
            >
              <CleanHandsIcon sx={{ fontSize: 40, color: "blue", mr: 2 }} />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Hires
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {recentHiresCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* ------------------- TITLE & TABS ------------------- */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h4" gutterBottom>
          Staff Management
        </Typography>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Tab icon={<PeopleIcon />} label="Staff" />
          <Tab icon={<EmojiPeopleIcon />} label="Attendance" />
          <Tab icon={<ReceiptIcon />} label="Payroll" />
          <Tab icon={<AssignmentIcon />} label="Task" />
          <Tab icon={<CalendarMonthIcon />} label="Schedule" />
        </Tabs>
      </Box>

      {/* ------------------- DATA GRID & SEARCH ------------------- */}
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
                <CSVLink
                  data={rows}
                  headers={csvHeaders}
                  filename={csvFilename}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Export CSV
                </CSVLink>
              </MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </Menu>
            {activeTab === 0 && (
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddStaffOpen(true)}>
                Add New Staff
              </Button>
            )}
            {activeTab === 2 && (
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddPayrollOpen(true)}>
                Add Payroll
              </Button>
            )}
            {activeTab === 3 && (
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddTaskOpen(true)}>
                Add Task
              </Button>
            )}
          </Box>
        </Box>
        <div style={{ height: 420, width: "100%" }}>
          <DataGrid rows={rows} columns={columns} getRowId={getRowId} pageSize={5} rowsPerPageOptions={[5, 10]} />
        </div>
      </Paper>

      {/* ------------------- RENDER EXTERNAL LAYOUTS ------------------- */}
      {isAddStaffOpen && <AddNewStaffLayout onClose={() => setAddStaffOpen(false)} />}
      {isAddPayrollOpen && (
        <AddPayrollLayout
          onClose={() => setAddPayrollOpen(false)}
          onAdd={(newPayroll) => {
            const nextId = payrollRecords.length
              ? Math.max(...payrollRecords.map((p) => p.PayrollID)) + 1
              : 1;
            const record = { PayrollID: nextId, ...newPayroll };
            const updated = [...payrollRecords, record];
            setPayrollRecords(updated);
            setFilteredPayroll(updated);
          }}
        />
      )}
      {isAddTaskOpen && (
        <AddStaffTaskLayout
          onClose={() => setAddTaskOpen(false)}
          onAdd={(newTask) => {
            const nextId = taskRecords.length ? Math.max(...taskRecords.map((t) => t.TaskID)) + 1 : 1;
            const record = { TaskID: nextId, ...newTask };
            const updated = [...taskRecords, record];
            setTaskRecords(updated);
            setFilteredTasks(updated);
          }}
        />
      )}

      {/* ------------------- PRINT PAYSLIP DIALOG ------------------- */}
      <Dialog open={isPayslipOpen} onClose={() => setPayslipOpen(false)} fullWidth maxWidth="lg">
        <DialogContent>
          <Box ref={printRef}>
            <PayslipLayout staffData={payslipStaffData} payrollData={payslipPayrollData} />
          </Box>
        </DialogContent>
        <Box sx={{ m: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <ReactToPrint
            trigger={() => <Button variant="contained" color="primary">Print Payslip</Button>}
            content={() => printRef.current}
            pageStyle="@media print { @page { size: A4; margin: 20mm } }"
          />
          <Button variant="text" color="inherit" onClick={() => setPayslipOpen(false)}>
            Close
          </Button>
        </Box>
      </Dialog>

      {/* ------------------- VIEW & EDIT DIALOGS ------------------- */}

      {/* VIEW STAFF */}
      <Dialog open={isViewStaffOpen} onClose={() => setViewStaffOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Staff Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStaff && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="textSecondary">
                    <strong>Personal Information</strong>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Full Name:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.FullName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Email:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.Email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.Phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Role:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.Role}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="textSecondary">
                    <strong>Work Information</strong>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Branch ID:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.BranchID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Date Hired:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.DateHired}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Daily Rate:
                  </Typography>
                  <Typography variant="body1">${selectedStaff.DailyRate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Hourly Rate:
                  </Typography>
                  <Typography variant="body1">${selectedStaff.HourlyRate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Overtime Rate:
                  </Typography>
                  <Typography variant="body1">${selectedStaff.OvertimeRate}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Notes:
                  </Typography>
                  <Typography variant="body1">{selectedStaff.Notes}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewStaffOpen(false)} variant="contained" color="primary">
            Close
          </Button>
          <Button
            onClick={() => {
              // For printing, you may need to supply appropriate payroll data.
              handlePrintPayslip(selectedStaff, selectedPayroll);
            }}
            variant="contained"
            color="primary"
          >
            Print Payslip
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT STAFF */}
      <Dialog open={isEditStaffOpen} onClose={() => setEditStaffOpen(false)}>
        <DialogTitle>Edit Staff</DialogTitle>
        <DialogContent dividers>
          {selectedStaff && (
            <>
              <TextField fullWidth margin="normal" label="Full Name" value={selectedStaff.FullName} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, FullName: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Email" value={selectedStaff.Email} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, Email: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Phone" value={selectedStaff.Phone} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, Phone: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Role" value={selectedStaff.Role} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, Role: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Branch ID" type="number" value={selectedStaff.BranchID} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, BranchID: Number(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Date Hired" value={selectedStaff.DateHired} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, DateHired: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Daily Rate" type="number" value={selectedStaff.DailyRate} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, DailyRate: Number(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Hourly Rate" type="number" value={selectedStaff.HourlyRate} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, HourlyRate: Number(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Overtime Rate" type="number" value={selectedStaff.OvertimeRate} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, OvertimeRate: Number(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Notes" value={selectedStaff.Notes} onChange={(e) => setSelectedStaff((prev) => ({ ...prev, Notes: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStaffOpen(false)}>Cancel</Button>
          <Button onClick={handleEditStaffSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW ATTENDANCE */}
      <Dialog open={isViewAttendanceOpen} onClose={() => setViewAttendanceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Attendance Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAttendance && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Attendance ID:</Typography>
                  <Typography variant="body1">{selectedAttendance.AttendanceID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Staff ID:</Typography>
                  <Typography variant="body1">{selectedAttendance.StaffID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date:</Typography>
                  <Typography variant="body1">{selectedAttendance.Date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Time In:</Typography>
                  <Typography variant="body1">{selectedAttendance.TimeIn}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Time Out:</Typography>
                  <Typography variant="body1">{selectedAttendance.TimeOut}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Hours Worked:</Typography>
                  <Typography variant="body1">{selectedAttendance.HoursWorked}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Overtime Hours:</Typography>
                  <Typography variant="body1">{selectedAttendance.OvertimeHours}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payroll ID:</Typography>
                  <Typography variant="body1">{selectedAttendance.PayrollID}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAttendanceOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT ATTENDANCE */}
      <Dialog open={isEditAttendanceOpen} onClose={() => setEditAttendanceOpen(false)}>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent dividers>
          {selectedAttendance && (
            <>
              <TextField fullWidth margin="normal" label="AttendanceID" disabled value={selectedAttendance.AttendanceID} />
              <TextField fullWidth margin="normal" label="StaffID" value={selectedAttendance.StaffID} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, StaffID: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Date" value={selectedAttendance.Date} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, Date: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Time In" value={selectedAttendance.TimeIn} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, TimeIn: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Time Out" value={selectedAttendance.TimeOut} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, TimeOut: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Hours Worked" type="number" value={selectedAttendance.HoursWorked} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, HoursWorked: parseFloat(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Overtime Hours" type="number" value={selectedAttendance.OvertimeHours} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, OvertimeHours: parseFloat(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="PayrollID" type="number" value={selectedAttendance.PayrollID} onChange={(e) => setSelectedAttendance((prev) => ({ ...prev, PayrollID: parseInt(e.target.value) || 0 }))} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAttendanceOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAttendanceSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW PAYROLL */}
      <Dialog open={isViewPayrollOpen} onClose={() => setViewPayrollOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Payroll Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPayroll && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payroll ID:</Typography>
                  <Typography variant="body1">{selectedPayroll.PayrollID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Staff ID:</Typography>
                  <Typography variant="body1">{selectedPayroll.StaffID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Start Date:</Typography>
                  <Typography variant="body1">{selectedPayroll.StartDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">End Date:</Typography>
                  <Typography variant="body1">{selectedPayroll.EndDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Gross Pay:</Typography>
                  <Typography variant="body1">${selectedPayroll.GrossPay}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Deductions:</Typography>
                  <Typography variant="body1">${selectedPayroll.Deductions}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Net Pay:</Typography>
                  <Typography variant="body1">${selectedPayroll.NetPay}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Generated Date:</Typography>
                  <Typography variant="body1">{selectedPayroll.GeneratedDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Typography variant="body1">{selectedPayroll.Status}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPayrollOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT PAYROLL */}
      <Dialog open={isEditPayrollOpen} onClose={() => setEditPayrollOpen(false)}>
        <DialogTitle>Edit Payroll</DialogTitle>
        <DialogContent dividers>
          {selectedPayroll && (
            <>
              <TextField fullWidth margin="normal" label="PayrollID" disabled value={selectedPayroll.PayrollID} />
              <TextField fullWidth margin="normal" label="StaffID" value={selectedPayroll.StaffID} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, StaffID: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Start Date" value={selectedPayroll.StartDate} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, StartDate: e.target.value }))} />
              <TextField fullWidth margin="normal" label="End Date" value={selectedPayroll.EndDate} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, EndDate: e.target.value }))} />
              <TextField fullWidth margin="normal" label="GrossPay" type="number" value={selectedPayroll.GrossPay} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, GrossPay: parseFloat(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="Deductions" type="number" value={selectedPayroll.Deductions} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, Deductions: parseFloat(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="NetPay" type="number" value={selectedPayroll.NetPay} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, NetPay: parseFloat(e.target.value) || 0 }))} />
              <TextField fullWidth margin="normal" label="GeneratedDate" value={selectedPayroll.GeneratedDate} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, GeneratedDate: e.target.value }))} />
              <TextField fullWidth margin="normal" label="Status" value={selectedPayroll.Status} onChange={(e) => setSelectedPayroll((prev) => ({ ...prev, Status: e.target.value }))} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPayrollOpen(false)}>Cancel</Button>
          <Button onClick={handleEditPayrollSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW TASK */}
      <Dialog open={isViewTaskOpen} onClose={() => setViewTaskOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Task Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Task ID:</Typography>
                  <Typography variant="body1">{selectedTask.TaskID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Staff ID:</Typography>
                  <Typography variant="body1">{selectedTask.StaffID}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Description:</Typography>
                  <Typography variant="body1">{selectedTask.TaskDescription}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Task Date:</Typography>
                  <Typography variant="body1">{selectedTask.TaskDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Typography variant="body1">{selectedTask.Status}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTaskOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT TASK */}
      <Dialog open={isEditTaskOpen} onClose={() => setEditTaskOpen(false)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <>
              <TextField fullWidth margin="normal" label="TaskID" disabled value={selectedTask.TaskID} />
              <TextField
                fullWidth
                margin="normal"
                label="StaffID"
                value={selectedTask.StaffID}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, StaffID: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Task Description"
                value={selectedTask.TaskDescription}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, TaskDescription: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Task Date"
                value={selectedTask.TaskDate}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, TaskDate: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Status"
                value={selectedTask.Status}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, Status: e.target.value }))}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTaskOpen(false)}>Cancel</Button>
          <Button onClick={handleEditTaskSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW SCHEDULE */}
      <Dialog open={isViewScheduleOpen} onClose={() => setViewScheduleOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="h6" color="primary">
            Schedule Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSchedule && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Schedule ID:</Typography>
                  <Typography variant="body1">{selectedSchedule.ScheduleID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Staff ID:</Typography>
                  <Typography variant="body1">{selectedSchedule.StaffID}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date:</Typography>
                  <Typography variant="body1">{selectedSchedule.ShiftDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Start:</Typography>
                  <Typography variant="body1">{selectedSchedule.ShiftStart}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">End:</Typography>
                  <Typography variant="body1">{selectedSchedule.ShiftEnd}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Role Override:</Typography>
                  <Typography variant="body1">{selectedSchedule.RoleOverride}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewScheduleOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT SCHEDULE */}
      <Dialog open={isEditScheduleOpen} onClose={() => setEditScheduleOpen(false)}>
        <DialogTitle>Edit Schedule</DialogTitle>
        <DialogContent dividers>
          {selectedSchedule && (
            <>
              <TextField fullWidth margin="normal" label="ScheduleID" disabled value={selectedSchedule.ScheduleID} />
              <TextField
                fullWidth
                margin="normal"
                label="StaffID"
                value={selectedSchedule.StaffID}
                onChange={(e) => setSelectedSchedule((prev) => ({ ...prev, StaffID: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Shift Date"
                value={selectedSchedule.ShiftDate}
                onChange={(e) => setSelectedSchedule((prev) => ({ ...prev, ShiftDate: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Shift Start"
                value={selectedSchedule.ShiftStart}
                onChange={(e) => setSelectedSchedule((prev) => ({ ...prev, ShiftStart: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Shift End"
                value={selectedSchedule.ShiftEnd}
                onChange={(e) => setSelectedSchedule((prev) => ({ ...prev, ShiftEnd: e.target.value }))}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Role Override"
                value={selectedSchedule.RoleOverride}
                onChange={(e) => setSelectedSchedule((prev) => ({ ...prev, RoleOverride: e.target.value }))}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditScheduleOpen(false)}>Cancel</Button>
          <Button onClick={handleEditScheduleSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------- RENDER PRINT PAYSLIP DIALOG ------------------- */}
      <Dialog open={isPayslipOpen} onClose={() => setPayslipOpen(false)} fullWidth maxWidth="lg">
        <DialogContent>
          <Box ref={printRef}>
            <PayslipLayout staffData={payslipStaffData} payrollData={payslipPayrollData} />
          </Box>
        </DialogContent>
        <Box sx={{ m: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <ReactToPrint
            trigger={() => <Button variant="contained" color="primary">Print Payslip</Button>}
            content={() => printRef.current}
            pageStyle="@media print { @page { size: A4; margin: 20mm } }"
          />
          <Button variant="text" color="inherit" onClick={() => setPayslipOpen(false)}>
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
