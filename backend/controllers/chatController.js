// controllers/chatController.js
// Consolidated AI chat controller - merged from aiController, assistantController, conversationController

const mongoose = require('mongoose');
const User = require('../models/User');
const { openAIService } = require('../services/openaiService');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { getModelConfig } = require('../config/aiModelConfig');
const { getPromptForType, isValidConversationType } = require('../config/conversationPrompts');

/**
 * Wait for database connection to be ready
 */
async function waitForDatabaseConnection(maxWaitMs = 10000) {
  const startTime = Date.now();
  
  while (mongoose.connection.readyState !== 1) {
    // Check if we've exceeded the maximum wait time
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Database connection timeout - connection not ready after 10 seconds');
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return true;
}

/**
 * Get or create anonymous user for public conversations
 */
async function getAnonymousUser() {
  // Wait for database connection to be ready before querying
  await waitForDatabaseConnection();
  
  const anonymousUserId = new mongoose.Types.ObjectId('000000000000000000000000');
  let user = await User.findById(anonymousUserId);
  
  if (!user) {
    // Create anonymous user if it doesn't exist
    user = await User.create({
      _id: anonymousUserId,
      clerkUserId: 'anonymous',
      email: 'anonymous@public.local',
      firstName: 'Anonymous',
      lastName: 'User',
      isActive: true,
    });
  }
  
  return user;
}

/**
 * Provide feedback on AI response
 * POST /api/ai/feedback
 */
exports.provideFeedback = catchAsync(async (req, res) => {
  const { messageId, sessionId, rating, helpful, comment } = req.body;
  
  // Get user (from request if authenticated, or anonymous)
  let user = req.user;
  if (!user) {
    user = await getAnonymousUser();
  } else {
    user = await User.findById(user._id || user);
    if (!user) {
      throw new AppError('User not found', 404);
    }
  }

  // Find session containing this message
  let session = null;
  if (sessionId) {
    session = user.findAISession(sessionId);
  } else {
    // Search through all sessions for the message
    for (const s of user.aiChats) {
      if (s.messages.some(m => m.messageId === messageId)) {
        session = s;
        break;
      }
    }
  }

  if (!session) {
    throw new AppError('Session or message not found', 404);
  }

  // Add feedback to the message
  const success = user.addMessageFeedbackToAISession(session.sessionId, messageId, {
    rating,
    helpful,
    comment
  });

  if (!success) {
    throw new AppError('Failed to add feedback', 500);
  }

  await user.save();

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

  const user = await getAnonymousUser();
  
  // Get sessions sorted by lastInteraction
  const sessions = [...user.aiChats]
    .sort((a, b) => {
      const aTime = a.lastInteraction ? new Date(a.lastInteraction).getTime() : new Date(a.startTime).getTime();
      const bTime = b.lastInteraction ? new Date(b.lastInteraction).getTime() : new Date(b.startTime).getTime();
      return bTime - aTime;
    })
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  const conversations = sessions.map((session) => {
    const firstUserMessage = session.messages.find(msg => msg.role === 'user');
    const lastMessage = session.messages[session.messages.length - 1];
    
    return {
      id: session.sessionId,
      title: session.title || firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
      personality: session.aiPersonality,
      conversationType: session.conversationType || 'GENERAL',
      createdAt: session.startTime,
      updatedAt: session.lastInteraction || session.startTime,
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
        total: user.aiChats.length,
        hasMore: (parseInt(offset) + parseInt(limit)) < user.aiChats.length,
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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const firstUserMessage = session.messages.find(msg => msg.role === 'user');
  const lastMessage = session.messages[session.messages.length - 1];

  const conversation = {
    id: session.sessionId,
    title: session.title || firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
    personality: session.aiPersonality,
    conversationType: session.conversationType || 'GENERAL',
    createdAt: session.startTime,
    updatedAt: session.lastInteraction || session.startTime,
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
  const user = await getAnonymousUser();
  
  // Validate conversation type if provided
  const validConversationType = conversationType && isValidConversationType(conversationType) 
    ? conversationType 
    : 'GENERAL';
  
  const session = user.getOrCreateAISession(uuidv4(), {
    title: title || 'New Conversation',
    conversationType: validConversationType,
    aiPersonality: 'ASSISTANT',
    timezone: 'UTC',
  });

  await user.save();

  const conversation = {
    id: session.sessionId,
    title: session.title || 'New Conversation',
    personality: session.aiPersonality,
    conversationType: session.conversationType || 'GENERAL',
    createdAt: session.startTime,
    updatedAt: session.lastInteraction || session.startTime,
    messageCount: session.messages.length,
    status: session.status,
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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  if (title) {
    session.title = title;
    session.lastInteraction = new Date();
  }

  await user.save();

  const conversation = {
    id: session.sessionId,
    title: session.title || 'Updated Conversation',
    personality: session.aiPersonality,
    conversationType: session.conversationType || 'GENERAL',
    createdAt: session.startTime,
    updatedAt: session.lastInteraction || session.startTime,
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
  const user = await getAnonymousUser();
  
  const deleted = user.deleteAISession(id);

  if (!deleted) {
    throw new AppError('Conversation not found', 404);
  }

  await user.save();

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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  // Add user message
  const userMessage = user.addMessageToAISession(session.sessionId, role, content, metadata);
  await user.save();

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
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders && res.flushHeaders();

      let assistantContent = '';
      let streamError = null;

      try {
        const { stream } = await openAIService.createChatCompletion(
          optimizedHistory,
          {
            model: getModelConfig('conversation').model,
            userId: user._id.toString(),
            stream: true,
          },
        );
        
        for await (const chunk of stream) {
          // Parse the SSE chunk from OpenAI
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim(); // Remove 'data: ' prefix
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  assistantContent += deltaContent;
                  // Send just the text content (frontend expects plain text after "data:")
                  res.write(`data:${deltaContent}\n\n`);
                  // Flush to ensure immediate delivery
                  if (res.flush) res.flush();
                }
              } catch (_e) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        streamError = error;
        // Send error to client
        res.write(`data:${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
      }
      
      // Always close the stream properly
      try {
        res.end();
      } catch (e) {
        console.error('Error closing stream:', e);
      }

      // Save the assistant response after stream closes (if we got content)
      if (assistantContent && !streamError) {
        try {
          user.addMessageToAISession(session.sessionId, 'assistant', assistantContent, {
            model: getModelConfig('conversation').model,
            timestamp: new Date(),
          });
          await user.save();
        } catch (saveError) {
          console.error('Error saving assistant message:', saveError);
        }
      }
      
      return;
    }

    // Non-streaming mode
    console.log('📤 Sending request to OpenAI...');
    const aiResponse = await openAIService.createChatCompletion(optimizedHistory, {
      model: getModelConfig('conversation').model,
      userId: user._id.toString(),
    });
    console.log('✅ Received AI response:', aiResponse.content?.substring(0, 100) + '...');

    user.addMessageToAISession(session.sessionId, 'assistant', aiResponse.content, {
      model: aiResponse.model,
      timestamp: new Date(),
    });
    await user.save();

    // Send response in SSE format (same as streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send the complete response as text (frontend expects plain text after "data:")
    res.write(`data:${aiResponse.content}\n\n`);
    
    // Send completion signal (removed to avoid showing in chat)
    // res.write(`data:[DONE]\n\n`);
    
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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const message = session.messages.find(m => m.messageId === messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (content) message.content = content;
  if (metadata) {
    if (!message.metadata) message.metadata = {};
    message.metadata = { ...message.metadata, ...metadata };
  }

  session.lastInteraction = new Date();
  await user.save();

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
  const user = await getAnonymousUser();
  
  const session = user.findAISession(id);

  if (!session) {
    throw new AppError('Conversation not found', 404);
  }

  const messageIndex = session.messages.findIndex(m => m.messageId === messageId);
  if (messageIndex === -1) {
    throw new AppError('Message not found', 404);
  }

  session.messages.splice(messageIndex, 1);
  session.lastInteraction = new Date();
  await user.save();

  res.json({
    success: true,
    data: { message: 'Message deleted successfully' }
  });
});

