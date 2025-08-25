// routes/analytics.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Import middleware
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

// Import controllers
const {
  getDashboard,
  getPerformanceAnalytics,
  getLearningPatterns,
  getPredictions,
  getInsights,
  getEngagementMetrics,
  getProgressTrends,
  getComparisonAnalytics,
  getTimeAnalytics,
  getSkillAnalytics,
  getAIEffectivenessAnalytics,
  generateReport,
  getAnalyticsHistory,
  exportAnalyticsData,
  getPersonalizedInsights,
  getGoalProgress,
  getLearningPath,
} = require("../controllers/analyticsController");

// Base time range fields for reuse
const baseTimeRangeFields = {
  timeRange: Joi.string()
    .valid("1d", "7d", "30d", "90d", "1y", "all")
    .default("30d"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref("startDate")).required(),
    otherwise: Joi.optional(),
  }),
  granularity: Joi.string()
    .valid("hour", "day", "week", "month")
    .default("day"),
};

// Validation schemas
const timeRangeSchema = Joi.object(baseTimeRangeFields);

const analyticsQuerySchema = Joi.object({
  ...baseTimeRangeFields,
  category: Joi.string()
    .valid(
      "Communication & Leadership",
      "Innovation & Creativity",
      "Technical Skills",
      "Business Strategy",
      "Personal Development",
      "Data & Analytics",
      "all"
    )
    .default("all"),
  difficulty: Joi.string()
    .valid("beginner", "intermediate", "advanced", "expert", "all")
    .default("all"),
  includeComparison: Joi.boolean().default(false),
  format: Joi.string().valid("summary", "detailed", "raw").default("summary"),
});

const dashboardQuerySchema = Joi.object({
  timeRange: Joi.string()
    .valid("today", "week", "month", "quarter", "year")
    .default("month"),
  widgets: Joi.array()
    .items(
      Joi.string().valid(
        "progress_overview",
        "engagement_metrics",
        "recent_achievements",
        "learning_streak",
        "ai_interactions",
        "performance_trends",
        "upcoming_goals",
        "recommendations"
      )
    )
    .default([
      "progress_overview",
      "engagement_metrics",
      "recent_achievements",
      "performance_trends",
    ]),
});

const performanceQuerySchema = Joi.object({
  timeRange: Joi.string()
    .valid("1d", "7d", "30d", "90d", "1y", "all")
    .default("30d"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref("startDate")).required(),
    otherwise: Joi.optional(),
  }),
  pathId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  moduleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  includeAIAnalysis: Joi.boolean().default(true),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        "completion_rate",
        "average_score",
        "time_spent",
        "engagement_level",
        "struggle_areas",
        "improvement_rate"
      )
    )
    .default(["completion_rate", "average_score", "engagement_level"]),
});

const patternsQuerySchema = Joi.object({
  timeRange: Joi.string()
    .valid("1d", "7d", "30d", "90d", "1y", "all")
    .default("30d"),
  patternTypes: Joi.array()
    .items(
      Joi.string().valid(
        "optimal_timing",
        "engagement_patterns",
        "learning_velocity",
        "struggle_patterns",
        "strength_areas",
        "ai_preference"
      )
    )
    .default(["optimal_timing", "engagement_patterns", "learning_velocity"]),
  minConfidence: Joi.number().min(0).max(100).default(60),
});

const predictionsQuerySchema = Joi.object({
  predictionTypes: Joi.array()
    .items(
      Joi.string().valid(
        "completion_likelihood",
        "time_to_completion",
        "performance_forecast",
        "engagement_forecast",
        "risk_assessment",
        "optimal_next_steps"
      )
    )
    .default([
      "completion_likelihood",
      "time_to_completion",
      "risk_assessment",
    ]),
  horizon: Joi.string()
    .valid("1week", "1month", "3months", "6months")
    .default("1month"),
  includeRecommendations: Joi.boolean().default(true),
});

