const logger = require('../utils/logger');

const handleCastErrorDB = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: 400,
    message: `Duplicate value for field '${field}'. Please use another value.`,
  };
};

const handleValidationErrorDB = (err) => ({
  statusCode: 400,
  message: Object.values(err.errors).map((e) => e.message).join('. '),
});

const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: 'Your token has expired. Please log in again.',
});

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err, message: err.message };

  if (err.name === 'CastError') Object.assign(error, handleCastErrorDB(err));
  if (err.code === 11000) Object.assign(error, handleDuplicateFieldsDB(err));
  if (err.name === 'ValidationError') Object.assign(error, handleValidationErrorDB(err));
  if (err.name === 'JsonWebTokenError') Object.assign(error, handleJWTError());
  if (err.name === 'TokenExpiredError') Object.assign(error, handleJWTExpiredError());

  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
    return res.status(error.statusCode || 500).json({
      success: false,
      status: error.status,
      message: error.message,
      stack: err.stack,
    });
  }

  // Production: don't leak error details
  if (err.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  logger.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};
