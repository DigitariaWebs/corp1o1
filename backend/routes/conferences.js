const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { validate } = require('../middleware/validation');

// Import controllers
const {
  createConference,
  deleteConference,
  getConference,
  verifyPin,
} = require('../controllers/conferenceController');

// Validation schemas
const createConferenceSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Conference ID is required',
    'any.required': 'Conference ID is required',
  }),
  hasPassword: Joi.boolean().default(false),
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .when('hasPassword', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.pattern.base': 'PIN must be exactly 4 digits',
      'any.required': 'PIN is required when password protection is enabled',
    }),
  createdBy: Joi.string().optional().allow('').messages({
    'string.base': 'createdBy must be a string',
  }),
});

const verifyPinSchema = Joi.object({
  pin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'PIN must be exactly 4 digits',
      'any.required': 'PIN is required',
    }),
});

/**
 * @route   POST /api/conferences
 * @desc    Create a new conference
 * @access  Public
 */
router.post(
  '/',
  validate(createConferenceSchema),
  createConference
);

/**
 * @route   GET /api/conferences/:id
 * @desc    Get conference details
 * @access  Public
 */
router.get('/:id', getConference);

/**
 * @route   POST /api/conferences/:id/verify-pin
 * @desc    Verify PIN for protected conference
 * @access  Public
 */
router.post(
  '/:id/verify-pin',
  validate(verifyPinSchema, 'body'),
  verifyPin
);

/**
 * @route   DELETE /api/conferences/:id
 * @desc    End/Delete a conference
 * @access  Public
 */
router.delete(
  '/:id',
  deleteConference
);

module.exports = router;

