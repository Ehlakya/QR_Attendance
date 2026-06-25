const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Department = require('../../models/Department');
const Attendance = require('../../models/Attendance');
const Section = require('../../models/Section');
const sequelize = require('../../config/db');
const { sendResponse } = require('../../shared/utils/response');

const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await Student.count();
    const totalTeachers = await Teacher.count();
    const totalDepartments = await Department.count();
    const totalAttendance = await Attendance.count();

    // Department wise attendance (simple mock/aggregate approach)
    // In real app, we group by Department through Student
    
    return sendResponse(res, 200, 'Admin dashboard data', {
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalAttendance
    });
  } catch (error) {
    next(error);
  }
};

const getHODDashboard = async (req, res, next) => {
  try {
    const hod = await Teacher.findByPk(req.user.id);
    const departmentId = hod.departmentId;

    const totalStudents = await Student.count({ where: { departmentId } });
    const totalSections = await Section.count({ where: { departmentId } });

    return sendResponse(res, 200, 'HOD dashboard data', {
      totalStudents,
      totalSections
    });
  } catch (error) {
    next(error);
  }
};

const getClassTeacherDashboard = async (req, res, next) => {
  try {
    // Assuming Class Teacher is assigned to a section (we didn't add sectionId to Teacher model, but conceptually...)
    // For demo, just returning basic stats
    return sendResponse(res, 200, 'Class Teacher dashboard data', {
      message: 'Class Teacher stats'
    });
  } catch (error) {
    next(error);
  }
};

const getAdminStudentStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.count();
    
    // Using simple JS filtering for "today" to avoid SQLite date specific syntax for now
    const todayStr = new Date().toISOString().split('T')[0];
    const newRegistrationsToday = await Student.count({
      where: sequelize.where(sequelize.fn('date', sequelize.col('createdAt')), '=', todayStr)
    });

    const pendingRegistrations = await Student.count({ where: { status: 'Pending' } });
    const approvedStudents = await Student.count({ where: { status: 'Approved' } });

    // Include recent registrations
    const recentRegistrations = await Student.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return sendResponse(res, 200, 'Admin student stats', {
      totalStudents,
      newRegistrationsToday,
      pendingRegistrations,
      approvedStudents,
      recentRegistrations
    });
  } catch (error) {
    next(error);
  }
};

const getAdminTeacherStats = async (req, res, next) => {
  try {
    const totalTeachers = await Teacher.count();
    const totalHODs = await Teacher.count({ where: { role: 'HOD' } });
    const totalClassTeachers = await Teacher.count({ where: { role: 'Class Teacher' } });
    const totalSubjectTeachers = await Teacher.count({ where: { role: 'Subject Teacher' } });

    const teachersList = await Teacher.findAll({
      include: [{ model: Department, as: 'Department' }]
    });

    return sendResponse(res, 200, 'Admin teacher stats', {
      totalTeachers,
      totalHODs,
      totalClassTeachers,
      totalSubjectTeachers,
      teachersList
    });
  } catch (error) {
    next(error);
  }
};

const getAdminAttendanceDetails = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const totalStudents = await Student.count({ where: { status: 'Approved' } });
    
    // Count distinct students present today
    const presentCountResult = await Attendance.count({
      where: { date: todayStr, status: 'Present' },
      distinct: true,
      col: 'studentId'
    });
    const presentStudentsToday = presentCountResult;
    const absentStudentsToday = totalStudents - presentStudentsToday;
    const attendancePercentage = totalStudents === 0 ? 0 : ((presentStudentsToday / totalStudents) * 100).toFixed(1);

    // Mock department wise attendance (in a real app, complex join)
    const departments = await Department.findAll();
    const departmentWise = await Promise.all(departments.map(async (dept) => {
      const deptStudentsCount = await Student.count({ where: { departmentId: dept.id, status: 'Approved' } });
      const deptPresentCount = await Attendance.count({
        where: { date: todayStr, status: 'Present' },
        include: [{ model: Student, where: { departmentId: dept.id } }],
        distinct: true,
        col: 'studentId'
      });
      const deptAbsentCount = deptStudentsCount - deptPresentCount;
      const deptAttendancePercentage = deptStudentsCount === 0 ? 0 : ((deptPresentCount / deptStudentsCount) * 100).toFixed(1);

      return {
        department: dept.name,
        totalStudents: deptStudentsCount,
        present: deptPresentCount,
        absent: deptAbsentCount,
        attendancePercentage: deptAttendancePercentage + '%'
      };
    }));

    const recentActivity = await Attendance.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{ model: Student, include: [Department, Section] }]
    });

    return sendResponse(res, 200, 'Admin attendance details', {
      overall: {
        totalStudents,
        presentStudentsToday,
        absentStudentsToday,
        attendancePercentage: attendancePercentage + '%'
      },
      departmentWise,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getHODDashboard,
  getClassTeacherDashboard,
  getAdminStudentStats,
  getAdminTeacherStats,
  getAdminAttendanceDetails
};
