// routes/onboarding.js
const express = require("express");
const router = express.Router();
const { clerkAuth, attachClerkUser } = require("../middleware/auth");
const {
  startOnboarding,
  submitAnswer,
  getSessionStatus,
  resumeSession,
  getOnboardingQuestions,
  getOnboardingProgress,
  getOnboardingResults,
  getRecommendations,
  skipOnboarding
} = require("../controllers/onboardingController");

// All onboarding routes require Clerk authentication
router.use(clerkAuth);
router.use(attachClerkUser);

/**
 * @route   POST /api/onboarding/start
 * @desc    Start onboarding session after Clerk signup
 * @access  Private
 */
router.post("/start", startOnboarding);

/**
 * @route   POST /api/onboarding/sessions/:sessionId/answer
 * @desc    Submit answer to onboarding question
 * @access  Private
 */
router.post("/sessions/:sessionId/answer", submitAnswer);

/**
 * @route   GET /api/onboarding/sessions/:sessionId/status
 * @desc    Get onboarding session status
 * @access  Private
 */
router.get("/sessions/:sessionId/status", getSessionStatus);

/**
 * @route   GET /api/onboarding/sessions/:sessionId/resume
 * @desc    Resume onboarding session
 * @access  Private
 */
router.get("/sessions/:sessionId/resume", resumeSession);

/**
 * @route   GET /api/onboarding/questions
 * @desc    Get onboarding questions (for frontend display)
 * @access  Private
 */
router.get("/questions", getOnboardingQuestions);

/**
 * @route   GET /api/onboarding/progress
 * @desc    Get onboarding progress for user
 * @access  Private
 */
router.get("/progress", getOnboardingProgress);

/**
 * @route   GET /api/onboarding/sessions/:sessionId/results
 * @desc    Get onboarding results and recommendations
 * @access  Private
 */
router.get("/sessions/:sessionId/results", getOnboardingResults);

/**
 * @route   GET /api/onboarding/recommendations
 * @desc    Get recommended assessments after onboarding
 * @access  Private
 */
router.get("/recommendations", getRecommendations);

/**
 * @route   POST /api/onboarding/skip
 * @desc    Skip onboarding (for users who want to skip)
 * @access  Private
 */
router.post("/skip", skipOnboarding);

module.exports = router;
