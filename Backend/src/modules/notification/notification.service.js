const Notification = require('../../models/Notification');
const { getIO } = require('../../config/socket');

/**
 * Creates a notification and emits a socket event
 * @param {Object} params - { userId, userRole, type, title, message, relatedId }
 */
const createAndEmitNotification = async ({ userId, userRole, type, title, message, relatedId }) => {
  try {
    const notification = await Notification.create({
      userId,
      userRole,
      type: type || 'Info',
      title,
      message,
      relatedId: relatedId || null
    });

    const io = getIO();
    // Emit to a specific user's room (Frontend must join this room on connect)
    io.to(`${userRole}_${userId}`).emit('new_notification', notification);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  createAndEmitNotification
};
