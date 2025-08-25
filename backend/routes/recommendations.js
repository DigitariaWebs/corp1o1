// routes/recommendations.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Import middleware
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

// Import controllers
const {
  getRecommendations,
  getRecommendationById,
  respondToRecommendation,
  getRecommendationsByType,
  generatePersonalizedRecommendations,
  getNextSteps,
  getContentRecommendations,
  getTimingRecommendations,
  getSkillRecommendations,
  markAsViewed,
  provideFeedback,
  getRecommendationHistory,
  getRecommendationStats,
  dismissRecommendation,
  requestSpecificRecommendation,
  getOptimalLearningPath,
  getBatchRecommendations,
} = require("../controllers/recommendationController");

// Validation schemas
const recommendationQuerySchema = Joi.object({
  type: Joi.string()
    .valid(
      "next_module",
      "learning_path",
      "review_content",
      "skill_development",
      "schedule_optimization",
      "difficulty_adjustment",
      "ai_personality",
      "study_break",
      "peer_collaboration",
      "assessment_timing",
      "all"
    )
    .default("all"),

  category: Joi.string()
    .valid(
      "Communication & Leadership",
      "Innovation & Creativity",
      "Technical Skills",
      "Business Strategy",
      "Personal Development",
      "Data & Analytics",
      "General",
      "all"
    )
    .default("all"),

  status: Joi.string()
    .valid("pending", "viewed", "accepted", "declined", "dismissed", "all")
    .default("pending"),

  priority: Joi.string().valid("high", "medium", "low", "all").default("all"),

  limit: Joi.number().integer().min(1).max(50).default(10),

  offset: Joi.number().integer().min(0).default(0),

  sortBy: Joi.string()
    .valid("relevance", "date", "priority", "confidence")
    .default("relevance"),

  includeExpired: Joi.boolean().default(false),
});

const responseSchema = Joi.object({
  response: Joi.string()
    .valid("accepted", "declined", "maybe_later", "not_interested")
    .required(),

  feedback: Joi.object({
    helpfulness: Joi.number().integer().min(1).max(5).optional(),

    relevance: Joi.number().integer().min(1).max(5).optional(),

    timing: Joi.number().integer().min(1).max(5).optional(),

    comment: Joi.string().max(500).optional(),
  }).optional(),

  reason: Joi.string().max(200).optional(),
});

const feedbackSchema = Joi.object({
  helpfulness: Joi.number().integer().min(1).max(5).required(),

  relevance: Joi.number().integer().min(1).max(5).required(),

  timing: Joi.number().integer().min(1).max(5).required(),

  comment: Joi.string().max(500).optional(),

  wouldRecommendToOthers: Joi.boolean().optional(),

  improvementSuggestions: Joi.string().max(300).optional(),
});

const generateRecommendationsSchema = Joi.object({
  context: Joi.object({
    currentModule: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    currentPath: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    category: Joi.string()
      .valid(
        "Communication & Leadership",
        "Innovation & Creativity",
        "Technical Skills",
        "Business Strategy",
        "Personal Development",
        "Data & Analytics"
      )
      .optional(),

    strugglingAreas: Joi.array().items(Joi.string()).optional(),

    interests: Joi.array().items(Joi.string()).optional(),

    timeAvailable: Joi.number()
      .min(5)
      .max(480) // 8 hours max
      .optional(),

    preferredDifficulty: Joi.string()
      .valid("beginner", "intermediate", "advanced", "expert")
      .optional(),
  }).required(),

  maxRecommendations: Joi.number().integer().min(1).max(20).default(5),

  includeScheduling: Joi.boolean().default(true),

  prioritizeWeakAreas: Joi.boolean().default(true),
});

