const express = require("express");
const router = express.Router();

// Import middleware
const { authenticate } = require("../middleware/auth");
const {
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");

// Import controllers
const {
  getProgressOverview,
  getPathProgress,
  getSessionsHistory,
  recordSessionData,
  getLearningAnalytics,
  getMilestones,
} = require("../controllers/progressController");

// Import validation schemas
const Joi = require("joi");
const { validate } = require("../middleware/validation");

// Custom validation schemas
const sessionDataSchema = Joi.object({
  sessionId: Joi.string().required(),
  activityType: Joi.string()
    .valid(
      "session_start",
      "session_pause",
      "session_resume",
      "session_end",
      "content_view",
      "content_skip",
      "content_replay",
      "content_bookmark",
      "assessment_start",
      "assessment_submit",
      "assessment_review",
      "note_create",
      "note_update",
      "help_request",
      "feedback_submit"
    )
    .required(),
  data: Joi.object().optional(),
  timestamp: Joi.date().optional(),
});

const analyticsQuerySchema = Joi.object({
  timeRange: Joi.string().valid("7d", "30d", "90d").optional(),
});

const sessionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  pathId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  moduleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string()
    .valid("active", "paused", "completed", "abandoned", "interrupted")
    .optional(),
});

// All progress routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/progress/overview
 * @desc    Get user's overall learning progress overview
 * @access  Private
 */
router.get("/overview", getProgressOverview);

/**
 * @route   GET /api/progress/path/:pathId
 * @desc    Get detailed progress for specific learning path
 * @access  Private
 */
router.get("/path/:pathId", validateMongoId, getPathProgress);

/**
 * @route   GET /api/progress/sessions
 * @desc    Get user's learning sessions history
 * @access  Private
 * @query   page, limit, pathId, moduleId, startDate, endDate, status
 */
router.get(
  "/sessions",
  validate(sessionsQuerySchema, "query"),
  getSessionsHistory
);

/**
 * @route   POST /api/progress/session-data
 * @desc    Record real-time session activity data
 * @access  Private
 */
router.post("/session-data", validate(sessionDataSchema), recordSessionData);

/**
 * @route   GET /api/progress/analytics
 * @desc    Get comprehensive learning analytics
 * @access  Private
 * @query   timeRange (7d, 30d, 90d)
 */
router.get(
  "/analytics",
  validate(analyticsQuerySchema, "query"),
  getLearningAnalytics
);

/**
 * @route   GET /api/progress/milestones
 * @desc    Get user achievements and milestones
 * @access  Private
 */
router.get("/milestones", getMilestones);

// Additional analytics endpoints

/**
 * @route   GET /api/progress/dashboard
 * @desc    Get dashboard-specific progress data (alias for overview)
 * @access  Private
 */
router.get("/dashboard", getProgressOverview);

/**
 * @route   GET /api/progress/summary
 * @desc    Get condensed progress summary (alias for overview)
 * @access  Private
 */
router.get("/summary", getProgressOverview);

/**
 * @route   GET /api/progress/stats
 * @desc    Get user learning statistics (alias for analytics)
 * @access  Private
 */
router.get(
  "/stats",
  validate(analyticsQuerySchema, "query"),
  getLearningAnalytics
);

// Health check for progress routes
router.get("/health/check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Progress service is healthy",
    timestamp: new Date().toISOString(),
    user: {
      id: req.userId,
      authenticated: !!req.user,
    },
    endpoints: {
      overview: [
        "GET /api/progress/overview",
        "GET /api/progress/dashboard",
        "GET /api/progress/summary",
      ],
      detailed: [
        "GET /api/progress/path/:pathId",
        "GET /api/progress/sessions",
      ],
      analytics: ["GET /api/progress/analytics", "GET /api/progress/stats"],
      achievements: ["GET /api/progress/milestones"],
      tracking: ["POST /api/progress/session-data"],
    },
    features: [
      "Real-time progress tracking",
      "Comprehensive learning analytics",
      "Session history and insights",
      "Achievement and milestone tracking",
      "Performance metrics",
      "Learning pattern analysis",
    ],
  });
});

module.exports = router;
