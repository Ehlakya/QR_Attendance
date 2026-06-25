const express = require('express');
const router = express.Router();
const studentController = require('./student.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

// Public route for student registration
router.post('/register', studentController.createStudent);

// Apply auth middleware to all other routes
router.use(authMiddleware);

router.get('/profile', studentController.getStudentProfile);
router.put('/profile', roleMiddleware('Student'), studentController.updateOwnProfile);
router.put('/profile/password', roleMiddleware('Student'), studentController.changePassword);

router.post('/', roleMiddleware('admin', 'HOD'), studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.put('/:id/status', roleMiddleware('admin', 'ADMIN', 'HOD', 'Class Teacher', 'Subject Teacher'), studentController.updateStudentStatus);
router.get('/:id', roleMiddleware('admin', 'HOD', 'Class Teacher'), studentController.getStudentById);
router.put('/:id', roleMiddleware('admin'), studentController.updateStudent);
router.delete('/:id', roleMiddleware('admin'), studentController.deleteStudent);

module.exports = router;
