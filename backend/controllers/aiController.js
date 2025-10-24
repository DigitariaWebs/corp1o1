// controllers/aiController.js
const AISession = require('../models/AISession');
// const User = require('../models/User'); // Not used anymore
const { openAIService } = require('../services/openaiService');
// Commented out: detailed user-context aggregation has been disabled for lightweight builds.
// const { contextService } = require('../services/contextService');
const { titleGenerationService } = require('../services/titleGenerationService');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle AI chat messages - Main AI interaction endpoint
 * POST /api/ai/chat
 */
const handleChatMessage = catchAsync(async (req, res) => {
  // Handle both authenticated and unauthenticated requests
  const userId = req.user?._id || new (require('mongoose')).Types.ObjectId('000000000000000000000000');
  const {
    message,
    sessionId = null,
    // context not used anymore
  } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message is required and cannot be empty', 400);
  }

  const startTime = Date.now();
  console.log(`🤖 AI Chat Request - User: ${userId} | Session: ${sessionId}`);

  try {
    // 1. Get or create AI session (simplified - no personality)
    const session = await getOrCreateSession(userId, sessionId);

    // 2. Analyze user message intent (simplified)
    const messageIntent = analyzeMessageIntent(message);

    // 3. Get simple prompt (no personality system)
    const promptData = getSimplePrompt(messageIntent, { userMessage: message });

    // 4. Add user message to session
    session.addMessage('user', message, {
      intent: messageIntent,
      urgency: detectUrgency(message),
      topics: extractTopics(message),
      timestamp: new Date(),
    });

    // 7. Build messages: system+prompt plus recent 8 conversation turns
    const conversationHistory = session.messages
      .slice(-8)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    const optimizedHistory = [...promptData.messages, ...conversationHistory];

    // 8. Generate AI response
    const wantStream = req.query.stream === '1' || req.headers.accept === 'text/event-stream';

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders && res.flushHeaders();

      const { stream } = await openAIService.createChatCompletion(
        optimizedHistory,
        {
          ...promptData.config,
          userId: userId.toString(),
          stream: true,
        },
      );

      let assistantContent = '';
      for await (const chunk of stream) {
        assistantContent += chunk;
        res.write(`data:${chunk}\n\n`);
      }
      res.end();

      // Save assistant message once stream finishes
      session.addMessage('assistant', assistantContent, {
        model: promptData.config.model,
        timestamp: new Date(),
      });
      await session.save();

      // Auto-generate title if needed (don't wait for it)
      if (titleGenerationService.needsTitleGeneration(session)) {
        titleGenerationService.generateTitleFromSession(session)
          .then(async (newTitle) => {
            session.title = newTitle;
            await session.save();
            console.log(`📝 Generated title for session ${session.sessionId}: "${newTitle}"`);
          })
          .catch(err => {
            console.error('Failed to generate title:', err);
          });
      }

      return; // streaming handled
    }

    const aiResponse = await openAIService.createChatCompletion(optimizedHistory, {
      ...promptData.config,
      userId: userId.toString(),
    });

    // 9. Validate response quality
    if (!openAIService.validateResponse(aiResponse)) {
      console.warn('⚠️ AI response quality validation failed');
      throw new AppError(
        'Generated response did not meet quality standards',
        500,
      );
    }

    // 10. Add AI response to session
    const assistantMessage = session.addMessage(
      'assistant',
      aiResponse.content,
      {
        model: aiResponse.model,
        responseTime: Date.now() - startTime,
        tokenCount: aiResponse.usage?.total_tokens || 0,
        confidence: 0.8, // Simplified - no complex confidence calculation
        finishReason: aiResponse.finishReason,
      },
    );

    // 11. Update session context and analytics
    session.updateContext({
      lastActivity: new Date(),
      sessionDuration: Math.round(
        (Date.now() - session.startTime) / (1000 * 60),
      ),
      userState: 'focused', // Simplified - no complex user state
    });

    // 12. Save session
    await session.save();

    // 12.5. Auto-generate title if needed (don't wait for it)
    if (titleGenerationService.needsTitleGeneration(session)) {
      titleGenerationService.generateTitleFromSession(session)
        .then(async (newTitle) => {
          session.title = newTitle;
          await session.save();
          console.log(`📝 Generated title for session ${session.sessionId}: "${newTitle}"`);
        })
        .catch(err => {
          console.error('Failed to generate title:', err);
        });
    }

    // 13. Calculate cost
    const cost = openAIService.calculateCost(
      aiResponse.usage,
      aiResponse.model,
    );

    // 14. Prepare response
    const responseTime = Date.now() - startTime;
    const response = {
      success: true,
      data: {
        message: {
          id: assistantMessage.messageId,
          content: aiResponse.content,
          role: 'assistant',
          timestamp: assistantMessage.timestamp,
          metadata: {
            confidence: assistantMessage.metadata.confidence,
            responseTime,
            model: aiResponse.model,
            promptName: promptData.metadata.promptName,
            personality: 'ASSISTANT',
            adaptationsApplied: [], // Simplified - no adaptations
          },
        },
        session: {
          id: session.sessionId,
          messageCount: session.messages.length,
          duration: session.duration,
        },
        context: {
          userState: 'focused', // Simplified
          recommendedApproach: 'standard',
          motivationLevel: 50,
        },
        usage: {
          tokens: aiResponse.usage,
          cost: Math.round(cost * 10000) / 10000, // Round to 4 decimal places
          model: aiResponse.model,
        },
      },
    };

    console.log(
      `✅ AI Chat Response Generated - ${responseTime}ms | ${
        aiResponse.usage?.total_tokens || 0
      } tokens | $${cost.toFixed(4)}`,
    );
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ AI Chat Error:', error);

    // Try to save error to session if we have one
    if (sessionId) {
      try {
        const errorSession = await AISession.findOne({ sessionId });
        if (errorSession) {
          errorSession.addMessage(
            'system',
            `Error occurred: ${error.message}`,
            {
              error: {
                occurred: true,
                message: error.message,
                code: error.statusCode || 500,
                timestamp: new Date(),
              },
            },
          );
          await errorSession.save();
        }
      } catch (saveError) {
        console.error('Failed to save error to session:', saveError);
      }
    }

    throw error;
  }
});

