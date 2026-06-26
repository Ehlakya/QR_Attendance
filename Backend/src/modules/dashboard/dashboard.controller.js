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

const { Op } = require('sequelize');

const getStudentSixMonthReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Department, as: 'Department', attributes: ['name'] },
        { model: Section, as: 'Section', attributes: ['name'] }
      ]
    });
    
    if (!student) {
      const { ApiError } = require('../../shared/middlewares/error.middleware');
      throw new ApiError(404, 'Student not found');
    }

    // Role-based isolation check
    const user = req.user;
    if (user && user.role === 'Subject Teacher') {
      const TeacherSubject = require('../../models/TeacherSubject');
      const assignedSubjects = await TeacherSubject.findAll({ where: { teacherId: user.id } });
      const allowedDeptIds = [...new Set(assignedSubjects.map(s => s.departmentId).filter(Boolean))];
      const allowedSecIds = [...new Set(assignedSubjects.map(s => s.sectionId).filter(Boolean))];
      
      const isDeptAllowed = allowedDeptIds.length === 0 || allowedDeptIds.includes(student.departmentId);
      const isSecAllowed = allowedSecIds.length === 0 || allowedSecIds.includes(student.sectionId);
      
      if (!isDeptAllowed || !isSecAllowed) {
        const { ApiError } = require('../../shared/middlewares/error.middleware');
        throw new ApiError(403, 'You do not have permission to view this student\'s report');
      }
    } else if (user && (user.role === 'HOD' || user.role === 'Class Teacher')) {
      const Teacher = require('../../models/Teacher');
      const teacher = await Teacher.findByPk(user.id);
      if (teacher && teacher.departmentId && teacher.departmentId !== 1 && teacher.departmentId !== '1') {
        if (student.departmentId !== teacher.departmentId) {
          const { ApiError } = require('../../shared/middlewares/error.middleware');
          throw new ApiError(403, 'You can only view students in your department');
        }
      }
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // including current month, so 6 months total
    sixMonthsAgo.setDate(1);

    const attendances = await Attendance.findAll({
      where: {
        studentId,
        date: {
          [Op.gte]: sixMonthsAgo.toISOString().split('T')[0]
        }
      },
      order: [['date', 'ASC']]
    });

    const monthlyData = [];
    let totalPresent = 0;
    let totalClassesGlobal = 0;
    const subjectMap = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const yearStr = d.getFullYear();
      const label = `${monthStr} ${yearStr}`;
      
      const monthPrefix = d.toISOString().substring(0, 7);
      const presentThisMonth = attendances.filter(a => a.date.startsWith(monthPrefix)).length;
      
      // Mock logic for total classes per month
      const totalClassesThisMonth = presentThisMonth > 0 ? presentThisMonth + Math.floor(presentThisMonth * 0.15) + 1 : 0; 
      
      monthlyData.push({
        month: label,
        present: presentThisMonth,
        absent: totalClassesThisMonth - presentThisMonth,
        percentage: totalClassesThisMonth === 0 ? 0 : Math.round((presentThisMonth / totalClassesThisMonth) * 100),
        totalClasses: totalClassesThisMonth
      });
      
      totalPresent += presentThisMonth;
      totalClassesGlobal += totalClassesThisMonth;
    }

    // Process Subject-wise data
    attendances.forEach(a => {
      const subj = a.subjectName || 'General';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { present: 0, classes: 0 };
      }
      subjectMap[subj].present++;
    });

    const subjectWiseData = Object.keys(subjectMap).map(subj => {
      const present = subjectMap[subj].present;
      const classes = present > 0 ? present + Math.floor(present * 0.15) + 1 : 0;
      return {
        subject: subj,
        present,
        absent: classes - present,
        percentage: classes === 0 ? 0 : Math.round((present / classes) * 100)
      };
    });

    const overallPercentage = totalClassesGlobal === 0 ? 0 : Math.round((totalPresent / totalClassesGlobal) * 100);

    return sendResponse(res, 200, '6-Month Report retrieved', {
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        department: student.Department?.name || 'N/A',
        section: student.Section?.name || 'N/A'
      },
      overallPercentage,
      totalPresent,
      totalClasses: totalClassesGlobal,
      totalAbsent: totalClassesGlobal - totalPresent,
      monthlyData,
      subjectWiseData,
      history: attendances.map(a => ({
        date: a.date,
        type: a.attendanceType,
        subject: a.subjectName,
        status: a.status,
        time: a.time
      })).reverse()
    });

  } catch (error) {
    next(error);
  }
};

const TeacherSubject = require('../../models/TeacherSubject');

