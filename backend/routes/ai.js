// routes/ai.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Import middleware
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

// Import controllers
const {
  handleChatMessage,
  getUserContext,
  switchPersonality,
  provideFeedback,
  getSessionHistory,
  getSessionDetail,
} = require("../controllers/aiController");

// Validation schemas
const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(4000).trim().messages({
    "string.empty": "Message cannot be empty",
    "string.min": "Message must be at least 1 character",
    "string.max": "Message cannot exceed 4000 characters",
    "any.required": "Message is required",
  }),

  sessionId: Joi.string().uuid().optional().messages({
    "string.uuid": "Session ID must be a valid UUID",
  }),

  personality: Joi.string().valid("ARIA", "SAGE", "COACH").optional().messages({
    "any.only": "Personality must be one of: ARIA, SAGE, COACH",
  }),

  context: Joi.object({
    deviceType: Joi.string()
      .valid("desktop", "tablet", "mobile", "unknown")
      .optional(),

    currentModule: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    currentPath: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    userMood: Joi.string()
      .valid(
        "motivated",
        "neutral",
        "tired",
        "stressed",
        "excited",
        "frustrated"
      )
      .optional(),

    sessionType: Joi.string()
      .valid("learning", "assessment", "review", "casual")
      .optional(),
  }).optional(),
});

const personalitySwitchSchema = Joi.object({
  personality: Joi.string().valid("ARIA", "SAGE", "COACH").required().messages({
    "any.only": "Personality must be one of: ARIA, SAGE, COACH",
    "any.required": "Personality is required",
  }),
});

const feedbackSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "any.required": "Message ID is required",
  }),

  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
    "number.integer": "Rating must be a whole number",
  }),

  helpful: Joi.boolean().optional(),

  comment: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Comment cannot exceed 500 characters",
  }),
});

const sessionHistorySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),

  offset: Joi.number().integer().min(0).default(0).messages({
    "number.min": "Offset cannot be negative",
  }),

  personality: Joi.string().valid("ARIA", "SAGE", "COACH").optional().messages({
    "any.only": "Personality must be one of: ARIA, SAGE, COACH",
  }),
});

// All AI routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/chat
 * @desc    Send message to AI assistant with full context
 * @access  Private
 * @body    { message, sessionId?, personality?, context? }
 */
router.post("/chat", validate(chatMessageSchema), handleChatMessage);

/**
 * @route   GET /api/ai/context
 * @desc    Get current user context for AI interactions
 * @access  Private
 * @returns User context including learning progress, preferences, and insights
 */
router.get("/context", getUserContext);

/**
 * @route   PUT /api/ai/personality
 * @desc    Switch AI personality (ARIA/SAGE/COACH)
 * @access  Private
 * @body    { personality }
 */
router.put(
  "/personality",
  validate(personalitySwitchSchema),
  switchPersonality
);

/**
 * @route   POST /api/ai/feedback
 * @desc    Provide feedback on AI response quality
 * @access  Private
 * @body    { messageId, rating?, helpful?, comment? }
 */
router.post("/feedback", validate(feedbackSchema), provideFeedback);

/**
 * @route   GET /api/ai/sessions
 * @desc    Get user's AI session history
 * @access  Private
 * @query   limit, offset, personality
 */
router.get(
  "/sessions",
  validate(sessionHistorySchema, "query"),
  getSessionHistory
);

/**
 * @route   GET /api/ai/sessions/:sessionId
 * @desc    Get detailed conversation for a specific session
 * @access  Private
 * @param   sessionId - UUID of the session
 */
