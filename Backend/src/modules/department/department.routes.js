const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

router.use(authMiddleware);

router.post('/', roleMiddleware('admin'), departmentController.createDepartment);
router.get('/', departmentController.getAllDepartments);
router.put('/:id', roleMiddleware('admin'), departmentController.updateDepartment);
router.delete('/:id', roleMiddleware('admin'), departmentController.deleteDepartment);

module.exports = router;
