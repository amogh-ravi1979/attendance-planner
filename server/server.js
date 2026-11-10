const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

let attendanceRecords = [];
let nextId = 1;

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Attendance Planner API is running"
  });
});

// Get all attendance records
app.get("/api/attendance", (req, res) => {
  res.json({
    success: true,
    data: attendanceRecords
  });
});

// Add attendance record
app.post("/api/attendance", (req, res) => {
  const {
    subject = "General",
    totalClasses,
    attendedClasses,
    targetAttendance = 75
  } = req.body;

  const total = Number(totalClasses);
  const attended = Number(attendedClasses);
  const target = Number(targetAttendance);

  if (
    !Number.isInteger(total) ||
    !Number.isInteger(attended) ||
    total <= 0 ||
    attended < 0 ||
    attended > total ||
    !Number.isFinite(target) ||
    target < 0 ||
    target > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter valid attendance details."
    });
  }

  const record = {
    id: nextId++,
    subject,
    totalClasses: total,
    attendedClasses: attended,
    targetAttendance: target,
    currentAttendance: Number(((attended / total) * 100).toFixed(2))
  };

  attendanceRecords.push(record);

  res.status(201).json({
    success: true,
    data: record
  });
});

// Delete attendance record
app.delete("/api/attendance/:id", (req, res) => {
  const id = Number(req.params.id);

  const initialLength = attendanceRecords.length;

  attendanceRecords = attendanceRecords.filter(
    record => record.id !== id
  );

  if (attendanceRecords.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: "Attendance record not found"
    });
  }

  res.json({
    success: true,
    message: "Attendance record deleted"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});