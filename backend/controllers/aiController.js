// controllers/aiController.js
const AISession = require("../models/AISession");
const User = require("../models/User");
const { openAIService } = require("../services/openaiService");
const { contextService } = require("../services/contextService");
const { promptService } = require("../services/promptService");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const { v4: uuidv4 } = require("uuid");

/**
 * Handle AI chat messages - Main AI interaction endpoint
 * POST /api/ai/chat
 */
const handleChatMessage = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const {
    message,
    sessionId = null,
    personality = null,
    context: additionalContext = {},
  } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new AppError("Message is required and cannot be empty", 400);
  }

  const startTime = Date.now();
  console.log(`🤖 AI Chat Request - User: ${userId} | Session: ${sessionId}`);

  try {
    // 1. Get or create AI session
    const session = await getOrCreateSession(userId, sessionId, personality);

    // 2. Assemble user context
    const userContext = await contextService.assembleUserContext(userId, {
      sessionId: session.sessionId,
      deviceType: req.headers["x-device-type"] || "unknown",
      userAgent: req.headers["user-agent"],
      ...additionalContext,
    });

    // 3. Analyze user message intent
    const messageIntent = promptService.analyzeMessageIntent(message);

    // 4. Get current user personality preference
    const aiPersonality =
      personality || userContext.user.aiPersonality || "ARIA";

    // 5. Select and build optimal prompt
    const promptData = await promptService.selectOptimalPrompt(
      aiPersonality,
      messageIntent,
      userContext,
      { userMessage: message }
    );

    // 6. Add user message to session
    const userMessage = session.addMessage("user", message, {
      intent: messageIntent,
      urgency: detectUrgency(message),
      topics: extractTopics(message),
      timestamp: new Date(),
    });

    // 7. Optimize messages for token limits
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const optimizedHistory = openAIService.optimizeMessages([
      ...promptData.messages,
      ...conversationHistory.slice(-10), // Keep last 10 messages
    ]);

    // 8. Generate AI response
    const aiResponse = await openAIService.createChatCompletion(
      optimizedHistory,
      {
        ...promptData.config,
        userId: userId.toString(),
        temperature: adjustTemperatureForContext(
          userContext,
          promptData.config.temperature
        ),
      }
    );

    // 9. Validate response quality
    if (!openAIService.validateResponse(aiResponse)) {
      console.warn("⚠️ AI response quality validation failed");
      throw new AppError(
        "Generated response did not meet quality standards",
        500
      );
    }

    // 10. Add AI response to session
    const assistantMessage = session.addMessage(
      "assistant",
      aiResponse.content,
      {
        promptId: promptData.metadata.promptId,
        model: aiResponse.model,
        responseTime: Date.now() - startTime,
        tokenCount: aiResponse.usage?.total_tokens || 0,
        confidence: calculateConfidence(aiResponse, userContext),
        finishReason: aiResponse.finishReason,
      }
    );

    // 11. Update session context and analytics
    session.updateContext({
      lastActivity: new Date(),
      sessionDuration: Math.round(
        (Date.now() - session.startTime) / (1000 * 60)
      ),
      userState: userContext.insights?.userState || "stable",
    });

    // 12. Save session
    await session.save();

    // 13. Calculate cost
    const cost = openAIService.calculateCost(
      aiResponse.usage,
      aiResponse.model
    );

    // 14. Prepare response
    const responseTime = Date.now() - startTime;
    const response = {
      success: true,
      data: {
        message: {
          id: assistantMessage.messageId,
          content: aiResponse.content,
          role: "assistant",
          timestamp: assistantMessage.timestamp,
          metadata: {
            confidence: assistantMessage.metadata.confidence,
            responseTime,
            model: aiResponse.model,
            promptName: promptData.metadata.promptName,
            personality: aiPersonality,
            adaptationsApplied: promptData.metadata.adaptationsApplied,
          },
        },
        session: {
          id: session.sessionId,
          messageCount: session.messages.length,
          duration: session.duration,
        },
        context: {
          userState: userContext.insights?.userState,
          recommendedApproach: userContext.insights?.recommendedApproach,
          motivationLevel: userContext.insights?.motivationLevel,
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
      } tokens | $${cost.toFixed(4)}`
    );
    res.status(200).json(response);
  } catch (error) {
    console.error("❌ AI Chat Error:", error);

    // Try to save error to session if we have one
    if (sessionId) {
      try {
        const errorSession = await AISession.findOne({ sessionId });
        if (errorSession) {
          errorSession.addMessage(
            "system",
            `Error occurred: ${error.message}`,
            {
              error: {
                occurred: true,
                message: error.message,
                code: error.statusCode || 500,
                timestamp: new Date(),
              },
            }
          );
          await errorSession.save();
        }
      } catch (saveError) {
        console.error("Failed to save error to session:", saveError);
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

  const context = await contextService.assembleUserContext(userId);

  res.status(200).json({
    success: true,
    data: {
      context: {
        user: context.user,
        currentLearning: context.currentLearning,
        insights: context.insights,
        aiHistory: context.aiHistory,
        lastUpdated: context.metadata.contextGeneratedAt,
      },
    },
  });
});

/**
 * Switch AI personality for user
 * PUT /api/ai/personality
 */
const switchPersonality = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { personality } = req.body;

  if (!personality || !["ARIA", "SAGE", "COACH"].includes(personality)) {
    throw new AppError(
      "Invalid personality. Must be ARIA, SAGE, or COACH",
      400
    );
  }

  console.log(
    `🎭 Switching AI personality for user ${userId} to: ${personality}`
  );

  // Update user's AI personality preference
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.learningProfile.aiPersonality = personality;
  await user.save();

  // Clear prompt cache to ensure new personality takes effect
  promptService.clearCache();

  res.status(200).json({
    success: true,
    data: {
      personality,
      message: `AI personality switched to ${personality}`,
      description: getPersonalityDescription(personality),
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
    throw new AppError("Message ID is required", 400);
  }

  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  console.log(`👍 Receiving feedback for message: ${messageId}`);

  // Find the session containing this message
  const session = await AISession.findOne({
    userId,
    "messages.messageId": messageId,
  });

  if (!session) {
    throw new AppError("Message not found in user sessions", 404);
  }

  // Add feedback to the message
  const feedbackAdded = session.addMessageFeedback(messageId, {
    rating,
    helpful,
    comment: comment?.substring(0, 500), // Limit comment length
    timestamp: new Date(),
  });

  if (!feedbackAdded) {
    throw new AppError("Failed to add feedback to message", 500);
  }

  await session.save();

  // Update prompt performance if we have a prompt ID
  const message = session.messages.find((m) => m.messageId === messageId);
  if (message?.metadata?.promptId && rating) {
    try {
      const prompt = await require("../models/AIPrompt").findById(
        message.metadata.promptId
      );
      if (prompt) {
        await prompt.recordUsage(message.metadata.responseTime || 0, rating);
      }
    } catch (error) {
      console.error("Error updating prompt performance:", error);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      message: "Feedback recorded successfully",
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
  const { limit = 10, offset = 0, personality = null } = req.query;

  console.log(`📚 Getting session history for user: ${userId}`);

  const query = { userId };
  if (personality) query.aiPersonality = personality;

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
    throw new AppError("Session not found", 404);
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
async function getOrCreateSession(userId, sessionId, personality) {
  if (sessionId) {
    // Try to find existing session
    const existingSession = await AISession.findOne({
      sessionId,
      userId,
      status: "active",
    });

    if (existingSession) {
      // Update last interaction
      existingSession.lastInteraction = new Date();
      return existingSession;
    }
  }

  // Create new session
  const user = await User.findById(userId);
  const aiPersonality =
    personality || user?.learningProfile?.aiPersonality || "ARIA";

  const newSession = new AISession({
    sessionId: uuidv4(),
    userId,
    aiPersonality,
    startTime: new Date(),
    status: "active",
    configuration: {
      modelType: "openai-gpt4",
      maxMessages: 100,
      sessionTimeout: 30,
      adaptiveMode: true,
      contextAware: true,
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
    "urgent",
    "asap",
    "immediately",
    "emergency",
    "help now",
  ];
  const mediumKeywords = ["soon", "quickly", "fast", "hurry"];

  const lowerMessage = message.toLowerCase();

  if (urgentKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "high";
  }

  if (mediumKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "medium";
  }

  return "low";
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
    learning: ["learn", "study", "understand", "knowledge"],
    assessment: ["test", "quiz", "exam", "assessment", "evaluate"],
    motivation: ["motivated", "inspiration", "encourage", "goal"],
    progress: ["progress", "advancement", "achievement", "completion"],
    difficulty: ["hard", "difficult", "challenging", "struggle", "confused"],
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
function calculateConfidence(aiResponse, userContext) {
  let confidence = 75; // Base confidence

  // Higher confidence for successful completion
  if (aiResponse.finishReason === "stop") {
    confidence += 10;
  }

  // Adjust based on context quality
  if (userContext.currentLearning?.hasActiveSession) {
    confidence += 10; // More context available
  }

  // Adjust based on response length (too short or too long might be less confident)
  const responseLength = aiResponse.content?.length || 0;
  if (responseLength > 50 && responseLength < 2000) {
    confidence += 5;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Adjust temperature based on context
 * @param {Object} userContext - User context
 * @param {number} baseTemperature - Base temperature
 * @returns {number} Adjusted temperature
 */
function adjustTemperatureForContext(userContext, baseTemperature = 0.7) {
  const userState = userContext.insights?.userState;

  // Lower temperature for struggling users (more focused responses)
  if (userState === "struggling") {
    return Math.max(0.3, baseTemperature - 0.2);
  }

  // Higher temperature for highly engaged users (more creative responses)
  if (userState === "highly_engaged") {
    return Math.min(1.0, baseTemperature + 0.1);
  }

  return baseTemperature;
}

/**
 * Get personality description
 * @param {string} personality - AI personality
 * @returns {string} Description
 */
function getPersonalityDescription(personality) {
  const descriptions = {
    ARIA: "Encouraging and supportive assistant focused on positive reinforcement and gentle guidance",
    SAGE: "Professional and analytical assistant providing objective insights and detailed analysis",
    COACH:
      "Motivational and energetic assistant focused on goal achievement and performance improvement",
  };

  return descriptions[personality] || descriptions["ARIA"];
}

module.exports = {
  handleChatMessage,
  getUserContext,
  switchPersonality,
  provideFeedback,
  getSessionHistory,
  getSessionDetail,
};
