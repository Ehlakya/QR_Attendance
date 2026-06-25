const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', notificationController.createNotification); // might need role restriction
router.get('/', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