/**
 * Get current user context for AI interactions
 * GET /api/ai/context
 */
const getUserContext = catchAsync(async (req, res) => {
  const userId = req.user._id;

  console.log(`📋 Getting AI context for user: ${userId}`);

  // Context feature disabled – return placeholder response
  res.status(200).json({
    success: true,
    data: {
      context: null,
      message: 'User context feature is disabled in this build.',
    },
  });
});

/**
 * Switch AI personality for user
 * PUT /api/ai/personality
 */
const switchPersonality = catchAsync(async (req, res) => {
  // Personality system has been removed for optimization
  res.status(200).json({
    success: true,
    data: {
      personality: 'ASSISTANT',
      message: 'Using standard AI assistant (personality system removed for optimization)',
    },
  });
});

/**
 * Provide feedback on AI response
 * POST /api/ai/feedback
 */
const provideFeedback = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { messageId, rating, helpful, comment } = req.body;

  if (!messageId) {
    throw new AppError('Message ID is required', 400);
  }

  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  console.log(`👍 Receiving feedback for message: ${messageId}`);

  // Find the session containing this message
  const session = await AISession.findOne({
    userId,
    'messages.messageId': messageId,
  });

  if (!session) {
    throw new AppError('Message not found in user sessions', 404);
  }

  // Add feedback to the message
  const feedbackAdded = session.addMessageFeedback(messageId, {
    rating,
    helpful,
    comment: comment?.substring(0, 500), // Limit comment length
    timestamp: new Date(),
  });

  if (!feedbackAdded) {
    throw new AppError('Failed to add feedback to message', 500);
  }

  await session.save();

  // Simplified - no prompt performance tracking since AIPrompt model was removed
  // const message = session.messages.find((m) => m.messageId === messageId);
  // if (message?.metadata?.promptId && rating) {
  //   // Prompt performance tracking removed for optimization
  // }

  res.status(200).json({
    success: true,
    data: {
      message: 'Feedback recorded successfully',
      messageId,
      feedback: { rating, helpful, comment },
    },
  });
});

/**
 * Get user's AI session history
 * GET /api/ai/sessions
 */
const getSessionHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { limit = 10, offset = 0 } = req.query;

  console.log(`📚 Getting session history for user: ${userId}`);

  const query = { userId };
  // Personality filtering removed (personality system deprecated)

  const sessions = await AISession.find(query)
    .sort({ startTime: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .lean();

  const sessionSummaries = sessions.map((session) => ({
    sessionId: session.sessionId,
    personality: session.aiPersonality,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    messageCount: session.messages.length,
    status: session.status,
    topics: session.analytics?.topicsDiscussed || [],
    satisfaction: session.outcomes?.userSatisfaction,
    lastInteraction: session.lastInteraction,
  }));

  res.status(200).json({
    success: true,
    data: {
      sessions: sessionSummaries,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await AISession.countDocuments(query),
      },
    },
  });
});

/**
 * Get detailed session conversation
 * GET /api/ai/sessions/:sessionId
 */
const getSessionDetail = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  console.log(`🔍 Getting session detail: ${sessionId}`);

  const session = await AISession.findOne({
    sessionId,
    userId,
  }).lean();

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Filter messages for response (exclude system metadata)
  const messages = session.messages.map((msg) => ({
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
      session: {
        id: session.sessionId,
        personality: session.aiPersonality,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        context: session.context,
        analytics: session.analytics,
        outcomes: session.outcomes,
      },
      messages,
    },
  });
});

