// controllers/conversationController.js
const AISession = require('../models/AISession');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Get user's conversations with pagination
 * GET /api/conversations
 */
const getConversations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { limit = 20, offset = 0, personality = null } = req.query;

  console.log(`📚 Getting conversations for user: ${userId}`);

  const query = { userId };
  if (personality) query.aiPersonality = personality;

  const sessions = await AISession.find(query)
    .sort({ lastInteraction: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .select('sessionId aiPersonality startTime endTime lastInteraction status messages')
    .lean();

  const conversations = sessions.map((session) => {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    const lastMessage = session.messages[session.messages.length - 1];
    
    return {
      id: session.sessionId,
      title: firstUserMessage ? 
        firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '') :
        'New Conversation',
      personality: session.aiPersonality,
      createdAt: session.startTime,
      updatedAt: session.lastInteraction,
      messageCount: session.messages.length,
      status: session.status,
      lastMessage: lastMessage ? {
        content: lastMessage.content.substring(0, 100),
        timestamp: lastMessage.timestamp,
        role: lastMessage.role,
      } : null,
    };
  });

  const total = await AISession.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      conversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        hasMore: offset + conversations.length < total,
      },
    },
  });
});

/**
 * Get a specific conversation
 * GET /api/conversations/:conversationId
 */
const getConversation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  console.log(`🔍 Getting conversation: ${conversationId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  }).lean();

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const firstUserMessage = session.messages.find(msg => msg.role === 'user');
  const lastMessage = session.messages[session.messages.length - 1];

  const conversation = {
    id: session.sessionId,
    title: firstUserMessage ? 
      firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '') :
      'New Conversation',
    personality: session.aiPersonality,
    createdAt: session.startTime,
    updatedAt: session.lastInteraction,
    messageCount: session.messages.length,
    status: session.status,
    duration: session.duration,
    analytics: session.analytics,
    context: session.context,
    lastMessage: lastMessage ? {
      content: lastMessage.content.substring(0, 100),
      timestamp: lastMessage.timestamp,
      role: lastMessage.role,
    } : null,
  };

  res.status(200).json({
    success: true,
    data: { conversation },
  });
});

/**
 * Create a new conversation
 * POST /api/conversations
 */
const createConversation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { title, personality } = req.body;

  console.log(`🆕 Creating new conversation for user: ${userId}`);

  // Get user's default personality if not specified
  const user = await User.findById(userId);
  const aiPersonality = personality || user?.learningProfile?.aiPersonality || 'ARIA';

  const newSession = new AISession({
    sessionId: uuidv4(),
    userId,
    aiPersonality,
    startTime: new Date(),
    status: 'active',
    configuration: {
      modelType: 'openai-gpt4',
      maxMessages: 100,
      sessionTimeout: 30,
      adaptiveMode: true,
      contextAware: true,
    },
  });

  await newSession.save();

  const conversation = {
    id: newSession.sessionId,
    title: title || 'New Conversation',
    personality: newSession.aiPersonality,
    createdAt: newSession.startTime,
    updatedAt: newSession.lastInteraction,
    messageCount: 0,
    status: newSession.status,
    lastMessage: null,
  };

  res.status(201).json({
    success: true,
    data: { conversation },
  });
});

/**
 * Update a conversation
 * PUT /api/conversations/:conversationId
 */
const updateConversation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;
  const { title } = req.body;

  console.log(`✏️ Updating conversation: ${conversationId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  // Update session metadata if needed
  if (title) {
    // Store title in session context or metadata
    session.context = {
      ...session.context,
      customTitle: title,
    };
  }

  session.lastInteraction = new Date();
  await session.save();

  const firstUserMessage = session.messages.find(msg => msg.role === 'user');
  const lastMessage = session.messages[session.messages.length - 1];

  const conversation = {
    id: session.sessionId,
    title: title || (firstUserMessage ? 
      firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '') :
      'New Conversation'),
    personality: session.aiPersonality,
    createdAt: session.startTime,
    updatedAt: session.lastInteraction,
    messageCount: session.messages.length,
    status: session.status,
    lastMessage: lastMessage ? {
      content: lastMessage.content.substring(0, 100),
      timestamp: lastMessage.timestamp,
      role: lastMessage.role,
    } : null,
  };

  res.status(200).json({
    success: true,
    data: { conversation },
  });
});

/**
 * Delete a conversation
 * DELETE /api/conversations/:conversationId
 */
