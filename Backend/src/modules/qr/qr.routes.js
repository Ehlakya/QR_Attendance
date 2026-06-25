const express = require('express');
const router = express.Router();
const qrController = require('./qr.controller');
const authMiddleware = require('../../shared/middlewares/auth.middleware');
const roleMiddleware = require('../../shared/middlewares/role.middleware');

router.use(authMiddleware);

router.post('/generate', roleMiddleware('Class Teacher', 'Subject Teacher', 'HOD', 'admin'), qrController.generateQR);
router.get('/active', roleMiddleware('Student'), qrController.getActiveQRs);
router.get('/', qrController.getGeneratedQRs);

module.exports = router;
