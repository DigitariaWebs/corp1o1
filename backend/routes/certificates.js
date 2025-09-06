// routes/certificates.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Import controllers
const {
  getUserCertificates,
  getCertificateDetails,
  downloadCertificate,
  shareCertificate,
  checkAssessmentCertificateEligibility,
  generateAssessmentCertificate,
  generatePathCertificate,
  verifyCertificate,
  getCertificateAnalytics,
  updateCertificateSettings,
  getCertificateTemplates,
} = require('../controllers/certificateController');

// Validation schemas
const certificateQuerySchema = Joi.object({
  type: Joi.string()
    .valid(
      'completion',
      'mastery',
      'specialization',
      'certification',
      'achievement',
      'micro_credential',
      'professional',
      'expert',
    )
    .optional(),

  category: Joi.string()
    .valid(
      'Communication & Leadership',
      'Innovation & Creativity',
      'Technical Skills',
      'Business Strategy',
      'Personal Development',
      'Data & Analytics',
      'General',
    )
    .optional(),

  status: Joi.string()
    .valid('draft', 'issued', 'revoked', 'expired', 'renewed')
    .optional(),

  isValid: Joi.string().valid('true', 'false').optional(),

  limit: Joi.number().integer().min(1).max(100).default(20),

  offset: Joi.number().integer().min(0).default(0),
});

const downloadQuerySchema = Joi.object({
  format: Joi.string().valid('pdf', 'png', 'jpg').default('pdf'),
});

const shareSchema = Joi.object({
  platform: Joi.string()
    .valid('linkedin', 'twitter', 'facebook', 'instagram', 'email', 'other')
    .required()
    .messages({
      'any.required': 'Platform is required',
      'any.only':
        'Platform must be one of: linkedin, twitter, facebook, instagram, email, other',
    }),

  postId: Joi.string().max(100).optional(),

  message: Joi.string()
    .max(280) // Twitter-like limit
    .optional(),
});

const generateCertificateSchema = Joi.object({
  templateId: Joi.string().max(50).optional(),

  backgroundColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base':
        'Background color must be a valid hex color (e.g., #ffffff)',
    }),

  primaryColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base':
        'Primary color must be a valid hex color (e.g., #0066cc)',
    }),

  secondaryColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base':
        'Secondary color must be a valid hex color (e.g., #e0e7ff)',
    }),

  issuerName: Joi.string().max(100).optional(),

  issuerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),

  competencyFramework: Joi.string().max(100).optional(),

  customMessage: Joi.string().max(500).optional(),
});

const settingsUpdateSchema = Joi.object({
  isPublic: Joi.boolean().optional(),

  allowSharing: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one setting must be provided',
  });

const analyticsQuerySchema = Joi.object({
  timeRange: Joi.string().valid('30d', '90d', '1y', 'all').default('1y'),
});

const templateQuerySchema = Joi.object({
  category: Joi.string()
    .valid(
      'Communication & Leadership',
      'Innovation & Creativity',
      'Technical Skills',
      'Business Strategy',
      'Personal Development',
      'Data & Analytics',
    )
    .optional(),
});

const certificateIdParamSchema = Joi.object({
  certificateId: Joi.string().required().messages({
    'any.required': 'Certificate ID is required',
  }),
});

const verificationCodeParamSchema = Joi.object({
  verificationCode: Joi.string().alphanum().length(12).required().messages({
    'string.alphanum':
      'Verification code must contain only letters and numbers',
    'string.length': 'Verification code must be exactly 12 characters',
    'any.required': 'Verification code is required',
  }),
});

const assessmentIdParamSchema = Joi.object({
  assessmentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Assessment ID must be a valid MongoDB ObjectId',
      'any.required': 'Assessment ID is required',
    }),
});

const pathIdParamSchema = Joi.object({
  pathId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Path ID must be a valid MongoDB ObjectId',
      'any.required': 'Path ID is required',
    }),
});

// Public routes (no authentication required)

/**
 * @route   GET /api/certificates/verify/:verificationCode
 * @desc    Publicly verify certificate authenticity
 * @access  Public
 */
router.get(
  '/verify/:verificationCode',
  validate(verificationCodeParamSchema, 'params'),
  verifyCertificate,
);

/**
 * @route   GET /api/certificates/templates
 * @desc    Get available certificate templates
 * @access  Public (can be used for preview)
 * @query   category
 */
router.get(
  '/templates',
  validate(templateQuerySchema, 'query'),
  getCertificateTemplates,
);

// Protected routes (authentication required)
router.use(authenticate);

/**
 * @route   GET /api/certificates
 * @desc    Get user's certificates with filtering
 * @access  Private
 * @query   type, category, status, isValid, limit, offset
 */
