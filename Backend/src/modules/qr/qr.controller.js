const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const QR = require('../../models/QR');
const Student = require('../../models/Student');
const { sendResponse } = require('../../shared/utils/response');
const { ApiError } = require('../../shared/middlewares/error.middleware');
const { Op } = require('sequelize');

const generateQR = async (req, res, next) => {
  try {
    const { type, expiryMinutes, departmentId, sectionId, subjectName, period } = req.body;
    const teacherId = req.user.id;

    // Generate a unique token for the QR
    const qrData = JSON.stringify({
      id: uuidv4(),
      type,
      teacherId,
      departmentId,
      sectionId,
      subjectName,
      period,
      timestamp: Date.now()
    });

    // Create QR image base64
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const expiryTime = new Date(Date.now() + (expiryMinutes || 10) * 60000);

    // Store in DB
    const qrRecord = await QR.create({
      type,
      qrCodeData: qrData,
      expiryTime,
      teacherId,
      departmentId,
      sectionId,
      subjectName,
      period
    });

    // Emit targeted socket event globally (frontend will filter by departmentId and sectionId)
    const io = require('../../config/socket').getIO();
    io.emit('qr_generated', {
      qrId: qrRecord.id,
      type,
      departmentId,
      sectionId,
      subjectName,
      period,
      message: type === 'Subject Attendance' 
        ? `Subject Attendance QR Available` 
        : `Morning Attendance QR Available`
    });

    return sendResponse(res, 201, 'QR Code generated successfully', {
      qrId: qrRecord.id,
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
