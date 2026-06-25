const Department = require('../../models/Department');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');

const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const existing = await Department.findOne({ where: { code } });
    if (existing) {
      throw new ApiError(400, 'Department with this code already exists');
    }
    const department = await Department.create({ name, code });
    return sendResponse(res, 201, 'Department created successfully', department);
  } catch (error) {
    next(error);
  }
};

const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll();
    return sendResponse(res, 200, 'Departments retrieved successfully', departments);
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) throw new ApiError(404, 'Department not found');
    
    await department.update(req.body);
    return sendResponse(res, 200, 'Department updated successfully', department);
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) throw new ApiError(404, 'Department not found');
    
    await department.destroy();
    return sendResponse(res, 200, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment
};
