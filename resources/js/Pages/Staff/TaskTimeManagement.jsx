import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "react-beautiful-dnd";
import {
  AccessTime,
  Schedule,
  Done,
  Pending,
  WorkOutline,
  AlarmOn,
  AlarmOff,
  Add
} from "@mui/icons-material";


const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const statusColors = {
  Pending: "#ffd8b2",
  Completed: "#c8e6c9",
  InProgress: "#d0d0ff",
};

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: 16,
  margin: "0 0 8px 0",
  background: isDragging ? "#9c27b0" : "#fff",
  color: isDragging ? "#fff" : "#000",
  borderRadius: 4,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  ...draggableStyle,
});

const getListStyle = (droppableId, isDraggingOver) => ({
  background: isDraggingOver ? "#f0f0f0" : statusColors[droppableId] || "#f5f5f5",
  padding: 8,
  width: 300,
  minHeight: 400,
  borderRadius: 8,
});

export default function TaskTimeManagement() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Clock functionality
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    // Fetch tasks
    fetch("/staff/tasks")
      .then(res => res.json())
      .then(data => setTasks(data.tasks || []));

    // Fetch attendance
    fetch("/staff/attendance")
      .then(res => res.json())
      .then(data => setAttendance(data.attendance || []));

    // Fetch schedule
    fetch("/staff/schedule")
      .then(res => res.json())
      .then(data => setSchedule(data.schedule || []));
  }, []);

  // Task status columns
  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const inProgressTasks = tasks.filter(t => t.status === "InProgress");
  const completedTasks = tasks.filter(t => t.status === "Completed");

  // Drag and drop handlers
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const updatedTasks = reorder(
      tasks,
      source.index,
      destination.index
    );
    
    const movedTask = updatedTasks[destination.index];
    movedTask.status = destination.droppableId;
    
    setTasks(updatedTasks);
    // Add API call to update task status here
  };

  // Clock in/out
  const handleClockInOut = () => {
    const newAttendance = {
      date: new Date().toISOString().split('T')[0],
      time: currentTime.toLocaleTimeString(),
      type: isClockedIn ? "ClockOut" : "ClockIn"
    };

    setAttendance(prev => [newAttendance, ...prev]);
    setIsClockedIn(!isClockedIn);
    // Add API call to record attendance here
  };


  // Task status chips
  const statusChips = {
    Pending: <Chip label="Pending" color="warning" size="small" />,
    InProgress: <Chip label="In Progress" color="info" size="small" />,
    Completed: <Chip label="Completed" color="success" size="small" />
  };

  const renderTaskItem = (task, index) => (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle2">{task.title}</Typography>
            {statusChips[task.status]}
          </Box>
          <Typography variant="body2" color="textSecondary">
            {task.description}
          </Typography>
          <Box mt={1} display="flex" justifyContent="space-between">
            <Typography variant="caption">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </Typography>
            <Avatar sx={{ width: 24, height: 24 }}>
              {task.assignedTo.charAt(0)}
            </Avatar>
          </Box>
        </Paper>
      )}
    </Draggable>
  );

  return (
    <Box sx={{ display: "flex", gap: 3, p: 4 }}>
      {/* Left Column - Task Management */}
      <Box flex={1}>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h4">Task Management</Typography>

        </Box>
        <Divider sx={{ mb: 2 }} />
        <DragDropContext onDragEnd={onDragEnd}>
          <Box display="flex" gap={3}>
            <Droppable droppableId="Pending">
              {(provided) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("Pending")}
                >
                  <Typography variant="h6" p={2}>
                    <Pending /> Pending ({pendingTasks.length})
                  </Typography>
                  {pendingTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            <Droppable droppableId="InProgress">
              {(provided) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("InProgress")}
                >
                  <Typography variant="h6" p={2}>
                    <WorkOutline /> In Progress ({inProgressTasks.length})
                  </Typography>
                  {inProgressTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>

            <Droppable droppableId="Completed">
              {(provided) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle("Completed")}
                >
                  <Typography variant="h6" p={2}>
                    <Done /> Completed ({completedTasks.length})
                  </Typography>
                  {completedTasks.map(renderTaskItem)}
                  {provided.placeholder}
                </Paper>
              )}
            </Droppable>
          </Box>
        </DragDropContext>
      </Box>

      {/* Right Column - Time & Attendance */}
      <Box width={400}>
        <Paper sx={{ p: 2, mb: 3, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            <AccessTime /> {currentTime.toLocaleTimeString()}
          </Typography>
          <Button
            variant="contained"
            color={isClockedIn ? "error" : "success"}
            startIcon={isClockedIn ? <AlarmOff /> : <AlarmOn />}
            onClick={handleClockInOut}
            fullWidth
          >
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            <Schedule /> Work Schedule
          </Typography>
          {schedule.map((shift, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1 }}>
              <Typography>
                {new Date(shift.date).toLocaleDateString()}
              </Typography>
              <Typography color="textSecondary">
                {shift.startTime} - {shift.endTime}
              </Typography>
            </Paper>
          ))}
        </Paper>

        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Attendance History
          </Typography>
          {attendance.map((entry, index) => (
            <Box key={index} display="flex" justifyContent="space-between" p={1}>
              <Typography>{entry.date}</Typography>
              <Typography color="textSecondary">
                {entry.time} - {entry.type}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>

      
    </Box>
  );
}