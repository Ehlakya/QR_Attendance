const Section = require('../../models/Section');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');

const createSection = async (req, res, next) => {
  try {
    const { name, departmentId } = req.body;
    const section = await Section.create({ name, departmentId });
    return sendResponse(res, 201, 'Section created successfully', section);
  } catch (error) {
    next(error);
  }
};

const getAllSections = async (req, res, next) => {
  try {
    const sections = await Section.findAll();
    return sendResponse(res, 200, 'Sections retrieved successfully', sections);
  } catch (error) {
    next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findByPk(id);
    if (!section) throw new ApiError(404, 'Section not found');
    
    await section.update(req.body);
    return sendResponse(res, 200, 'Section updated successfully', section);
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findByPk(id);
    if (!section) throw new ApiError(404, 'Section not found');
    
    await section.destroy();
    return sendResponse(res, 200, 'Section deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSection,
  getAllSections,
  updateSection,
  deleteSection
};
