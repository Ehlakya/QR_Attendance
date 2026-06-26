const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const QR = require('../../models/QR');
const Student = require('../../models/Student');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');
const { Op } = require('sequelize');

const generateQR = async (req, res, next) => {
  try {
    const { type, expiryMinutes, departmentIds, sectionId, subjectName, period } = req.body;
    const teacherId = req.user.id;

    if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
      throw new ApiError(400, 'At least one department must be selected');
    }

    // Generate a unique token for the QR that includes ALL department IDs
    const qrData = JSON.stringify({
      id: uuidv4(),
      type,
      teacherId,
      departmentIds,
      sectionId,
      subjectName,
      period,
      timestamp: Date.now()
    });

    // Create a single shared QR image base64
    const qrCodeImage = await QRCode.toDataURL(qrData);
    const expiryTime = new Date(Date.now() + (expiryMinutes || 10) * 60000);
    const qrRecords = [];
    const io = require('../../config/socket').getIO();

    // Create a DB record for EACH department to allow students in those departments to find it
    for (const dId of departmentIds) {
      const qrRecord = await QR.create({
        type,
        qrCodeData: qrData,
        expiryTime,
        teacherId,
        departmentId: dId,
        sectionId,
        subjectName,
        period
      });
      qrRecords.push(qrRecord);

      // Emit targeted socket event globally (frontend filters by departmentId and sectionId)
      io.emit('qr_generated', {
        qrId: qrRecord.id,
        type,
        departmentId: dId,
        sectionId,
        subjectName,
        period,
        message: type === 'Subject Attendance' 
          ? `Subject Attendance QR Available` 
          : `Morning Attendance QR Available`
      });
    }

    return sendResponse(res, 201, 'QR Code generated successfully', {
      qrId: qrRecords[0].id,
      qrCodeImage,
      expiryTime
    });
  } catch (error) {
    next(error);
  }
};

const getGeneratedQRs = async (req, res, next) => {
  try {
    const qrs = await QR.findAll({ where: { teacherId: req.user.id } });
    return sendResponse(res, 200, 'QR codes retrieved successfully', qrs);
  } catch (error) {
    next(error);
  }
};

const getActiveQRs = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.user.id);
    if (!student) throw new ApiError(404, 'Student not found');

    const activeQRs = await QR.findAll({
      where: {
        departmentId: student.departmentId,
        sectionId: student.sectionId,
        isActive: true,
        expiryTime: {
          [Op.gt]: new Date()
        }
      },
      include: [
        { model: require('../../models/Teacher'), attributes: ['name'] }
      ]
    });

    // Generate Base64 QR Image for each active session on the fly
    const sanitizedQRs = await Promise.all(activeQRs.map(async qr => {
      const qrImage = await QRCode.toDataURL(qr.qrCodeData);
      return {
        id: qr.id,
        type: qr.type,
        subjectName: qr.subjectName,
        period: qr.period,
        expiryTime: qr.expiryTime,
        teacherName: qr.Teacher?.name,
        createdAt: qr.createdAt,
        qrCodeData: qr.qrCodeData, // Required for the file upload scanner
        qrImage: qrImage // Base64 image string for preview and download
      };
    }));

    return sendResponse(res, 200, 'Active QRs retrieved', sanitizedQRs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQR,
  getGeneratedQRs,
  getActiveQRs
};
