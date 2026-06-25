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

const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) throw new ApiError(404, 'Teacher not found');
    
    await teacher.update(req.body);
    return sendResponse(res, 200, 'Teacher updated successfully', teacher);
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

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher
};
