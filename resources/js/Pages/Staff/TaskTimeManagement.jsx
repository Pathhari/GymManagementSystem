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

export default function TaskTimeManagement() {
  const [staffId, setStaffId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState([]);

  // Function to add log entries
  const addLog = (message) => {
    setLogs((prev) => [{ time: new Date(), message }, ...prev]);
  };

  // 1) Load initial data
  useEffect(() => {
    fetch("/staff/dashboard-info")
      .then(res => res.json())
      .then(data => {
        if (data.staffId) setStaffId(data.staffId);
        if (data.tasks) {
          const normalized = data.tasks.map(item => ({
            ...item,
            status: item.Status,            // <-- copy over Status to status
            description: item.TaskDescription,
          }));
          setTasks(normalized);
        }
        if (data.attendance) setAttendance(data.attendance);
        if (data.schedule) setSchedule(data.schedule);
      })
      .catch(err => console.error("Failed to load dashboard info:", err));
  }, []);

  // Update currentTime every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Separate tasks by status
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const inProgressTasks = tasks.filter((t) => t.status === "InProgress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  // Drag & Drop
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // reorder array in memory
    const updatedTasks = reorder(tasks, source.index, destination.index);
    // find the movedTask
    const movedTask = updatedTasks[destination.index];
    // update local status
    const previousStatus = movedTask.status;
    movedTask.status = destination.droppableId;
    setTasks(updatedTasks);

    // Log the task move
    addLog(`Task "${movedTask.description || "Untitled Task"}" moved from ${previousStatus} to ${destination.droppableId} at ${new Date().toLocaleTimeString()}`);

    // Optionally persist changes:
    if (movedTask.TaskID) {
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
        // We'll do a PUT to /staff/tasks/:id, sending the updated status
        await fetch(`/staff/tasks/${movedTask.TaskID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({ Status: movedTask.status }),
        });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }
  };

  // Clock In/Out handler
  const handleClockInOut = () => {
    const action = isClockedIn ? "Clock Out" : "Clock In";
    setIsClockedIn(!isClockedIn);
    addLog(`${action} at ${new Date().toLocaleTimeString()}`);
    // Optionally, send a request to persist clock in/out info
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
                {task.description || "Untitled Task"}
              </Typography>
              {statusChips[task.status]}
            </Box>
            <Box mt={1} display="flex" justifyContent="space-between">
              {task.TaskDate ? (
                <Typography variant="caption">
                  Due: {new Date(task.TaskDate).toLocaleDateString()}
                </Typography>
              ) : (
                <Typography variant="caption" color="textSecondary">
                  No due date
                </Typography>
              )}
              <Avatar sx={{ width: 24, height: 24 }}>
                {task.staff
                  ? (task.staff.FullName || "?").charAt(0)
                  : "?"}
              </Avatar>
            </Box>
          </Paper>
        )}
      </Draggable>
    );
  };

  // Setup columns and logs UI
  return (
    <Box sx={{ p: 4 }}>
      {/* Header: Task Management & Real-Time Clock */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Task Management
        </Typography>
      
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      <Box display="flex" gap={3}>
        {/* Task Columns */}
        <Box sx={{ flex: 2 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Box display="flex" gap={3}>
              {/* PENDING COLUMN */}
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

              {/* IN-PROGRESS COLUMN */}
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

              {/* COMPLETED COLUMN */}
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

        {/* Activity Logs */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" mb={2}>
            Activity Logs
          </Typography>
          <Paper sx={{ maxHeight: 400, overflow: "auto", p: 2 }}>
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <Typography key={idx} variant="caption" display="block" gutterBottom>
                  [{new Date(log.time).toLocaleTimeString()}] {log.message}
                </Typography>
              ))
            ) : (
              <Typography variant="caption" color="textSecondary">
                No logs yet.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
