// routes/floatingChat.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { validate } = require('../middleware/validation');

// Import fast chat controller
const {
  sendMessage,
  sendMessageNonStreaming,
  getHistory,
  clearHistory,
  createSession,
} = require('../controllers/fastChatController');

// Validation schemas
const sendMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(2000).trim().messages({
    'string.empty': 'Message cannot be empty',
    'string.min': 'Message must be at least 1 character',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message is required',
  }),
  sessionId: Joi.string().optional().messages({
    'string.base': 'Session ID must be a string',
  }),
});

/**
 * @route   POST /api/floating-chat/message
 * @desc    Send a message and get AI response (streaming by default)
 * @access  Public
 */
router.post('/message', validate(sendMessageSchema), (req, res, next) => {
  // Check if streaming is requested
  const wantStream = req.query.stream !== 'false' && req.query.stream !== '0';
  
  if (wantStream) {
    return sendMessage(req, res, next);
  } else {
    return sendMessageNonStreaming(req, res, next);
  }
});

/**
 * @route   GET /api/floating-chat/history/:sessionId
 * @desc    Get chat history for a session
 * @access  Public
 */
router.get('/history/:sessionId', getHistory);

/**
 * @route   DELETE /api/floating-chat/history/:sessionId
 * @desc    Clear chat history for a session
 * @access  Public
 */
router.delete('/history/:sessionId', clearHistory);

/**
 * @route   POST /api/floating-chat/session
 * @desc    Create a new chat session
 * @access  Public
 */
router.post('/session', createSession);

module.exports = router;

