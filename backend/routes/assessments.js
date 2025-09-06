// routes/assessments.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { authenticateWithClerk } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Import controllers
const {
  getAvailableAssessments,
  getAssessmentDetails,
  startAssessment,
  getSessionStatus,
  submitAnswer,
  completeAssessment,
  pauseSession,
  resumeSession,
  getAssessmentResults,
  getAssessmentHistory,
  getAssessmentAnalytics,
  submitAssessmentFeedback,
} = require('../controllers/assessmentController');

// Import AI evaluation service for testing
const { aiEvaluationService } = require('../services/aiEvaluationService');
const { planCustomAssessments } = require('../controllers/assessmentController');

// Validation schemas
const assessmentQuerySchema = Joi.object({
  category: Joi.string()
    .valid(
      'Communication & Leadership',
      'Innovation & Creativity',
      'Technical Skills',
      'Business Strategy',
      'Personal Development',
      'Data & Analytics',
    )
    .optional(),

  difficulty: Joi.string()
    .valid('all', 'beginner', 'intermediate', 'advanced', 'expert', 'mixed')
    .optional(),

  type: Joi.string()
    .valid(
      'skill_check',
      'module_completion',
      'path_final',
      'certification',
      'placement',
      'progress_check',
      'ai_adaptive',
    )
    .optional(),

  limit: Joi.number().integer().min(1).max(100).default(20),

  offset: Joi.number().integer().min(0).default(0),
});

const startAssessmentSchema = Joi.object({
  deviceType: Joi.string()
    .valid('desktop', 'tablet', 'mobile', 'unknown')
    .default('unknown'),

  browser: Joi.string().max(100).optional(),

  screenSize: Joi.string()
    .pattern(/^\d+x\d+$/)
    .optional(),

  timezone: Joi.string().max(50).default('UTC'),

  environment: Joi.object({
    proctored: Joi.boolean().default(false),
    allowedResources: Joi.array().items(Joi.string()).optional(),
    restrictions: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const submitAnswerSchema = Joi.object({
  questionId: Joi.string().required().messages({
    'any.required': 'Question ID is required',
  }),

  answer: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string()),
      Joi.object(),
    )
    .required()
    .messages({
      'any.required': 'Answer is required',
    }),

  timeSpent: Joi.number()
    .integer()
    .min(0)
    .max(7200) // Max 2 hours per question
    .default(0)
    .messages({
      'number.max': 'Time spent cannot exceed 2 hours per question',
    }),
});

const completeAssessmentSchema = Joi.object({
  finalAnswers: Joi.object()
    .pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string()),
      ),
    )
    .optional()
    .messages({
      'object.unknown': 'Invalid answer format in finalAnswers',
    }),
});

const historyQuerySchema = Joi.object({
  status: Joi.string()
    .valid('in_progress', 'completed', 'abandoned', 'timeout', 'paused')
    .optional(),

  limit: Joi.number().integer().min(1).max(100).default(20),

  offset: Joi.number().integer().min(0).default(0),
});

const analyticsQuerySchema = Joi.object({
  timeRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
});

const feedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),

  difficulty: Joi.string()
    .valid('too_easy', 'just_right', 'too_hard')
    .optional(),

  comments: Joi.string().max(1000).optional().messages({
    'string.max': 'Comments cannot exceed 1000 characters',
  }),

  suggestions: Joi.string().max(1000).optional().messages({
    'string.max': 'Suggestions cannot exceed 1000 characters',
  }),
});

const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string().uuid().required().messages({
    'string.uuid': 'Session ID must be a valid UUID',
    'any.required': 'Session ID is required',
  }),
});

const assessmentIdParamSchema = Joi.object({
  assessmentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Assessment ID must be a valid MongoDB ObjectId',
      'any.required': 'Assessment ID is required',
    }),
});

// All assessment routes require authentication
router.use(authenticateWithClerk);

/**
 * @route   GET /api/assessments
 * @desc    List available assessments (matches roadmap requirement)
 * @access  Private
 * @query   category, difficulty, type, limit, offset
 */
router.get(
  '/',
  validate(assessmentQuerySchema, 'query'),
  getAvailableAssessments,
);

