const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeacherSubject = sequelize.define('TeacherSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  teacherId: {
    type: DataTypes.UUID,
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
    type: DataTypes.UUID,
    allowNull: true
  },
  sectionId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'teacher_subjects'
});

module.exports = TeacherSubject;