const reportSchema = Joi.object({
  reportType: Joi.string()
    .valid("comprehensive", "performance", "engagement", "progress", "custom")
    .required(),
  timeRange: Joi.string()
    .valid("1d", "7d", "30d", "90d", "1y", "all")
    .default("30d"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref("startDate")).required(),
    otherwise: Joi.optional(),
  }),
  includeCharts: Joi.boolean().default(true),
  includeTables: Joi.boolean().default(true),
  includeInsights: Joi.boolean().default(true),
  format: Joi.string().valid("pdf", "html", "json", "csv").default("pdf"),
  customSections: Joi.array().items(Joi.string()).when("reportType", {
    is: "custom",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

const exportSchema = Joi.object({
  timeRange: Joi.string()
    .valid("1d", "7d", "30d", "90d", "1y", "all")
    .default("30d"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().when("startDate", {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref("startDate")).required(),
    otherwise: Joi.optional(),
  }),
  dataTypes: Joi.array()
    .items(
      Joi.string().valid(
        "learning_sessions",
        "module_completions",
        "assessment_scores",
        "ai_interactions",
        "engagement_metrics",
        "progress_data"
      )
    )
    .default(["learning_sessions", "progress_data"]),
  format: Joi.string().valid("json", "csv", "xlsx").default("json"),
  includePersonalData: Joi.boolean().default(false),
});

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get personalized analytics dashboard
 * @access  Private
 * @query   timeRange, widgets
 */
router.get("/dashboard", validate(dashboardQuerySchema, "query"), getDashboard);

/**
 * @route   GET /api/analytics/performance
 * @desc    Get detailed performance analytics
 * @access  Private
 * @query   timeRange, pathId, moduleId, includeAIAnalysis, metrics
 */
router.get(
  "/performance",
  validate(performanceQuerySchema, "query"),
  getPerformanceAnalytics
);

/**
 * @route   GET /api/analytics/patterns
 * @desc    Get learning pattern analysis
 * @access  Private
 * @query   timeRange, patternTypes, minConfidence
 */
router.get(
  "/patterns",
  validate(patternsQuerySchema, "query"),
  getLearningPatterns
);

/**
 * @route   GET /api/analytics/predictions
 * @desc    Get AI-powered learning predictions
 * @access  Private
 * @query   predictionTypes, horizon, includeRecommendations
 */
router.get(
  "/predictions",
  validate(predictionsQuerySchema, "query"),
  getPredictions
);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get personalized learning insights
 * @access  Private
 */
router.get("/insights", getInsights);

/**
 * @route   GET /api/analytics/engagement
 * @desc    Get engagement metrics and trends
 * @access  Private
 * @query   timeRange, granularity
 */
router.get(
  "/engagement",
  validate(timeRangeSchema, "query"),
  getEngagementMetrics
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get progress trends over time
 * @access  Private
 * @query   timeRange, granularity
 */
router.get("/trends", validate(timeRangeSchema, "query"), getProgressTrends);

/**
 * @route   GET /api/analytics/comparison
 * @desc    Get comparative analytics
 * @access  Private
 * @query   timeRange, comparisonType
 */
router.get(
  "/comparison",
  validate(analyticsQuerySchema, "query"),
  getComparisonAnalytics
);

/**
 * @route   GET /api/analytics/time
 * @desc    Get time-based analytics
 * @access  Private
 * @query   timeRange, granularity
 */
router.get("/time", validate(timeRangeSchema, "query"), getTimeAnalytics);

/**
 * @route   GET /api/analytics/skills
 * @desc    Get skill-based analytics
 * @access  Private
 * @query   category, difficulty
 */
router.get(
  "/skills",
  validate(analyticsQuerySchema, "query"),
  getSkillAnalytics
);

/**
 * @route   GET /api/analytics/ai-effectiveness
 * @desc    Get AI interaction effectiveness analytics
 * @access  Private
 * @query   timeRange
 */
router.get(
  "/ai-effectiveness",
  validate(timeRangeSchema, "query"),
  getAIEffectivenessAnalytics
);

/**
 * @route   POST /api/analytics/report
 * @desc    Generate comprehensive analytics report
 * @access  Private
 * @body    reportType, timeRange, format, customSections
 */
router.post("/report", validate(reportSchema, "body"), generateReport);

/**
 * @route   GET /api/analytics/history
 * @desc    Get analytics calculation history
 * @access  Private
 * @query   timeRange
 */
router.get("/history", validate(timeRangeSchema, "query"), getAnalyticsHistory);

/**
 * @route   POST /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 * @body    timeRange, dataTypes, format, includePersonalData
 */
router.post("/export", validate(exportSchema, "body"), exportAnalyticsData);

/**
 * @route   GET /api/analytics/personalized-insights
 * @desc    Get AI-powered personalized insights
 * @access  Private
 */
router.get("/personalized-insights", getPersonalizedInsights);

/**
 * @route   GET /api/analytics/goal-progress
 * @desc    Get progress towards learning goals
 * @access  Private
 * @query   timeRange
 */
router.get(
  "/goal-progress",
  validate(timeRangeSchema, "query"),
  getGoalProgress
);

/**
 * @route   GET /api/analytics/learning-path
 * @desc    Get recommended learning path analytics
 * @access  Private
 */
router.get("/learning-path", getLearningPath);

module.exports = router;