/**
 * @route   GET /api/assessments/available  
 * @desc    Get available assessments for the authenticated user (legacy)
 * @access  Private
 * @query   category, difficulty, type, limit, offset
 */
router.get(
  '/available',
  validate(assessmentQuerySchema, 'query'),
  getAvailableAssessments,
);

/**
 * @route   GET /api/assessments/history
 * @desc    Get user's assessment history
 * @access  Private
 * @query   status, limit, offset
 */
router.get(
  '/history',
  validate(historyQuerySchema, 'query'),
  getAssessmentHistory,
);

/**
 * @route   GET /api/assessments/analytics
 * @desc    Get assessment analytics for the user
 * @access  Private
 * @query   timeRange
 */
router.get(
  '/analytics',
  validate(analyticsQuerySchema, 'query'),
  getAssessmentAnalytics,
);

/**
 * @route   GET /api/assessments/:assessmentId
 * @desc    Get specific assessment details
 * @access  Private
 */
router.get(
  '/:assessmentId',
  validate(assessmentIdParamSchema, 'params'),
  getAssessmentDetails,
);

/**
 * @route   POST /api/assessments/:assessmentId/start
 * @desc    Start a new assessment session
 * @access  Private
 * @body    deviceType, browser, screenSize, timezone, environment
 */
router.post(
  '/:assessmentId/start',
  validate(assessmentIdParamSchema, 'params'),
  validate(startAssessmentSchema),
  startAssessment,
);

/**
 * @route   POST /api/assessments/:assessmentId/feedback
 * @desc    Submit feedback for an assessment
 * @access  Private
 * @body    rating, difficulty, comments, suggestions
 */
router.post(
  '/:assessmentId/feedback',
  validate(assessmentIdParamSchema, 'params'),
  validate(feedbackSchema),
  submitAssessmentFeedback,
);

/**
 * @route   GET /api/assessments/sessions/:sessionId
 * @desc    Get current assessment session status
 * @access  Private
 */
router.get(
  '/sessions/:sessionId',
  validate(sessionIdParamSchema, 'params'),
  getSessionStatus,
);

/**
 * @route   POST /api/assessments/sessions/:sessionId/answer
 * @desc    Submit answer for a question in the assessment
 * @access  Private
 * @body    questionId, answer, timeSpent
 */
router.post(
  '/sessions/:sessionId/answer',
  validate(sessionIdParamSchema, 'params'),
  validate(submitAnswerSchema),
  submitAnswer,
);

/**
 * @route   POST /api/assessments/sessions/:sessionId/complete
 * @desc    Complete the assessment session
 * @access  Private
 * @body    finalAnswers (optional)
 */
router.post(
  '/sessions/:sessionId/complete',
  validate(sessionIdParamSchema, 'params'),
  validate(completeAssessmentSchema),
  completeAssessment,
);

/**
 * @route   POST /api/assessments/sessions/:sessionId/pause
 * @desc    Pause the assessment session
 * @access  Private
 */
router.post(
  '/sessions/:sessionId/pause',
  validate(sessionIdParamSchema, 'params'),
  pauseSession,
);

/**
 * @route   POST /api/assessments/sessions/:sessionId/resume
 * @desc    Resume a paused assessment session
 * @access  Private
 */
router.post(
  '/sessions/:sessionId/resume',
  validate(sessionIdParamSchema, 'params'),
  resumeSession,
);

/**
 * @route   GET /api/assessments/sessions/:sessionId/results
 * @desc    Get detailed assessment results
 * @access  Private
 */
router.get(
  '/sessions/:sessionId/results',
  validate(sessionIdParamSchema, 'params'),
  getAssessmentResults,
);

/**
 * @route   GET /api/assessments/:assessmentId/results
 * @desc    Get assessment results by assessment ID (latest completed session)
 * @access  Private
 */
