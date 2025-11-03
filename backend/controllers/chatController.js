// controllers/chatController.js
// Consolidated AI chat controller - merged from aiController, assistantController, conversationController

const mongoose = require('mongoose');
const AISession = require('../models/AISession');
const { openAIService } = require('../services/openaiService');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { getModelConfig } = require('../config/aiModelConfig');
const { getPromptForType, isValidConversationType } = require('../config/conversationPrompts');


/**
 * Provide feedback on AI response
 * POST /api/ai/feedback
 */
exports.provideFeedback = catchAsync(async (req, res) => {
  const { messageId, rating, helpful, comment } = req.body;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');

  // Find the session containing this message
  const session = await AISession.findOne({
    userId: anonymousUserId,
    'messages.messageId': messageId
  });

  if (!session) {
    throw new AppError('Message not found', 404);
  }

  // Add feedback to the message
  const success = session.addMessageFeedback(messageId, {
    rating,
    helpful,
    comment
  });

  if (!success) {
    throw new AppError('Failed to add feedback', 500);
  }

  await session.save();

  res.json({
    success: true,
    data: {
      message: 'Feedback recorded successfully',
      messageId,
      feedback: {
        rating,
        helpful,
        comment
      }
    }
  });
});

// ============================================================================
// PUBLIC CONVERSATION ENDPOINTS (no auth required)
// ============================================================================

/**
 * Get public conversations
 * GET /api/conversations/public
 */
exports.getPublicConversations = catchAsync(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  const query = { userId: anonymousUserId };

  const sessions = await AISession.find(query)
    .sort({ lastInteraction: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .select('sessionId aiPersonality conversationType startTime endTime lastInteraction status messages')
    .lean();

  const conversations = sessions.map((session) => {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    const lastMessage = session.messages[session.messages.length - 1];
    
    return {
      id: session.sessionId,
      title: firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
      personality: session.aiPersonality,
      conversationType: session.conversationType || 'GENERAL',
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

  res.json({
    success: true,
    data: {
      conversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: conversations.length,
        hasMore: conversations.length === parseInt(limit),
      },
    }
  });
});

/**
 * Get public conversation by ID
 * GET /api/conversations/public/:id
 */
exports.getPublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
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
    conversationType: session.conversationType || 'GENERAL',
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

/**
 * Create new public conversation
 * POST /api/conversations/public
 */
exports.createPublicConversation = catchAsync(async (req, res) => {
  const { title, conversationType } = req.body;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
  // Validate conversation type if provided
  const validConversationType = conversationType && isValidConversationType(conversationType) 
    ? conversationType 
    : 'GENERAL';
  
  const newSession = new AISession({
    sessionId: uuidv4(),
    userId: anonymousUserId,
    aiPersonality: 'ASSISTANT',
    conversationType: validConversationType,
    startTime: new Date(),
    status: 'active',
    context: {
      sessionDuration: 0,
      userState: 'focused',
      lastActivity: new Date(),
      deviceType: 'unknown',
      platform: 'web',
      timezone: 'UTC'
    }
  });

  await newSession.save();

  const conversation = {
    id: newSession.sessionId,
    title: title || 'New Conversation',
    personality: newSession.aiPersonality,
    conversationType: newSession.conversationType || 'GENERAL',
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

/**
 * Update public conversation
 * PUT /api/conversations/public/:id
 */
exports.updatePublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  if (title) {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      firstUserMessage.content = title;
    }
  }


  await session.save();

  const conversation = {
    id: session.sessionId,
    title: title || 'Updated Conversation',
    personality: session.aiPersonality,
    conversationType: session.conversationType || 'GENERAL',
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

/**
 * Delete public conversation
 * DELETE /api/conversations/public/:id
 */
exports.deletePublicConversation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
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

/**
 * Get messages for public conversation
 * GET /api/conversations/public/:id/messages
 */
exports.getPublicConversationMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
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

/**
 * Add message to public conversation with AI response
 * POST /api/conversations/public/:id/messages
 */
exports.addPublicMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, role = 'user', metadata = {} } = req.body;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
  const session = await AISession.findOne({ 
    sessionId: id, 
    userId: anonymousUserId 
  });

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  // Add user message
  const userMessage = session.addMessage(role, content, metadata);
  await session.save();

  // If it's a user message, generate AI response  
  if (role === 'user') {
    const wantStream = req.query.stream === '1' || req.headers.accept === 'text/event-stream';
    
    // Prepare conversation history
    const conversationHistory = session.messages
      .slice(-8)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    // Get the appropriate system prompt based on conversation type
    const conversationType = session.conversationType || 'GENERAL';
    const systemPrompt = getPromptForType(conversationType);

    const optimizedHistory = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders && res.flushHeaders();

      const { stream } = await openAIService.createChatCompletion(
        optimizedHistory,
        {
          model: getModelConfig('conversation').model,
          userId: anonymousUserId.toString(),
          stream: true,
        },
      );

      let assistantContent = '';
      
      for await (const chunk of stream) {
        // Parse the SSE chunk from OpenAI
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                // Send just the text content
                res.write(`data: ${deltaContent}\n\n`);
              }
            } catch (_e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
      
      // Send completion signal (removed to avoid showing in chat)
      // res.write(`data: [DONE]\n\n`);
      res.end();

      // Add AI response to session
      session.addMessage('assistant', assistantContent, {
        model: getModelConfig('conversation').model,
        timestamp: new Date(),
      });
      await session.save();
      return;
    }

    // Non-streaming mode
    console.log('📤 Sending request to OpenAI...');
    const aiResponse = await openAIService.createChatCompletion(optimizedHistory, {
      model: getModelConfig('conversation').model,
      userId: anonymousUserId.toString(),
    });
    console.log('✅ Received AI response:', aiResponse.content?.substring(0, 100) + '...');

    session.addMessage('assistant', aiResponse.content, {
      model: aiResponse.model,
      timestamp: new Date(),
    });
    await session.save();

    // Send response in SSE format (same as streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the complete response as text
    res.write(`data: ${aiResponse.content}\n\n`);
    
    // Send completion signal (removed to avoid showing in chat)
    // res.write(`data: [DONE]\n\n`);
    
    res.end();
  } else {
    // Non-user message, just return the message
    res.status(201).json({
      success: true,
      data: {
        message: {
          id: userMessage.messageId,
          content: userMessage.content,
          role: userMessage.role,
          timestamp: userMessage.timestamp,
          metadata: userMessage.metadata
        }
      }
    });
  }
});

/**
 * Update message in public conversation
 * PUT /api/conversations/public/:id/messages/:messageId
 */
exports.updatePublicMessage = catchAsync(async (req, res) => {
  const { id, messageId } = req.params;
  const { content, metadata } = req.body;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
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

/**
 * Delete message from public conversation
 * DELETE /api/conversations/public/:id/messages/:messageId
 */
exports.deletePublicMessage = catchAsync(async (req, res) => {
  const { id, messageId } = req.params;
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  
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

