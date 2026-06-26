const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

router.use(authMiddleware);

router.get('/admin', roleMiddleware('admin', 'ADMIN'), dashboardController.getAdminDashboard);
router.get('/admin/students', roleMiddleware('admin', 'ADMIN'), dashboardController.getAdminStudentStats);
router.get('/admin/teachers', roleMiddleware('admin', 'ADMIN'), dashboardController.getAdminTeacherStats);
router.get('/admin/attendance-details', roleMiddleware('admin', 'ADMIN'), dashboardController.getAdminAttendanceDetails);

router.get('/hod', roleMiddleware('HOD'), dashboardController.getHODDashboard);
router.get('/class-teacher', roleMiddleware('Class Teacher'), dashboardController.getClassTeacherDashboard);
router.get('/6-month-report/:studentId', roleMiddleware('admin', 'ADMIN', 'HOD', 'Class Teacher', 'Subject Teacher'), dashboardController.getStudentSixMonthReport);
router.get('/6-month-overview', roleMiddleware('admin', 'ADMIN', 'HOD', 'Class Teacher', 'Subject Teacher'), dashboardController.getSixMonthDashboardOverview);

module.exports = router;