const specificRequestSchema = Joi.object({
  requestType: Joi.string()
    .valid(
      "content_for_skill",
      "learning_path_for_goal",
      "schedule_optimization",
      "difficulty_adjustment",
      "ai_personality_match",
      "peer_study_group"
    )
    .required(),

  details: Joi.object({
    skill: Joi.string().when("..requestType", {
      is: "content_for_skill",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

    goal: Joi.string().when("..requestType", {
      is: "learning_path_for_goal",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

    currentSchedule: Joi.array()
      .items(
        Joi.object({
          day: Joi.string().valid(
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          ),
          timeSlots: Joi.array().items(
            Joi.object({
              start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
              end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
            })
          ),
        })
      )
      .when("..requestType", {
        is: "schedule_optimization",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),

    currentDifficulty: Joi.string()
      .valid("too_easy", "appropriate", "too_hard")
      .when("..requestType", {
        is: "difficulty_adjustment",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),

    personalityPreferences: Joi.object({
      communicationStyle: Joi.string().valid(
        "direct",
        "encouraging",
        "detailed"
      ),
      supportLevel: Joi.string().valid("minimal", "moderate", "high"),
      explanationDepth: Joi.string().valid(
        "brief",
        "moderate",
        "comprehensive"
      ),
    }).when("..requestType", {
      is: "ai_personality_match",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).required(),

  urgency: Joi.string().valid("low", "medium", "high").default("medium"),
});

const statsQuerySchema = Joi.object({
  timeRange: Joi.string().valid("7d", "30d", "90d", "1y", "all").default("30d"),

  includeComparison: Joi.boolean().default(false),

  groupBy: Joi.string()
    .valid("type", "category", "week", "month")
    .default("type"),
});

const batchRequestSchema = Joi.object({
  recommendationIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(20)
    .required(),

  action: Joi.string()
    .valid("mark_viewed", "dismiss", "accept_batch", "decline_batch")
    .required(),

  feedback: Joi.object({
    comment: Joi.string().max(500).optional(),
    reason: Joi.string().max(200).optional(),
  }).optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/recommendations
 * @desc    Get user's recommendations with filtering
 * @access  Private
 * @query   type, category, status, priority, limit, offset, sortBy
 */
router.get(
  "/",
  validate(recommendationQuerySchema, "query"),
  getRecommendations
);

/**
 * @route   GET /api/recommendations/next-steps
 * @desc    Get personalized next learning steps
 * @access  Private
 * @query   limit, category
 */
router.get(
  "/next-steps",
  validate(
    Joi.object({
      limit: Joi.number().integer().min(1).max(10).default(3),
      category: Joi.string().optional(),
    }),
    "query"
  ),
  getNextSteps
);

/**
 * @route   GET /api/recommendations/content/:moduleId
 * @desc    Get content recommendations for specific module
 * @access  Private
 * @param   moduleId
 */
router.get(
  "/content/:moduleId",
  validate(
    Joi.object({
      moduleId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  getContentRecommendations
);

/**
 * @route   GET /api/recommendations/timing
 * @desc    Get optimal learning timing recommendations
 * @access  Private
 */
router.get("/timing", getTimingRecommendations);

/**
 * @route   GET /api/recommendations/skills
 * @desc    Get skill development recommendations
 * @access  Private
 * @query   targetSkill, currentLevel
 */
router.get(
  "/skills",
  validate(
    Joi.object({
      targetSkill: Joi.string().optional(),
      currentLevel: Joi.string()
        .valid("beginner", "intermediate", "advanced", "expert")
        .optional(),
    }),
    "query"
  ),
  getSkillRecommendations
);

/**
 * @route   GET /api/recommendations/learning-path
 * @desc    Get optimal learning path recommendations
 * @access  Private
 * @query   goal, timeframe, intensity
 */
router.get(
  "/learning-path",
  validate(
    Joi.object({
      goal: Joi.string().optional(),
      timeframe: Joi.string()
        .valid("1month", "3months", "6months", "1year")
        .optional(),
      intensity: Joi.string()
        .valid("light", "moderate", "intensive")
        .optional(),
    }),
    "query"
  ),
  getOptimalLearningPath
);

/**
 * @route   GET /api/recommendations/type/:type
 * @desc    Get recommendations by specific type
 * @access  Private
 * @param   type
 * @query   limit
 */
router.get(
  "/type/:type",
  validate(
    Joi.object({
      type: Joi.string()
        .valid(
          "next_module",
          "learning_path",
          "review_content",
          "skill_development",
          "schedule_optimization",
          "difficulty_adjustment",
          "ai_personality",
          "study_break",
          "peer_collaboration",
          "assessment_timing"
        )
        .required(),
    }),
    "params"
  ),
  validate(
    Joi.object({
      limit: Joi.number().integer().min(1).max(20).default(5),
    }),
    "query"
  ),
  getRecommendationsByType
);

/**
 * @route   GET /api/recommendations/:id
 * @desc    Get specific recommendation details
 * @access  Private
 * @param   id
 */
router.get(
  "/:id",
  validate(
    Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  getRecommendationById
);

/**
 * @route   GET /api/recommendations/history/user
 * @desc    Get user's recommendation history
 * @access  Private
 * @query   timeRange, status, limit
 */
router.get(
  "/history/user",
  validate(
    Joi.object({
      timeRange: Joi.string()
        .valid("7d", "30d", "90d", "1y", "all")
        .default("30d"),
      status: Joi.string()
        .valid("accepted", "declined", "dismissed", "all")
        .default("all"),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
    "query"
  ),
  getRecommendationHistory
);

/**
 * @route   GET /api/recommendations/stats/user
 * @desc    Get user's recommendation statistics
 * @access  Private
 * @query   timeRange, includeComparison, groupBy
 */
router.get(
  "/stats/user",
  validate(statsQuerySchema, "query"),
  getRecommendationStats
);

/**
 * @route   POST /api/recommendations/generate
 * @desc    Generate personalized recommendations
 * @access  Private
 * @body    context, maxRecommendations, includeScheduling
 */
router.post(
  "/generate",
  validate(generateRecommendationsSchema),
  generatePersonalizedRecommendations
);

/**
 * @route   POST /api/recommendations/request
 * @desc    Request specific type of recommendation
 * @access  Private
 * @body    requestType, details, urgency
 */
router.post(
  "/request",
  validate(specificRequestSchema),
  requestSpecificRecommendation
);

/**
 * @route   POST /api/recommendations/batch-action
 * @desc    Perform batch actions on multiple recommendations
 * @access  Private
 * @body    recommendationIds, action, feedback
 */
router.post(
  "/batch-action",
  validate(batchRequestSchema),
  getBatchRecommendations
);

/**
 * @route   PUT /api/recommendations/:id/respond
 * @desc    Respond to a recommendation
 * @access  Private
 * @param   id
 * @body    response, feedback, reason
 */
router.put(
  "/:id/respond",
  validate(
    Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  validate(responseSchema),
  respondToRecommendation
);

/**
 * @route   PUT /api/recommendations/:id/viewed
 * @desc    Mark recommendation as viewed
 * @access  Private
 * @param   id
 */
router.put(
  "/:id/viewed",
  validate(
    Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  markAsViewed
);

/**
 * @route   PUT /api/recommendations/:id/feedback
 * @desc    Provide detailed feedback on recommendation
 * @access  Private
 * @param   id
 * @body    helpfulness, relevance, timing, comment
 */
router.put(
  "/:id/feedback",
  validate(
    Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  validate(feedbackSchema),
  provideFeedback
);

/**
 * @route   DELETE /api/recommendations/:id
 * @desc    Dismiss/delete a recommendation
 * @access  Private
 * @param   id
 */
router.delete(
  "/:id",
  validate(
    Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    }),
    "params"
  ),
  dismissRecommendation
);

/**
 * @route   GET /api/recommendations/health/check
 * @desc    Health check for recommendation service
 * @access  Private
 */
router.get("/health/check", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "recommendations",
      status: "operational",
      timestamp: new Date().toISOString(),
      features: {
        personalization: "active",
        aiGeneration: "active",
        realTimeAdaptation: "active",
        feedbackLearning: "active",
        batchProcessing: "active",
      },
      endpoints: {
        core: [
          "GET /api/recommendations",
          "GET /api/recommendations/:id",
          "POST /api/recommendations/generate",
          "PUT /api/recommendations/:id/respond",
        ],
        specialized: [
          "GET /api/recommendations/next-steps",
          "GET /api/recommendations/content/:moduleId",
          "GET /api/recommendations/timing",
          "GET /api/recommendations/skills",
        ],
        management: [
          "GET /api/recommendations/history/user",
          "GET /api/recommendations/stats/user",
          "POST /api/recommendations/batch-action",
          "DELETE /api/recommendations/:id",
        ],
      },
      algorithms: {
        collaborative_filtering: "active",
        content_based: "active",
        hybrid: "active",
        ai_driven: "active",
        rule_based: "active",
      },
    },
  });
});

/**
 * Error handling middleware for recommendation routes
 */
router.use((error, req, res, next) => {
  console.error("Recommendation route error:", error);

  // Handle specific recommendation-related errors
  if (error.message.includes("insufficient user data")) {
    return res.status(400).json({
      success: false,
      error: "Insufficient user data",
      message:
        "Not enough learning data to generate personalized recommendations",
      suggestion:
        "Complete more learning activities to unlock personalized recommendations",
    });
  }

  if (error.message.includes("recommendation not found")) {
    return res.status(404).json({
      success: false,
      error: "Recommendation not found",
      message: "The requested recommendation does not exist or has expired",
    });
  }

  if (error.message.includes("generation failed")) {
    return res.status(500).json({
      success: false,
      error: "Recommendation generation failed",
      message: "Unable to generate recommendations at this time",
      suggestion:
        "Please try again later or use manual learning path selection",
    });
  }

  if (error.message.includes("already responded")) {
    return res.status(409).json({
      success: false,
      error: "Already responded",
      message: "You have already responded to this recommendation",
    });
  }

  if (error.message.includes("expired")) {
    return res.status(410).json({
      success: false,
      error: "Recommendation expired",
      message: "This recommendation has expired and is no longer valid",
    });
  }

  // Pass to global error handler
  next(error);
});

module.exports = router;
