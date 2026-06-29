const Attendance = require('../../models/Attendance');
const QR = require('../../models/QR');
const Student = require('../../models/Student');
const Department = require('../../models/Department');
const Section = require('../../models/Section');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');
const { Op } = require('sequelize');

const markAttendance = async (req, res, next) => {
  try {
    console.log("Attendance Mark Request Body:", req.body);
    const { qrDataStr, qrId } = req.body;
    // Extract studentId from the authenticated JWT token context
    const studentId = req.user?.id || req.body.studentId;

    if (!qrDataStr && !qrId) {
      throw new ApiError(400, 'QR ID and QR Data are required');
    }

    // Search by primary key if provided, fallback to the exact QR string
    let qr = null;
    if (qrId) {
      qr = await QR.findByPk(qrId);
      if (qr) {
        // Robust check: parse and compare UUIDs instead of fragile string equality
        const expectedPayload = JSON.parse(qr.qrCodeData);
        const receivedPayload = JSON.parse(qrDataStr);
        if (expectedPayload.id !== receivedPayload.id) {
          throw new ApiError(400, 'Invalid QR signature payload');
        }
      }
    } else {
      qr = await QR.findOne({ where: { qrCodeData: qrDataStr } });
    }
    
    if (!qr) throw new ApiError(404, 'Invalid QR Code');

    if (!qr.isActive || new Date() > qr.expiryTime) {
      throw new ApiError(400, 'QR Code has expired');
    }

    const student = await Student.findByPk(studentId, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Section, attributes: ['name'] }
      ]
    });
    if (!student) throw new ApiError(404, 'Student not found');

    // Strict Target Validation
    if (student.departmentId !== qr.departmentId || student.sectionId !== qr.sectionId) {
      throw new ApiError(403, 'Access Denied: This QR code is not valid for your department or section.');
    }

    // Check Duplicate
    const existing = await Attendance.findOne({ where: { studentId, qrId: qr.id } });
    if (existing) {
      throw new ApiError(400, 'Attendance already marked for this QR');
    }

    const attendance = await Attendance.create({
      studentId,
      qrId: qr.id,
      attendanceType: qr.type,
      subjectName: qr.subjectName,
      period: qr.period,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      status: 'Present'
    });

    // Emit real-time event with full details for Teacher Dashboard
    const io = require('../../config/socket').getIO();
    io.emit('attendanceMarked', { 
      name: student ? student.name : 'Unknown Student',
      registerNumber: student ? student.registerNumber : 'Unknown',
      subjectName: qr.subjectName || (qr.type === 'Subject Attendance' ? 'Subject Attendance' : 'Morning Attendance'),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      studentId, 
      qrId: qr.id 
    });

    // Notify ONLY the Teacher who generated the QR code
    if (student && qr.teacherId) {
      const { createAndEmitNotification } = require('../notification/notification.service');
      const Teacher = require('../../models/Teacher');
      
      const teacher = await Teacher.findByPk(qr.teacherId);
      if (teacher) {
        const departmentName = student.Department ? student.Department.name : 'Unknown Department';
        const sectionName = student.Section ? student.Section.name : 'Unknown Section';
        
        // Year/Semester logic: fetch from student model directly
        const year = student.year || 'Unknown';
        const semester = student.semester || 'Unknown';
        const subjectName = qr.subjectName || qr.type;

        const message = `Student: ${student.name}\nRegister No: ${student.registerNumber}\nDepartment: ${departmentName}\nYear: ${year}\nSemester: ${semester}\nSection: ${sectionName}\nSubject: ${subjectName}\nTime: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\nDate: ${new Date().toLocaleDateString('en-GB')}\nStatus: Present\nQR Session ID: ${qr.id}`;
        
        await createAndEmitNotification({
          userId: qr.teacherId,
          userRole: teacher.role || 'Teacher', // We send to the specific teacher's role dynamically
          type: 'Info',
          title: '✅ Attendance Marked',
          message: message,
          relatedId: student.id
        });
      }
    }

    return sendResponse(res, 201, 'Attendance marked successfully', attendance);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(400, 'Attendance already marked'));
    }
    next(error);
  }
};

const getAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const history = await Attendance.findAll({ where: { studentId }, include: [QR] });
    return sendResponse(res, 200, 'Attendance history retrieved', history);
  } catch (error) {
    next(error);
  }
};

const getDailyAttendance = async (req, res, next) => {
  try {
    const { date, sectionId } = req.query; // date format YYYY-MM-DD
    
    // In real app, filter by sectionId by including Student
    const attendances = await Attendance.findAll({
      where: { date },
      include: [{ model: Student, where: sectionId ? { sectionId } : {} }]
    });
    return sendResponse(res, 200, 'Daily attendance retrieved', attendances);
  } catch (error) {
    next(error);
  }
};

const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { year, month, studentId } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await Attendance.findAll({
      where: {
        studentId,
        date: {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      }
    });
    return sendResponse(res, 200, 'Monthly attendance retrieved', attendances);
  } catch (error) {
    next(error);
  }
};

