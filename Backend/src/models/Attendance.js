const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  attendanceType: {
    type: DataTypes.ENUM('Morning Attendance', 'Subject Attendance'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Late'),
    defaultValue: 'Present',
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true,
  }
  // studentId, qrId will be added by association
}, {
  timestamps: true,
  tableName: 'attendances',
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'qrId'] // Prevent Duplicate Attendance
    }
  ]
});

module.exports = Attendance;