router.get(
  '/:assessmentId/results',
  validate(assessmentIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { assessmentId } = req.params;
      
      // Find the latest completed session for this assessment
      const session = await require('../models/AssessmentSession').findOne({
        userId,
        assessmentId,
        status: 'completed',
      }).sort({ endTime: -1 });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'No completed assessment sessions found',
          message: 'You must complete this assessment first to view results',
        });
      }
      
      // Use the existing controller with the found session ID
      req.params.sessionId = session.sessionId;
      getAssessmentResults(req, res, next);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   PUT /api/assessments/:assessmentId/submit
 * @desc    Submit entire assessment (alternative to per-question submission)
 * @access  Private
 * @body    sessionId, answers
 */
router.put(
  '/:assessmentId/submit',
  validate(assessmentIdParamSchema, 'params'),
  validate(Joi.object({
    sessionId: Joi.string().uuid().required(),
    answers: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.number(), 
        Joi.boolean(),
        Joi.array().items(Joi.string()),
        Joi.object(),
      ),
    ).required(),
  })),
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { assessmentId } = req.params;
      const { sessionId, answers } = req.body;
      
      // Verify session belongs to user and assessment
      const session = await require('../models/AssessmentSession').findOne({
        sessionId,
        userId,
        assessmentId,
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: 'Invalid session for this assessment',
        });
      }
      
      // Submit all answers and complete assessment
      const results = await require('../services/assessmentService').submitFullAssessment(
        sessionId,
        answers,
      );
      
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   POST /api/assessments/:assessmentId/ai-evaluate
 * @desc    AI-powered evaluation of assessment answers
 * @access  Private
 * @body    sessionId, questionId, answer, evaluationContext
 */
router.post(
  '/:assessmentId/ai-evaluate',
  validate(assessmentIdParamSchema, 'params'),
  validate(Joi.object({
    sessionId: Joi.string().uuid().required(),
    questionId: Joi.string().required(),
    answer: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.array(),
      Joi.object(),
    ).required(),
    evaluationContext: Joi.object({
      questionType: Joi.string().optional(),
      difficulty: Joi.string().optional(),
      maxPoints: Joi.number().optional(),
      timeSpent: Joi.number().optional(),
    }).optional(),
  })),
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { assessmentId } = req.params;
      const { sessionId, questionId, answer, evaluationContext } = req.body;
      
      // Import AI service
      const aiEvaluationService = require('../services/aiEvaluationService');
      
      // Verify session ownership
      const session = await require('../models/AssessmentSession').findOne({
        sessionId,
        userId,
        assessmentId,
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          message: 'Invalid session for this assessment',
        });
      }
      
      // Get question details
      const question = await require('../models/Question').findOne({
        questionId,
        assessmentId,
      });
      
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
          message: 'Question not found in this assessment',
        });
      }
      
      // Perform AI evaluation
      const evaluation = await aiEvaluationService.evaluateAnswer(
        question,
        answer,
        evaluationContext,
      );
      
      res.status(200).json({
        success: true,
        data: {
          evaluation,
          metadata: {
            questionId,
            sessionId,
            evaluatedAt: new Date(),
            aiProvider: evaluation.provider,
            model: evaluation.model,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/assessments/health
 * @desc    Health check for assessment service
 * @access  Private
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'assessments',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        aiEvaluation: 'active',
        adaptiveQuestioning: 'active',
        certificateGeneration: 'active',
        sessionManagement: 'active',
      },
    },
  });
});

/**
 * Error handling middleware for assessment routes
 */
router.use((error, req, res, next) => {
  console.error('Assessment route error:', error);

  // Handle specific assessment-related errors
  if (error.message.includes('Assessment session')) {
    return res.status(400).json({
      success: false,
      error: 'Assessment session error',
      message: error.message,
    });
  }

  if (error.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: 'Assessment timeout',
      message: 'Assessment session has timed out',
    });
  }

  if (
    error.message.includes('eligibility') ||
    error.message.includes('eligible')
  ) {
    return res.status(403).json({
      success: false,
      error: 'Eligibility error',
      message: error.message,
    });
  }

  // Pass to global error handler
  next(error);
});

/**
 * @route   POST /api/assessments/generate-questions
 * @desc    Generate assessment questions using AI
 * @access  Private
 */
