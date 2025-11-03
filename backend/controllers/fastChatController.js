// controllers/fastChatController.js
// Lightweight, fast chatbot controller for floating chat widget
// Uses fast AI models for quick responses

const { openAIService } = require('../services/openaiService');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { getModelConfig } = require('../config/aiModelConfig');

// Simple in-memory session storage for quick access
// In production, consider Redis or a lightweight database
const chatSessions = new Map();

// Lightweight system prompt for quick responses
const FAST_CHAT_SYSTEM_PROMPT = "You are a helpful, concise AI assistant. Provide clear, quick answers. Keep responses brief but informative. Be friendly and direct.";

/**
 * Get or create a chat session
 * @param {string} sessionId - Optional session ID
 * @returns {Object} Session object with messages
 */
function getSession(sessionId) {
  if (!sessionId || !chatSessions.has(sessionId)) {
    const newSessionId = sessionId || `fast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    chatSessions.set(newSessionId, {
      id: newSessionId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    });
    return chatSessions.get(newSessionId);
  }
  return chatSessions.get(sessionId);
}

/**
 * Clean up old sessions (older than 24 hours)
 */
function cleanupOldSessions() {
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const [sessionId, session] of chatSessions.entries()) {
    if (session.lastActivity.getTime() < twentyFourHoursAgo) {
      chatSessions.delete(sessionId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

/**
 * Send a message and get AI response (streaming)
 * POST /api/floating-chat/message
 */
exports.sendMessage = catchAsync(async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message is required and cannot be empty', 400);
  }

  // Get or create session
  const session = getSession(sessionId);
  session.lastActivity = new Date();

  // Add user message to session
  const userMessage = {
    role: 'user',
    content: message.trim(),
    timestamp: new Date(),
  };
  session.messages.push(userMessage);

  // Limit conversation history to last 10 messages for speed
  const recentMessages = session.messages.slice(-10);

  // Prepare messages for API (with system prompt)
  const messagesForAPI = [
    { role: 'system', content: FAST_CHAT_SYSTEM_PROMPT },
    ...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // Get lightweight model config
  const modelConfig = getModelConfig('lightweight');
  
  // Set up streaming response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  try {
    // Request streaming response
    const { stream } = await openAIService.createChatCompletion(
      messagesForAPI,
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature || 0.7,
        max_tokens: modelConfig.maxTokens || 2000,
        stream: true,
      },
    );

    let assistantContent = '';
    
    // Stream chunks to client
    for await (const chunk of stream) {
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
              // Send chunk to client
              res.write(`data: ${JSON.stringify({ content: deltaContent })}\n\n`);
            }
          } catch (_e) {
            // Skip invalid JSON chunks
            continue;
          }
        }
      }
    }

    // Add assistant response to session
    if (assistantContent) {
      session.messages.push({
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      });
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Fast chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate response. Please try again.' })}\n\n`);
    res.end();
  }
});

/**
 * Send a message and get AI response (non-streaming)
 * POST /api/floating-chat/message?stream=false
 */
exports.sendMessageNonStreaming = catchAsync(async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message is required and cannot be empty', 400);
  }

  // Get or create session
  const session = getSession(sessionId);
  session.lastActivity = new Date();

  // Add user message to session
  const userMessage = {
    role: 'user',
    content: message.trim(),
    timestamp: new Date(),
  };
  session.messages.push(userMessage);

  // Limit conversation history to last 10 messages for speed
  const recentMessages = session.messages.slice(-10);

  // Prepare messages for API (with system prompt)
  const messagesForAPI = [
    { role: 'system', content: FAST_CHAT_SYSTEM_PROMPT },
    ...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // Get lightweight model config
  const modelConfig = getModelConfig('lightweight');

  // Get AI response
  const aiResponse = await openAIService.createChatCompletion(messagesForAPI, {
    model: modelConfig.model,
    temperature: modelConfig.temperature || 0.7,
    max_tokens: modelConfig.maxTokens || 2000,
  });

  // Add assistant response to session
  if (aiResponse.content) {
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
    });
  }

  res.json({
    success: true,
    data: {
      message: aiResponse.content,
      sessionId: session.id,
      model: aiResponse.model,
    },
  });
});

/**
 * Get chat history for a session
 * GET /api/floating-chat/history/:sessionId
 */
exports.getHistory = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  const session = getSession(sessionId);
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      messages: session.messages,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    },
  });
});

/**
 * Clear chat history for a session
 * DELETE /api/floating-chat/history/:sessionId
 */
exports.clearHistory = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
  }

  res.json({
    success: true,
    data: {
      message: 'Chat history cleared',
    },
  });
});

/**
 * Create a new session
 * POST /api/floating-chat/session
 */
exports.createSession = catchAsync(async (req, res) => {
  const session = getSession();
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      createdAt: session.createdAt,
    },
  });
});