const deleteConversation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  console.log(`🗑️ Deleting conversation: ${conversationId}`);

  const result = await AISession.deleteOne({
    sessionId: conversationId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError('Conversation not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      message: 'Conversation deleted successfully',
      conversationId,
    },
  });
});

/**
 * Get messages for a conversation with pagination
 * GET /api/conversations/:conversationId/messages
 */
const getConversationMessages = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  console.log(`💬 Getting messages for conversation: ${conversationId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  }).lean();

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  // Get messages with pagination
  const totalMessages = session.messages.length;
  const startIndex = Math.max(0, totalMessages - parseInt(limit) - parseInt(offset));
  const endIndex = Math.max(0, totalMessages - parseInt(offset));
  
  const messages = session.messages
    .slice(startIndex, endIndex)
    .map((msg) => ({
      id: msg.messageId,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: {
        intent: msg.metadata?.intent,
        confidence: msg.metadata?.confidence,
        responseTime: msg.metadata?.responseTime,
        feedback: msg.metadata?.feedback,
      },
    }));

  res.status(200).json({
    success: true,
    data: {
      messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalMessages,
        hasMore: endIndex < totalMessages,
      },
    },
  });
});

/**
 * Add a message to a conversation
 * POST /api/conversations/:conversationId/messages
 */
const addMessage = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;
  const { content, role } = req.body;

  console.log(`➕ Adding message to conversation: ${conversationId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const message = session.addMessage(role, content, {
    timestamp: new Date(),
  });

  await session.save();

  res.status(201).json({
    success: true,
    data: {
      message: {
        id: message.messageId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      },
    },
  });
});

/**
 * Update a message in a conversation
 * PUT /api/conversations/:conversationId/messages/:messageId
 */
