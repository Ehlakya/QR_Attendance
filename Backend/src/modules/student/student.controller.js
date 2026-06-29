const Student = require('../../models/Student');
const Department = require('../../models/Department');
const Section = require('../../models/Section');
const Attendance = require('../../models/Attendance');
const QR = require('../../models/QR');
const bcrypt = require('bcryptjs');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');

// Create Student
const createStudent = async (req, res, next) => {
  try {
    const { name, registerNumber, email, phone, departmentId, sectionId } = req.body;
    
    // Check if student exists
    const existingStudent = await Student.findOne({ where: { registerNumber } });
    if (existingStudent) {
      throw new ApiError(400, 'Student with this register number already exists');
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const student = await Student.create({
      name,
      registerNumber,
      email,
      phone,
      password: hashedPassword,
      departmentId,
      sectionId
    });

    // Emit real-time event
    const io = require('../../config/socket').getIO();
    io.emit('new_registration', { 
      name: student.name, 
      registerNumber: student.registerNumber,
      departmentId: student.departmentId,
      sectionId: student.sectionId 
    });

    // Notify Admins
    const { createAndEmitNotification } = require('../notification/notification.service');
    const Admin = require('../../models/Admin');
    const admins = await Admin.findAll();
    for (const admin of admins) {
      await createAndEmitNotification({
        userId: admin.id,
        userRole: 'ADMIN',
        type: 'Info',
        title: 'New Student Registered',
        message: `${name} (${registerNumber}) has registered.`,
        relatedId: student.id
      });
    }

    const { generateToken } = require('../../shared/utils/jwt');
    const token = generateToken({ id: student.id, role: 'Student', email: student.email });

    return sendResponse(res, 201, 'Student created successfully', { user: student, token });
  } catch (error) {
    next(error);
  }
};

const getStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Section, attributes: ['name'] }
      ]
    });

    if (!student) throw new ApiError(404, 'Student not found');

    const attendances = await Attendance.findAll({
      where: { studentId },
      include: [{ model: QR }],
      order: [['createdAt', 'DESC']]
    });

    const presentDays = attendances.length; // Assuming each record is a present day
    const totalClasses = presentDays + 8; // Mock absent count logic for demonstration since absences aren't explicitly logged yet
    const absentDays = totalClasses - presentDays;
    const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentDays / totalClasses) * 100);

    const history = attendances.map(a => ({
      date: a.date,
      type: a.attendanceType,
      subject: a.subjectName,
      status: a.status,
      time: a.time
    }));

    const lastQrScanned = attendances.length > 0 ? attendances[0].QR?.type || attendances[0].attendanceType : null;
    const lastAttendanceTime = attendances.length > 0 ? `${attendances[0].date} ${attendances[0].time}` : null;

    const profileData = {
      id: student.id,
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      mobile: student.mobileNumber,
      department: student.Department?.name || 'N/A',
      section: student.Section?.name || 'N/A',
      createdAt: student.createdAt,
      stats: {
        totalClasses,
        presentDays,
        absentDays,
        attendancePercentage
      },
      lastQrScanned,
      lastAttendanceTime,
      history
    };

    return sendResponse(res, 200, 'Profile retrieved successfully', profileData);
  } catch (error) {
    next(error);
  }
};

const updateOwnProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { name, mobile } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) throw new ApiError(404, 'Student not found');

    if (name) student.name = name;
    if (mobile) student.mobileNumber = mobile;

    await student.save();

    return sendResponse(res, 200, 'Profile updated successfully', {
      name: student.name,
      mobile: student.mobileNumber
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'Old and new passwords are required');
    }

    const student = await Student.findByPk(studentId);
    if (!student) throw new ApiError(404, 'Student not found');

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      throw new ApiError(401, 'Incorrect old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    await student.save();

    return sendResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// Get all students
const TeacherSubject = require('../../models/TeacherSubject');

const getAllStudents = async (req, res, next) => {
  try {
    const { status, departmentId, sectionId, search } = req.query;
    const { Op } = require('sequelize');
    const user = req.user;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (departmentId) whereClause.departmentId = departmentId;
    if (sectionId) whereClause.sectionId = sectionId;

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { registerNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    if (user && user.role === 'Subject Teacher') {
      const assignedSubjects = await TeacherSubject.findAll({ where: { teacherId: user.id } });
      const allowedDeptIds = [...new Set(assignedSubjects.map(s => s.departmentId).filter(Boolean))];
      const allowedSecIds = [...new Set(assignedSubjects.map(s => s.sectionId).filter(Boolean))];

      if (allowedDeptIds.length > 0) whereClause.departmentId = { [Op.in]: allowedDeptIds };
      if (allowedSecIds.length > 0) whereClause.sectionId = { [Op.in]: allowedSecIds };
    } else if (user && (user.role === 'HOD' || user.role === 'Class Teacher')) {
      const Teacher = require('../../models/Teacher');
      const teacher = await Teacher.findByPk(user.id);
      if (teacher && teacher.departmentId && teacher.departmentId !== 1 && teacher.departmentId !== '1') {
        whereClause.departmentId = teacher.departmentId;
      }
    }

    // We include associations so the frontend can display them nicely
    const Department = require('../../models/Department');
    const Section = require('../../models/Section');

    const students = await Student.findAll({
      where: whereClause,
      include: [
        { model: Department, as: 'Department', attributes: ['name', 'code'] },
        { model: Section, as: 'Section', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return sendResponse(res, 200, 'Students retrieved successfully', students);
  } catch (error) {
    next(error);
  }
};

// Update student status (Approve/Reject)
const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    const student = await Student.findByPk(id);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status update');
    }

    await student.update({ status });

    // Emit real-time event for status change
    const io = require('../../config/socket').getIO();
    io.emit('student_status_updated', { studentId: student.id, status: student.status });

    return sendResponse(res, 200, `Student status updated to ${status}`, student);
  } catch (error) {
    next(error);
  }
};

// Get student by ID
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }
    return sendResponse(res, 200, 'Student retrieved successfully', student);
  } catch (error) {
    next(error);
  }
};

// Update student
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }
    
    await student.update(req.body);
    return sendResponse(res, 200, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

// Delete student
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }
    
    await student.destroy();
    return sendResponse(res, 200, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  getStudentProfile,
  updateOwnProfile,
  changePassword
};