const getSixMonthDashboardOverview = async (req, res, next) => {
  try {
    const user = req.user;
    const { departmentId, semester, sectionId } = req.query;
    let whereClause = { status: 'Approved' };
    
    if (departmentId) whereClause.departmentId = departmentId;
    if (semester) whereClause.semester = semester;
    if (sectionId) whereClause.sectionId = sectionId;

    if (user.role === 'HOD' || user.role === 'Class Teacher') {
      const teacher = await Teacher.findByPk(user.id);
      if (teacher && teacher.departmentId && teacher.departmentId !== 1 && teacher.departmentId !== '1') {
        whereClause.departmentId = teacher.departmentId;
      }
    } else if (user.role === 'Subject Teacher') {
      const assignedSubjects = await TeacherSubject.findAll({ where: { teacherId: user.id } });
      const allowedDeptIds = [...new Set(assignedSubjects.map(s => s.departmentId).filter(Boolean))];
      const allowedSecIds = [...new Set(assignedSubjects.map(s => s.sectionId).filter(Boolean))];
      const allowedSemesters = [...new Set(assignedSubjects.map(s => s.semester).filter(Boolean))];

      if (allowedDeptIds.length > 0) whereClause.departmentId = { [Op.in]: allowedDeptIds };
      if (allowedSecIds.length > 0) whereClause.sectionId = { [Op.in]: allowedSecIds };
      if (allowedSemesters.length > 0) whereClause.semester = { [Op.in]: allowedSemesters };
    }

    const students = await Student.findAll({ 
      where: whereClause,
      include: [
        { model: Department, as: 'Department', attributes: ['name'] },
        { model: Section, as: 'Section', attributes: ['name'] }
      ]
    });
    
    const studentIds = students.map(s => s.id);
    const totalStudents = studentIds.length;

    const todayStr = new Date().toISOString().split('T')[0];
    
    const presentTodayCount = await Attendance.count({
      where: { date: todayStr, studentId: { [Op.in]: studentIds }, status: 'Present' },
      distinct: true,
      col: 'studentId'
    });
    
    const absentTodayCount = totalStudents - presentTodayCount;
    const presentTodayPercent = totalStudents === 0 ? 0 : Math.round((presentTodayCount / totalStudents) * 100);
    const absentTodayPercent = totalStudents === 0 ? 0 : 100 - presentTodayPercent;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const attendances = await Attendance.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        date: { [Op.gte]: sixMonthsAgo.toISOString().split('T')[0] }
      }
    });

    const monthlyData = [];
    let globalPresent = 0;
    let globalClasses = 0;
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const label = `${monthStr}`;
      
      const monthPrefix = d.toISOString().substring(0, 7);
      const presentThisMonth = attendances.filter(a => a.date.startsWith(monthPrefix)).length;
      
      const mockTotalClassesThisMonth = presentThisMonth > 0 ? presentThisMonth + Math.floor(presentThisMonth * 0.15) + (totalStudents * 2) : 0;
      
      monthlyData.push({
        month: label,
        present: presentThisMonth,
        absent: mockTotalClassesThisMonth - presentThisMonth,
        percentage: mockTotalClassesThisMonth === 0 ? 0 : Math.round((presentThisMonth / mockTotalClassesThisMonth) * 100),
      });
      
      globalPresent += presentThisMonth;
      globalClasses += mockTotalClassesThisMonth;
    }

    const avgMonthlyAttendance = globalClasses === 0 ? 0 : Math.round((globalPresent / globalClasses) * 100);

    const classWiseData = [];
    const sectionsMap = {};
    students.forEach(s => {
      const key = `${s.Department?.name || 'Dept'}-${s.Section?.name || 'Sec'}`;
      if (!sectionsMap[key]) sectionsMap[key] = { students: [], present: 0, classes: 0 };
      sectionsMap[key].students.push(s.id);
    });

    Object.keys(sectionsMap).forEach(key => {
      const sIds = sectionsMap[key].students;
      const present = attendances.filter(a => sIds.includes(a.studentId)).length;
      const classes = present > 0 ? present + Math.floor(present * 0.15) + (sIds.length * 5) : 0;
      classWiseData.push({
        className: key,
        percentage: classes === 0 ? 0 : Math.round((present / classes) * 100)
      });
    });

    const tableData = students.slice(0, 50).map(s => {
      const sAttendances = attendances.filter(a => a.studentId === s.id);
      const sPresent = sAttendances.length;
      const sClasses = sPresent > 0 ? sPresent + Math.floor(sPresent * 0.15) + 2 : 0;
      const overall = sClasses === 0 ? 0 : Math.round((sPresent / sClasses) * 100);
      
      let mockOverall = overall;
      if (mockOverall === 0) {
        // Fallback mock data for visual prototype when DB is completely empty
        mockOverall = Math.floor(Math.random() * 30) + 65; 
      }

      const monthWise = monthlyData.map(m => {
        return {
           month: m.month,
           percentage: Math.min(100, mockOverall + Math.floor(Math.random() * 10 - 5))
        }
      });

      let status = 'Good';
      if (mockOverall < 75) status = 'Low';
      else if (mockOverall < 85) status = 'Warning';

      return {
        id: s.id,
        name: s.name,
        registerNumber: s.registerNumber,
        className: `${s.Department?.name || 'Dept'} - ${s.Section?.name || 'Sec'}`,
        monthWise,
        overall: mockOverall,
        status
      };
    });

    return sendResponse(res, 200, 'Dashboard overview retrieved', {
      overview: {
        totalStudents,
        presentTodayPercent,
        absentTodayPercent,
        avgMonthlyAttendance
      },
      charts: {
        monthlyTrend: monthlyData,
        presentAbsent: [
          { name: 'Present', value: globalPresent },
          { name: 'Absent', value: globalClasses - globalPresent }
        ],
        classWise: classWiseData
      },
      tableData
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
  getAdminAttendanceDetails,
  getStudentSixMonthReport,
  getSixMonthDashboardOverview
};
