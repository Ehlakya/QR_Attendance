const express = require('express');
const cors = require('cors');
const { errorConverter, errorHandler } = require('./shared/middlewares/error.middleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Basic route for testing
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running healthy', data: {} });
});

// Routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/students', require('./modules/student/student.routes'));
app.use('/api/v1/departments', require('./modules/department/department.routes'));
app.use('/api/v1/sections', require('./modules/section/section.routes'));
app.use('/api/v1/teachers', require('./modules/teacher/teacher.routes'));
app.use('/api/v1/qr', require('./modules/qr/qr.routes'));
app.use('/api/v1/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/api/v1/dashboard', require('./modules/dashboard/dashboard.routes'));

// Error handling
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
