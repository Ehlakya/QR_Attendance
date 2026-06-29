const express = require('express');
const router = express.Router();
const sectionController = require('./section.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

// Make GET public for Registration forms
router.get('/', sectionController.getAllSections);

router.post('/', authMiddleware, roleMiddleware('admin', 'HOD'), sectionController.createSection);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'HOD'), sectionController.updateSection);
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'HOD'), sectionController.deleteSection);

module.exports = router;
