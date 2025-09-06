// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  // Log error for production monitoring
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
      isOperational: true,
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } '${value}' already exists`;
    error = {
      message,
      statusCode: 400,
      isOperational: true,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));

    error = {
      message: 'Validation failed',
      statusCode: 400,
      isOperational: true,
      details: errors,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again';
    error = {
      message,
      statusCode: 401,
      isOperational: true,
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again';
    error = {
      message,
      statusCode: 401,
      isOperational: true,
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = {
      message,
      statusCode: 400,
      isOperational: true,
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files uploaded';
    error = {
      message,
      statusCode: 400,
      isOperational: true,
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests. Please try again later';
    error = {
      message,
      statusCode: 429,
      isOperational: true,
    };
  }

  // Database connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error';
    error = {
      message,
      statusCode: 500,
      isOperational: false,
    };
  }

  // Network/External API errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    const message = 'External service unavailable';
    error = {
      message,
      statusCode: 503,
      isOperational: true,
    };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const isOperational = error.isOperational || false;

  // Determine response based on environment and error type
  const response = {
    error: true,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add error details for validation errors
  if (error.details) {
    response.details = error.details;
  }

  // Add additional information in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.errorName = err.name;
  }

  // Add request ID if available (for debugging)
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Different response format for production vs development
  if (process.env.NODE_ENV === 'production') {
    // Don't leak error details in production for non-operational errors
    if (!isOperational && statusCode >= 500) {
      response.message = 'Something went wrong. Please try again later.';
    }
  }

  res.status(statusCode).json(response);
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper to catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    true,
  );
  next(error);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);

  // Close server & exit process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);

  // Close server & exit process
  process.exit(1);
});

module.exports = {
  errorHandler,
  AppError,
  catchAsync,
  notFound,
};