router.get('/', validate(certificateQuerySchema, 'query'), getUserCertificates);

/**
 * @route   GET /api/certificates/analytics
 * @desc    Get certificate analytics for the user
 * @access  Private
 * @query   timeRange
 */
router.get(
  '/analytics',
  validate(analyticsQuerySchema, 'query'),
  getCertificateAnalytics,
);

/**
 * @route   GET /api/certificates/eligible/assessment/:assessmentId
 * @desc    Check certificate eligibility for specific assessment
 * @access  Private
 */
router.get(
  '/eligible/assessment/:assessmentId',
  validate(assessmentIdParamSchema, 'params'),
  checkAssessmentCertificateEligibility,
);

/**
 * @route   POST /api/certificates/generate/assessment/:assessmentId
 * @desc    Generate certificate for completed assessment
 * @access  Private
 * @body    templateId, colors, issuer info, etc.
 */
router.post(
  '/generate/assessment/:assessmentId',
  validate(assessmentIdParamSchema, 'params'),
  validate(generateCertificateSchema),
  generateAssessmentCertificate,
);

/**
 * @route   POST /api/certificates/generate/path/:pathId
 * @desc    Generate certificate for completed learning path
 * @access  Private
 * @body    templateId, colors, issuer info, etc.
 */
router.post(
  '/generate/path/:pathId',
  validate(pathIdParamSchema, 'params'),
  validate(generateCertificateSchema),
  generatePathCertificate,
);

/**
 * @route   GET /api/certificates/:certificateId
 * @desc    Get specific certificate details
 * @access  Private
 */
router.get(
  '/:certificateId',
  validate(certificateIdParamSchema, 'params'),
  getCertificateDetails,
);

/**
 * @route   GET /api/certificates/:certificateId/download
 * @desc    Download certificate as PDF or image
 * @access  Private
 * @query   format (pdf, png, jpg)
 */
router.get(
  '/:certificateId/download',
  validate(certificateIdParamSchema, 'params'),
  validate(downloadQuerySchema, 'query'),
  downloadCertificate,
);

/**
 * @route   POST /api/certificates/:certificateId/share
 * @desc    Share certificate on social media platform
 * @access  Private
 * @body    platform, postId, message
 */
router.post(
  '/:certificateId/share',
  validate(certificateIdParamSchema, 'params'),
  validate(shareSchema),
  shareCertificate,
);

/**
 * @route   PUT /api/certificates/:certificateId/settings
 * @desc    Update certificate visibility and sharing settings
 * @access  Private
 * @body    isPublic, allowSharing
 */
router.put(
  '/:certificateId/settings',
  validate(certificateIdParamSchema, 'params'),
  validate(settingsUpdateSchema),
  updateCertificateSettings,
);

/**
 * @route   GET /api/certificates/health
 * @desc    Health check for certificate service
 * @access  Private
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'certificates',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        generation: 'active',
        verification: 'active',
        templates: 'active',
        sharing: 'active',
        analytics: 'active',
        blockchain: 'planned', // Future feature
      },
      statistics: {
        templatesAvailable: 5,
        formatsSupported: ['pdf', 'png', 'jpg'],
        sharingPlatforms: [
          'linkedin',
          'twitter',
          'facebook',
          'instagram',
          'email',
        ],
      },
    },
  });
});

/**
 * Error handling middleware for certificate routes
 */
router.use((error, req, res, next) => {
  console.error('Certificate route error:', error);

  // Handle specific certificate-related errors
  if (error.message.includes('Certificate not found')) {
    return res.status(404).json({
      success: false,
      error: 'Certificate not found',
      message:
        'The requested certificate does not exist or you do not have access to it',
    });
  }

  if (
    error.message.includes('already issued') ||
    error.message.includes('already exists')
  ) {
    return res.status(409).json({
      success: false,
      error: 'Certificate already exists',
      message: 'A certificate has already been issued for this achievement',
    });
  }

  if (
    error.message.includes('not eligible') ||
    error.message.includes('eligibility')
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not eligible for certificate',
      message: error.message,
    });
  }

  if (
    error.message.includes('generation failed') ||
    error.message.includes('template')
  ) {
    return res.status(500).json({
      success: false,
      error: 'Certificate generation failed',
      message: 'Unable to generate certificate. Please try again later.',
    });
  }

  if (
    error.message.includes('verification') &&
    error.message.includes('invalid')
  ) {
    return res.status(404).json({
      success: false,
      error: 'Invalid certificate',
      message:
        'Certificate verification failed - certificate may be invalid or revoked',
    });
  }

  // Pass to global error handler
  next(error);
});

module.exports = router;
