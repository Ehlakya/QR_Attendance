const express = require('express');
const router = express.Router();
const teacherController = require('./teacher.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

router.use(authMiddleware);

router.post('/', roleMiddleware('admin', 'HOD'), teacherController.createTeacher);
router.get('/', teacherController.getAllTeachers);

// Subject assignments
router.post('/subjects', roleMiddleware('Class Teacher', 'Subject Teacher', 'HOD', 'admin'), teacherController.assignSubjects);
router.get('/subjects', roleMiddleware('Class Teacher', 'Subject Teacher', 'HOD', 'admin'), teacherController.getAssignedSubjects);

router.get('/:id', teacherController.getTeacherById);

router.delete('/:id', roleMiddleware('admin'), teacherController.deleteTeacher);

module.exports = router;
