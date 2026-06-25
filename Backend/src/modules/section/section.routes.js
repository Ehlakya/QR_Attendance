const express = require('express');
const router = express.Router();
const sectionController = require('./section.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

router.use(authMiddleware);

router.post('/', roleMiddleware('admin', 'HOD'), sectionController.createSection);
router.get('/', sectionController.getAllSections);
router.put('/:id', roleMiddleware('admin', 'HOD'), sectionController.updateSection);
router.delete('/:id', roleMiddleware('admin', 'HOD'), sectionController.deleteSection);

module.exports = router;
