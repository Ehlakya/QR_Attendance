const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Alert', 'Info', 'Warning'),
    defaultValue: 'Info',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
  // teacherId will be added by association
}, {
  timestamps: true,
  tableName: 'notifications'
});

module.exports = Notification;
