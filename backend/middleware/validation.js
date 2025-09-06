const Joi = require('joi');

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data =
      source === 'body'
        ? req.body
        : source === 'params'
          ? req.params
          : source === 'query'
            ? req.query
            : req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errorDetails,
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') req.body = value;
    else if (source === 'params') req.params = value;
    else if (source === 'query') req.query = value;
    else req[source] = value;

    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'First name can only contain letters and spaces',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
      }),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
      }),

    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Please provide a valid email address',
    }),

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
      }),

    timezone: Joi.string().optional().default('UTC'),

    preferredLanguage: Joi.string()
      .valid('en', 'fr', 'es', 'de')
      .optional()
      .default('en'),

    agreeToTerms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must agree to the terms and conditions',
    }),
  }),

  // User login validation
  login: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.email': 'Please provide a valid email address',
    }),

    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),

    rememberMe: Joi.boolean().optional().default(false),
  }),

  // Profile update validation
  updateProfile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'First name can only contain letters and spaces',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
      }),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
      }),

    timezone: Joi.string().optional(),

    preferredLanguage: Joi.string().valid('en', 'fr', 'es', 'de').optional(),

    bio: Joi.string().max(500).optional().messages({
      'string.max': 'Bio cannot exceed 500 characters',
    }),
  }),

  // Learning profile update validation
  updateLearningProfile: Joi.object({
    learningStyle: Joi.string()
      .valid('visual', 'auditory', 'kinesthetic', 'reading', 'balanced')
      .optional()
      .messages({
        'any.only':
          'Learning style must be one of: visual, auditory, kinesthetic, reading, balanced',
      }),

    preferredPace: Joi.string()
      .valid('slow', 'medium', 'fast')
      .optional()
      .messages({
        'any.only': 'Preferred pace must be one of: slow, medium, fast',
      }),

    optimalSessionDuration: Joi.number()
      .integer()
      .min(15)
      .max(180)
      .optional()
      .messages({
        'number.min': 'Session duration must be at least 15 minutes',
        'number.max': 'Session duration cannot exceed 180 minutes',
      }),

    aiPersonality: Joi.string()
      .valid('ARIA', 'SAGE', 'COACH')
      .optional()
      .messages({
        'any.only': 'AI personality must be one of: ARIA, SAGE, COACH',
      }),

    adaptiveMode: Joi.boolean().optional(),

    voiceEnabled: Joi.boolean().optional(),

    bestLearningHours: Joi.array()
      .items(Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/))
      .max(5)
      .optional()
      .messages({
        'string.pattern.base': 'Learning hours must be in HH:MM format',
        'array.max': 'Cannot specify more than 5 optimal learning hours',
      }),

    notificationSettings: Joi.object({
      learningReminders: Joi.boolean().optional(),
      achievementNotifications: Joi.boolean().optional(),
      weeklyProgress: Joi.boolean().optional(),
      aiInsights: Joi.boolean().optional(),
    }).optional(),
  }),

  // Password change validation
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),

    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base':
          'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
      }),
  }),

  // Refresh token validation
  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),

  // ID parameter validation
  mongoId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format',
      }),
  }),

  // Query parameters validation
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),

    limit: Joi.number().integer().min(1).max(100).optional().default(10),

    sort: Joi.string().optional().default('createdAt'),

    order: Joi.string().valid('asc', 'desc').optional().default('desc'),
  }),
};

// Validation middleware for specific schemas
const validateRegistration = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateProfileUpdate = validate(schemas.updateProfile);
const validateLearningProfileUpdate = validate(schemas.updateLearningProfile);
const validatePasswordChange = validate(schemas.changePassword);
const validateRefreshToken = validate(schemas.refreshToken);
const validateMongoId = validate(schemas.mongoId, 'params');
const validatePagination = validate(schemas.paginationQuery, 'query');

// Custom validation for file uploads
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload',
      });
    }

    const file = req.files.file || Object.values(req.files)[0];

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: `Allowed file types: ${allowedTypes.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  validate,
  schemas,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateLearningProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateMongoId,
  validatePagination,
  validateFileUpload,
};
