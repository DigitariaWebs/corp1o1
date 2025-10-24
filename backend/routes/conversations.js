// routes/conversations.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { authenticateWithClerk } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Import controllers
const {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getConversationMessages,
  updateMessage,
  deleteMessage,
} = require('../controllers/conversationController');

// Import public controllers for AI assistant
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
} = require('../controllers/conversationController');

// Validation schemas
const createConversationSchema = Joi.object({
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
  // Personality system removed for optimization
  personality: Joi.string().optional().messages({}),
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

const conversationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50',
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Offset cannot be negative',
  }),
  // Personality system removed for optimization
  personality: Joi.string().optional().messages({}),
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

// Require Clerk-based auth for all conversation routes
router.use(authenticateWithClerk);

/**
 * @route   GET /api/conversations
 * @desc    Get user's conversations with pagination
 * @access  Private
 * @query   limit, offset, personality
 */
router.get(
  '/',
  validate(conversationQuerySchema, 'query'),
  getConversations,
);

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation
 * @access  Private
 * @body    { title?, personality? }
 */
router.post(
  '/',
  validate(createConversationSchema),
  createConversation,
);

/**
 * @route   GET /api/conversations/:conversationId
 * @desc    Get a specific conversation
 * @access  Private
 * @param   conversationId - UUID of the conversation
 */
router.get(
  '/:conversationId',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  getConversation,
);

/**
 * @route   PUT /api/conversations/:conversationId
 * @desc    Update a conversation (e.g., title)
 * @access  Private
 * @param   conversationId - UUID of the conversation
 * @body    { title? }
 */
router.put(
  '/:conversationId',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  validate(updateConversationSchema),
  updateConversation,
);

/**
 * @route   DELETE /api/conversations/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 * @param   conversationId - UUID of the conversation
 */
router.delete(
  '/:conversationId',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  deleteConversation,
);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Get messages for a conversation with pagination
 * @access  Private
 * @param   conversationId - UUID of the conversation
 * @query   limit, offset
 */
router.get(
  '/:conversationId/messages',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  validate(messageQuerySchema, 'query'),
  getConversationMessages,
);

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Add a message to a conversation
 * @access  Private
 * @param   conversationId - UUID of the conversation
 * @body    { content, role }
 */
router.post(
  '/:conversationId/messages',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  validate(addMessageSchema),
  addMessage,
);

/**
 * @route   PUT /api/conversations/:conversationId/messages/:messageId
 * @desc    Update a message in a conversation
 * @access  Private
 * @param   conversationId - UUID of the conversation
 * @param   messageId - UUID of the message
 * @body    { content? }
 */
router.put(
  '/:conversationId/messages/:messageId',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
      messageId: Joi.string().uuid().required().messages({
        'string.uuid': 'Message ID must be a valid UUID',
        'any.required': 'Message ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  validate(updateMessageSchema),
  updateMessage,
);

/**
 * @route   DELETE /api/conversations/:conversationId/messages/:messageId
 * @desc    Delete a message from a conversation
 * @access  Private
 * @param   conversationId - UUID of the conversation
 * @param   messageId - UUID of the message
 */
router.delete(
  '/:conversationId/messages/:messageId',
  (req, res, next) => {
    const schema = Joi.object({
      conversationId: Joi.string().uuid().required().messages({
        'string.uuid': 'Conversation ID must be a valid UUID',
        'any.required': 'Conversation ID is required',
      }),
      messageId: Joi.string().uuid().required().messages({
        'string.uuid': 'Message ID must be a valid UUID',
        'any.required': 'Message ID is required',
      }),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  },
  deleteMessage,
);

module.exports = router;
