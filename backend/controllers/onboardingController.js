// controllers/onboardingController.js
const { onboardingService } = require('../services/onboardingService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * Start onboarding session after Clerk signup
 * POST /api/onboarding/start
 */
const startOnboarding = catchAsync(async (req, res) => {
  const { clerkUserId } = req.body;
  const userId = req.user._id;

  console.log(`🚀 Starting onboarding for user: ${userId} (Clerk: ${clerkUserId})`);

  const onboardingData = await onboardingService.startOnboardingSession(clerkUserId, userId);

  res.status(201).json({
    success: true,
    data: onboardingData,
    message: 'Onboarding session started successfully',
  });
});

/**
 * Submit answer to onboarding question
 * POST /api/onboarding/sessions/:sessionId/answer
 */
const submitAnswer = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const { questionId, answer, timeSpent } = req.body;

  console.log(`📝 Submitting onboarding answer: Session ${sessionId}, Question ${questionId}`);

  const result = await onboardingService.submitAnswer(sessionId, questionId, answer, timeSpent);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Answer submitted successfully',
  });
});

/**
 * Get onboarding session status
 * GET /api/onboarding/sessions/:sessionId/status
 */
const getSessionStatus = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  console.log(`📊 Getting onboarding session status: ${sessionId}`);

  const status = await onboardingService.getSessionStatus(sessionId);

  res.status(200).json({
    success: true,
    data: status,
    message: 'Session status retrieved successfully',
  });
});

/**
 * Resume onboarding session
 * GET /api/onboarding/sessions/:sessionId/resume
 */
const resumeSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  console.log(`▶️ Resuming onboarding session: ${sessionId}`);

  const sessionData = await onboardingService.resumeSession(sessionId);

  res.status(200).json({
    success: true,
    data: sessionData,
    message: 'Session resumed successfully',
  });
});

/**
 * Get onboarding questions (for frontend display)
 * GET /api/onboarding/questions
 */
const getOnboardingQuestions = catchAsync(async (req, res) => {
  console.log('📋 Getting onboarding questions');

  const OnboardingQuestion = require('../models/OnboardingQuestion');
  const questions = await OnboardingQuestion.getOnboardingFlow();

  res.status(200).json({
    success: true,
    data: {
      questions: questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        description: q.description,
        type: q.type,
        category: q.category,
        options: q.options,
        expectedLength: q.expectedLength,
        flow: q.flow,
      })),
      totalQuestions: questions.length,
    },
    message: 'Onboarding questions retrieved successfully',
  });
});

/**
 * Get onboarding progress for user
 * GET /api/onboarding/progress
 */
const getOnboardingProgress = catchAsync(async (req, res) => {
  const userId = req.user._id;

  console.log(`📈 Getting onboarding progress for user: ${userId}`);

  const OnboardingSession = require('../models/OnboardingSession');
  const sessions = await OnboardingSession.getUserOnboardingHistory(userId);

  const progress = {
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    currentSession: sessions.find(s => s.status === 'in_progress') || null,
    lastCompletedSession: sessions.find(s => s.status === 'completed') || null,
  };

  res.status(200).json({
    success: true,
    data: progress,
    message: 'Onboarding progress retrieved successfully',
  });
});

/**
 * Get onboarding results and recommendations
 * GET /api/onboarding/sessions/:sessionId/results
 */
const getOnboardingResults = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  console.log(`🏁 Getting onboarding results: ${sessionId}`);

  const OnboardingSession = require('../models/OnboardingSession');
  const session = await OnboardingSession.findOne({ sessionId });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Onboarding session not found',
    });
  }

  if (session.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Onboarding session not completed yet',
    });
  }

  const results = {
    sessionId: session.sessionId,
    completedAt: session.completedAt,
    totalTime: session.totalTime,
    aiProfile: session.aiProfile,
    generatedAssessments: session.generatedAssessments,
    answers: session.answers.map(answer => ({
      questionId: answer.questionId,
      question: answer.question,
      answer: answer.answer,
      aiAnalysis: answer.aiAnalysis,
    })),
  };

  res.status(200).json({
    success: true,
    data: results,
    message: 'Onboarding results retrieved successfully',
  });
});

/**
 * Get recommended assessments after onboarding
 * GET /api/onboarding/recommendations
 */
const getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;

  console.log(`🎯 Getting recommendations for user: ${userId}`);

  const OnboardingSession = require('../models/OnboardingSession');
  const session = await OnboardingSession.findOne({ 
    userId, 
    status: 'completed', 
  }).sort({ completedAt: -1 });

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'No completed onboarding session found',
    });
  }

  const recommendations = {
    personalizedAssessments: session.generatedAssessments || [],
    recommendedPrebuilt: await onboardingService.getRecommendedPrebuiltAssessments(session.aiProfile),
    aiProfile: session.aiProfile,
    nextSteps: [
      'Start with your personalized assessments',
      'Complete recommended prebuilt assessments',
      'Review your AI-generated learning profile',
      'Set up your learning goals and preferences',
    ],
  };

  res.status(200).json({
    success: true,
    data: recommendations,
    message: 'Recommendations retrieved successfully',
  });
});

/**
 * Skip onboarding (for users who want to skip)
 * POST /api/onboarding/skip
 */
const skipOnboarding = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { clerkUserId } = req.body;

  console.log(`⏭️ Skipping onboarding for user: ${userId}`);

  // Create a minimal onboarding session
  const OnboardingSession = require('../models/OnboardingSession');
  const session = new OnboardingSession({
    sessionId: require('uuid').v4(),
    userId,
    clerkUserId,
    status: 'completed',
    totalQuestions: 0,
    questionsAnswered: 0,
    completedAt: new Date(),
    aiProfile: {
      learningStyle: { primary: 'adaptive', secondary: 'visual', confidence: 50, reasoning: 'Default profile' },
      experienceLevel: { overall: 'intermediate', technical: 'intermediate', business: 'intermediate', confidence: 50, reasoning: 'Default profile' },
      careerGoals: ['Professional development'],
      interests: ['Learning and growth'],
      motivation: 'Skill development',
      timeAvailability: 'moderate',
      preferredFormat: 'interactive',
      strengths: ['Adaptability'],
      areasForGrowth: ['Technical skills'],
      recommendedPaths: ['General development'],
    },
    generatedAssessments: [],
    aiProcessingStatus: {
      profileAnalysis: { status: 'completed', completedAt: new Date() },
      assessmentGeneration: { status: 'completed', completedAt: new Date() },
    },
  });

  await session.save();

  // Update user profile with default values
  const User = require('../models/User');
  const user = await User.findById(userId);
  if (user) {
    user.learningProfile = {
      ...user.learningProfile,
      currentLevel: 'intermediate',
      learningStyle: 'adaptive',
      goals: ['Professional development'],
      interests: ['Learning and growth'],
      aiPersonality: 'ARIA',
    };
    await user.save();
  }

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.sessionId,
      message: 'Onboarding skipped successfully',
      aiProfile: session.aiProfile,
      generatedAssessments: [],
      recommendedAssessments: await onboardingService.getRecommendedPrebuiltAssessments(session.aiProfile),
    },
  });
});

module.exports = {
  startOnboarding,
  submitAnswer,
  getSessionStatus,
  resumeSession,
  getOnboardingQuestions,
  getOnboardingProgress,
  getOnboardingResults,
  getRecommendations,
  skipOnboarding,
};
