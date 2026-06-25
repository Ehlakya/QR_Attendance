const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('./error.middleware');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No token provided, authorization denied'));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new ApiError(401, 'Token is invalid or expired'));
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;
