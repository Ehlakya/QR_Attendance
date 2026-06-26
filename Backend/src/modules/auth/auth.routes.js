const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/google', authController.googleLogin);
router.post('/admin-login', authController.adminLogin);
router.post('/mock-login', authController.mockLogin);
router.post('/student-login', authController.studentLogin);
router.post('/setup-teacher', authController.setupTeacher);

module.exports = router;
