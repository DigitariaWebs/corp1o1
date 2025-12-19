// routes/conversations.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { validate } = require('../middleware/validation');

// Import public controllers (no auth required)
const {
  getPublicConversations,
  getPublicConversation,
  createPublicConversation,
  updatePublicConversation,
  deletePublicConversation,
  addPublicMessage,
  getPublicConversationMessages,
  updatePublicMessage,
  deletePublicMessage,
} = require('../controllers/chatController');

// Validation schemas
const createConversationSchema = Joi.object({
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
  // Personality system removed for optimization
  personality: Joi.string().optional().messages({}),
  conversationType: Joi.string()
    .valid('LEARNING', 'EDUCATION', 'PROBLEM_SOLVING', 'PROGRAMMING', 'MATHEMATICS', 'GENERAL')
    .optional()
    .messages({
      'any.only': 'conversationType must be one of: LEARNING, EDUCATION, PROBLEM_SOLVING, PROGRAMMING, MATHEMATICS, GENERAL',
    }),
});

const updateConversationSchema = Joi.object({
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
});

const addMessageSchema = Joi.object({
  content: Joi.string().required().min(1).max(4000).trim().messages({
    'string.empty': 'Message content cannot be empty',
    'string.min': 'Message must be at least 1 character',
    'string.max': 'Message cannot exceed 4000 characters',
    'any.required': 'Message content is required',
  }),
  role: Joi.string().valid('user', 'assistant', 'system').required().messages({
    'any.only': 'Role must be user, assistant, or system',
    'any.required': 'Role is required',
  }),
});

const updateMessageSchema = Joi.object({
  content: Joi.string().min(1).max(4000).trim().optional().messages({
    'string.min': 'Message must be at least 1 character',
    'string.max': 'Message cannot exceed 4000 characters',
  }),
});



const messageQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Offset cannot be negative',
  }),
});

/**
 * @route   GET /api/conversations/public
 * @desc    Get public conversations for AI assistant (no auth required)
 * @access  Public
 */
router.get('/public', validate(messageQuerySchema, 'query'), getPublicConversations);

/**
 * @route   GET /api/conversations/public/:id
 * @desc    Get public conversation by ID
 * @access  Public
 */
router.get('/public/:id', getPublicConversation);

/**
 * @route   POST /api/conversations/public
 * @desc    Create new public conversation
 * @access  Public
 */
router.post('/public', validate(createConversationSchema), createPublicConversation);

/**
 * @route   PUT /api/conversations/public/:id
 * @desc    Update public conversation
 * @access  Public
 */
router.put('/public/:id', validate(updateConversationSchema), updatePublicConversation);

/**
 * @route   DELETE /api/conversations/public/:id
 * @desc    Delete public conversation
 * @access  Public
 */
router.delete('/public/:id', deletePublicConversation);

/**
 * @route   GET /api/conversations/public/:id/messages
 * @desc    Get messages for public conversation
 * @access  Public
 */
router.get('/public/:id/messages', validate(messageQuerySchema, 'query'), getPublicConversationMessages);

/**
 * @route   POST /api/conversations/public/:id/messages
 * @desc    Add message to public conversation
 * @access  Public
 */
router.post('/public/:id/messages', validate(addMessageSchema), addPublicMessage);

/**
 * @route   PUT /api/conversations/public/:id/messages/:messageId
 * @desc    Update message in public conversation
 * @access  Public
 */
router.put('/public/:id/messages/:messageId', validate(updateMessageSchema), updatePublicMessage);

/**
 * @route   DELETE /api/conversations/public/:id/messages/:messageId
 * @desc    Delete message from public conversation
 * @access  Public
 */
router.delete('/public/:id/messages/:messageId', deletePublicMessage);

// Removed all Clerk-authenticated private routes – only public endpoints remain.

module.exports = router;