const getSessionAttendance = async (req, res, next) => {
  try {
    const { qrId } = req.params;

    const qr = await QR.findByPk(qrId, {
      include: [
        { model: require('../../models/Department'), attributes: ['name'] },
        { model: require('../../models/Section'), attributes: ['name'] },
        { model: require('../../models/Teacher'), attributes: ['name'] }
      ]
    });

    if (!qr) throw new ApiError(404, 'QR Session not found');

    // Get all students in the target class
    const students = await Student.findAll({
      where: { departmentId: qr.departmentId, sectionId: qr.sectionId },
      include: [
        { model: require('../../models/Department'), attributes: ['name'] },
        { model: require('../../models/Section'), attributes: ['name'] }
      ]
    });

    // Get attendance records for this specific QR session
    const attendances = await Attendance.findAll({
      where: { qrId }
    });

    const attendanceMap = {};
    attendances.forEach(a => {
      attendanceMap[a.studentId] = a;
    });

    const studentList = students.map(student => {
      const record = attendanceMap[student.id];
      return {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        department: student.Department?.name || '-',
        section: student.Section?.name || '-',
        status: record ? 'Present' : 'Absent',
        time: record ? record.time : '-'
      };
    });

    const presentStudents = studentList.filter(s => s.status === 'Present');
    const absentStudents = studentList.filter(s => s.status === 'Absent');

    const totalStudents = students.length;
    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const attendancePercentage = totalStudents === 0 ? 0 : Math.round((presentCount / totalStudents) * 100);

    return sendResponse(res, 200, 'Session details retrieved', {
      sessionInfo: {
        subjectName: qr.subjectName || (qr.type === 'Subject Attendance' ? 'Unknown Subject' : 'Morning Attendance'),
        department: qr.Department?.name || 'N/A',
        section: qr.Section?.name || 'N/A',
        period: qr.period || '-',
        date: qr.createdAt.toISOString().split('T')[0],
        teacherName: qr.Teacher?.name || 'N/A',
        isActive: qr.isActive
      },
      stats: {
        totalStudents,
        presentCount,
        absentCount,
        attendancePercentage
      },
      studentList,
      presentStudents,
      absentStudents
    });

  } catch (error) {
    next(error);
  }
};

const getGlobalLiveAttendance = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    // Get all QRs by this teacher generated today
    const today = new Date().toISOString().split('T')[0];
    const qrs = await QR.findAll({
      where: {
        teacherId,
        createdAt: {
          [Op.gte]: new Date(today)
        }
      },
      include: [
        { model: require('../../models/Department'), attributes: ['name'] },
        { model: require('../../models/Section'), attributes: ['name'] }
      ]
    });

    const qrIds = qrs.map(q => q.id);
    
    // Get attendances for these QRs
    const attendances = await Attendance.findAll({
      where: { qrId: { [Op.in]: qrIds } },
      include: [
        { 
          model: Student, 
          include: [
            { model: require('../../models/Department'), attributes: ['name'] },
            { model: require('../../models/Section'), attributes: ['name'] }
          ]
        },
        { model: QR }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate unique total students by looking up Department + Section combinations from the generated QRs
    const targetClasses = Array.from(new Set(qrs.map(q => `${q.departmentId}-${q.sectionId}`)));
    let uniqueStudentsCount = 0;
    for (const cls of targetClasses) {
      const [depId, secId] = cls.split('-');
      const count = await Student.count({ where: { departmentId: depId, sectionId: secId }});
      uniqueStudentsCount += count;
    }

    const presentCount = attendances.length;
    let absentCount = uniqueStudentsCount - presentCount;
    if (absentCount < 0) absentCount = 0;

    const studentList = attendances.map(a => ({
      id: a.id,
      name: a.Student?.name || '-',
      registerNumber: a.Student?.registerNumber || '-',
      department: a.Student?.Department?.name || '-',
      section: a.Student?.Section?.name || '-',
      subjectName: a.subjectName || (a.QR?.type === 'Subject Attendance' ? 'Subject Attendance' : 'Morning Attendance'),
      time: a.time,
      qrId: a.qrId,
      date: a.date
    }));

    return sendResponse(res, 200, 'Global Live Attendance retrieved', {
      stats: {
        totalStudents: uniqueStudentsCount,
        presentCount,
        absentCount,
        attendancePercentage: uniqueStudentsCount === 0 ? 0 : Math.round((presentCount / uniqueStudentsCount) * 100)
      },
      qrs: qrs.map(q => ({
        id: q.id,
        type: q.type,
        subjectName: q.subjectName || q.type,
        department: q.Department?.name || '-',
        section: q.Section?.name || '-',
        isActive: q.isActive,
        isExpired: new Date() > q.expiryTime,
        createdAt: q.createdAt,
        expiryTime: q.expiryTime
      })),
      studentList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceHistory,
  getDailyAttendance,
  getMonthlyAttendance,
  getSessionAttendance,
  getGlobalLiveAttendance
};
