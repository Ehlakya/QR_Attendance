const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeacherSubject = sequelize.define('TeacherSubject', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subjectType: {
    type: DataTypes.ENUM('Theory', 'Lab', 'Skill'),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'teacher_subjects'
});

module.exports = TeacherSubject;
