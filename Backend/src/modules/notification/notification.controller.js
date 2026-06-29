const Notification = require('../../models/Notification');
const Teacher = require('../../models/Teacher');
const Admin = require('../../models/Admin');
const { sendResponse } = require('../../shared/utils/response');

const createNotification = async (req, res, next) => {
  try {
    const { message, type, targetRoles, departmentId } = req.body;
    
    // In a real app, this might be triggered internally. If via API, we handle targets.
    // targetRoles could be ['HOD', 'Class Teacher', 'Subject Teacher', 'admin']
    let usersToNotify = [];

    if (targetRoles.includes('admin')) {
      // Admins don't have teacherId in Notification model by default,
      // but if we keep it generic we could store adminId or just not associate for admins
    }

    if (departmentId) {
      const teachers = await Teacher.findAll({
        where: { departmentId, role: targetRoles.filter(r => r !== 'admin') }
      });
      usersToNotify.push(...teachers);
    }

    const notifications = usersToNotify.map(user => ({
      message,
      type,
      teacherId: user.id
    }));

    await Notification.bulkCreate(notifications);

    return sendResponse(res, 201, 'Notifications sent and logged successfully');
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id, userRole: req.user.role },
      order: [['createdAt', 'DESC']]
    });
    return sendResponse(res, 200, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.update({ isRead: true }, { where: { id, userId: req.user.id, userRole: req.user.role } });
    return sendResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, userRole: req.user.role, isRead: false } });
    return sendResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
