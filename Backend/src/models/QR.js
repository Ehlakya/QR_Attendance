const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QR = sequelize.define('QR', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('Morning Attendance', 'Subject Attendance'),
    allowNull: false,
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiryTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true,
  }
  // teacherId, departmentId, sectionId will be added by association
}, {
  timestamps: true,
  tableName: 'qrs'
});

module.exports = QR;
