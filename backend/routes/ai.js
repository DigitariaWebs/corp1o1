// routes/ai.js
// Simplified AI routes - removed unused endpoints
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { authenticateWithClerk } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Import controller
const { provideFeedback } = require('../controllers/chatController');

// Feedback validation schema
const feedbackSchema = Joi.object({
  messageId: Joi.string().uuid().required().messages({
    'string.uuid': 'Message ID must be a valid UUID',
    'any.required': 'Message ID is required',
  }),

  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
  }),

  helpful: Joi.boolean().optional(),

  comment: Joi.string().max(500).optional().messages({
    'string.max': 'Comment cannot exceed 500 characters',
  }),
});

// Require authentication for all AI routes
router.use(authenticateWithClerk);

/**
 * @route   POST /api/ai/feedback
 * @desc    Provide feedback on AI response
 * @access  Private
 */
router.post('/feedback', validate(feedbackSchema), provideFeedback);

module.exports = router;