router.get(
  "/sessions/:sessionId",
  (req, res, next) => {
    const schema = Joi.object({
      sessionId: Joi.string().uuid().required().messages({
        "string.uuid": "Session ID must be a valid UUID",
        "any.required": "Session ID is required",
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
  getSessionDetail
);

/**
 * @route   GET /api/ai/health
 * @desc    Health check for AI service
 * @access  Private
 */
router.get("/health", async (req, res) => {
  try {
    const { openAIService } = require("../services/openaiService");
    const isHealthy = await openAIService.healthCheck();

    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? "healthy" : "degraded",
        openai: isHealthy,
        database: true, // We got this far, DB is working
        timestamp: new Date().toISOString(),
        services: {
          openaiService: isHealthy ? "operational" : "down",
          contextService: "operational",
          promptService: "operational",
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route   GET /api/ai/analytics
 * @desc    Get AI usage analytics for the user
 * @access  Private
 */
router.get("/analytics", async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's AI session analytics
    const analytics =
      await require("../models/AISession").getUserSessionAnalytics(
        userId,
        "30d"
      );

    res.status(200).json({
      success: true,
      data: {
        analytics: analytics[0] || {
          totalSessions: 0,
          totalMessages: 0,
          avgSessionDuration: 0,
          avgEngagement: 0,
          avgHelpfulness: 0,
          avgRating: 0,
          totalTopics: [],
        },
        period: "30 days",
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve analytics data",
    });
  }
});

/**
 * @route   POST /api/ai/sessions/:sessionId/end
 * @desc    Manually end an AI session
 * @access  Private
 */
router.post("/sessions/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await require("../models/AISession").findOne({
      sessionId,
      userId,
      status: "active",
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Active session not found",
      });
    }

    session.endSession("completed");
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        message: "Session ended successfully",
        sessionId,
        duration: session.duration,
        messageCount: session.messages.length,
      },
    });
  } catch (error) {
    console.error("Session end error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end session",
    });
  }
});

/**
 * @route   GET /api/ai/personalities
 * @desc    Get available AI personalities with descriptions
 * @access  Private
 */
router.get("/personalities", (req, res) => {
  const personalities = [
    {
      id: "ARIA",
      name: "ARIA",
      title: "Supportive Learning Companion",
      description:
        "Encouraging and empathetic assistant that provides gentle guidance and positive reinforcement",
      style: "supportive",
      bestFor: [
        "beginners",
        "confidence building",
        "emotional support",
        "motivation",
      ],
      traits: ["encouraging", "patient", "understanding", "optimistic"],
      responseStyle: "warm and supportive",
      icon: "🌟",
    },
    {
      id: "SAGE",
      name: "SAGE",
      title: "Professional Learning Analyst",
      description:
        "Objective and analytical assistant that provides detailed insights and professional guidance",
      style: "analytical",
      bestFor: [
        "advanced learners",
        "detailed analysis",
        "objective feedback",
        "skill assessment",
      ],
      traits: ["analytical", "objective", "detailed", "professional"],
      responseStyle: "informative and structured",
      icon: "🎓",
    },
    {
      id: "COACH",
      name: "COACH",
      title: "Motivational Performance Coach",
      description:
        "Energetic and goal-focused assistant that pushes you to achieve peak performance",
      style: "motivational",
      bestFor: [
        "goal achievement",
        "performance improvement",
        "challenges",
        "accountability",
      ],
      traits: ["energetic", "challenging", "results-focused", "direct"],
      responseStyle: "motivating and action-oriented",
      icon: "💪",
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      personalities,
      currentPersonality: req.user?.learningProfile?.aiPersonality || "ARIA",
    },
  });
});

/**
 * @route   DELETE /api/ai/sessions/:sessionId
 * @desc    Delete a specific AI session
 * @access  Private
 */
router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const result = await require("../models/AISession").deleteOne({
      sessionId,
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Session deleted successfully",
        sessionId,
      },
    });
  } catch (error) {
    console.error("Session deletion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session",
    });
  }
});

/**
 * @route   POST /api/ai/sessions/:sessionId/pause
 * @desc    Pause an active AI session
 * @access  Private
 */
router.post("/sessions/:sessionId/pause", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await require("../models/AISession").findOne({
      sessionId,
      userId,
      status: "active",
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Active session not found",
      });
    }

    session.status = "paused";
    session.lastInteraction = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        message: "Session paused successfully",
        sessionId,
        status: "paused",
      },
    });
  } catch (error) {
    console.error("Session pause error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to pause session",
    });
  }
});

/**
 * @route   POST /api/ai/sessions/:sessionId/resume
 * @desc    Resume a paused AI session
 * @access  Private
 */
router.post("/sessions/:sessionId/resume", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await require("../models/AISession").findOne({
      sessionId,
      userId,
      status: "paused",
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Paused session not found",
      });
    }

    session.status = "active";
    session.lastInteraction = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        message: "Session resumed successfully",
        sessionId,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Session resume error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resume session",
    });
  }
});

module.exports = router;
