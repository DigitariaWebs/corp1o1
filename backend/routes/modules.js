const express = require("express");
const router = express.Router();

// Import middleware
const { authenticate } = require("../middleware/auth");
const { validateMongoId } = require("../middleware/validation");

// Import controllers
const {
  getModule,
  getPathModules,
  startSession,
  updateProgress,
  completeModule,
  getModuleAssessment,
  submitAssessment,
  pauseSession,
  resumeSession,
} = require("../controllers/moduleController");

// Import validation schemas
const Joi = require("joi");
const { validate } = require("../middleware/validation");

// Custom validation schemas for module operations
const sessionStartSchema = Joi.object({
  environment: Joi.string()
    .valid("home", "office", "library", "cafe", "commuting", "other")
    .optional(),
  initialMood: Joi.string()
    .valid("motivated", "neutral", "tired", "stressed", "excited", "frustrated")
    .optional(),
});

const progressUpdateSchema = Joi.object({
  sessionId: Joi.string().required(),
  progressPercentage: Joi.number().min(0).max(100).optional(),
  timeSpent: Joi.number().min(0).optional(),
  engagementScore: Joi.number().min(0).max(100).optional(),
  contentInteractions: Joi.array()
    .items(
      Joi.object({
        materialId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required(),
        materialType: Joi.string()
          .valid(
            "video",
            "text",
            "image",
            "audio",
            "interactive",
            "document",
            "link",
            "quiz"
          )
          .required(),
        timeSpent: Joi.number().min(0).optional(),
        engagementLevel: Joi.string().valid("low", "medium", "high").optional(),
        completionPercentage: Joi.number().min(0).max(100).optional(),
        interactions: Joi.array()
          .items(
            Joi.object({
              type: Joi.string()
                .valid(
                  "play",
                  "pause",
                  "seek",
                  "scroll",
                  "click",
                  "hover",
                  "focus",
                  "blur"
                )
                .required(),
              timestamp: Joi.date().optional(),
              position: Joi.number().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  strugglingAreas: Joi.array()
    .items(
      Joi.object({
        skill: Joi.string().required(),
        difficulty: Joi.number().min(0).max(100).required(),
        recommendedActions: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),
  notes: Joi.array()
    .items(
      Joi.object({
        content: Joi.string().required(),
        materialId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .optional(),
        position: Joi.number().optional(),
      })
    )
    .optional(),
});

const moduleCompletionSchema = Joi.object({
  sessionId: Joi.string().optional(),
  finalEngagementScore: Joi.number().min(0).max(100).optional(),
  finalMood: Joi.string()
    .valid(
      "satisfied",
      "neutral",
      "frustrated",
      "accomplished",
      "confused",
      "motivated"
    )
    .optional(),
  finalEnergyLevel: Joi.number().min(1).max(10).optional(),
  feedback: Joi.object({
    overallSatisfaction: Joi.number().min(1).max(5).optional(),
    contentQuality: Joi.number().min(1).max(5).optional(),
    difficultyRating: Joi.string()
      .valid("too_easy", "just_right", "too_hard")
      .optional(),
    paceRating: Joi.string()
      .valid("too_slow", "just_right", "too_fast")
      .optional(),
    suggestions: Joi.string().max(1000).optional(),
    wouldRecommend: Joi.boolean().optional(),
  }).optional(),
});

const assessmentSubmissionSchema = Joi.object({
  answers: Joi.object()
    .pattern(
      /^[0-9a-fA-F]{24}$/, // questionId pattern
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string())
      )
    )
    .required(),
  timeSpent: Joi.number().min(0).optional(),
});

const sessionControlSchema = Joi.object({
  sessionId: Joi.string().required(),
});

// All module routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/modules/path/:pathId
 * @desc    Get all modules for a specific learning path
 * @access  Private
 */
router.get("/path/:pathId", validateMongoId, getPathModules);

/**
 * @route   GET /api/modules/:moduleId
 * @desc    Get module content with personalization
 * @access  Private
 */
router.get("/:moduleId", validateMongoId, getModule);

/**
 * @route   POST /api/modules/:moduleId/start-session
 * @desc    Start a learning session for a module
 * @access  Private
 */
router.post(
  "/:moduleId/start-session",
  validateMongoId,
  validate(sessionStartSchema),
  startSession
);

/**
 * @route   PUT /api/modules/:moduleId/progress
 * @desc    Update module progress during learning session
 * @access  Private
 */
router.put(
  "/:moduleId/progress",
  validateMongoId,
  validate(progressUpdateSchema),
  updateProgress
);

/**
 * @route   POST /api/modules/:moduleId/complete
 * @desc    Mark module as completed
 * @access  Private
 */
router.post(
  "/:moduleId/complete",
  validateMongoId,
  validate(moduleCompletionSchema),
  completeModule
);

/**
 * @route   GET /api/modules/:moduleId/assessment
 * @desc    Get module assessment questions
 * @access  Private
 */
router.get("/:moduleId/assessment", validateMongoId, getModuleAssessment);

/**
 * @route   POST /api/modules/:moduleId/assessment
 * @desc    Submit module assessment answers
 * @access  Private
 */
router.post(
  "/:moduleId/assessment",
  validateMongoId,
  validate(assessmentSubmissionSchema),
  submitAssessment
);

/**
 * @route   POST /api/modules/session/pause
 * @desc    Pause current learning session
 * @access  Private
 */
router.post("/session/pause", validate(sessionControlSchema), pauseSession);

/**
 * @route   POST /api/modules/session/resume
 * @desc    Resume paused learning session
 * @access  Private
 */
router.post("/session/resume", validate(sessionControlSchema), resumeSession);

// Health check for modules routes
router.get("/health/check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Modules service is healthy",
    timestamp: new Date().toISOString(),
    user: {
      id: req.userId,
      authenticated: !!req.user,
    },
    endpoints: {
      content: ["GET /api/modules/path/:pathId", "GET /api/modules/:moduleId"],
      learning: [
        "POST /api/modules/:moduleId/start-session",
        "PUT /api/modules/:moduleId/progress",
        "POST /api/modules/:moduleId/complete",
      ],
      assessment: [
        "GET /api/modules/:moduleId/assessment",
        "POST /api/modules/:moduleId/assessment",
      ],
      session: [
        "POST /api/modules/session/pause",
        "POST /api/modules/session/resume",
      ],
    },
    features: [
      "Personalized content delivery",
      "Real-time progress tracking",
      "Interactive assessments",
      "Session management",
      "Learning analytics",
    ],
  });
});

module.exports = router;