router.post(
  '/generate-questions',
  authenticateWithClerk,
  validate(Joi.object({
    assessmentId: Joi.string().required(),
    title: Joi.string().required(),
    category: Joi.string().required(),
    // Accept both 3-level and 4-level difficulty vocabularies
    difficulty: Joi.string()
      .valid('easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced', 'expert')
      .default('intermediate'),
    questionCount: Joi.number().min(1).max(50).default(10),
    includeTypes: Joi.array().items(Joi.string().valid('multiple_choice', 'text', 'essay', 'code')).default(['multiple_choice', 'text']),
    topic: Joi.string().optional(),
    subtopics: Joi.array().items(Joi.string()).optional(),
  })),
  require('../controllers/questionGenerationController').generateQuestions,
);

/**
 * @route   POST /api/assessments/regenerate-question
 * @desc    Regenerate a specific question
 * @access  Private
 */
router.post(
  '/regenerate-question',
  authenticateWithClerk,
  validate(Joi.object({
    questionId: Joi.string().required(),
    currentQuestion: Joi.object().required(),
    reason: Joi.string().optional(),
    preferences: Joi.string().optional(),
  })),
  require('../controllers/questionGenerationController').regenerateQuestion,
);

/**
 * @route   POST /api/assessments/evaluate
 * @desc    Evaluate an answer using AI with personality
 * @access  Private
 */
router.post(
  '/evaluate',
  authenticateWithClerk,
  validate(Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    personality: Joi.string().valid('ARIA', 'SAGE', 'COACH').default('ARIA'),
    // Accept both 3-level and 4-level difficulty vocabularies
    difficulty: Joi.string()
      .valid('easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced', 'expert')
      .default('medium'),
    points: Joi.number().min(1).max(100).default(10),
    rubric: Joi.string().optional(),
    context: Joi.string().optional(),
  })),
  require('../controllers/assessmentEvaluationController').evaluateAnswer,
);

/**
 * @route   POST /api/assessments/evaluate-multiple-choice
 * @desc    Evaluate a multiple choice answer
 * @access  Private
 */
router.post(
  '/evaluate-multiple-choice',
  authenticateWithClerk,
  validate(Joi.object({
    question: Joi.string().required(),
    selectedAnswer: Joi.string().required(),
    correctAnswer: Joi.string().required(),
    options: Joi.array().items(Joi.string()).required(),
    personality: Joi.string().valid('ARIA', 'SAGE', 'COACH').default('ARIA'),
    points: Joi.number().min(1).max(100).default(10),
  })),
  require('../controllers/assessmentEvaluationController').evaluateMultipleChoice,
);

/**
 * @route   GET /api/assessments/personalities
 * @desc    Get available AI personalities
 * @access  Private
 */
router.get(
  '/personalities',
  authenticateWithClerk,
  require('../controllers/assessmentEvaluationController').getPersonalities,
);

/**
 * @route   POST /api/assessments/study-recommendations
 * @desc    Generate personalized study recommendations
 * @access  Private
 */
router.post(
  '/study-recommendations',
  authenticateWithClerk,
  validate(Joi.object({
    assessmentResults: Joi.object({
      score: Joi.number().required(),
      strengths: Joi.array().items(Joi.string()).optional(),
      weaknesses: Joi.array().items(Joi.string()).optional(),
    }).required(),
    personality: Joi.string().valid('ARIA', 'SAGE', 'COACH').default('ARIA'),
    learningGoals: Joi.string().optional(),
    timeAvailable: Joi.string().optional(),
  })),
  require('../controllers/assessmentEvaluationController').generateStudyRecommendations,
);

/**
 * @route   POST /api/assessments/plan
 * @desc    Plan 3 tailored assessments from user intake
 * @access  Private (dev bypass supported)
 */
router.post(
  '/plan',
  authenticateWithClerk,
  validate(Joi.object({
    primaryDomain: Joi.string().required(),
    subdomains: Joi.array().items(Joi.string()).default([]),
    yearsExperience: Joi.string().default('0-1'),
    goals: Joi.string().default('baseline'),
    preferredDifficulty: Joi.string().valid('beginner','intermediate','advanced').default('intermediate'),
  })),
  planCustomAssessments,
);

module.exports = router;
