const Teacher = require('../../models/Teacher');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, role, departmentId } = req.body;
    
    const existing = await Teacher.findOne({ where: { email } });
    if (existing) {
      throw new ApiError(400, 'Teacher with this email already exists');
    }

    const teacher = await Teacher.create({ name, email, role, departmentId });
    
    const io = require('../../config/socket').getIO();
    io.emit('new_teacher_added', teacher);

    return sendResponse(res, 201, 'Teacher created successfully', teacher);
  } catch (error) {
    next(error);
  }
};

const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.findAll();
    return sendResponse(res, 200, 'Teachers retrieved successfully', teachers);
  } catch (error) {
    next(error);
  }
};

const getTeacherById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    return sendResponse(res, 200, 'Teacher retrieved successfully', teacher);
  } catch (error) {
    next(error);
  }
};


const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    
    await teacher.destroy();
    return sendResponse(res, 200, 'Teacher deleted successfully');
  } catch (error) {
    next(error);
  }
};

const TeacherSubject = require('../../models/TeacherSubject');

const assignSubjects = async (req, res, next) => {
  try {
    const { subjects, departmentId, sectionId, semester } = req.body;
    const teacherId = req.user.id;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      throw new ApiError(400, 'At least one subject must be selected');
    }

    if (!semester) {
      throw new ApiError(400, 'Semester is required');
    }

    const assignments = subjects.map(subject => ({
      teacherId,
      subjectName: subject.name,
      subjectType: subject.type,
      semester,
      departmentId: departmentId || null,
      sectionId: sectionId || null
    }));

    for (const assignment of assignments) {
      const existing = await TeacherSubject.findOne({
        where: {
          teacherId,
          subjectName: assignment.subjectName,
          semester: assignment.semester,
          sectionId: assignment.sectionId
        }
      });
      
      if (!existing) {
        await TeacherSubject.create(assignment);
      }
    }

    return sendResponse(res, 201, 'Subjects assigned successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignedSubjects = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const subjects = await TeacherSubject.findAll({
      where: { teacherId }
    });
    
    return sendResponse(res, 200, 'Assigned subjects retrieved', subjects);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  deleteTeacher,
  assignSubjects,
  getAssignedSubjects
};
