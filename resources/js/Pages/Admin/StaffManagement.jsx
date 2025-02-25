// File: StaffManagement.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Inertia } from '@inertiajs/inertia'; 
import { route } from 'ziggy-js';
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



export default function StaffManagement({ staff = [], attendance = [], payroll = [], tasks = [], schedules = [] }) {
  // -------------- STAFF STATES -------------------
  const [staffRecords, setStaffRecords] = useState(staff);
  const [filteredStaff, setFilteredStaff] = useState(staff);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewStaffOpen, setViewStaffOpen] = useState(false);
  const [isEditStaffOpen, setEditStaffOpen] = useState(false);
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);

  // -------------- ATTENDANCE STATES -------------------
  const [attendanceRecords, setAttendanceRecords] = useState(attendance);
  const [filteredAttendance, setFilteredAttendance] = useState(attendance);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isViewAttendanceOpen, setViewAttendanceOpen] = useState(false);
  const [isEditAttendanceOpen, setEditAttendanceOpen] = useState(false);

  // -------------- PAYROLL STATES -------------------
  const [payrollRecords, setPayrollRecords] = useState(payroll);
  const [filteredPayroll, setFilteredPayroll] = useState(payroll);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isViewPayrollOpen, setViewPayrollOpen] = useState(false);
  const [isEditPayrollOpen, setEditPayrollOpen] = useState(false);
  const [isAddPayrollOpen, setAddPayrollOpen] = useState(false);
  const handleAddPayroll = () => {
    setAddPayrollOpen(true);
  };

  const handleClosePayrollDialog = () => {
    setAddPayrollOpen(false);
  };

    // This is called by AddPayrollLayout's `onAdd(payload)`
    const handleCreatePayroll = (newPayroll) => {
      // newPayroll will have { StaffID, StartDate, EndDate, Deductions, etc. }
      // We'll send it to the server via axios or fetch
      axios.post(route('staff.payroll.store'), newPayroll)
        .then((res) => {
          const created = res.data.payroll;
          // Optionally update local payroll state if you keep it
          // e.g. setPayrollRecords(prev => [...prev, created]);
          // close the dialog or do something else
        })
        .catch((err) => {
          console.error("Error creating payroll:", err);
        });
    };

  // -------------- TASK STATES -------------------
  const [taskRecords, setTaskRecords] = useState(tasks);
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewTaskOpen, setViewTaskOpen] = useState(false);
  const [isEditTaskOpen, setEditTaskOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);

  // -------------- SCHEDULE STATES -------------------
  const [scheduleRecords, setScheduleRecords] = useState(schedules);
  const [filteredSchedule, setFilteredSchedule] = useState(schedules);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isViewScheduleOpen, setViewScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setEditScheduleOpen] = useState(false);

  // -------------- PRINT PAYSLIP -------------------
  const [isPayslipOpen, setPayslipOpen] = useState(false);
  const [payslipStaffData, setPayslipStaffData] = useState(null);
  const [payslipPayrollData, setPayslipPayrollData] = useState(null);
  const printRef = useRef();

  // -------------- TABS & FILTERS -------------------
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [timePeriod, setTimePeriod] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branch, setBranch] = useState("all");
  const [branchOptions, setBranchOptions] = useState([]);
  
  useEffect(() => {

    axios
    .get("/owner/branches") // must match the route definition
    .then((res) => {
      // Because indexJson returns { "branches": [ ... ] }
      const branchData = res.data.branches; 
      if (!branchData) {
        console.error("No 'branches' key found in response:", res.data);
        return;
      }
      
      // Map to { value, label } objects
      const mapped = branchData.map((b) => ({
        value: b.BranchID,
        label: b.BranchName,
      }));
      // Optionally prepend "All Branches"
      mapped.unshift({ value: "all", label: "All Branches" });
      
      setBranchOptions(mapped);
    })
    .catch((err) => {
      console.error("Error fetching branches:", err);
    });

    // 1. Staff
    axios.get(route('staff.index'))
      .then((response) => {
        setStaffRecords(response.data);
        setFilteredStaff(response.data);
      })
      .catch((err) => console.error("Error fetching staff:", err));
    
    // 2. Attendance
    axios.get(route('staff.attendance.index'))
      .then((res) => {
        setAttendanceRecords(res.data);
        setFilteredAttendance(res.data);
      })
      .catch((err) => console.error("Error fetching attendance:", err));
  
    // 3. Payroll
    axios.get(route('staff.payroll.index'))
      .then((res) => {
        setPayrollRecords(res.data);
        setFilteredPayroll(res.data);
      })
      .catch((err) => console.error("Error fetching payroll:", err));
  
    // 4. Tasks
    axios.get(route('staff.tasks.index'))
      .then((res) => {
        setTaskRecords(res.data);
        setFilteredTasks(res.data);
      })
      .catch((err) => console.error("Error fetching tasks:", err));
  
    // 5. Schedules
    axios.get(route('staff.schedules.index'))
      .then((res) => {
        setScheduleRecords(res.data);
        setFilteredSchedule(res.data);
      })
      .catch((err) => console.error("Error fetching schedules:", err));
  }, []);
  

  // -------------- Filter Handlers (TimePeriod, Branch, etc.) --------------
  const handleTimePeriodChange = (e) => setTimePeriod(e.target.value);
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);
  function handleBranchChange(e) {
    const selected = e.target.value;
    setBranch(selected);
  
    if (selected === "all") {
      setFilteredStaff(staffRecords);
    } else {
      const branchID = Number(selected);
      const filtered = staffRecords.filter((st) => {
        // st.branches is an array
        // check if any of st.branches has a matching BranchID
        return st.branches.some((b) => b.BranchID === branchID);
      });
      setFilteredStaff(filtered);
    }
  }
  
  // -------------- STAFF CRUD --------------
  const handleViewStaff = (record) => {
    setSelectedStaff(record);
    setViewStaffOpen(true);
  };

  const handleEditStaff = (record) => {
    setSelectedStaff(record);
    setEditStaffOpen(true);
  };




  async function handleDeleteStaff(staffID) {
    if (!confirm('Are you sure you want to delete this staff?')) return;
    try {
      await axios.delete(route('staff.destroy', staffID));
      // Update local arrays
      setStaffRecords((prev) => prev.filter((s) => s.StaffID !== staffID));
      setFilteredStaff((prev) => prev.filter((s) => s.StaffID !== staffID));
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  }
  
  
  async function handleEditStaffSubmit() {
    try {
      const staffID = selectedStaff.StaffID;
  
      // Build the payload you want to send.
      // If the staff table has fields like FullName, Email, Role, etc.
      // and BranchIDs is the array for pivot syncing:
      const payload = {
        FullName:      selectedStaff.FullName,
        Email:         selectedStaff.Email,
        Role:          selectedStaff.Role,
        Phone:         selectedStaff.Phone,
        DateHired:     selectedStaff.DateHired,
        DailyRate:     selectedStaff.DailyRate,
        HourlyRate:    selectedStaff.HourlyRate,
        OvertimeRate:  selectedStaff.OvertimeRate,
        Notes:         selectedStaff.Notes,
        BranchIDs:     selectedStaff.BranchIDs || [],
      };
  
      // Make the PUT request
      const response = await axios.put(`/staff/${staffID}`, payload);
  
      // If your back end returns updated staff data:
      const updatedStaff = response.data.staff;
  
      // Update local state, e.g. staffRecords
      setStaffRecords((prev) =>
        prev.map((s) => (s.StaffID === staffID ? updatedStaff : s))
      );
      setFilteredStaff((prev) =>
        prev.map((s) => (s.StaffID === staffID ? updatedStaff : s))
      );
  
      setEditStaffOpen(false);
    } catch (error) {
      console.error("Error updating staff:", error);
    }
  }
  // -------------- ATTENDANCE CRUD (No official "destroy" route) --------------
  const handleViewAttendance = (record) => {
    setSelectedAttendance(record);
    setViewAttendanceOpen(true);
  };
  const handleEditAttendance = (record) => {
    setSelectedAttendance(record);
    setEditAttendanceOpen(true);
  };

  async function handleEditAttendanceSubmit() {
    try {
      const id = selectedAttendance.AttendanceID;
      await axios.put(route('staff.attendance.update', id), selectedAttendance);
  
      // Update local arrays
      setAttendanceRecords((prev) =>
        prev.map((a) =>
          a.AttendanceID === id ? { ...a, ...selectedAttendance } : a
        )
      );
      setFilteredAttendance((prev) =>
        prev.map((a) =>
          a.AttendanceID === id ? { ...a, ...selectedAttendance } : a
        )
      );
  
      setEditAttendanceOpen(false);
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  }
  

  async function handleDeleteAttendance(attendanceID) {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(route('staff.attendance.destroy', attendanceID));
      setAttendanceRecords((prev) =>
        prev.filter((a) => a.AttendanceID !== attendanceID)
      );
      setFilteredAttendance((prev) =>
        prev.filter((a) => a.AttendanceID !== attendanceID)
      );
    } catch (error) {
      console.error('Error deleting attendance:', error);
    }
  }
  
  
// -------------- PAYROLL CRUD (No official "destroy" route) --------------
const handleViewPayroll = (record) => {
  setSelectedPayroll(record);
  setViewPayrollOpen(true);
};
const handleEditPayroll = (record) => {
  setSelectedPayroll(record);
  setEditPayrollOpen(true);
};

async function handleDeletePayroll(payrollID) {
  if (!confirm('Are you sure?')) return;
  try {
    await axios.delete(route('staff.payroll.destroy', payrollID));
    setPayrollRecords((prev) =>
      prev.filter((p) => p.PayrollID !== payrollID)
    );
    setFilteredPayroll((prev) =>
      prev.filter((p) => p.PayrollID !== payrollID)
    );
  } catch (error) {
    console.error('Error deleting payroll:', error);
  }
}

async function handleEditPayrollSubmit() {
  try {
    const payrollID = selectedPayroll.PayrollID;
    await axios.put(route('staff.payroll.update', payrollID), selectedPayroll);

    // Update local arrays
    setPayrollRecords((prev) =>
      prev.map((p) =>
        p.PayrollID === payrollID ? { ...p, ...selectedPayroll } : p
      )
    );
    setFilteredPayroll((prev) =>
      prev.map((p) =>
        p.PayrollID === payrollID ? { ...p, ...selectedPayroll } : p
      )
    );

    setEditPayrollOpen(false);
  } catch (err) {
    console.error('Error updating payroll:', err);
  }
}


  // -------------- TASKS CRUD (No official "destroy" route) --------------
  const handleViewTask = (record) => {
    setSelectedTask(record);
    setViewTaskOpen(true);
  };

  const handleEditTask = (record) => {
    setSelectedTask(record);
    setEditTaskOpen(true);
  };

  async function handleDeleteTask(taskID) {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(route('staff.tasks.destroy', taskID));
      setTaskRecords((prev) => prev.filter((t) => t.TaskID !== taskID));
      setFilteredTasks((prev) => prev.filter((t) => t.TaskID !== taskID));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }
  
  async function handleEditTaskSubmit() {
    try {
      const id = selectedTask.TaskID;
      await axios.put(route('staff.tasks.update', id), selectedTask);
  
      setTaskRecords((prev) =>
        prev.map((t) => (t.TaskID === id ? { ...t, ...selectedTask } : t))
      );
      setFilteredTasks((prev) =>
        prev.map((t) => (t.TaskID === id ? { ...t, ...selectedTask } : t))
      );
  
      setEditTaskOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }
  

 // -------------- SCHEDULE CRUD --------------
  const handleViewSchedule = (record) => {
    setSelectedSchedule(record);
    setViewScheduleOpen(true);
  };
  const handleEditSchedule = (record) => {
    setSelectedSchedule(record);
    setEditScheduleOpen(true);
  };

  async function handleEditScheduleSubmit() {
    try {
      const id = selectedSchedule.ScheduleID;
      await axios.put(route('staff.schedules.update', id), selectedSchedule);
  
      // Update local arrays
      setScheduleRecords((prev) =>
        prev.map((sc) => (sc.ScheduleID === id ? { ...sc, ...selectedSchedule } : sc))
      );
      setFilteredSchedule((prev) =>
        prev.map((sc) => (sc.ScheduleID === id ? { ...sc, ...selectedSchedule } : sc))
      );
  
      setEditScheduleOpen(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  }
  

  async function handleDeleteSchedule(scheduleID) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await axios.delete(route('staff.schedules.destroy', scheduleID));
  
      setScheduleRecords((prev) =>
        prev.filter((sc) => sc.ScheduleID !== scheduleID)
      );
      setFilteredSchedule((prev) =>
        prev.filter((sc) => sc.ScheduleID !== scheduleID)
      );
    } catch (error) {
      console.error(error);
    }
  }
  

// -------------- PRINT PAYSLIP --------------
const handlePrintPayslip = (staffRecord, payrollRecord) => {
  setPayslipStaffData(staffRecord);
  setPayslipPayrollData(payrollRecord);
  setPayslipOpen(true);
};

 // -------------- SEARCH & TAB SWITCH --------------
 const handleSearchChange = (e) => {
  const value = e.target.value.toLowerCase();
  setSearchTerm(value);

  if (activeTab === 0) {
    setFilteredStaff(
      staffRecords.filter((s) =>
        Object.values(s).some((val) => String(val).toLowerCase().includes(value))
      )
    );
  } else if (activeTab === 1) {
    setFilteredAttendance(
      attendanceRecords.filter((a) =>
        Object.values(a).some((val) => String(val).toLowerCase().includes(value))
      )
    );
  } else if (activeTab === 2) {
    setFilteredPayroll(
      payrollRecords.filter((p) =>
        Object.values(p).some((val) => String(val).toLowerCase().includes(value))
      )
    );
  } else if (activeTab === 3) {
    setFilteredTasks(
      taskRecords.filter((t) =>
        Object.values(t).some((val) => String(val).toLowerCase().includes(value))
      )
    );
  } else {
    setFilteredSchedule(
      scheduleRecords.filter((sc) =>
        Object.values(sc).some((val) => String(val).toLowerCase().includes(value))
      )
    );
  }
};

const handleTabChange = (e, newValue) => {
  setActiveTab(newValue);
  setSearchTerm("");
  // Reset filtered arrays
  if (newValue === 0) setFilteredStaff(staffRecords);
  else if (newValue === 1) setFilteredAttendance(attendanceRecords);
  else if (newValue === 2) setFilteredPayroll(payrollRecords);
  else if (newValue === 3) setFilteredTasks(taskRecords);
  else setFilteredSchedule(scheduleRecords);
};

  // -------------- OVERVIEW CARD DATA --------------
 // 1) Basic counts
 const totalStaff = staffRecords.length;

 // 2) Trainer count
 const trainerCount = staffRecords.filter(
   (s) => s.Role && s.Role.toLowerCase() === "trainer"
 ).length;

 // 3) Manager/Administrator count
 const managerCount = staffRecords.filter(
   (s) => s.Role && s.Role.toLowerCase() === "manager"
 ).length;

 // 4) Recent hires: staff hired in the past 30 days
 const today = new Date();
 const thirtyDaysAgo = new Date();
 thirtyDaysAgo.setDate(today.getDate() - 30);

 const recentHiresCount = staffRecords.filter((s) => {
   if (!s.DateHired) return false;
   const hiredDate = new Date(s.DateHired);
   return hiredDate >= thirtyDaysAgo;
 }).length;


  // ------------------- COLUMNS: TABLES -------------------
  const staffColumns = [
    { field: "StaffID", headerName: "Staff ID", width: 80 },
    { field: "FullName", headerName: "Full Name", width: 160 },
    { field: "Email", headerName: "Email", width: 160 },
    { field: "Phone", headerName: "Phone", width: 120 },
    { field: "Role", headerName: "Role", width: 120 },
{
  field: "Branch",
  headerName: "Branches",
  width: 250,
  renderCell: (params) => {
    // 'row.branches' is an array
    const branches = params.row.branches || [];
    // join them into a string
    return branches.map((b) => b.BranchName).join(", ");
  },
},    
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
    {
      field: "StaffID",
      headerName: "Staff Name",
      width: 150,
      renderCell: (params) => {
        // If it's eager loaded, the staff object is at row.staff
        return params.row.staff ? params.row.staff.FullName : "N/A";
      }
    },
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
    {
      field: "StaffID",
      headerName: "Staff Name",
      width: 150,
      renderCell: (params) => {
        // If it's eager loaded, the staff object is at row.staff
        return params.row.staff ? params.row.staff.FullName : "N/A";
      }
    },    
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
    {
      field: "StaffID",
      headerName: "Staff Name",
      width: 150,
      renderCell: (params) => {
        // If it's eager loaded, the staff object is at row.staff
        return params.row.staff ? params.row.staff.FullName : "N/A";
      }
    },
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
    {
      field: "StaffID",
      headerName: "Staff Name",
      width: 150,
      renderCell: (params) => {
        // If it's eager loaded, the staff object is at row.staff
        return params.row.staff ? params.row.staff.FullName : "N/A";
      }
    },    
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
          <Select
            value={branch}
            onChange={handleBranchChange}
            label="Branch"
          >
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <div style={{ height: 400, width: "100%" }}>
      <DataGrid
            rows={
              activeTab === 0
                ? filteredStaff
                : activeTab === 1
                ? filteredAttendance
                : activeTab === 2
                ? filteredPayroll
                : activeTab === 3
                ? filteredTasks
                : filteredSchedule
            }
            columns={
              activeTab === 0
                ? staffColumns
                : activeTab === 1
                ? attendanceColumns
                : activeTab === 2
                ? payrollColumns
                : activeTab === 3
                ? taskColumns
                : scheduleColumns
            }
            getRowId={(row) => {
              if (activeTab === 0) return row.StaffID;
              if (activeTab === 1) return row.AttendanceID;
              if (activeTab === 2) return row.PayrollID;
              if (activeTab === 3) return row.TaskID;
              return row.ScheduleID;
            }}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
          />        
          </div>
      </Paper>

      {/* ------------------- RENDER EXTERNAL LAYOUTS ------------------- */}
      {isAddStaffOpen && (
        <AddNewStaffLayout
          onClose={() => setAddStaffOpen(false)}
          onStaffAdded={(createdStaff) => {
            // either re-fetch from server
            // Inertia.get(route('staff.index'));

            // or update local state
            setStaffRecords((prev) => [...prev, createdStaff]);
            setFilteredStaff((prev) => [...prev, createdStaff]);
          }}
        />
      )}
      {isAddPayrollOpen && (
        <AddPayrollLayout
          onClose={() => setAddPayrollOpen(false)}
          onAdd={(newPayroll) => {
            axios.post(route('staff.payroll.store'), newPayroll)
              .then(res => {
                // Use the full payroll object from response
                setPayrollRecords(prev => [...prev, res.data.payroll]);
                setFilteredPayroll(prev => [...prev, res.data.payroll]);
              })
              .catch(err => console.error('Error adding payroll:', err));
          }}
          staffOptions={staffRecords.map((s) => ({
            value: s.StaffID,
            label: s.FullName,
            dailyRate: s.DailyRate,
            hourlyRate: s.HourlyRate,
            overtimeRate: s.OvertimeRate,          
          }))}
        />
      )}
            
            {isAddTaskOpen && (
            <AddStaffTaskLayout
              onClose={() => setAddTaskOpen(false)}
              onAdd={(newTask) => {
                axios.post(route('staff.tasks.store'), newTask)
                  .then(res => {
                    setTaskRecords(prev => [...prev, res.data.task]);
                    setFilteredTasks(prev => [...prev, res.data.task]);
                  })
                  .catch(err => console.error('Error adding task:', err));
              }}
              staffOptions={staffRecords.map((s) => ({
                value: s.StaffID,
                label: s.FullName,
              }))}
            />
          )}

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
                  <Typography variant="body1">{selectedStaff.branches[0].BranchID}</Typography>
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
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                value={selectedStaff.FullName}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, FullName: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                value={selectedStaff.Email}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, Email: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Phone"
                value={selectedStaff.Phone}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, Phone: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Role"
                value={selectedStaff.Role}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, Role: e.target.value }))
                }
              />

              {/* Instead of a numeric BranchID input, use a dropdown of branches */}
              <FormControl fullWidth margin="normal">
                  <InputLabel>Branches</InputLabel>
                  <Select
                    label="Branches"
                    multiple
                    value={selectedStaff.BranchIDs || []} // an array
                    onChange={(e) =>
                      setSelectedStaff((prev) => ({
                        ...prev,
                        BranchIDs: e.target.value, // an array of selected branch IDs
                      }))
                    }
                  >
                    {branchOptions.map((branch) => (
                      <MenuItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Date Hired"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={selectedStaff.DateHired || ""}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, DateHired: e.target.value }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Daily Rate"
                type="number"
                value={selectedStaff.DailyRate || 0}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({
                    ...prev,
                    DailyRate: Number(e.target.value) || 0,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Hourly Rate"
                type="number"
                value={selectedStaff.HourlyRate || 0}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({
                    ...prev,
                    HourlyRate: Number(e.target.value) || 0,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Overtime Rate"
                type="number"
                value={selectedStaff.OvertimeRate || 0}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({
                    ...prev,
                    OvertimeRate: Number(e.target.value) || 0,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Notes"
                multiline
                rows={2}
                value={selectedStaff.Notes || ""}
                onChange={(e) =>
                  setSelectedStaff((prev) => ({ ...prev, Notes: e.target.value }))
                }
              />
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
