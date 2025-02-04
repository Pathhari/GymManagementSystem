import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "react-beautiful-dnd";
import {
  AccessTime,
  AlarmOn,
  AlarmOff,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  WorkOutline as WorkOutlineIcon,
  Done as DoneIcon,
} from "@mui/icons-material";

/** Reorders array items after drag-and-drop */
function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/** Background colors for columns */
const statusColors = {
  Pending: "#ffd8b2",
  InProgress: "#d0d0ff",
  Completed: "#c8e6c9",
};

/** Style for each draggable item */
function getItemStyle(isDragging, draggableStyle) {
  return {
    userSelect: "none",
    padding: 16,
    margin: "0 0 8px 0",
    background: isDragging ? "#9c27b0" : "#fff",
    color: isDragging ? "#fff" : "#000",
    borderRadius: 4,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    ...draggableStyle,
  };
}

/** Style for each droppable column */
function getListStyle(droppableId, isDraggingOver) {
  return {
    background: isDraggingOver ? "#f0f0f0" : statusColors[droppableId] || "#f5f5f5",
    padding: 8,
    width: 300,
    minHeight: 400,
    borderRadius: 8,
  };
}

export default function TimeTaskManagement() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Keep clock updated every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tasks, attendance, schedule on mount
  useEffect(() => {
    fetch("/staff/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      })
      .catch((err) => console.error("Failed to load tasks:", err));

    fetch("/staff/attendance")
      .then((res) => res.json())
      .then((data) => {
        setAttendance(Array.isArray(data) ? data : data.attendance || []);
      })
      .catch((err) => console.error("Failed to load attendance:", err));

    fetch("/staff/schedules")
      .then((res) => res.json())
      .then((data) => {
        setSchedule(Array.isArray(data) ? data : data.schedule || []);
      })
      .catch((err) => console.error("Failed to load schedule:", err));
  }, []);

  // Separate tasks by status
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const inProgressTasks = tasks.filter((t) => t.status === "InProgress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  // Drag & Drop
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const updatedTasks = reorder(tasks, source.index, destination.index);
    const movedTask = updatedTasks[destination.index];
    movedTask.status = destination.droppableId;
    setTasks(updatedTasks);

    // Optionally persist changes
    /*
    fetch(`/staff/tasks/${movedTask.TaskID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ status: movedTask.status }),
    })
    .then(...)
    */
  };

  // Clock In/Out with StaffID=1
  const handleClockInOut = async () => {
    // This staff ID must exist in your staff table
    const staffId = 1;

    // Format date => "YYYY-MM-DD"
    const dateStr = new Date().toISOString().split("T")[0];

    // Format time => "HH:mm" (no seconds)
    const fullTimeStr = currentTime.toLocaleTimeString("it-IT"); // e.g. "01:10:55"
    const timeStr = fullTimeStr.slice(0,5); // => "01:10"

    const clockData = {
      StaffID: staffId,
      Date: dateStr,
      TimeIn: isClockedIn ? null : timeStr,
      TimeOut: isClockedIn ? timeStr : null,
    };

    try {
      // Grab CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

      const response = await fetch("/staff/attendance/clock-in-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,       // <--- CSRF token
          "Accept": "application/json",    // to ensure JSON response
        },
        body: JSON.stringify(clockData),
      });
      if (!response.ok) {
        throw new Error(`Clock in/out failed with status ${response.status}`);
      }

      const respData = await response.json();
      console.log("Clock in/out recorded:", respData);

      // Refresh attendance
      const attendRes = await fetch("/staff/attendance");
      if (!attendRes.ok) {
        throw new Error(`Failed to fetch updated attendance: ${attendRes.status}`);
      }
      const finalData = await attendRes.json();
      setAttendance(Array.isArray(finalData) ? finalData : finalData.attendance || []);

      // Toggle local isClockedIn
      setIsClockedIn(!isClockedIn);

    } catch (err) {
      console.error("Failed to record attendance:", err);
    }
  };

  // Status chips
  const statusChips = {
    Pending: <Chip label="Pending" color="warning" size="small" />,
    InProgress: <Chip label="In Progress" color="info" size="small" />,
    Completed: <Chip label="Completed" color="success" size="small" />,
  };

  // Renders each task item
  const renderTaskItem = (task, idx) => {
    const taskId = task.TaskID || task.id || `temp-${idx}`;
    return (
      <Draggable key={taskId} draggableId={String(taskId)} index={idx}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
          >
            <Box display="flex" justifyContent="space-between">
              <Typography variant="subtitle2">
                {task.title || task.TaskDescription || "Untitled Task"}
              </Typography>
              {statusChips[task.status]}
            </Box>
            <Typography variant="body2" color="textSecondary">
              {task.description || task.TaskDescription}
            </Typography>
            <Box mt={1} display="flex" justifyContent="space-between">
              {task.dueDate ? (
                <Typography variant="caption">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              ) : (
                <Typography variant="caption" color="textSecondary">
                  No due date
                </Typography>
              )}
              <Avatar sx={{ width: 24, height: 24 }}>
                {task.assignedTo
                  ? task.assignedTo.charAt(0)
                  : task.staff
                  ? task.staff.FullName.charAt(0)
                  : "?"}
              </Avatar>
            </Box>
          </Paper>
        )}
      </Draggable>
    );
  };

  return (
    <Box sx={{ p: 4, display: "flex", gap: 3 }}>
      {/* LEFT: Time & Attendance */}
      <Box sx={{ width: 400 }}>
        <Paper sx={{ p: 2, mb: 3, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            <AccessTime /> {currentTime.toLocaleTimeString()}
          </Typography>
          <Button
            variant="contained"
            color={isClockedIn ? "error" : "success"}
            onClick={handleClockInOut}
            fullWidth
            sx={{ mt: 2 }}
          >
            {isClockedIn ? (
              <>
                <AlarmOff /> Clock Out
              </>
            ) : (
              <>
                <AlarmOn /> Clock In
              </>
            )}
          </Button>
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <ScheduleIcon /> Work Schedule
          </Typography>
          {schedule.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No schedules found.
            </Typography>
          ) : (
            schedule.map((shift, idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1 }}>
                <Typography>
                  {shift.ShiftDate
                    ? new Date(shift.ShiftDate).toLocaleDateString()
                    : "Unknown Date"}
                </Typography>
                <Typography color="textSecondary">
                  {shift.ShiftStart || "??:??"} - {shift.ShiftEnd || "??:??"}
                </Typography>
              </Paper>
            ))
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Attendance History
          </Typography>
          {attendance.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No attendance records found.
            </Typography>
          ) : (
            attendance.map((entry, idx) => (
              <Box key={idx} display="flex" justifyContent="space-between" p={1}>
                <Typography>
                  {entry.Date
                    ? new Date(entry.Date).toLocaleDateString()
                    : "Unknown Date"}
                </Typography>
                <Typography color="textSecondary">
                  {entry.TimeIn || ""}
                  {entry.TimeOut ? ` - ${entry.TimeOut}` : ""}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      {/* RIGHT: Task Management */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" mb={2}>
          Task Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <DragDropContext onDragEnd={onDragEnd}>
          <Box display="flex" gap={3}>
            <Droppable droppableId="Pending">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("Pending", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" p={2}>
                    <PendingIcon /> Pending ({pendingTasks.length})
                  </Typography>
                  {pendingTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            <Droppable droppableId="InProgress">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("InProgress", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" p={2}>
                    <WorkOutlineIcon /> In Progress ({inProgressTasks.length})
                  </Typography>
                  {inProgressTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            <Droppable droppableId="Completed">
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("Completed", snapshot.isDraggingOver)}
                >
                  <Typography variant="h6" p={2}>
                    <DoneIcon /> Completed ({completedTasks.length})
                  </Typography>
                  {completedTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>
          </Box>
        </DragDropContext>
      </Box>
    </Box>
  );
}
