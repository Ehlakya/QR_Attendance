const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/mark', attendanceController.markAttendance);
router.get('/history/:studentId', attendanceController.getAttendanceHistory);
router.get('/daily', attendanceController.getDailyAttendance);
router.get('/monthly', attendanceController.getMonthlyAttendance);
router.get('/session/:qrId', attendanceController.getSessionAttendance);
router.get('/live', attendanceController.getGlobalLiveAttendance);

module.exports = router;
