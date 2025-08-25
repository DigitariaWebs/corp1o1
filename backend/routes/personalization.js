// routes/personalization.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Import middleware
const { authenticateWithClerk } = require("../middleware/auth");
const { validate } = require("../middleware/validation");

// Import controllers
const {
  generatePersonalizedExperience,
  getPersonalization,
  updatePersonalization,
  generateContextualContent,
  resetPersonalization,
  getPersonalizationAnalytics
} = require("../controllers/personalizationController");

// Validation schemas
const onboardingDataSchema = Joi.object({
  onboardingData: Joi.object({
    // Professional Background
    currentRole: Joi.string().max(200).optional(),
    experience: Joi.string().valid('0-1', '2-3', '4-6', '7-10', '10+').optional(),
    industry: Joi.string().max(100).optional(),
    company: Joi.string().max(200).optional(),
    
    // Goals & Aspirations
    primaryGoal: Joi.string().valid(
      'career_growth', 'skill_development', 'career_change', 
      'certification', 'leadership', 'entrepreneurship'
    ).required(),
    careerGoals: Joi.array().items(Joi.string().max(100)).optional(),
    timeCommitment: Joi.string().valid(
      '15min', '30min', '1hour', 'weekends', 'flexible'
    ).optional(),
    preferredLearningStyle: Joi.string().valid(
      'hands_on', 'structured', 'bite_sized', 'interactive'
    ).optional(),
    
    // Skills & Interests
    currentSkills: Joi.array().items(Joi.string().max(50)).optional(),
    skillsToImprove: Joi.array().items(Joi.string().max(50)).optional(),
    preferredDomains: Joi.array().items(
      Joi.string().valid(
        'programming', 'design', 'analytics', 
        'communication', 'leadership', 'business'
      )
    ).min(1).required(),
    
    // AI Personalization Preferences
    assessmentDifficulty: Joi.string().valid(
      'beginner', 'intermediate', 'advanced', 'adaptive'
    ).optional(),
    contentType: Joi.string().valid(
      'visual', 'text', 'video', 'interactive', 'mixed'
    ).optional(),
    motivationStyle: Joi.string().valid(
      'achievement', 'social', 'autonomy', 'mastery', 'purpose'
    ).optional(),
    feedbackPreference: Joi.string().valid(
      'immediate', 'detailed', 'encouraging', 'direct'
    ).optional()
  }).required()
});

const behaviorUpdateSchema = Joi.object({
  behaviorData: Joi.object({
    assessmentPerformance: Joi.object({
      averageScore: Joi.number().min(0).max(100).optional(),
      completionRate: Joi.number().min(0).max(100).optional(),
      preferredDifficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
      timeSpentLearning: Joi.number().min(0).optional()
    }).optional(),
    learningBehavior: Joi.object({
      sessionsCompleted: Joi.number().min(0).optional(),
      averageSessionTime: Joi.number().min(0).optional(),
      preferredTimeOfDay: Joi.string().optional(),
      mostEngagedContent: Joi.array().items(Joi.string()).optional()
    }).optional(),
    engagementMetrics: Joi.object({
      clickThroughRate: Joi.number().min(0).max(100).optional(),
      timeOnPlatform: Joi.number().min(0).optional(),
      featuresUsed: Joi.array().items(Joi.string()).optional()
    }).optional()
  }).optional(),
  
  feedbackData: Joi.object({
    contentDifficulty: Joi.string().valid('too_easy', 'just_right', 'too_hard').optional(),
    learningPacePreference: Joi.string().valid('slower', 'current', 'faster').optional(),
    contentTypePreference: Joi.array().items(Joi.string()).optional(),
    motivationFactors: Joi.array().items(Joi.string()).optional(),
    suggestions: Joi.string().max(1000).optional()
  }).optional()
});

const contextualContentSchema = Joi.object({
  currentContext: Joi.object({
    currentActivity: Joi.string().valid(
      'assessment', 'learning', 'review', 'project', 'idle'
    ).required(),
    recentPerformance: Joi.object({
      lastScore: Joi.number().min(0).max(100).optional(),
      trend: Joi.string().valid('improving', 'stable', 'declining').optional(),
      strugglingAreas: Joi.array().items(Joi.string()).optional()
    }).optional(),
    timeContext: Joi.object({
      timeAvailable: Joi.number().min(0).optional(),
      sessionNumber: Joi.number().min(1).optional(),
      streakDays: Joi.number().min(0).optional()
    }).optional(),
    emotionalState: Joi.string().valid(
      'motivated', 'frustrated', 'confident', 'overwhelmed', 'neutral'
    ).optional()
  }).required()
});

// Apply authentication to all routes
router.use(authenticateWithClerk);

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`🎯 Personalization Route: ${req.method} ${req.originalUrl}`);
  console.log(`🎯 Headers:`, {
    authorization: req.headers.authorization ? 'Bearer [PRESENT]' : 'MISSING',
    contentType: req.headers['content-type'],
    userAgent: req.headers['user-agent']
  });
  console.log(`🎯 User from auth:`, req.user ? req.user._id : 'NO USER');
  next();
});

/**
 * @route   POST /api/personalization/test
 * @desc    Test route to verify personalization routes are working
 * @access  Private
 */
router.post("/test", (req, res) => {
  console.log(`🎯 [TEST] Personalization test route hit`);
  console.log(`🎯 [TEST] User:`, req.user ? req.user._id : 'NO USER');
  res.status(200).json({
    success: true,
    message: 'Personalization routes are working',
    user: req.user ? req.user._id : null,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/personalization/generate
 * @desc    Generate personalized experience from onboarding data
 * @access  Private
 */
router.post(
  "/generate",
  (req, res, next) => {
    console.log(`🎯 [ROUTE] About to validate onboarding data`);
    console.log(`🎯 [ROUTE] Request body keys:`, Object.keys(req.body));
    next();
  },
  validate(onboardingDataSchema),
  (req, res, next) => {
    console.log(`🎯 [ROUTE] Validation passed, calling controller`);
    next();
  },
  generatePersonalizedExperience
);

/**
 * @route   GET /api/personalization
 * @desc    Get user's current personalization
 * @access  Private
 */
router.get("/", getPersonalization);

/**
 * @route   PUT /api/personalization/update
 * @desc    Update personalization based on behavior and feedback
 * @access  Private
 */
router.put(
  "/update",
  validate(behaviorUpdateSchema),
  updatePersonalization
);

/**
 * @route   POST /api/personalization/contextual
 * @desc    Generate contextual content based on current situation
 * @access  Private
 */
router.post(
  "/contextual",
  validate(contextualContentSchema),
  generateContextualContent
);

/**
 * @route   DELETE /api/personalization/reset
 * @desc    Reset personalization (restart onboarding)
 * @access  Private
 */
router.delete("/reset", resetPersonalization);

/**
 * @route   GET /api/personalization/analytics
 * @desc    Get personalization analytics and insights
 * @access  Private
 */
router.get("/analytics", getPersonalizationAnalytics);

/**
 * @route   GET /api/personalization/health
 * @desc    Health check for personalization service
 * @access  Private
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "personalization",
      status: "operational",
      timestamp: new Date().toISOString(),
      features: {
        aiPersonalization: "active",
        onboardingFlow: "active",
        behaviorTracking: "active",
        contextualContent: "active"
      }
    }
  });
});

module.exports = router;