// Helper Functions

/**
 * Get or create AI session
 * @param {string} userId - User ID
 * @param {string|null} sessionId - Existing session ID
 * @param {string|null} personality - AI personality
 * @returns {Promise<Object>} AI Session
 */
async function getOrCreateSession(userId, sessionId) {
  const mongoose = require('mongoose');
  // Dev/local fallback: if userId is not a valid ObjectId (e.g., 'dev-user-id'),
  // substitute a constant dummy ObjectId so Mongoose queries don't throw.
  if (!mongoose.isValidObjectId(userId)) {
    userId = new mongoose.Types.ObjectId('000000000000000000000000');
  }
  if (sessionId) {
    // Try to find existing session
    const existingSession = await AISession.findOne({
      sessionId,
      userId,
      status: 'active',
    });

    if (existingSession) {
      // Update last interaction
      existingSession.lastInteraction = new Date();
      return existingSession;
    }
  }

  // Create new session (simplified - no personality system)
  const newSession = new AISession({
    sessionId: uuidv4(),
    userId,
    aiPersonality: 'ASSISTANT',
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
        lastAssessmentScore: null,
      },
      deviceType: 'unknown',
      platform: 'web',
      timezone: 'UTC',
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
      sessionQuality: 0,
    },
  });

  console.log(`🆕 Created new AI session: ${newSession.sessionId}`);
  return newSession;
}

/**
 * Detect urgency level from message
 * @param {string} message - User message
 * @returns {string} Urgency level
 */
function detectUrgency(message) {
  const urgentKeywords = [
    'urgent',
    'asap',
    'immediately',
    'emergency',
    'help now',
  ];
  const mediumKeywords = ['soon', 'quickly', 'fast', 'hurry'];

  const lowerMessage = message.toLowerCase();

  if (urgentKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return 'high';
  }

  if (mediumKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Extract topics from message
 * @param {string} message - User message
 * @returns {Array} Extracted topics
 */
function extractTopics(message) {
  // Simple topic extraction (can be enhanced with NLP)
  const topics = [];
  const lowerMessage = message.toLowerCase();

  const topicKeywords = {
    learning: ['learn', 'study', 'understand', 'knowledge'],
    assessment: ['test', 'quiz', 'exam', 'assessment', 'evaluate'],
    motivation: ['motivated', 'inspiration', 'encourage', 'goal'],
    progress: ['progress', 'advancement', 'achievement', 'completion'],
    difficulty: ['hard', 'difficult', 'challenging', 'struggle', 'confused'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
}

/**
 * Calculate response confidence
 * @param {Object} aiResponse - OpenAI response
 * @param {Object} userContext - User context
 * @returns {number} Confidence score (0-100)
 */
// Simplified - confidence calculation removed (now uses fixed value)

/**
 * Adjust temperature based on context
 * @param {Object} userContext - User context
 * @param {number} baseTemperature - Base temperature
 * @returns {number} Adjusted temperature
 */
// Removed - no longer needed without user context
// function adjustTemperatureForContext(userContext, baseTemperature = 0.7) {
//   return baseTemperature;
// }

/**
 * Get personality description
 * @param {string} personality - AI personality
 * @returns {string} Description
 */
// Removed - personality system deprecated
// function getPersonalityDescription(personality) {
//   return 'Standard AI assistant';
// }

/**
 * Analyze user message to determine intent (simplified)
 * @param {string} message - User message
 * @returns {string} Detected intent
 */
function analyzeMessageIntent(message) {
  const lowerMessage = message.toLowerCase();

  // Simplified intent patterns
  const patterns = {
    help: ['help', 'stuck', 'confused', 'explain'],
    assessment: ['test', 'quiz', 'assessment', 'evaluate'],
    progress: ['progress', 'how am i doing', 'status'],
    guidance: ['recommend', 'suggest', 'advice', 'how to'],
  };

  // Find best matching intent
  for (const [intent, keywords] of Object.entries(patterns)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return intent;
    }
  }

  return 'general';
}

/**
 * Get a simple prompt for AI interactions
 * @param {string} intent - User message intent (optional)
 * @param {Object} options - Additional options
 * @returns {Object} Simple prompt structure
 */
function getSimplePrompt(intent = 'general', options = {}) {
  const userMessage = options.userMessage || 'Hello, I need help.';
  
  return {
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses to user questions.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    config: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
    },
    metadata: {
      promptId: 'simple-assistant-prompt',
      promptName: 'Simple Assistant Prompt',
      contextType: intent,
      buildTimestamp: new Date(),
      mappedModel: 'gpt-4o',
    },
  };
}

module.exports = {
  handleChatMessage,
  getUserContext,
  switchPersonality,
  provideFeedback,
  getSessionHistory,
  getSessionDetail,
};
