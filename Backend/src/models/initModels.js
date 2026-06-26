const Admin = require('./Admin');
const Department = require('./Department');
const Section = require('./Section');
const Teacher = require('./Teacher');
const Student = require('./Student');
const QR = require('./QR');
const Attendance = require('./Attendance');
const Notification = require('./Notification');
const TeacherSubject = require('./TeacherSubject');

const initModels = () => {
  // Department hasMany Sections
  Department.hasMany(Section, { foreignKey: 'departmentId' });
  Section.belongsTo(Department, { foreignKey: 'departmentId' });

  // Department hasMany Teachers
  Department.hasMany(Teacher, { foreignKey: 'departmentId' });
  Teacher.belongsTo(Department, { foreignKey: 'departmentId' });

  // Department hasMany Students
  Department.hasMany(Student, { foreignKey: 'departmentId' });
  Student.belongsTo(Department, { foreignKey: 'departmentId' });

  // Section hasMany Students
  Section.hasMany(Student, { foreignKey: 'sectionId' });
  Student.belongsTo(Section, { foreignKey: 'sectionId' });

  // QR Associations
  Teacher.hasMany(QR, { foreignKey: 'teacherId' });
  QR.belongsTo(Teacher, { foreignKey: 'teacherId' });

  Department.hasMany(QR, { foreignKey: 'departmentId' });
  QR.belongsTo(Department, { foreignKey: 'departmentId' });

  Section.hasMany(QR, { foreignKey: 'sectionId' });
  QR.belongsTo(Section, { foreignKey: 'sectionId' });

  // Attendance Associations
  Student.hasMany(Attendance, { foreignKey: 'studentId' });
  Attendance.belongsTo(Student, { foreignKey: 'studentId' });

  QR.hasMany(Attendance, { foreignKey: 'qrId' });
  Attendance.belongsTo(QR, { foreignKey: 'qrId' });

  // Notification Associations
  Teacher.hasMany(Notification, { foreignKey: 'teacherId' });
  Notification.belongsTo(Teacher, { foreignKey: 'teacherId' });

  // TeacherSubject Associations
  Teacher.hasMany(TeacherSubject, { foreignKey: 'teacherId' });
  TeacherSubject.belongsTo(Teacher, { foreignKey: 'teacherId' });

  Department.hasMany(TeacherSubject, { foreignKey: 'departmentId' });
  TeacherSubject.belongsTo(Department, { foreignKey: 'departmentId' });

  Section.hasMany(TeacherSubject, { foreignKey: 'sectionId' });
  TeacherSubject.belongsTo(Section, { foreignKey: 'sectionId' });
};

module.exports = {
  initModels,
  Admin,
  Department,
  Section,
  Teacher,
  Student,
  QR,
  Attendance,
  Notification,
  TeacherSubject
};