const updateMessage = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId, messageId } = req.params;
  const { content } = req.body;

  console.log(`✏️ Updating message: ${messageId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const message = session.messages.find(msg => msg.messageId === messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  // Update message content
  if (content !== undefined) {
    message.content = content;
  }

  session.lastInteraction = new Date();
  await session.save();

  res.status(200).json({
    success: true,
    data: {
      message: {
        id: message.messageId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      },
    },
  });
});

/**
 * Delete a message from a conversation
 * DELETE /api/conversations/:conversationId/messages/:messageId
 */
const deleteMessage = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { conversationId, messageId } = req.params;

  console.log(`🗑️ Deleting message: ${messageId}`);

  const session = await AISession.findOne({
    sessionId: conversationId,
    userId,
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const messageIndex = session.messages.findIndex(msg => msg.messageId === messageId);
  if (messageIndex === -1) {
    throw new AppError('Message not found', 404);
  }

  // Remove message from array
  session.messages.splice(messageIndex, 1);
  session.lastInteraction = new Date();
  await session.save();

  res.status(200).json({
    success: true,
    data: {
      message: 'Message deleted successfully',
      messageId,
    },
  });
});

// Public versions for AI assistant (no authentication required)
const getPublicConversations = catchAsync(async (req, res) => {
  const { limit = 20, offset = 0, personality = null } = req.query;

  console.log(`📚 Getting public conversations`);

  // Use a constant ObjectId for anonymous users
  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const query = { userId: anonymousUserId };
  if (personality) query.aiPersonality = personality;

  const sessions = await AISession.find(query)
    .sort({ lastInteraction: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .select('sessionId aiPersonality startTime endTime lastInteraction status messages')
    .lean();

  const conversations = sessions.map((session) => {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    const lastMessage = session.messages[session.messages.length - 1];
    
    return {
      id: session.sessionId,
      title: firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
      personality: session.aiPersonality,
      createdAt: session.startTime,
      updatedAt: session.lastInteraction,
      messageCount: session.messages.length,
      status: session.status,
      lastMessage: lastMessage ? {
        content: lastMessage.content.substring(0, 100),
        timestamp: lastMessage.timestamp,
        role: lastMessage.role
      } : null
    };
  });

  res.json({
    success: true,
    data: {
      conversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: conversations.length,
        hasMore: conversations.length === parseInt(limit)
      }
    }
  });
});

const getPublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  }).lean();

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const firstUserMessage = session.messages.find(msg => msg.role === 'user');
  const lastMessage = session.messages[session.messages.length - 1];

  const conversation = {
    id: session.sessionId,
    title: firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
    personality: session.aiPersonality,
    createdAt: session.startTime,
    updatedAt: session.lastInteraction,
    messageCount: session.messages.length,
    status: session.status,
    lastMessage: lastMessage ? {
      content: lastMessage.content.substring(0, 100),
      timestamp: lastMessage.timestamp,
      role: lastMessage.role
    } : null
  };

  res.json({
    success: true,
    data: { conversation }
  });
});

const createPublicConversation = catchAsync(async (req, res) => {
  const { title, personality = 'ARIA' } = req.body;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const newSession = new AISession({
    sessionId: uuidv4(),
    userId: anonymousUserId,
    aiPersonality: personality,
    startTime: new Date(),
    status: 'active',
    context: {
      sessionDuration: 0,
      userState: 'focused',
      lastActivity: new Date(),
      progressContext: {
        currentProgress: 0,
        recentPerformance: 0,
        strugglingAreas: [],
        strengths: [],
        lastAssessmentScore: null
      },
      deviceType: 'unknown',
      platform: 'web',
      timezone: 'UTC'
    },
    configuration: {
      modelType: 'openai-gpt4',
      maxMessages: 100,
      sessionTimeout: 30,
      adaptiveMode: true,
      contextAware: true,
    },
    analytics: {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      averageRating: 0,
      totalTokens: 0,
      averageTokensPerMessage: 0,
      sessionDuration: 0,
      engagementScore: 0,
      learningProgress: 0,
      retentionRate: 0,
      adaptationEffectiveness: 0,
      personalizationScore: 0,
      contextRelevance: 0,
      sessionQuality: 0
    },
  });

  await newSession.save();

  const conversation = {
    id: newSession.sessionId,
    title: title || 'New Conversation',
    personality: newSession.aiPersonality,
    createdAt: newSession.startTime,
    updatedAt: newSession.lastInteraction,
    messageCount: 0,
    status: newSession.status,
    lastMessage: null
  };

  res.status(201).json({
    success: true,
    data: { conversation }
  });
});

const updatePublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, personality } = req.body;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  if (title) {
    // Update the first user message content to reflect the new title
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      firstUserMessage.content = title;
    }
  }

  if (personality) {
    session.aiPersonality = personality;
  }

  await session.save();

  const conversation = {
    id: session.sessionId,
    title: title || 'Updated Conversation',
    personality: session.aiPersonality,
    createdAt: session.startTime,
    updatedAt: session.lastInteraction,
    messageCount: session.messages.length,
    status: session.status
  };

  res.json({
    success: true,
    data: { conversation }
  });
});

const deletePublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOneAndDelete({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  res.json({
    success: true,
    data: { message: 'Conversation deleted successfully' }
  });
});

const getPublicConversationMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  }).lean();

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const messages = session.messages
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
    .map(msg => ({
      id: msg.messageId,
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: session.messages.length,
        hasMore: (parseInt(offset) + parseInt(limit)) < session.messages.length
      }
    }
  });
});

const addPublicMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, role = 'user', metadata = {} } = req.body;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const message = session.addMessage(role, content, metadata);
  await session.save();

  res.status(201).json({
    success: true,
    data: {
      message: {
        id: message.messageId,
        content: message.content,
        role: message.role,
        timestamp: message.timestamp,
        metadata: message.metadata
      }
    }
  });
});

const updatePublicMessage = catchAsync(async (req, res) => {
  const { id, messageId } = req.params;
  const { content, metadata } = req.body;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const message = session.messages.find(m => m.messageId === messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (content) message.content = content;
  if (metadata) message.metadata = { ...message.metadata, ...metadata };

  await session.save();

  res.json({
    success: true,
    data: {
      message: {
        id: message.messageId,
        content: message.content,
        role: message.role,
        timestamp: message.timestamp,
        metadata: message.metadata
      }
    }
  });
});

const deletePublicMessage = catchAsync(async (req, res) => {
  const { id, messageId } = req.params;

  const anonymousUserId = new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const messageIndex = session.messages.findIndex(m => m.messageId === messageId);
  if (messageIndex === -1) {
    throw new AppError('Message not found', 404);
  }

  session.messages.splice(messageIndex, 1);
  await session.save();

  res.json({
    success: true,
    data: { message: 'Message deleted successfully' }
  });
});

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getConversationMessages,
  updateMessage,
  deleteMessage,
  // Public versions
  getPublicConversations,
  getPublicConversation,
  createPublicConversation,
  updatePublicConversation,
  deletePublicConversation,
  addPublicMessage,
  getPublicConversationMessages,
  updatePublicMessage,
  deletePublicMessage,
};
